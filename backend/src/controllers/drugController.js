const drugService = require('../services/drugService');

const VALID_DOSAGE_FORMS = ['tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops', 'inhaler', 'other'];

const drugController = {
  async createDrug(req, res, next) {
    try {
      const { name, genericName, category, dosageForm, strength, unitOfMeasurement, minimumStockThreshold, description } = req.body;

      if (!name || !category || !dosageForm || !strength || !unitOfMeasurement) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Missing required fields: name, category, dosageForm, strength, and unitOfMeasurement are required.' }
        });
      }

      if (!VALID_DOSAGE_FORMS.includes(dosageForm)) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: `Invalid dosage form. Allowed values: ${VALID_DOSAGE_FORMS.join(', ')}` }
        });
      }

      // Check duplicate constraint
      const existing = await drugService.checkDuplicate(name, dosageForm, strength);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: { code: 409, message: 'A drug with the same name, dosage form, and strength already exists.' }
        });
      }

      const newDrug = await drugService.createDrug({
        name,
        genericName,
        category,
        dosageForm,
        strength,
        unitOfMeasurement,
        minimumStockThreshold,
        description
      });

      return res.status(201).json({
        success: true,
        message: 'Drug created successfully.',
        data: { drug: newDrug }
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllDrugs(req, res, next) {
    try {
      const { search, category, status, limit, offset } = req.query;
      const result = await drugService.getAllDrugs({
        search,
        category,
        status,
        limit: limit || 20,
        offset: offset || 0
      });

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async getDrugById(req, res, next) {
    try {
      const { id } = req.params;
      const drug = await drugService.getDrugById(id);

      if (!drug) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Drug not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        data: { drug }
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDrug(req, res, next) {
    try {
      const { id } = req.params;
      const { dosageForm } = req.body;

      if (dosageForm && !VALID_DOSAGE_FORMS.includes(dosageForm)) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: `Invalid dosage form. Allowed values: ${VALID_DOSAGE_FORMS.join(', ')}` }
        });
      }

      const updatedDrug = await drugService.updateDrug(id, req.body);

      if (!updatedDrug) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Drug not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Drug updated successfully.',
        data: { drug: updatedDrug }
      });
    } catch (error) {
      next(error);
    }
  },

  async archiveDrug(req, res, next) {
    try {
      const { id } = req.params;
      const archivedDrug = await drugService.archiveDrug(id);

      if (!archivedDrug) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'Drug not found.' }
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Drug archived/deactivated successfully.',
        data: { drug: archivedDrug }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = drugController;