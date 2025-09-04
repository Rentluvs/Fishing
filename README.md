<<<<<<< HEAD
# 🐟 Hệ thống quản lý cá cảnh

Hệ thống quản lý cá cảnh chuyên nghiệp được xây dựng với Node.js, Vue.js và SQLite.

## ✨ Tính năng

### 🔐 Hệ thống xác thực
- Đăng ký/Đăng nhập
- JWT authentication
- Bảo mật API endpoints

### 🏠 Quản lý hồ cá
- Thêm, sửa, xóa hồ cá
- Theo dõi thông tin: ID, tên hồ, loại cá, ngày thả, ngày đẻ
- Ghi chú và thông số môi trường
- Thống kê tổng quan

### 🐠 Theo dõi lứa cá
- Thêm lứa cá mới (ngày đẻ, số lượng cá bột, chủng loại)
- Cập nhật số lượng sống/chết theo từng giai đoạn
- Nhật ký phát triển chi tiết
- Upload hình ảnh theo mốc thời gian
- Tính toán tỷ lệ sống

### 🌊 Nhật ký môi trường
- Nhắc nhở thay nước định kỳ
- Lịch vệ sinh hồ cá
- Theo dõi pH, nhiệt độ
- Ghi chú các hoạt động bảo trì

### 💰 Quản lý chi phí
- Tổng hợp chi phí theo tháng/năm
- Phân loại chi phí theo danh mục
- Báo cáo chi phí theo hồ cá hoặc lứa cá
- Thống kê và biểu đồ

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm >= 8.0.0

### Cài đặt dependencies

```bash
# Cài đặt dependencies cho toàn bộ dự án
npm run install:all

# Hoặc cài đặt từng phần
cd server && npm install
cd ../client && npm install
```

### Chạy ứng dụng

#### Development (Phát triển)
```bash
# Chạy cả backend và frontend cùng lúc
npm run dev

# Hoặc chạy riêng từng phần
# Backend (port 5000)
npm run server:dev

# Frontend (port 3000)  
npm run client:dev
```

#### Production (Sản phẩm)
```bash
# Build frontend
npm run client:build

# Chạy backend
npm run server:start
```

### Truy cập ứng dụng

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api/test

### Tài khoản demo

```
Username: admin
Password: admin123
```

## 📁 Cấu trúc dự án

```
fish-management-system/
├── server/                 # Backend (Node.js + Express + SQLite)
│   ├── config.js          # Cấu hình server
│   ├── index.js           # Entry point
│   ├── database/          # Database và migrations
│   │   ├── init.js        # Khởi tạo database
│   │   └── fish_management.db
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication
│   │   ├── tanks.js       # Quản lý hồ cá
│   │   ├── batches.js     # Theo dõi lứa cá
│   │   ├── environment.js # Nhật ký môi trường
│   │   └── expenses.js    # Quản lý chi phí
│   └── uploads/           # File uploads
├── client/                # Frontend (Vue.js)
│   ├── public/
│   ├── src/
│   │   ├── components/    # Vue components
│   │   ├── views/         # Pages/Views
│   │   ├── stores/        # Pinia stores
│   │   ├── router/        # Vue Router
│   │   ├── assets/        # CSS, images
│   │   └── utils/         # Utilities
│   ├── vue.config.js      # Vue CLI config
│   └── package.json
└── package.json           # Root package.json
```

## 🛠️ Stack công nghệ

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **multer** - File upload
- **express-validator** - Input validation

### Frontend
- **Vue.js 3** - Progressive framework
- **Vue Router** - Routing
- **Pinia** - State management
- **Element Plus** - UI component library
- **Axios** - HTTP client
- **Sass** - CSS preprocessor

## 📊 Database Schema

### Users
- id, username, email, password_hash, full_name, timestamps

### Fish Tanks
- id, user_id, name, fish_type, release_date, spawn_date, notes, capacity, current_ph, current_temperature, timestamps

### Fish Batches
- id, tank_id, batch_name, spawn_date, initial_count, fish_species, notes, timestamps

### Batch Tracking
- id, batch_id, tracking_date, stage, alive_count, dead_count, notes

### Development Logs
- id, batch_id, log_date, stage, description, weight, length, notes

### Environment Logs
- id, tank_id, log_date, activity_type, ph_level, temperature, water_change_percentage, notes, reminder_date, completed

### Expenses
- id, user_id, tank_id, batch_id, expense_date, category, description, amount, currency, notes

### Photos
- id, tank_id, batch_id, photo_path, caption, photo_date, file_size

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/register` - Đăng ký
- `GET /api/auth/me` - Thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

### Tanks
- `GET /api/tanks` - Danh sách hồ cá
- `GET /api/tanks/:id` - Chi tiết hồ cá
- `POST /api/tanks` - Tạo hồ cá mới
- `PUT /api/tanks/:id` - Cập nhật hồ cá
- `DELETE /api/tanks/:id` - Xóa hồ cá

### Batches
- `GET /api/batches` - Danh sách lứa cá
- `GET /api/batches/:id` - Chi tiết lứa cá
- `POST /api/batches` - Tạo lứa cá mới
- `POST /api/batches/:id/tracking` - Thêm theo dõi
- `POST /api/batches/:id/development-log` - Thêm nhật ký phát triển

### Environment
- `GET /api/environment` - Danh sách nhật ký môi trường
- `GET /api/environment/reminders` - Nhắc nhở
- `POST /api/environment` - Thêm nhật ký mới
- `PUT /api/environment/:id` - Cập nhật nhật ký
- `POST /api/environment/quick-actions` - Thao tác nhanh

### Expenses
- `GET /api/expenses` - Danh sách chi phí
- `GET /api/expenses/summary` - Tóm tắt chi phí
- `GET /api/expenses/statistics` - Thống kê chi phí
- `POST /api/expenses` - Thêm chi phí mới
- `PUT /api/expenses/:id` - Cập nhật chi phí

## 🔜 Roadmap

### Phiên bản tiếp theo
- [ ] Upload và quản lý hình ảnh
- [ ] Xuất báo cáo PDF/Excel
- [ ] Notification system
- [ ] Mobile responsive improvements
- [ ] Dark mode
- [ ] Multi-language support

### Tương lai
- [ ] Mobile app (React Native/Flutter)
- [ ] Cloud deployment guides
- [ ] Advanced analytics và AI insights
- [ ] IoT integration (sensors)
- [ ] Multi-user support với roles
- [ ] Backup/restore functionality

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📝 License

Dự án này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 🙋‍♂️ Hỗ trợ

Nếu bạn gặp vấn đề hoặc có câu hỏi, vui lòng tạo issue trên GitHub repository.

## 🎯 Demo

Tài khoản demo:
- Username: `admin`  
- Password: `admin123`

Dữ liệu demo sẽ được tự động tạo khi khởi động ứng dụng lần đầu.

---

**Phát triển với ❤️ bởi THANHTD**
=======
# Fishing
Quản lý mua bán cá cảnh
>>>>>>> 6be9185cec9a33ffe02c60200a94bcfff4585a50
