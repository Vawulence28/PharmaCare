const reportService = require('../services/reportService');

const reportController = {
  async getCurrentStock(req, res, next) {
    try {
      const { drugId, category } = req.query;
      const data = await reportService.getCurrentStockReport({ drugId, category });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getDrugBatches(req, res, next) {
    try {
      const { drugId, batchNumber, status } = req.query;
      const data = await reportService.getDrugBatchReport({ drugId, batchNumber, status });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getStockReceived(req, res, next) {
    try {
      const { startDate, endDate, drugId, batchNumber } = req.query;
      const data = await reportService.getStockMovementReport({ transactionType: 'RECEIVED', startDate, endDate, drugId, batchNumber });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getStockIssued(req, res, next) {
    try {
      const { startDate, endDate, drugId, batchNumber } = req.query;
      const data = await reportService.getStockMovementReport({ transactionType: 'ISSUED', startDate, endDate, drugId, batchNumber });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getStockAdjustments(req, res, next) {
    try {
      const { startDate, endDate, drugId, batchNumber } = req.query;
      const data = await reportService.getStockMovementReport({ transactionType: 'ADJUSTMENT', startDate, endDate, drugId, batchNumber });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req, res, next) {
    try {
      const data = await reportService.getLowStockReport();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getExpiredBatches(req, res, next) {
    try {
      const data = await reportService.getExpiredBatchReport();
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getUpcomingExpiry(req, res, next) {
    try {
      const { windowDays } = req.query;
      const data = await reportService.getUpcomingExpiryReport(windowDays || 30);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = reportController;