const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middleware/auth');

// All dashboard and alert routes require authentication
router.use(isAuthenticated);

router.get('/summary', dashboardController.getDashboardSummary);

module.exports = router;