# 📸 SỬA LỖI UPLOAD ẢNH HỒ CÁ

## 🚨 Vấn đề đã tìm thấy

**Frontend đang gọi sai endpoint** cho upload ảnh:

### ❌ Endpoints sai (trước đây)
- **TankList.vue**: `/upload/tank/${tankId}` 
- **BatchList.vue**: `/upload/batch/${batchId}`

### ✅ Endpoints đúng (đã sửa)
- **TankList.vue**: `/api/tanks/${tankId}/photos`
- **BatchList.vue**: `/api/batches/${batchId}/photos`

## 📋 Files đã được sửa

1. ✅ **client/src/views/tanks/TankList.vue** - Line 492
2. ✅ **client/src/views/batches/BatchList.vue** - Line 667

## 🔧 Chi tiết thay đổi

### File: client/src/views/tanks/TankList.vue
```javascript
// TRƯỚC (sai)
const response = await axios.post(`/upload/tank/${tankId}`, formData, {

// SAU (đúng)  
const response = await axios.post(`/api/tanks/${tankId}/photos`, formData, {
```

### File: client/src/views/batches/BatchList.vue
```javascript
// TRƯỚC (sai)
const response = await axios.post(`/upload/batch/${batchId}`, formData, {

// SAU (đúng)
const response = await axios.post(`/api/batches/${batchId}/photos`, formData, {
```

## ✅ Kiểm tra hoạt động

Sau khi sửa, chức năng upload ảnh sẽ hoạt động bình thường:

1. **Tạo hồ cá mới** + upload ảnh ✅
2. **Chỉnh sửa hồ cá** + upload ảnh ✅  
3. **Upload ảnh cho lứa cá** ✅

## 🔄 Backend endpoints hiện có

- `POST /api/tanks/:id/photos` - Upload ảnh hồ cá
- `POST /api/batches/:id/photos` - Upload ảnh lứa cá
- `POST /api/expenses/:id/receipt` - Upload hóa đơn chi phí

## 🎯 Kết quả

Sau khi sửa, người dùng sẽ có thể:
- Tạo hồ cá mới và upload ảnh thành công
- Thấy thông báo "Tạo hồ cá và upload ảnh thành công!" thay vì lỗi
- Ảnh sẽ hiển thị ngay sau khi upload

## 🚀 Testing

Để test upload ảnh:
1. Vào trang "Quản lý hồ cá"  
2. Nhấn "Thêm hồ cá mới"
3. Điền thông tin + chọn ảnh
4. Nhấn "Lưu"
5. Kiểm tra thông báo thành công và ảnh hiển thị
