const fs = require('fs');
const path = require('path');

// Tạo thư mục logs nếu chưa tồn tại
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Logger class
class Logger {
  constructor(level = 'INFO') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }

  formatMessage(level, message, meta = {}) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta
    }) + '\n';
  }

  writeToFile(filename, content) {
    const filePath = path.join(logsDir, filename);
    fs.appendFileSync(filePath, content);
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] <= this.level) {
      const formattedMessage = this.formatMessage(level, message, meta);
      
      // Console output with colors
      const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[90m'  // Gray
      };
      
      console.log(`${colors[level]}[${level}]\x1b[0m ${message}`, meta);
      
      // File output
      this.writeToFile(`${level.toLowerCase()}.log`, formattedMessage);
      
      // All logs to combined file
      this.writeToFile('combined.log', formattedMessage);
    }
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
}

// Create global logger instance
const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

// Request logging middleware
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.send to log response
  res.send = function(data) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Log response
    logger.info('Response sent', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id,
      responseSize: Buffer.byteLength(data, 'utf8')
    });

    // Performance warning for slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user?.id
      });
    }

    originalSend.call(this, data);
  };

  next();
}

// Error logging middleware
function errorLogger(err, req, res, next) {
  logger.error('Request error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userId: req.user?.id,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(err);
}

// Database operation logger
function logDatabaseOperation(operation, table, data = {}) {
  logger.debug('Database operation', {
    operation,
    table,
    data
  });
}

// Performance monitoring
function performanceLogger(label) {
  const start = Date.now();
  return {
    end: () => {
      const duration = Date.now() - start;
      logger.debug('Performance measurement', {
        label,
        duration: `${duration}ms`
      });
      return duration;
    }
  };
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  logDatabaseOperation,
  performanceLogger
};
