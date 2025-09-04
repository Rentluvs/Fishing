require('dotenv').config();

// Validate critical environment variables
const requiredEnvVars = ['JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('📝 Please set these in your .env file or environment');
  process.exit(1);
}

// Generate secure JWT secret if not provided (for development only)
let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ JWT_SECRET must be set in production');
    process.exit(1);
  } else {
    // Generate a random secret for development
    jwtSecret = require('crypto').randomBytes(64).toString('hex');
    console.warn('⚠️  Using generated JWT secret for development. Set JWT_SECRET in production!');
  }
}

const config = {
  // Server
  port: parseInt(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  
  // Database
  databasePath: process.env.DATABASE_PATH || './database/fish_management.db',
  
  // File uploads
  upload: {
    path: process.env.UPLOAD_PATH || './uploads',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log'
  }
};

// Validate configuration
if (config.upload.maxSize > 10 * 1024 * 1024) {
  console.warn('⚠️  Upload max size is very large:', config.upload.maxSize);
}

if (config.jwt.secret.length < 32) {
  console.error('❌ JWT secret is too short. Use at least 32 characters.');
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
}

module.exports = config;
