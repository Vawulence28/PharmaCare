const authService = require('../services/authService');

const userController = {
  async getAllUsers(req, res, next) {
    try {
      const users = await authService.getAllUsers();
      return res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const { username, email, password, fullName, role } = req.body;

      if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'All fields are required.' },
        });
      }

      if (!['ADMIN', 'STAFF'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Invalid role. Must be ADMIN or STAFF.' },
        });
      }

      const existingUser = await authService.findUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: { code: 409, message: 'Username already exists.' },
        });
      }

      const newUser = await authService.createUser({
        username,
        email,
        password,
        fullName,
        role,
      });

      return res.status(201).json({
        success: true,
        message: 'User account created successfully.',
        data: { user: newUser },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { email, fullName, role, isActive } = req.body;

      if (role && !['ADMIN', 'STAFF'].includes(role)) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Invalid role. Must be ADMIN or STAFF.' },
        });
      }

      const updatedUser = await authService.updateStaffUser(id, {
        email,
        fullName,
        role,
        isActive,
      });

      if (!updatedUser) {
        return res.status(404).json({
          success: false,
          error: { code: 404, message: 'User not found.' },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'User updated successfully.',
        data: { user: updatedUser },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = userController;