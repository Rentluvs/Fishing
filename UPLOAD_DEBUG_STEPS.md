# 🐛 DEBUG UPLOAD ẢNH HỒ CÁ

## ✅ ĐÃ HOÀN THÀNH
- [x] Server đang chạy thành công (port 5000)
- [x] Sửa endpoint từ `/upload/tank/` thành `/api/tanks/:id/photos`
- [x] Thêm logging chi tiết trong frontend
- [x] Thư mục uploads tồn tại và có quyền ghi

## 🔍 BƯỚC KIỂM TRA TIẾP THEO

### 1. Test Upload với Console Log
1. Mở `http://localhost:3000`
2. Đăng nhập: `admin/admin123` 
3. Vào "Quản lý hồ cá" → "Thêm hồ cá mới"
4. **Mở F12 → Console tab**
5. Điền form + chọn ảnh → Lưu
6. **Xem messages trong Console**

### 2. Các Log Messages Mong Đợi
```javascript
// SUCCESS
"Đang upload ảnh cho tank ID: 1"
"Upload result: {success: true, data: {...}}"

// ERROR
"Chi tiết lỗi upload ảnh: ..."
"Response data: {success: false, message: '...'}"
"Response status: 400/401/500"
```

### 3. Các Lỗi Có Thể Gặp

#### A. Authentication Error (401)
```
Response status: 401
Response data: {success: false, message: "Token không hợp lệ"}
```
**Fix**: Logout → Login lại

#### B. Validation Error (400)  
```
Response status: 400
Response data: {success: false, message: "Dữ liệu không hợp lệ"}
```
**Fix**: Kiểm tra file type, size

#### C. Server Error (500)
```
Response status: 500  
Response data: {success: false, message: "Lỗi lưu ảnh vào database"}
```
**Fix**: Kiểm tra database, permissions

#### D. Network Error
```
Chi tiết lỗi upload ảnh: Error: Network Error
```
**Fix**: Kiểm tra server chạy, CORS

## 🛠️ TROUBLESHOOTING CHECKLIST

- [ ] Server chạy ở port 5000? ✅
- [ ] Client chạy ở port 3000?
- [ ] Login thành công?
- [ ] Console có hiện log "Đang upload ảnh"?
- [ ] HTTP status code là gì?
- [ ] Error message cụ thể là gì?

## 📝 BÁO CÁO LỖI

Sau khi test, cần thông tin:
1. **Console logs** (copy/paste)
2. **Network tab** trong DevTools (request/response details)
3. **Server logs** (nếu có lỗi server-side)

## 🔧 QUICK FIXES CÓ THỂ

### Fix Authentication
```javascript
// Thêm vào uploadTankPhoto function
headers: {
  'Content-Type': 'multipart/form-data',
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}
```

### Fix CORS
```javascript  
// server/index.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Fix File Validation
```javascript
// Check file before upload
if (!file || !file.type.startsWith('image/')) {
  throw new Error('Please select a valid image file');
}
```
