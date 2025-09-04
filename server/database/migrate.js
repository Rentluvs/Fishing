const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

function migrateDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Đã kết nối SQLite database cho migration');
    });

    // Bắt đầu transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Kiểm tra xem bảng fish_tanks có tồn tại không
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='fish_tanks'", (err, row) => {
        if (err) {
          console.error('❌ Lỗi kiểm tra bảng:', err);
          db.run('ROLLBACK');
          db.close();
          reject(err);
          return;
        }

        if (row) {
          console.log('🔄 Bắt đầu migration cho bảng fish_tanks...');
          
          // Thêm cột tank_type nếu chưa có
          db.run("ALTER TABLE fish_tanks ADD COLUMN tank_type VARCHAR(100)", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
              console.error('❌ Lỗi thêm cột tank_type:', err);
            } else {
              console.log('✅ Đã thêm cột tank_type');
            }
          });

          // Xóa cột capacity và current_ph
          // SQLite không hỗ trợ DROP COLUMN trực tiếp, nên chúng ta sẽ tạo bảng mới
          db.run(`
            CREATE TABLE fish_tanks_new (
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
          `, (err) => {
            if (err) {
              console.error('❌ Lỗi tạo bảng mới:', err);
              db.run('ROLLBACK');
              db.close();
              reject(err);
              return;
            }

            // Copy dữ liệu từ bảng cũ sang bảng mới
            db.run(`
              INSERT INTO fish_tanks_new 
              (id, user_id, name, fish_type, release_date, spawn_date, notes, current_temperature, created_at, updated_at)
              SELECT id, user_id, name, fish_type, release_date, spawn_date, notes, current_temperature, created_at, updated_at
              FROM fish_tanks
            `, (err) => {
              if (err) {
                console.error('❌ Lỗi copy dữ liệu:', err);
                db.run('ROLLBACK');
                db.close();
                reject(err);
                return;
              }

              // Xóa bảng cũ và đổi tên bảng mới
              db.run('DROP TABLE fish_tanks', (err) => {
                if (err) {
                  console.error('❌ Lỗi xóa bảng cũ:', err);
                  db.run('ROLLBACK');
                  db.close();
                  reject(err);
                  return;
                }

                db.run('ALTER TABLE fish_tanks_new RENAME TO fish_tanks', (err) => {
                  if (err) {
                    console.error('❌ Lỗi đổi tên bảng:', err);
                    db.run('ROLLBACK');
                    db.close();
                    reject(err);
                    return;
                  }

                  console.log('✅ Migration hoàn thành thành công!');
                  db.run('COMMIT');
                  db.close();
                  resolve();
                });
              });
            });
          });
        } else {
          console.log('ℹ️ Bảng fish_tanks chưa tồn tại, bỏ qua migration');
          db.run('COMMIT');
          db.close();
          resolve();
        }
      });
    });
  });
}

// Chạy migration nếu file được gọi trực tiếp
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('🎉 Migration hoàn thành!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration thất bại:', err);
      process.exit(1);
    });
}

module.exports = { migrateDatabase };
