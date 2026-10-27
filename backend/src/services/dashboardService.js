const db = require('../config/db');

const dashboardService = {
  async getDashboardSummary(expiryWindowDays = 30) {
    const today = new Date().toISOString().split('T')[0];
    const targetExpiryDate = new Date(Date.now() + parseInt(expiryWindowDays, 10) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const poolClient = await db.pool.connect();
    try {
      // 1. Total active drug products
      const activeDrugsRes = await poolClient.query('SELECT COUNT(*) FROM dmi_drugs WHERE is_active = TRUE');
      const totalActiveDrugs = parseInt(activeDrugsRes.rows[0].count, 10);

      // 2. Total active batches (non-depleted, non-expired)
      const activeBatchesRes = await poolClient.query(
        'SELECT COUNT(*) FROM dmi_batches WHERE current_quantity > 0 AND expiry_date > $1',
        [today]
      );
      const totalActiveBatches = parseInt(activeBatchesRes.rows[0].count, 10);

      // 3. Usable stock grouped by unit of measurement
      const stockByUnitRes = await poolClient.query(
        `SELECT d.unit_of_measurement, SUM(b.current_quantity) AS total_usable_quantity
         FROM dmi_batches b
         JOIN dmi_drugs d ON b.drug_id = d.id
         WHERE b.expiry_date > $1 AND b.current_quantity > 0 AND d.is_active = TRUE
         GROUP BY d.unit_of_measurement`,
        [today]
      );
      const usableStockByUnit = stockByUnitRes.rows;

      // 4. Low Stock Alerts (Drug-level usable quantity <= minimum_stock_threshold)
      const lowStockRes = await poolClient.query(
        `SELECT 
           d.id AS drug_id, 
           d.name, 
           d.strength, 
           d.dosage_form, 
           d.unit_of_measurement,
           d.minimum_stock_threshold,
           COALESCE(SUM(CASE WHEN b.expiry_date > $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS usable_stock
         FROM dmi_drugs d
         LEFT JOIN dmi_batches b ON d.id = b.drug_id
         WHERE d.is_active = TRUE
         GROUP BY d.id
         HAVING COALESCE(SUM(CASE WHEN b.expiry_date > $1 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) <= d.minimum_stock_threshold
         ORDER BY usable_stock ASC`,
        [today]
      );
      const lowStockDrugs = lowStockRes.rows;

      // 5. Expired Batches with remaining quantities
      const expiredBatchesRes = await poolClient.query(
        `SELECT b.*, d.name AS drug_name, d.strength, d.dosage_form, d.unit_of_measurement
         FROM dmi_batches b
         JOIN dmi_drugs d ON b.drug_id = d.id
         WHERE b.expiry_date <= $1 AND b.current_quantity > 0
         ORDER BY b.expiry_date ASC`,
        [today]
      );
      const expiredBatches = expiredBatchesRes.rows;

      // 6. Batches approaching expiry within window (30 days default)
      const expiringSoonRes = await poolClient.query(
        `SELECT b.*, d.name AS drug_name, d.strength, d.dosage_form, d.unit_of_measurement
         FROM dmi_batches b
         JOIN dmi_drugs d ON b.drug_id = d.id
         WHERE b.expiry_date > $1 AND b.expiry_date <= $2 AND b.current_quantity > 0
         ORDER BY b.expiry_date ASC`,
        [today, targetExpiryDate]
      );
      const expiringSoonBatches = expiringSoonRes.rows;

      // 7. Recent stock movements (audit log history, latest 10)
      const recentTxRes = await poolClient.query(
        `SELECT t.*, d.name AS drug_name, b.batch_number, u.full_name AS user_name
         FROM dmi_stock_transactions t
         JOIN dmi_drugs d ON t.drug_id = d.id
         JOIN dmi_batches b ON t.batch_id = b.id
         JOIN dmi_users u ON t.user_id = u.id
         ORDER BY t.transaction_date DESC
         LIMIT 10`
      );
      const recentTransactions = recentTxRes.rows;

      return {
        metrics: {
          totalActiveDrugs,
          totalActiveBatches,
          lowStockCount: lowStockDrugs.length,
          expiredCount: expiredBatches.length,
          expiringSoonCount: expiringSoonBatches.length,
        },
        usableStockByUnit,
        alerts: {
          lowStockDrugs,
          expiredBatches,
          expiringSoonBatches,
        },
        recentTransactions,
      };
    } finally {
      poolClient.release();
    }
  },
};

module.exports = dashboardService;