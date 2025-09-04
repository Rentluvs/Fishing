const sqlite3 = require('sqlite3').verbose();
const config = require('../config');

function migrateAddExpenseReceipt() {
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
      db.run("ALTER TABLE expenses ADD COLUMN receipt_path VARCHAR(255)", (err) => {
        if (err && !String(err.message).includes('duplicate column name')) {
          console.error('❌ Lỗi thêm cột receipt_path:', err);
          db.run('ROLLBACK');
          db.close();
          reject(err);
          return;
        }
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            console.error('❌ Lỗi COMMIT:', commitErr);
            db.close();
            reject(commitErr);
            return;
          }
          console.log('🎉 Migration thêm receipt_path hoàn tất');
          db.close();
          resolve();
        });
      });
    });
  });
}

if (require.main === module) {
  migrateAddExpenseReceipt()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateAddExpenseReceipt };


