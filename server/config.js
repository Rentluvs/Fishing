module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production',
  databasePath: process.env.DATABASE_PATH || './database/fish_management.db',
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  nodeEnv: process.env.NODE_ENV || 'development'
};
