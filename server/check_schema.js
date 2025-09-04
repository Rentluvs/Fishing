const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

function checkSchema() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(config.databasePath, (err) => {
      if (err) {
        console.error('❌ Lỗi kết nối database:', err);
        reject(err);
        return;
      }
      console.log('✅ Đã kết nối SQLite database');
    });

    // Kiểm tra cấu trúc bảng fish_tanks
    db.all("PRAGMA table_info(fish_tanks)", (err, columns) => {
      if (err) {
        console.error('❌ Lỗi kiểm tra schema:', err);
        db.close();
        reject(err);
        return;
      }

      console.log('📋 Cấu trúc bảng fish_tanks hiện tại:');
      columns.forEach(col => {
        console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
      });

      // Kiểm tra xem có cột capacity và current_ph không
      const hasCapacity = columns.some(col => col.name === 'capacity');
      const hasCurrentPh = columns.some(col => col.name === 'current_ph');
      const hasTankType = columns.some(col => col.name === 'tank_type');

      console.log('\n🔍 Phân tích:');
      console.log(`  - Có cột capacity: ${hasCapacity ? '✅' : '❌'}`);
      console.log(`  - Có cột current_ph: ${hasCurrentPh ? '✅' : '❌'}`);
      console.log(`  - Có cột tank_type: ${hasTankType ? '✅' : '❌'}`);

      if (hasCapacity || hasCurrentPh) {
        console.log('\n⚠️  Cần xóa các cột cũ (capacity, current_ph)');
      }

      db.close();
      resolve({ hasCapacity, hasCurrentPh, hasTankType });
    });
  });
}

// Chạy kiểm tra nếu file được gọi trực tiếp
if (require.main === module) {
  checkSchema()
    .then((result) => {
      console.log('\n🎯 Kết quả kiểm tra:', result);
      process.exit(0);
    })
    .catch((err) => {
      console.error('💥 Lỗi kiểm tra schema:', err);
      process.exit(1);
    });
}

module.exports = { checkSchema };
