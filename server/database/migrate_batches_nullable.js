const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('../config');

function migrateBatchesNullable() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Kết nối SQLite thành công');
    });

    db.serialize(() => {
      console.log('🔄 Bắt đầu migration: cho phép tank_id NULL và ON DELETE SET NULL...');

      // Bật foreign keys
      db.run('PRAGMA foreign_keys = ON');

      db.run('BEGIN TRANSACTION');

      // Tạo bảng mới với schema đúng
      db.run(`
        CREATE TABLE IF NOT EXISTS fish_batches_new (
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
      `, (err) => {
        if (err) {
          console.error('❌ Lỗi tạo bảng fish_batches_new:', err);
          db.run('ROLLBACK');
          db.close();
          reject(err);
          return;
        }

        // Copy dữ liệu từ bảng cũ sang bảng mới
        db.run(`
          INSERT INTO fish_batches_new (id, user_id, tank_id, batch_name, spawn_date, initial_count, fish_species, notes, created_at, updated_at)
          SELECT id, user_id, tank_id, batch_name, spawn_date, initial_count, fish_species, notes, created_at, updated_at
          FROM fish_batches
        `, (copyErr) => {
          if (copyErr) {
            console.error('❌ Lỗi copy dữ liệu fish_batches:', copyErr);
            db.run('ROLLBACK');
            db.close();
            reject(copyErr);
            return;
          }

          // Xóa bảng cũ
          db.run('DROP TABLE fish_batches', (dropErr) => {
            if (dropErr) {
              console.error('❌ Lỗi xóa fish_batches cũ:', dropErr);
              db.run('ROLLBACK');
              db.close();
              reject(dropErr);
              return;
            }

            // Đổi tên bảng mới
            db.run('ALTER TABLE fish_batches_new RENAME TO fish_batches', (renameErr) => {
              if (renameErr) {
                console.error('❌ Lỗi đổi tên fish_batches_new:', renameErr);
                db.run('ROLLBACK');
                db.close();
                reject(renameErr);
                return;
              }

              db.run('COMMIT', (commitErr) => {
                if (commitErr) {
                  console.error('❌ Lỗi COMMIT:', commitErr);
                  db.close();
                  reject(commitErr);
                  return;
                }
                console.log('🎉 Migration fish_batches hoàn tất: tank_id đã cho phép NULL và ON DELETE SET NULL');
                db.close();
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

if (require.main === module) {
  migrateBatchesNullable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateBatchesNullable };


