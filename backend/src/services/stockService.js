const db = require('../config/db');

const stockService = {
  // Register a new batch with initial RECEIVE stock transaction
  async registerBatch({ drugId, batchNumber, quantityReceived, dateReceived, expiry_date, unitCost, userId, notes }, client = db) {
    const today = new Date().toISOString().split('T')[0];
    if (expiry_date <= today) {
      throw { statusCode: 400, message: 'Cannot register a batch that is already expired.' };
    }

    // Begin transaction
    const poolClient = await db.pool.connect();
    try {
      await poolClient.query('BEGIN');

      // Check if drug exists and is active
      const drugRes = await poolClient.query('SELECT id, is_active FROM dmi_drugs WHERE id = $1', [drugId]);
      if (drugRes.rows.length === 0 || !drugRes.rows[0].is_active) {
        throw { statusCode: 404, message: 'Drug not found or is currently archived/inactive.' };
      }

      // Check duplicate batch
      const dupRes = await poolClient.query('SELECT id FROM dmi_batches WHERE drug_id = $1 AND batch_number = $2', [drugId, batchNumber.trim()]);
      if (dupRes.rows.length > 0) {
        throw { statusCode: 409, message: `Batch '${batchNumber}' already exists for this drug.` };
      }

      const insertBatchQuery = `
        INSERT INTO dmi_batches (drug_id, batch_number, quantity_received, current_quantity, date_received, expiry_date, unit_cost)
        VALUES ($1, $2, $3, $3, $4, $5, $6)
        RETURNING *
      `;
      const batchValues = [
        drugId,
        batchNumber.trim(),
        parseInt(quantityReceived, 10),
        dateReceived || today,
        expiry_date,
        unitCost || 0.00
      ];
      const batchResult = await poolClient.query(insertBatchQuery, batchValues);
      const newBatch = batchResult.rows[0];

      // Audit log transaction
      const insertTxQuery = `
        INSERT INTO dmi_stock_transactions (drug_id, batch_id, transaction_type, quantity, user_id, reason_or_notes)
        VALUES ($1, $2, 'RECEIVED', $3, $4, $5)
      `;
      await poolClient.query(insertTxQuery, [drugId, newBatch.id, parseInt(quantityReceived, 10), userId, notes || 'Initial batch receipt']);

      await poolClient.query('COMMIT');
      return newBatch;
    } catch (error) {
      await poolClient.query('ROLLBACK');
      throw error;
    } finally {
      poolClient.release();
    }
  },

  // Receive additional stock into an existing batch
  async receiveStock({ batchId, quantity, userId, notes }) {
    if (quantity <= 0) throw { statusCode: 400, message: 'Quantity must be greater than zero.' };

    const poolClient = await db.pool.connect();
    try {
      await poolClient.query('BEGIN');

      const batchRes = await poolClient.query('SELECT * FROM dmi_batches WHERE id = $1 FOR UPDATE', [batchId]);
      if (batchRes.rows.length === 0) throw { statusCode: 404, message: 'Batch not found.' };
      const batch = batchRes.rows[0];

      const today = new Date().toISOString().split('T')[0];
      if (batch.expiry_date <= today) throw { statusCode: 400, message: 'Cannot add stock to an expired batch.' };

      const newCurrentQty = batch.current_quantity + parseInt(quantity, 10);
      const newReceivedQty = batch.quantity_received + parseInt(quantity, 10);

      await poolClient.query(
        'UPDATE dmi_batches SET current_quantity = $1, quantity_received = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [newCurrentQty, newReceivedQty, batchId]
      );

      await poolClient.query(
        'INSERT INTO dmi_stock_transactions (drug_id, batch_id, transaction_type, quantity, user_id, reason_or_notes) VALUES ($1, $2, \'RECEIVED\', $3, $4, $5)',
        [batch.drug_id, batchId, parseInt(quantity, 10), userId, notes || 'Additional stock receipt']
      );

      await poolClient.query('COMMIT');
      return { ...batch, current_quantity: newCurrentQty, quantity_received: newReceivedQty };
    } catch (error) {
      await poolClient.query('ROLLBACK');
      throw error;
    } finally {
      poolClient.release();
    }
  },

  // Issue stock with FEFO (First Expiry, First Out) selection
  async issueStock({ drugId, batchId, quantity, userId, notes }) {
    const qtyToIssue = parseInt(quantity, 10);
    if (qtyToIssue <= 0) throw { statusCode: 400, message: 'Quantity issued must be greater than zero.' };

    const poolClient = await db.pool.connect();
    try {
      await poolClient.query('BEGIN');

      const today = new Date().toISOString().split('T')[0];
      let batchesToProcess = [];

      if (batchId) {
        // Issue from specific batch
        const batchRes = await poolClient.query(
          'SELECT * FROM dmi_batches WHERE id = $1 AND drug_id = $2 FOR UPDATE',
          [batchId, drugId]
        );
        if (batchRes.rows.length === 0) throw { statusCode: 404, message: 'Specified batch not found for this drug.' };
        const batch = batchRes.rows[0];
        if (batch.expiry_date <= today) throw { statusCode: 400, message: 'Cannot issue from an expired batch.' };
        if (batch.current_quantity < qtyToIssue) throw { statusCode: 400, message: `Insufficient stock in batch ${batch.batch_number}. Available: ${batch.current_quantity}` };
        batchesToProcess.push(batch);
      } else {
        // FEFO Selection: Find available non-expired batches ordered by earliest expiry_date
        const fefoRes = await poolClient.query(
          `SELECT * FROM dmi_batches 
           WHERE drug_id = $1 AND expiry_date > $2 AND current_quantity > 0 
           ORDER BY expiry_date ASC FOR UPDATE`,
          [drugId, today]
        );

        const totalAvailable = fefoRes.rows.reduce((sum, b) => sum + b.current_quantity, 0);
        if (totalAvailable < qtyToIssue) {
          throw { statusCode: 400, message: `Insufficient total usable stock across batches. Required: ${qtyToIssue}, Available: ${totalAvailable}` };
        }
        batchesToProcess = fefoRes.rows;
      }

      let remainingToIssue = qtyToIssue;
      const transactions = [];

      for (const batch of batchesToProcess) {
        if (remainingToIssue <= 0) break;

        const deduction = Math.min(batch.current_quantity, remainingToIssue);
        const newQty = batch.current_quantity - deduction;

        await poolClient.query(
          'UPDATE dmi_batches SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [newQty, batch.id]
        );

        await poolClient.query(
          'INSERT INTO dmi_stock_transactions (drug_id, batch_id, transaction_type, quantity, user_id, reason_or_notes) VALUES ($1, $2, \'ISSUED\', $3, $4, $5)',
          [drugId, batch.id, -deduction, userId, notes || 'Stock issuance']
        );

        remainingToIssue -= deduction;
        transactions.push({ batchId: batch.id, batchNumber: batch.batch_number, issuedQuantity: deduction });
      }

      await poolClient.query('COMMIT');
      return { drugId, totalIssued: qtyToIssue, allocations: transactions };
    } catch (error) {
      await poolClient.query('ROLLBACK');
      throw error;
    } finally {
      poolClient.release();
    }
  },

  // Apply Authorized Stock Adjustment (Positive or Negative)
  async adjustStock({ batchId, newQuantity, reason, userId }) {
    if (newQuantity === undefined || parseInt(newQuantity, 10) < 0) {
      throw { statusCode: 400, message: 'Valid non-negative new quantity is required.' };
    }
    if (!reason || reason.trim() === '') {
      throw { statusCode: 400, message: 'Reason for adjustment is mandatory.' };
    }

    const poolClient = await db.pool.connect();
    try {
      await poolClient.query('BEGIN');

      const batchRes = await poolClient.query('SELECT * FROM dmi_batches WHERE id = $1 FOR UPDATE', [batchId]);
      if (batchRes.rows.length === 0) throw { statusCode: 404, message: 'Batch not found.' };
      const batch = batchRes.rows[0];

      const targetQty = parseInt(newQuantity, 10);
      const diff = targetQty - batch.current_quantity;

      if (diff === 0) {
        throw { statusCode: 400, message: 'New quantity is identical to current batch quantity.' };
      }

      await poolClient.query(
        'UPDATE dmi_batches SET current_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [targetQty, batchId]
      );

      await poolClient.query(
        'INSERT INTO dmi_stock_transactions (drug_id, batch_id, transaction_type, quantity, user_id, reason_or_notes) VALUES ($1, $2, \'ADJUSTMENT\', $3, $4, $5)',
        [batch.drug_id, batchId, diff, userId, `Adjustment: ${reason.trim()}`]
      );

      await poolClient.query('COMMIT');
      return { ...batch, current_quantity: targetQty, adjustmentDifference: diff };
    } catch (error) {
      await poolClient.query('ROLLBACK');
      throw error;
    } finally {
      poolClient.release();
    }
  },

  // Query batches with filter tabs (all, available, expiring_soon, expired, depleted)
  async getBatches({ drugId, filterStatus, batchNumber, search }) {
    const today = new Date().toISOString().split('T')[0];
    const next30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = `
      SELECT b.*, d.name AS drug_name, d.strength, d.dosage_form, d.minimum_stock_threshold,
      CASE 
        WHEN b.expiry_date <= '${today}' THEN 'EXPIRED'
        WHEN b.current_quantity = 0 THEN 'DEPLETED'
        WHEN b.expiry_date <= '${next30Days}' THEN 'EXPIRING_SOON'
        ELSE 'AVAILABLE'
      END AS status
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

    if (search) {
      query += ` AND (d.name ILIKE $${idx} OR b.batch_number ILIKE $${idx})`;
      values.push(`%${search.trim()}%`);
      idx++;
    }

    if (filterStatus === 'EXPIRED') {
      query += ` AND b.expiry_date <= '${today}'`;
    } else if (filterStatus === 'EXPIRING_SOON') {
      query += ` AND b.expiry_date > '${today}' AND b.expiry_date <= '${next30Days}' AND b.current_quantity > 0`;
    } else if (filterStatus === 'DEPLETED') {
      query += ` AND b.current_quantity = 0`;
    } else if (filterStatus === 'AVAILABLE') {
      query += ` AND b.expiry_date > '${today}' AND b.current_quantity > 0`;
    }

    query += ` ORDER BY b.expiry_date ASC, b.id DESC`;

    const result = await db.query(query, values);
    return result.rows;
  },

  // Get total stock summary per drug
  async getDrugStockSummary(drugId) {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT 
        d.id AS drug_id,
        d.name,
        d.strength,
        d.dosage_form,
        d.minimum_stock_threshold,
        COALESCE(SUM(CASE WHEN b.expiry_date > $2 AND b.current_quantity > 0 THEN b.current_quantity ELSE 0 END), 0) AS usable_stock,
        COALESCE(SUM(CASE WHEN b.expiry_date <= $2 THEN b.current_quantity ELSE 0 END), 0) AS expired_stock,
        COALESCE(SUM(b.current_quantity), 0) AS total_stock
      FROM dmi_drugs d
      LEFT JOIN dmi_batches b ON d.id = b.drug_id
      WHERE d.id = $1
      GROUP BY d.id
    `;
    const result = await db.query(query, [drugId, today]);
    return result.rows[0];
  },

  // Get stock movement history for audit logs
  async getTransactionHistory({ drugId, batchId, limit = 50 }) {
    let query = `
      SELECT t.*, d.name AS drug_name, b.batch_number, u.full_name AS user_name, u.role AS user_role
      FROM dmi_stock_transactions t
      JOIN dmi_drugs d ON t.drug_id = d.id
      JOIN dmi_batches b ON t.batch_id = b.id
      JOIN dmi_users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    let idx = 1;

    if (drugId) {
      query += ` AND t.drug_id = $${idx++}`;
      values.push(drugId);
    }
    if (batchId) {
      query += ` AND t.batch_id = $${idx++}`;
      values.push(batchId);
    }

    query += ` ORDER BY t.transaction_date DESC LIMIT $${idx}`;
    values.push(parseInt(limit, 10));

    const result = await db.query(query, values);
    return result.rows;
  }
};

module.exports = stockService;