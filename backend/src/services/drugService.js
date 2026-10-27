const db = require('../config/db');

const drugService = {
  async createDrug({ name, genericName, category, dosageForm, strength, unitOfMeasurement, minimumStockThreshold, description }) {
    const query = `
      INSERT INTO dmi_drugs (name, generic_name, category, dosage_form, strength, unit_of_measurement, minimum_stock_threshold, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      name.trim(),
      genericName ? genericName.trim() : null,
      category.trim(),
      dosageForm,
      strength.trim(),
      unitOfMeasurement.trim(),
      minimumStockThreshold !== undefined ? parseInt(minimumStockThreshold, 10) : 10,
      description ? description.trim() : null
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async getAllDrugs({ search, category, status, limit = 20, offset = 0 }) {
    let query = 'SELECT * FROM dmi_drugs WHERE 1=1';
    const values = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR generic_name ILIKE $${paramIndex} OR CAST(id AS TEXT) = $${paramIndex})`;
      values.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category ILIKE $${paramIndex}`;
      values.push(category.trim());
      paramIndex++;
    }

    if (status !== undefined && status !== '') {
      query += ` AND is_active = $${paramIndex}`;
      values.push(status === 'true' || status === true);
      paramIndex++;
    }

    // Count total matching rows for pagination metadata
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*)');
    const countResult = await db.query(countQuery, values);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Apply pagination
    query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(parseInt(limit, 10), parseInt(offset, 10));

    const result = await db.query(query, values);
    return {
      drugs: result.rows,
      pagination: {
        total: totalCount,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10)
      }
    };
  },

  async getDrugById(id) {
    const query = 'SELECT * FROM dmi_drugs WHERE id = $1';
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async updateDrug(id, { name, genericName, category, dosageForm, strength, unitOfMeasurement, minimumStockThreshold, description, isActive }) {
    const query = `
      UPDATE dmi_drugs
      SET name = COALESCE($1, name),
          generic_name = COALESCE($2, generic_name),
          category = COALESCE($3, category),
          dosage_form = COALESCE($4, dosage_form),
          strength = COALESCE($5, strength),
          unit_of_measurement = COALESCE($6, unit_of_measurement),
          minimum_stock_threshold = COALESCE($7, minimum_stock_threshold),
          description = COALESCE($8, description),
          is_active = COALESCE($9, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      name ? name.trim() : null,
      genericName !== undefined ? (genericName ? genericName.trim() : null) : null,
      category ? category.trim() : null,
      dosageForm || null,
      strength ? strength.trim() : null,
      unitOfMeasurement ? unitOfMeasurement.trim() : null,
      minimumStockThreshold !== undefined ? parseInt(minimumStockThreshold, 10) : null,
      description !== undefined ? (description ? description.trim() : null) : null,
      isActive !== undefined ? isActive : null,
      id
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async archiveDrug(id) {
    // Check if drug has batch history (future compatibility guard)
    // For now, we perform status archival (is_active = FALSE)
    const query = `
      UPDATE dmi_drugs
      SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await db.query(query, [id]);
    return result.rows[0];
  },

  async checkDuplicate(name, dosageForm, strength) {
    const query = 'SELECT id FROM dmi_drugs WHERE LOWER(name) = LOWER($1) AND LOWER(dosage_form) = LOWER($2) AND LOWER(strength) = LOWER($3)';
    const result = await db.query(query, [name.trim(), dosageForm.trim(), strength.trim()]);
    return result.rows[0];
  }
};

module.exports = drugService;