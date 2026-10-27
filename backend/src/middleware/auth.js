const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    error: {
      code: 401,
      message: 'Unauthorized: Please log in to access this resource.',
    },
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: { code: 401, message: 'Unauthorized: No active session.' },
      });
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 403,
          message: 'Forbidden: You do not have permission to perform this action.',
        },
      });
    }

    next();
  };
};

module.exports = {
  isAuthenticated,
  authorizeRoles,
};