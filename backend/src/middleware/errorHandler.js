const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      code: statusCode,
      message: err.message || 'Internal Server Error',
    },
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      code: 404,
      message: `Route not found - ${req.originalUrl}`,
    },
  });
};

module.exports = { errorHandler, notFoundHandler };