const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logging utility (you can replace with Winston later)
class Logger {
  constructor() {
    this.logFile = path.join(logsDir, 'app.log');
    this.errorFile = path.join(logsDir, 'error.log');
  }

  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    // Console output
    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, meta);

    // File output
    try {
      fs.appendFileSync(this.logFile, logLine);
      
      if (level === 'error') {
        fs.appendFileSync(this.errorFile, logLine);
      }
    } catch (err) {
      console.error('Logging error:', err);
    }
  }

  info(message, meta) { this.log('info', message, meta); }
  warn(message, meta) { this.log('warn', message, meta); }
  error(message, meta) { this.log('error', message, meta); }
  debug(message, meta) { this.log('debug', message, meta); }
}

const logger = new Logger();

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;

  // Log error details
  logger.error('Request Error', {
    error: err.message,
    stack: err.stack,
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous'
  });

  // Handle specific error types
  if (err.code === 'SQLITE_CONSTRAINT') {
    statusCode = 400;
    message = 'Dữ liệu vi phạm ràng buộc database';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File quá lớn';
  } else if (err.message.includes('jwt')) {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }

  // Operational errors - send message to client
  if (err.isOperational || statusCode < 500) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    });
  }

  // Programming errors - don't leak details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: 'Có lỗi xảy ra!',
    ...(isDevelopment && { error: err.message, stack: err.stack }),
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  logger
};
