const db = require('../config/db');

const reportService = {
  // 1. Current Stock Report
  async getCurrentStockReport({ drugId, category }) {
    const today = new Date().toISOString().split('T')[0];
    let query = `
      SELECT 
        d.id AS drug_id,
        d.name AS drug_name,
        d.generic_name,
        d.category,
        d.dosage_form,
        d.strength,
        d.unit_of_measurement,
        d.minimum_stock_threshold,
        COALESCE(SUM(CASE WHEN b.expiry_date > $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS usable_stock,
        COALESCE(SUM(CASE WHEN b.expiry_date <= $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS expired_stock,
        COALESCE(SUM(b.current_quantity), 0) AS total_stock
      FROM dmi_drugs d
      LEFT JOIN dmi_batches b ON d.id = b.drug_id
      WHERE d.is_active = TRUE
    `;
    const values = [today];
    let idx = 2;

    if (drugId) {
      query += ` AND d.id = $${idx++}`;
      values.push(drugId);
    }
    if (category) {
      query += ` AND d.category ILIKE $${idx++}`;
      values.push(`%${category.trim()}%`);
    }

    query += ` GROUP BY d.id ORDER BY d.name ASC`;
    const result = await db.query(query, values);
    return result.rows;
  },

  // 2. Drug and Batch Report
  async getDrugBatchReport({ drugId, batchNumber, status }) {
    const today = new Date().toISOString().split('T')[0];
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT 
        b.id AS batch_id,
        b.batch_number,
        b.quantity_received,
        b.current_quantity,
        b.date_received,
        b.expiry_date,
        b.unit_cost,
        d.id AS drug_id,
        d.name AS drug_name,
        d.generic_name,
        d.category,
        d.dosage_form,
        d.strength,
        d.unit_of_measurement,
        CASE 
          WHEN b.expiry_date <= '${today}' THEN 'EXPIRED'
          WHEN b.current_quantity = 0 THEN 'DEPLETED'
          WHEN b.expiry_date <= '${next30Days}' THEN 'EXPIRING_SOON'
          ELSE 'AVAILABLE'
        END AS batch_status
      FROM dmi_batches b
      JOIN dmi_drugs d ON b.drug_id = d.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (drugId) {
      query += ` AND b.drug_id = $${idx++}`;
      values.push(drugId);
    }
    if (batchNumber) {
      query += ` AND b.batch_number ILIKE $${idx++}`;
      values.push(`%${batchNumber.trim()}%`);
    }
    if (status) {
      if (status === 'EXPIRED') {
        query += ` AND b.expiry_date <= '${today}'`;
      } else if (status === 'AVAILABLE') {
        query += ` AND b.expiry_date > '${today}' AND b.current_quantity > 0`;
      } else if (status === 'DEPLETED') {
        query += ` AND b.current_quantity = 0`;
      }
    }

    query += ` ORDER BY b.expiry_date ASC`;
    const result = await db.query(query, values);
    return result.rows;
  },

  // 3, 4, 5. Stock Movement Reports (Received, Issued, Adjustments)
  async getStockMovementReport({ transactionType, startDate, endDate, drugId, batchNumber }) {
    let query = `
      SELECT 
        t.id AS transaction_id,
        t.transaction_type,
        t.quantity,
        t.transaction_date,
        t.reason_or_notes,
        d.id AS drug_id,
        d.name AS drug_name,
        d.strength,
        d.dosage_form,
        d.unit_of_measurement,
        b.id AS batch_id,
        b.batch_number,
        u.id AS user_id,
        u.full_name AS user_name,
        u.role AS user_role
      FROM dmi_stock_transactions t
      JOIN dmi_drugs d ON t.drug_id = d.id
      JOIN dmi_batches b ON t.batch_id = b.id
      JOIN dmi_users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (transactionType) {
      query += ` AND t.transaction_type = $${idx++}`;
      values.push(transactionType.toUpperCase());
    }
    if (startDate) {
      query += ` AND t.transaction_date >= $${idx++}`;
      values.push(`${startDate} 00:00:00+00`);
    }
    if (endDate) {
      query += ` AND t.transaction_date <= $${idx++}`;
      values.push(`${endDate} 23:59:59+00`);
    }
    if (drugId) {
      query += ` AND t.drug_id = $${idx++}`;
      values.push(drugId);
    }
    if (batchNumber) {
      query += ` AND b.batch_number ILIKE $${idx++}`;
      values.push(`%${batchNumber.trim()}%`);
    }

    query += ` ORDER BY t.transaction_date DESC`;
    const result = await db.query(query, values);
    return result.rows;
  },

  // 6. Low-Stock Report
  async getLowStockReport() {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        d.id AS drug_id,
        d.name AS drug_name,
        d.generic_name,
        d.category,
        d.dosage_form,
        d.strength,
        d.unit_of_measurement,
        d.minimum_stock_threshold,
        COALESCE(SUM(CASE WHEN b.expiry_date > $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS usable_stock
      FROM dmi_drugs d
      LEFT JOIN dmi_batches b ON d.id = b.drug_id
      WHERE d.is_active = TRUE
      GROUP BY d.id
      HAVING COALESCE(SUM(CASE WHEN b.expiry_date > $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) <= d.minimum_stock_threshold
      ORDER BY usable_stock ASC
    `;
    const result = await db.query(query, [today]);
    return result.rows;
  },

  // 7. Expired-Batch Report
  async getExpiredBatchReport() {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        b.id AS batch_id,
        b.batch_number,
        b.current_quantity,
        b.expiry_date,
        d.id AS drug_id,
        d.name AS drug_name,
        d.strength,
        d.dosage_form,
        d.unit_of_measurement
      FROM dmi_batches b
      JOIN dmi_drugs d ON b.drug_id = d.id
      WHERE b.expiry_date <= $1 AND b.current_quantity > 0
      ORDER BY b.expiry_date ASC
    `;
    const result = await db.query(query, [today]);
    return result.rows;
  },

  // 8. Upcoming-Expiry Report
  async getUpcomingExpiryReport(windowDays = 30) {
    const today = new Date().toISOString().split('T')[0];
    const targetDate = new Date(Date.now() + parseInt(windowDays, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `
      SELECT 
        b.id AS batch_id,
        b.batch_number,
        b.current_quantity,
        b.expiry_date,
        d.id AS drug_id,
        d.name AS drug_name,
        d.strength,
        d.dosage_form,
        d.unit_of_measurement
      FROM dmi_batches b
      JOIN dmi_drugs d ON b.drug_id = d.id
      WHERE b.expiry_date > $1 AND b.expiry_date <= $2 AND b.current_quantity > 0
      ORDER BY b.expiry_date ASC
    `;
    const result = await db.query(query, [today, targetDate]);
    return result.rows;
  },
};

module.exports = reportService;