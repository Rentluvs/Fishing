const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

function simpleMigration() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Đã kết nối SQLite database');
    });

    db.serialize(() => {
      console.log('🔄 Bắt đầu migration đơn giản...');

      // Backup dữ liệu hiện tại
      db.all("SELECT * FROM fish_tanks", (err, rows) => {
        if (err) {
          console.error('❌ Lỗi backup dữ liệu:', err);
          db.close();
          reject(err);
          return;
        }

        console.log(`📦 Backup ${rows.length} bản ghi`);

        // Xóa bảng cũ
        db.run("DROP TABLE IF EXISTS fish_tanks", (err) => {
          if (err) {
            console.error('❌ Lỗi xóa bảng cũ:', err);
            db.close();
            reject(err);
            return;
          }
          console.log('✅ Đã xóa bảng cũ');

          // Tạo bảng mới với schema đúng
          db.run(`
            CREATE TABLE fish_tanks (
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
              db.close();
              reject(err);
              return;
            }
            console.log('✅ Đã tạo bảng mới với schema đúng');

            // Khôi phục dữ liệu (bỏ qua capacity và current_ph)
            if (rows.length > 0) {
              const stmt = db.prepare(`
                INSERT INTO fish_tanks 
                (id, user_id, name, fish_type, release_date, spawn_date, notes, current_temperature, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              `);

              rows.forEach(row => {
                stmt.run([
                  row.id,
                  row.user_id,
                  row.name,
                  row.fish_type,
                  row.release_date,
                  row.spawn_date,
                  row.notes,
                  row.current_temperature,
                  row.created_at,
                  row.updated_at
                ]);
              });

              stmt.finalize((err) => {
                if (err) {
                  console.error('❌ Lỗi khôi phục dữ liệu:', err);
                  db.close();
                  reject(err);
                  return;
                }
                console.log(`✅ Đã khôi phục ${rows.length} bản ghi`);
                db.close();
                resolve();
              });
            } else {
              console.log('ℹ️ Không có dữ liệu để khôi phục');
              db.close();
              resolve();
            }
          });
        });
      });
    });
  });
}

// Chạy migration nếu file được gọi trực tiếp
if (require.main === module) {
  simpleMigration()
    .then(() => {
      console.log('🎉 Migration đơn giản hoàn thành!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Migration thất bại:', err);
      process.exit(1);
    });
}

module.exports = { simpleMigration };
