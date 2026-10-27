const express = require('express');
const router = express.Router();
const drugController = require('../controllers/drugController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// All drug routes require authentication
router.use(isAuthenticated);

// Publicly accessible to both ADMIN and STAFF roles
router.get('/', drugController.getAllDrugs);
router.get('/:id', drugController.getDrugById);

// Restricted actions: Create, Update, Archive require ADMIN or designated inventory manager role
router.post('/', authorizeRoles('ADMIN', 'STAFF'), drugController.createDrug);
router.put('/:id', authorizeRoles('ADMIN', 'STAFF'), drugController.updateDrug);
router.patch('/:id/archive', authorizeRoles('ADMIN'), drugController.archiveDrug);

module.exports = router;