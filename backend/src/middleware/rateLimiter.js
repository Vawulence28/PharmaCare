const rateLimit = require('express-rate-limit');

// General API rate limiter to prevent DDoS / abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 429, message: 'Too many requests from this IP, please try again after 15 minutes.' }
  }
});

// Strict rate limiter for login to prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: { code: 429, message: 'Too many login attempts from this IP, please try again after 15 minutes.' }
  }
});

module.exports = { apiLimiter, loginLimiter };