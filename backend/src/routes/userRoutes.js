const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, authorizeRoles } = require('../middleware/auth');

// All user management routes require ADMIN role
router.use(isAuthenticated, authorizeRoles('ADMIN'));

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);

module.exports = router;