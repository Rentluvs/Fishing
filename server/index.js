const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
require('dotenv').config();

const initDatabase = require('./database/init');

const app = express();

// ----------------- Middleware cơ bản -----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files cho thư mục uploads (cache 1 ngày)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Phục vụ uploads qua /api để tương thích proxy trên hosting (cPanel thường proxy /api)
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Static files cho thư mục client/public/upload để hiển thị ảnh upload từ client
app.use('/upload', express.static(path.join(__dirname, '..', 'client', 'public', 'upload'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// ----------------- Healthcheck -----------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
// Routes
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Route gốc cho /api để cPanel check
app.get("/api", (req, res) => {
  res.json({
    status: "ok",
    message: "Fish Management API running"
  });
});

// ----------------- API routes -----------------
app.get('/api', (req, res) => {
  res.json({ success: true, message: '🐟 Fish Management API is running!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Fish Management API đang hoạt động!' });
});

// Gắn các router con
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/tanks', require('./routes/tanks'));
app.use('/api/batches', require('./routes/batches'));
app.use('/api/environment', require('./routes/environment'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/weather', require('./routes/weather'));
//app.use('/api/upload', require('./routes/upload'));

// ----------------- Error handling -----------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Có lỗi xảy ra!',
    error: config.nodeEnv === 'development' ? err.message : {}
  });
});

// ----------------- 404 handler -----------------
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint không tồn tại'
  });
});

// ----------------- Khởi tạo DB & chạy server -----------------
initDatabase()
  .then(() => {
    app.listen(config.port, '0.0.0.0', () => {
      console.log(`🐟 Fish Management Server chạy tại port ${config.port}`);
      console.log(`🌐 API endpoint: http://localhost:${config.port}/api`);
    });
  })
  .catch(err => {
    console.error('❌ Lỗi khởi tạo database:', err);
    process.exit(1);
  });
