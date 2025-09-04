# 📸 TÍNH NĂNG GIỮ NGUYÊN ẢNH KHI CHỈNH SỬA

## ✅ ĐÃ IMPLEMENT THÀNH CÔNG

### 🎯 **Vấn đề đã giải quyết:**
- **Trước**: Khi chỉnh sửa thông tin hồ cá → ảnh cũ bị mất
- **Sau**: Chỉnh sửa thông tin → **ảnh cũ được giữ nguyên** nếu không upload ảnh mới

### 🔧 **Tính năng đã thêm:**

#### **1. Hiển thị ảnh hiện tại trong form edit:**
- Khi mở form chỉnh sửa → hiển thị ảnh hiện tại của hồ
- Có 2 nút: "Thay đổi ảnh" và "Xóa ảnh"
- Hiển thị hint: *"Nếu không chọn ảnh mới, ảnh hiện tại sẽ được giữ nguyên"*

#### **2. Logic thông minh:**
- **Không upload ảnh mới** → giữ nguyên ảnh cũ
- **Upload ảnh mới** → thay thế ảnh cũ
- **Nhấn "Xóa ảnh"** → xóa ảnh hiện tại khi lưu

### 💻 **Implementation Details:**

#### **Template Changes:**
```vue
<!-- Hiển thị ảnh hiện tại khi edit -->
<div v-if="editingTank && editingTank.latest_photo && !tankForm.photo" class="current-photo">
  <div class="current-photo-label">Ảnh hiện tại:</div>
  <div class="current-photo-container">
    <img :src="editingTank.latest_photo" alt="Ảnh hồ cá hiện tại" class="current-photo-img" />
    <div class="current-photo-actions">
      <el-button type="primary" size="small" @click="$refs.uploadRef.$el.querySelector('input').click()">
        Thay đổi ảnh
      </el-button>
      <el-button type="danger" size="small" @click="removeCurrentPhoto">
        Xóa ảnh
      </el-button>
    </div>
  </div>
</div>

<!-- Upload component với conditional class -->
<el-upload
  :class="{ 'hidden-upload': editingTank && editingTank.latest_photo && !tankForm.photo }"
>
  <el-button type="primary" icon="Upload">
    {{ editingTank ? 'Thay đổi ảnh' : 'Chọn ảnh hồ cá' }}
  </el-button>
  <template #tip>
    <div class="el-upload__tip">
      Chỉ được upload file ảnh, kích thước tối đa 5MB
      <span v-if="editingTank && editingTank.latest_photo">
        <br/>💡 Nếu không chọn ảnh mới, ảnh hiện tại sẽ được giữ nguyên
      </span>
    </div>
  </template>
</el-upload>
```

#### **Script Changes:**
```javascript
// Thêm field để track việc xóa ảnh
const tankForm = reactive({
  // ... existing fields
  removeCurrentPhoto: false
})

// Function xử lý xóa ảnh hiện tại
const removeCurrentPhoto = async () => {
  try {
    await ElMessageBox.confirm(
      'Bạn có chắc chắn muốn xóa ảnh hiện tại?',
      'Xác nhận xóa ảnh',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'warning'
      }
    )
    
    // Đánh dấu xóa ảnh hiện tại
    tankForm.removeCurrentPhoto = true
    editingTank.value.latest_photo = null
    ElMessage.success('Ảnh sẽ được xóa khi lưu thay đổi')
  } catch (error) {
    // User cancelled
  }
}
```

#### **CSS Styles:**
```css
.current-photo {
  margin-bottom: 16px;
}

.current-photo-container {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  background-color: #fafafa;
}

.current-photo-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hidden-upload {
  display: none;
}
```

### 🎯 **User Experience Flow:**

#### **Case 1: Chỉ sửa thông tin (không động đến ảnh)**
1. Mở form edit → thấy ảnh hiện tại
2. Sửa tên, loại cá, ghi chú, etc.
3. Nhấn "Cập nhật" → **ảnh giữ nguyên** ✅

#### **Case 2: Muốn thay ảnh mới**
1. Mở form edit → thấy ảnh hiện tại
2. Nhấn "Thay đổi ảnh" → chọn ảnh mới
3. Nhấn "Cập nhật" → **ảnh mới thay thế ảnh cũ** ✅

#### **Case 3: Muốn xóa ảnh**
1. Mở form edit → thấy ảnh hiện tại
2. Nhấn "Xóa ảnh" → confirm dialog
3. Nhấn "Cập nhật" → **ảnh bị xóa** ✅

#### **Case 4: Thay đổi ý định**
1. Chọn ảnh mới hoặc nhấn xóa
2. Muốn giữ ảnh cũ → nhấn "Hủy"
3. Form reset → **ảnh cũ được khôi phục** ✅

### 🚀 **Benefits:**

1. **Professional UX**: Không làm mất dữ liệu của user
2. **Clear Interface**: Hiển thị rõ ảnh hiện tại và các tùy chọn
3. **Smart Logic**: Chỉ thay đổi khi user muốn
4. **Confirmation**: Xác nhận trước khi xóa ảnh
5. **Visual Feedback**: Hint và preview rõ ràng

### 📋 **Áp dụng cho các trang khác:**

Tính năng này có thể áp dụng tương tự cho:
- **Quản lý lứa cá** (BatchList.vue)
- **Chi tiết hồ cá** (TankDetail.vue) 
- **Chi tiết lứa cá** (BatchDetail.vue)
- **Quản lý chi phí** (ExpenseList.vue) - cho receipt photos

### 🎉 **Status: READY FOR TESTING**

Tính năng hoàn chỉnh và professional. User experience được cải thiện đáng kể!
