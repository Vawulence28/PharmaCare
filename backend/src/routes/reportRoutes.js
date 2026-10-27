const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { isAuthenticated } = require('../middleware/auth');

// All report endpoints require authentication
router.use(isAuthenticated);

router.get('/current-stock', reportController.getCurrentStock);
router.get('/drug-batches', reportController.getDrugBatches);
router.get('/received', reportController.getStockReceived);
router.get('/issued', reportController.getStockIssued);
router.get('/adjustments', reportController.getStockAdjustments);
router.get('/low-stock', reportController.getLowStock);
router.get('/expired', reportController.getExpiredBatches);
router.get('/upcoming-expiry', reportController.getUpcomingExpiry);

module.exports = router;