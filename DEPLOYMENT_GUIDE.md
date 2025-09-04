# 🚀 Hướng dẫn Deploy và Cập nhật

## ✅ **Vấn đề đã được sửa:**

### 🔧 **Hardcode localhost đã được loại bỏ:**
- **Trước**: `http://localhost:5000/uploads/tanks/...`
- **Sau**: `/uploads/tanks/...` (đường dẫn tương đối)

### 📁 **Files đã được cập nhật:**
- `client/src/config/index.js` - File cấu hình mới
- `client/src/stores/tanks.js` - Sử dụng config.buildUrl()
- `client/src/views/expenses/ExpenseList.vue` - Sử dụng config.buildUrl()
- `client/src/views/batches/BatchList.vue` - Sử dụng config.buildUrl()
- `client/src/views/batches/BatchDetail.vue` - Sử dụng config.buildUrl()

## 🚀 **Cách Deploy:**

### 1. **Build Frontend:**
```bash
cd client
npm run build
```

### 2. **Upload Files:**
- Upload toàn bộ thư mục `client/dist/` lên hosting frontend
- Upload toàn bộ thư mục `server/` lên hosting backend

### 3. **Cấu hình Backend:**
```bash
cd server
npm install
npm start
```

## 🌐 **Cấu hình URL:**

### **Development (localhost):**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Images: `http://localhost:5000/uploads/...`

### **Production (hosting):**
- Frontend: `https://yourdomain.com`
- Backend: `https://api.yourdomain.com` hoặc `https://yourdomain.com/api`
- Images: `https://yourdomain.com/uploads/...` hoặc `/uploads/...`

## 🔧 **Cấu hình Environment:**

### **Frontend (client/src/config/index.js):**
```javascript
get apiBaseUrl() {
  // In production, use relative paths
  if (process.env.NODE_ENV === 'production') {
    return ''
  }
  // In development, use localhost
  return 'http://localhost:5000'
}
```

### **Backend (server/config.js):**
```javascript
module.exports = {
  port: process.env.PORT || 5000,
  databasePath: process.env.DATABASE_PATH || './database/fish_management.db',
  uploadPath: process.env.UPLOAD_PATH || './uploads'
}
```

## 📱 **Tính năng Mobile đã được tối ưu:**

### **Responsive Sidebar:**
- Tự động thu gọn trên mobile
- Nút toggle cho mobile
- Overlay khi mở sidebar

### **Mobile-First Design:**
- Grid responsive cho tất cả trang
- Touch-friendly buttons (44px minimum)
- Optimized spacing cho màn hình nhỏ

## 🖼️ **Xử lý Ảnh:**

### **Upload Paths:**
- **Tanks**: `/uploads/tanks/`
- **Batches**: `/uploads/batches/`
- **Expenses**: `/uploads/expenses/`

### **URL Building:**
```javascript
// Sử dụng config.buildUrl() thay vì hardcode
const imageUrl = config.buildUrl(photo.photo_path)
```

## ⚠️ **Lưu ý quan trọng:**

### **1. Database:**
- Đảm bảo database đã được migrate
- Kiểm tra quyền ghi cho thư mục uploads

### **2. File Permissions:**
```bash
chmod 755 uploads/
chmod 644 uploads/*/*
```

### **3. Nginx Configuration (nếu dùng):**
```nginx
location /uploads/ {
    alias /path/to/your/app/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### **4. CORS (nếu frontend/backend khác domain):**
```javascript
// server/index.js
app.use(cors({
  origin: ['https://yourdomain.com', 'http://localhost:3000'],
  credentials: true
}))
```

## 🔍 **Kiểm tra sau khi deploy:**

### **1. Test Upload Ảnh:**
- Upload ảnh mới cho tank/batch/expense
- Kiểm tra URL trong database
- Kiểm tra hiển thị ảnh

### **2. Test Responsive:**
- Kiểm tra trên mobile
- Kiểm tra sidebar collapse
- Kiểm tra grid layout

### **3. Test API:**
- Kiểm tra upload endpoint
- Kiểm tra serve static files
- Kiểm tra CORS nếu cần

## 📞 **Hỗ trợ:**

Nếu gặp vấn đề:
1. Kiểm tra console browser
2. Kiểm tra server logs
3. Kiểm tra file permissions
4. Kiểm tra database schema

---

**🎉 Chúc mừng! Ứng dụng của bạn giờ đây hoàn toàn responsive và sẵn sàng cho production!**
