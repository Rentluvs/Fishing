const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
const securityHeaders = helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      scriptSrc: ["'self'", "'unsafe-eval'"], // Vue dev tools need unsafe-eval
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "https:", "wss:"]
    }
  }
});

// Rate limiting configurations
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: {
    success: false,
    message
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message
    });
  }
});

// Different rate limits for different endpoints
const authLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút'
);

const apiLimiter = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Quá nhiều yêu cầu, vui lòng thử lại sau'
);

const uploadLimiter = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 uploads
  'Quá nhiều lần upload, vui lòng thử lại sau 1 phút'
);

module.exports = {
  securityHeaders,
  authLimiter,
  apiLimiter,
  uploadLimiter
};
