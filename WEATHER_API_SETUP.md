# 🌤️ Cấu hình API Thời tiết

## Tổng quan
Hệ thống đã được tích hợp API thời tiết để tự động lấy nhiệt độ hiện tại của Đông Hà, Quảng Trị, Việt Nam.

## Cấu hình API Key (Tùy chọn)

### 1. Lấy API Key miễn phí
- Truy cập: https://openweathermap.org/api
- Đăng ký tài khoản miễn phí
- Lấy API key từ dashboard

### 2. Cấu hình trong file .env
Tạo file `.env` trong thư mục `server/` với nội dung:

```env
# Database Configuration
NODE_ENV=development
PORT=5000

# JWT Secret
JWT_SECRET=your_jwt_secret_here

# Weather API (Optional - for real weather data)
OPENWEATHER_API_KEY=your_openweather_api_key_here

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 3. Không có API Key
Nếu không cấu hình API key, hệ thống sẽ sử dụng nhiệt độ mặc định (25°C) và hiển thị thông báo tương ứng.

## API Endpoints

### Lấy nhiệt độ hiện tại
```
GET /api/weather/current
```

Response:
```json
{
  "success": true,
  "data": {
    "temperature": 25.5,
    "feels_like": 26.2,
    "humidity": 75,
    "description": "mây cụm",
    "city": "Đông Hà",
    "country": "VN",
    "timestamp": "2024-01-20T10:30:00.000Z"
  }
}
```

### Lấy dự báo thời tiết 5 ngày
```
GET /api/weather/forecast
```

## Tính năng trong giao diện

### Trang "Quản lý hồ cá"
- Nút "Lấy nhiệt độ hiện tại" trong form tạo/sửa hồ cá
- Tự động điền nhiệt độ từ API thời tiết
- Hiển thị thông tin thời tiết: thành phố, nhiệt độ, mô tả

### Cập nhật đã thực hiện
1. ✅ Thay đổi trường "Dung tích" thành "Loại hồ" (input text)
2. ✅ Xóa trường "pH"
3. ✅ Thêm tính năng lấy nhiệt độ thời tiết thực tế
4. ✅ Cập nhật database schema
5. ✅ Cập nhật API endpoints
6. ✅ Cập nhật giao diện người dùng

## Lưu ý
- API thời tiết có giới hạn 1000 request/ngày cho tài khoản miễn phí
- Nếu không có API key, hệ thống vẫn hoạt động bình thường với nhiệt độ mặc định
- Dữ liệu thời tiết được cập nhật theo thời gian thực khi người dùng nhấn nút "Lấy nhiệt độ hiện tại"
