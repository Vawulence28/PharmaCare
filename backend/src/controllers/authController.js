const authService = require('../services/authService');

const authController = {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'Username and password are required.' },
        });
      }

      const user = await authService.findUserByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: { code: 401, message: 'Invalid username or password.' },
        });
      }

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          error: { code: 403, message: 'Account is deactivated. Contact administrator.' },
        });
      }

      const isValidPassword = await authService.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: { code: 401, message: 'Invalid username or password.' },
        });
      }

      // Regenerate session to prevent session fixation attacks
      req.session.regenerate((err) => {
        if (err) return next(err);

        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        };

        req.session.save((saveErr) => {
          if (saveErr) return next(saveErr);
          return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            data: {
              user: req.session.user,
            },
          });
        });
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req, res, next) {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie('dmi.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    });
  },

  async getCurrentUser(req, res, next) {
    try {
      if (!req.session || !req.session.user) {
        return res.status(401).json({
          success: false,
          error: { code: 401, message: 'Not authenticated' },
        });
      }
      const user = await authService.findUserById(req.session.user.id);
      if (!user || !user.is_active) {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          error: { code: 401, message: 'Session invalid or account deactivated.' },
        });
      }
      return res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  },

  async bootstrapAdmin(req, res, next) {
    try {
      const adminCount = await authService.countAdmins();
      if (adminCount > 0) {
        return res.status(403).json({
          success: false,
          error: {
            code: 403,
            message: 'Bootstrap disabled: An administrator account already exists.',
          },
        });
      }

      const { username, email, password, fullName } = req.body;
      if (!username || !email || !password || !fullName) {
        return res.status(400).json({
          success: false,
          error: { code: 400, message: 'All fields (username, email, password, fullName) are required.' },
        });
      }

      const newAdmin = await authService.createUser({
        username,
        email,
        password,
        fullName,
        role: 'ADMIN',
      });

      return res.status(201).json({
        success: true,
        message: 'Initial administrator created successfully.',
        data: { user: newAdmin },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;