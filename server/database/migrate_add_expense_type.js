const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

function migrateAddExpenseType() {
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
      db.run('BEGIN TRANSACTION');

      // Thêm cột expense_type nếu chưa có. Giá trị: 'purchase' | 'sale'. Mặc định 'purchase'.
      db.run("ALTER TABLE expenses ADD COLUMN expense_type VARCHAR(20) DEFAULT 'purchase'", (err) => {
        if (err && !String(err.message).includes('duplicate column name')) {
          console.error('❌ Lỗi thêm cột expense_type:', err);
          db.run('ROLLBACK');
          db.close();
          reject(err);
          return;
        }

        // Với các bản ghi cũ không có phân loại, đặt mặc định là 'purchase'
        db.run("UPDATE expenses SET expense_type = 'purchase' WHERE expense_type IS NULL", (updErr) => {
          if (updErr) {
            console.error('❌ Lỗi backfill expense_type:', updErr);
            db.run('ROLLBACK');
            db.close();
            reject(updErr);
            return;
          }

          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('❌ Lỗi COMMIT:', commitErr);
              db.close();
              reject(commitErr);
              return;
            }
            console.log('🎉 Migration thêm expense_type hoàn tất');
            db.close();
            resolve();
          });
        });
      });
    });
  });
}

if (require.main === module) {
  migrateAddExpenseType()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateAddExpenseType };


