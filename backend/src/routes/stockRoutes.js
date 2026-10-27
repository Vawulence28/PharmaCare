const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// All stock routes require authentication
router.use(isAuthenticated);

// Read-only endpoints
router.get('/batches', stockController.getBatches);
router.get('/summary/:drugId', stockController.getDrugStockSummary);
router.get('/transactions', stockController.getTransactionHistory);

// Transactional Stock Operations (ADMIN & STAFF)
router.post('/batches', authorizeRoles('ADMIN', 'STAFF'), stockController.registerBatch);
router.post('/receive', authorizeRoles('ADMIN', 'STAFF'), stockController.receiveStock);
router.post('/issue', authorizeRoles('ADMIN', 'STAFF'), stockController.issueStock);

// Stock Adjustments (Restricted to ADMIN)
router.post('/adjust', authorizeRoles('ADMIN'), stockController.adjustStock);

module.exports = router;