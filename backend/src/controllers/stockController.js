const stockService = require('../services/stockService');

const stockController = {
  async registerBatch(req, res, next) {
    try {
      const { drugId, batchNumber, quantityReceived, dateReceived, expiryDate, unitCost, notes } = req.body;

      if (!drugId || !batchNumber || !quantityReceived || !expiryDate) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Missing mandatory fields: drugId, batchNumber, quantityReceived, and expiryDate are required.' }
        });
      }

      const batch = await stockService.registerBatch({
        drugId,
        batchNumber,
        quantityReceived,
        dateReceived,
        expiry_date: expiryDate,
        unitCost,
        userId: req.session.user.id,
        notes
      });

      return res.status(201).json({
        success: true,
        message: 'Batch registered successfully.',
        data: { batch }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.statusCode, message: error.message }
        });
      }
      next(error);
    }
  },

  async receiveStock(req, res, next) {
    try {
      const { batchId, quantity, notes } = req.body;

      if (!batchId || !quantity) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'batchId and quantity are required.' }
        });
      }

      const batch = await stockService.receiveStock({
        batchId,
        quantity,
        userId: req.session.user.id,
        notes
      });

      return res.status(200).json({
        success: true,
        message: 'Stock received successfully.',
        data: { batch }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.statusCode, message: error.message }
        });
      }
      next(error);
    }
  },

  async issueStock(req, res, next) {
    try {
      const { drugId, batchId, quantity, notes } = req.body;

      if (!drugId || !quantity) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'drugId and quantity are required.' }
        });
      }

      const result = await stockService.issueStock({
        drugId,
        batchId,
        quantity,
        userId: req.session.user.id,
        notes
      });

      return res.status(200).json({
        success: true,
        message: 'Stock issued successfully using FEFO allocation.',
        data: result
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.statusCode, message: error.message }
        });
      }
      next(error);
    }
  },

  async adjustStock(req, res, next) {
    try {
      const { batchId, newQuantity, reason } = req.body;

      const result = await stockService.adjustStock({
        batchId,
        newQuantity,
        reason,
        userId: req.session.user.id
      });

      return res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully.',
        data: { batch: result }
      });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          error: { code: error.statusCode, message: error.message }
        });
      }
      next(error);
    }
  },

  async getBatches(req, res, next) {
    try {
      const { drugId, status, batchNumber, search } = req.query;
      const batches = await stockService.getBatches({ drugId, filterStatus: status, batchNumber, search });

      return res.status(200).json({
        success: true,
        data: { batches }
      });
    } catch (error) {
      next(error);
    }
  },

  async getDrugStockSummary(req, res, next) {
    try {
      const { drugId } = req.params;
      const summary = await stockService.getDrugStockSummary(drugId);

      return res.status(200).json({
        success: true,
        data: { summary }
      });
    } catch (error) {
      next(error);
    }
  },

  async getTransactionHistory(req, res, next) {
    try {
      const { drugId, batchId, limit } = req.query;
      const transactions = await stockService.getTransactionHistory({ drugId, batchId, limit });

      return res.status(200).json({
        success: true,
        data: { transactions }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = stockController;