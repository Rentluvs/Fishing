const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

function fixMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Đã kết nối SQLite database cho fix migration');
    });

    // Bắt đầu transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      console.log('🔄 Bắt đầu fix migration...');

      // Tạo bảng mới với schema đúng
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
        console.log('✅ Đã tạo bảng mới');

        // Copy dữ liệu từ bảng cũ sang bảng mới (bỏ qua capacity và current_ph)
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
          console.log('✅ Đã copy dữ liệu');

          // Xóa bảng cũ
          db.run('DROP TABLE fish_tanks', (err) => {
            if (err) {
              console.error('❌ Lỗi xóa bảng cũ:', err);
              db.run('ROLLBACK');
              db.close();
              reject(err);
              return;
            }
            console.log('✅ Đã xóa bảng cũ');

            // Đổi tên bảng mới thành fish_tanks
            db.run('ALTER TABLE fish_tanks_new RENAME TO fish_tanks', (err) => {
              if (err) {
                console.error('❌ Lỗi đổi tên bảng:', err);
                db.run('ROLLBACK');
                db.close();
                reject(err);
                return;
              }

              console.log('✅ Đã đổi tên bảng thành công');
              console.log('✅ Fix migration hoàn thành thành công!');
              db.run('COMMIT');
              db.close();
              resolve();
            });
          });
        });
      });
    });
  });
}

// Chạy fix migration nếu file được gọi trực tiếp
if (require.main === module) {
  fixMigration()
    .then(() => {
      console.log('🎉 Fix migration hoàn thành!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Fix migration thất bại:', err);
      process.exit(1);
    });
}

module.exports = { fixMigration };
