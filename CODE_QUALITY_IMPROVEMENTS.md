# 🏗️ CHẤT LƯỢNG CODE - CẢI TIẾN CẦN THIẾT

## 1. Error Handling & Logging
**Vấn đề**: Error handling không consistent, thiếu structured logging

**Cải tiến - Centralized Error Handler**:
```javascript
// middleware/errorHandler.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let { statusCode = 500, message, code } = err;

  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    statusCode,
    code,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Operational errors - send message to client
  if (err.isOperational) {
    return res.status(statusCode).json({
      success: false,
      message,
      code
    });
  }

  // Programming errors - don't leak details
  console.error('PROGRAMMING ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Có lỗi xảy ra!'
  });
};

module.exports = { AppError, errorHandler, logger };
```

**Usage**:
```javascript
const { AppError, logger } = require('../middleware/errorHandler');

// Trong routes
if (!user) {
  throw new AppError('Người dùng không tồn tại', 404, 'USER_NOT_FOUND');
}

// Thay vì console.log
logger.info('User logged in', { userId: user.id, ip: req.ip });
```

## 2. Database Layer Abstraction
**Vấn đề**: Raw SQL queries trực tiếp trong routes

**Cải tiến - Repository Pattern**:
```javascript
// repositories/BaseRepository.js
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.get(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id], (err, row) => {
        db.close();
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  async findByUserId(userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(
        `SELECT * FROM ${this.tableName} WHERE user_id = ? ORDER BY created_at DESC`,
        [userId],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async create(data) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      const fields = Object.keys(data);
      const values = Object.values(data);
      const placeholders = fields.map(() => '?').join(', ');
      
      db.run(
        `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
        values,
        function(err) {
          db.close();
          if (err) reject(err);
          else resolve({ id: this.lastID, ...data });
        }
      );
    });
  }
}

// repositories/TankRepository.js
class TankRepository extends BaseRepository {
  constructor() {
    super('fish_tanks');
  }

  async findWithBatchCount(userId) {
    return new Promise((resolve, reject) => {
      const db = getDatabase();
      db.all(`
        SELECT t.*, 
               COUNT(DISTINCT b.id) as batch_count,
               SUM(COALESCE(bt.alive_count, b.initial_count, 0)) as total_fish
        FROM fish_tanks t
        LEFT JOIN fish_batches b ON t.id = b.tank_id
        LEFT JOIN (
          SELECT batch_id, alive_count,
                 ROW_NUMBER() OVER (PARTITION BY batch_id ORDER BY tracking_date DESC) as rn
          FROM batch_tracking
        ) bt ON b.id = bt.batch_id AND bt.rn = 1
        WHERE t.user_id = ?
        GROUP BY t.id
        ORDER BY t.created_at DESC
      `, [userId], (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}
```

## 3. Input Validation Enhancement
**Cải tiến**:
```javascript
// validation/schemas.js
const Joi = require('joi');

const schemas = {
  tank: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    fish_type: Joi.string().max(100).optional(),
    tank_type: Joi.string().max(100).optional(),
    capacity: Joi.number().positive().optional(),
    current_ph: Joi.number().min(0).max(14).optional(),
    current_temperature: Joi.number().min(-10).max(50).optional(),
    release_date: Joi.date().iso().optional(),
    spawn_date: Joi.date().iso().optional(),
    notes: Joi.string().max(1000).optional()
  }),

  batch: Joi.object({
    tank_id: Joi.number().integer().positive().required(),
    batch_name: Joi.string().max(100).optional(),
    spawn_date: Joi.date().iso().required(),
    initial_count: Joi.number().integer().min(0).required(),
    fish_species: Joi.string().max(100).optional(),
    notes: Joi.string().max(1000).optional()
  })
};

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

module.exports = { schemas, validate };
```

## 4. API Response Standardization
**Cải tiến**:
```javascript
// middleware/response.js
const sendResponse = (res, statusCode, success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
};

// Middleware để thêm response helpers
const responseMiddleware = (req, res, next) => {
  res.success = (message, data, meta) => 
    sendResponse(res, 200, true, message, data, meta);
  
  res.created = (message, data) => 
    sendResponse(res, 201, true, message, data);
  
  res.error = (statusCode, message, data = null) => 
    sendResponse(res, statusCode, false, message, data);
  
  next();
};

// Usage
app.use(responseMiddleware);

// Trong routes
res.success('Lấy danh sách hồ cá thành công', tanks, {
  total: tanks.length,
  page: 1
});
```

## 5. Environment Configuration
**Cải tiến**:
```javascript
// config/index.js
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  DATABASE_PATH: Joi.string().required(),
  UPLOAD_PATH: Joi.string().default('./uploads'),
  UPLOAD_MAX_SIZE: Joi.number().default(5 * 1024 * 1024), // 5MB
  RATE_LIMIT_WINDOW: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: Joi.number().default(100)
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN
  },
  database: {
    path: envVars.DATABASE_PATH
  },
  upload: {
    path: envVars.UPLOAD_PATH,
    maxSize: envVars.UPLOAD_MAX_SIZE
  },
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW,
    max: envVars.RATE_LIMIT_MAX
  }
};
```

## 6. Testing Structure
**Cải tiến**:
```javascript
// tests/setup.js
const path = require('path');
const fs = require('fs');

// Test database setup
const testDbPath = path.join(__dirname, '../database/test.db');

beforeEach(() => {
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

// tests/api/auth.test.js
const request = require('supertest');
const app = require('../../index');

describe('Auth API', () => {
  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'admin',
          password: 'admin123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });
  });
});
```

## 7. Documentation
**Cải tiến**: Swagger/OpenAPI documentation
```javascript
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fish Management API',
      version: '1.0.0',
      description: 'API cho hệ thống quản lý cá cảnh'
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```
