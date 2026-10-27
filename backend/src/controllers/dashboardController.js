const dashboardService = require('../services/dashboardService');

const dashboardController = {
  async getDashboardSummary(req, res, next) {
    try {
      const { expiryWindow } = req.query;
      const windowDays = expiryWindow ? parseInt(expiryWindow, 10) : 30;

      const summary = await dashboardService.getDashboardSummary(windowDays);

      return res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = dashboardController;