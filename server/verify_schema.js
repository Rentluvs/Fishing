const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

const db = new sqlite3.Database(config.databasePath);

console.log('🔍 Kiểm tra schema thực tế...');

db.all("PRAGMA table_info(fish_tanks)", (err, columns) => {
  if (err) {
    console.error('❌ Lỗi:', err);
  } else {
    console.log('📋 Schema hiện tại:');
    columns.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });
    
    const columnNames = columns.map(col => col.name);
    console.log('\n📝 Danh sách cột:', columnNames.join(', '));
    
    if (columnNames.includes('tank_type') && !columnNames.includes('capacity') && !columnNames.includes('current_ph')) {
      console.log('\n✅ Schema đã được cập nhật thành công!');
    } else {
      console.log('\n❌ Schema chưa được cập nhật đúng!');
    }
  }
  
  db.close();
});
