const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Tạo thư mục database nếu chưa tồn tại
const dbDir = path.dirname(config.databasePath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Khởi tạo database
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Đã kết nối SQLite database');
    });

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON;');

    // Tạo bảng Users
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng Fish Tanks (Hồ cá)
    db.run(`
      CREATE TABLE IF NOT EXISTS fish_tanks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name VARCHAR(100) NOT NULL,
        fish_type VARCHAR(100),
        release_date DATE,
        spawn_date DATE,
        notes TEXT,
        tank_type VARCHAR(100),
        current_temperature DECIMAL(4,1),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Tạo bảng Fish Batches (Lứa cá)
    db.run(`
      CREATE TABLE IF NOT EXISTS fish_batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tank_id INTEGER,
        batch_name VARCHAR(100),
        spawn_date DATE NOT NULL,
        initial_count INTEGER NOT NULL,
        fish_species VARCHAR(100),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tank_id) REFERENCES fish_tanks(id) ON DELETE SET NULL
      )
    `);

    // Tạo bảng Batch Tracking (Theo dõi từng giai đoạn)
    db.run(`
      CREATE TABLE IF NOT EXISTS batch_tracking (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        tracking_date DATE NOT NULL,
        stage VARCHAR(50),
        alive_count INTEGER NOT NULL,
        dead_count INTEGER NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES fish_batches(id) ON DELETE CASCADE
      )
    `);

    // Tạo bảng Development Logs (Nhật ký phát triển)
    db.run(`
      CREATE TABLE IF NOT EXISTS development_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        log_date DATE NOT NULL,
        stage VARCHAR(50),
        description TEXT,
        weight DECIMAL(8,3),
        length DECIMAL(8,2),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES fish_batches(id) ON DELETE CASCADE
      )
    `);

    // Tạo bảng Environment Logs (Nhật ký môi trường)
    db.run(`
      CREATE TABLE IF NOT EXISTS environment_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER NOT NULL,
        log_date DATE NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        ph_level DECIMAL(3,1),
        temperature DECIMAL(4,1),
        water_change_percentage INTEGER,
        notes TEXT,
        reminder_date DATE,
        completed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tank_id) REFERENCES fish_tanks(id) ON DELETE CASCADE
      )
    `);

    // Tạo bảng Expenses (Chi phí)
    db.run(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        tank_id INTEGER,
        batch_id INTEGER,
        expense_date DATE NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        amount DECIMAL(12,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'VND',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tank_id) REFERENCES fish_tanks(id) ON DELETE SET NULL,
        FOREIGN KEY (batch_id) REFERENCES fish_batches(id) ON DELETE SET NULL
      )
    `);

    // Tạo bảng Photos (Hình ảnh)
    db.run(`
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tank_id INTEGER,
        batch_id INTEGER,
        photo_path VARCHAR(255) NOT NULL,
        caption TEXT,
        photo_date DATE NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tank_id) REFERENCES fish_tanks(id) ON DELETE CASCADE,
        FOREIGN KEY (batch_id) REFERENCES fish_batches(id) ON DELETE CASCADE
      )
    `);

    // Tạo user mặc định cho demo
    const bcrypt = require('bcryptjs');
    const defaultPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash, full_name)
      VALUES ('admin', 'admin@fishmanagement.com', ?, 'Administrator')
    `, [defaultPassword], (err) => {
      if (err) {
        console.error('❌ Lỗi tạo user mặc định:', err);
      } else {
        console.log('✅ Đã tạo user mặc định (admin/admin123)');
      }
    });

    db.close((err) => {
      if (err) {
        console.error('❌ Lỗi đóng database:', err);
        reject(err);
      } else {
        console.log('✅ Database đã được khởi tạo thành công');
        resolve();
      }
    });
  });
}

module.exports = initDatabase;
