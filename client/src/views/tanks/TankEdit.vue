<template>
  <div class="tank-edit">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" />
    </div>
    
    <div v-else-if="!tank" class="error">
      <el-result
        icon="error"
        title="Không tìm thấy hồ cá"
        sub-title="Hồ cá không tồn tại hoặc đã bị xóa"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/tanks')">
            Quay về danh sách
          </el-button>
        </template>
      </el-result>
    </div>
    
    <div v-else>
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <el-button @click="$router.back()" type="text" icon="ArrowLeft">
            Quay lại
          </el-button>
          <h1>Chỉnh sửa hồ cá: {{ tank.name }}</h1>
          <p>Cập nhật thông tin hồ cá</p>
        </div>
      </div>
      
      <!-- Edit Form -->
      <div class="edit-form-card">
        <el-form 
          ref="tankFormRef"
          :model="tankForm"
          :rules="tankRules"
          label-width="140px"
          class="tank-edit-form"
        >
          <el-form-item label="Tên hồ cá" prop="name">
            <el-input v-model="tankForm.name" placeholder="Nhập tên hồ cá" />
          </el-form-item>
          
          <el-form-item label="Loại cá" prop="fish_type">
            <el-input v-model="tankForm.fish_type" placeholder="Ví dụ: Cá koi, Cá betta..." />
          </el-form-item>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Ngày thả" prop="release_date">
                <el-date-picker 
                  v-model="tankForm.release_date" 
                  type="date" 
                  placeholder="Chọn ngày thả cá"
                  style="width: 100%"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Ngày đẻ" prop="spawn_date">
                <el-date-picker 
                  v-model="tankForm.spawn_date" 
                  type="date" 
                  placeholder="Chọn ngày đẻ"
                  style="width: 100%"
                  format="DD/MM/YYYY"
                  value-format="YYYY-MM-DD"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="Loại hồ" prop="tank_type">
                <el-input 
                  v-model="tankForm.tank_type" 
                  placeholder="Ví dụ: Hồ ngoài trời, Hồ trong nhà, Bể kính..."
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="Nhiệt độ (°C)" prop="current_temperature">
                <el-input-number 
                  v-model="tankForm.current_temperature" 
                  :min="0" 
                  :max="50" 
                  :step="0.1" 
                  placeholder="32.0"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="Ghi chú" prop="notes">
            <el-input 
              v-model="tankForm.notes" 
              type="textarea" 
              :rows="3"
              placeholder="Ghi chú về hồ cá..."
            />
          </el-form-item>
          
          <el-form-item label="Hình ảnh">
            <!-- Hiển thị ảnh hiện tại -->
            <div v-if="tank.latest_photo && !tankForm.photo" class="current-photo">
              <div class="current-photo-label">Ảnh hiện tại:</div>
              <div class="current-photo-container">
                <img :src="tank.latest_photo" alt="Ảnh hồ cá hiện tại" class="current-photo-img" />
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
            
            <!-- Upload component -->
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="true"
              :limit="1"
              accept="image/*"
              @change="handleFileChange"
              @remove="handleFileRemove"
              class="tank-photo-upload"
            >
              <template #trigger>
                <el-button type="primary" icon="Upload">{{ tank.latest_photo && !tankForm.photo ? 'Thay đổi ảnh' : 'Chọn ảnh' }}</el-button>
              </template>
              <template #tip>
                <div class="el-upload__tip">
                  Chỉ chấp nhận file JPG/PNG, không quá 10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
          
          <!-- Action Buttons -->
          <div class="form-actions">
            <el-button @click="$router.back()" size="large">
              Hủy bỏ
            </el-button>
            <el-button 
              type="primary" 
              @click="saveTank" 
              :loading="saving"
              size="large"
            >
              {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </el-button>
          </div>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage } from 'element-plus'
import axios from 'axios'

export default {
  name: 'TankEdit',
  setup() {
    const router = useRouter()
    const route = useRoute()
    const tanksStore = useTanksStore()
    
    const loading = ref(true)
    const saving = ref(false)
    const tank = ref(null)
    const tankFormRef = ref()
    const uploadRef = ref()
    
    const tankForm = reactive({
      name: '',
      fish_type: '',
      release_date: '',
      spawn_date: '',
      tank_type: '',
      current_temperature: 32,
      notes: '',
      photo: null,
      removeCurrentPhoto: false
    })
    
    const tankRules = {
      name: [
        { required: true, message: 'Vui lòng nhập tên hồ cá', trigger: 'blur' }
      ]
    }
    
    const loadTank = async () => {
      try {
        loading.value = true
        const tankId = route.params.id
        
        // Load tank data from store or API
        await tanksStore.fetchTanks()
        const tankData = tanksStore.getTankById(parseInt(tankId))
        
        if (!tankData) {
          // Try to load from API directly
          const response = await axios.get(`/tanks/${tankId}`)
          if (response.data.success) {
            tank.value = response.data.data.tank
          } else {
            throw new Error('Tank not found')
          }
        } else {
          tank.value = tankData
        }
        
        // Populate form with tank data
        if (tank.value) {
          tankForm.name = tank.value.name || ''
          tankForm.fish_type = tank.value.fish_type || ''
          tankForm.release_date = tank.value.release_date || ''
          tankForm.spawn_date = tank.value.spawn_date || ''
          tankForm.tank_type = tank.value.tank_type || ''
          tankForm.current_temperature = tank.value.current_temperature || 32
          tankForm.notes = tank.value.notes || ''
          tankForm.photo = null
          tankForm.removeCurrentPhoto = false
        }
        
      } catch (error) {
        console.error('Error loading tank:', error)
        ElMessage.error('Không thể tải thông tin hồ cá')
        tank.value = null
      } finally {
        loading.value = false
      }
    }
    
    const saveTank = async () => {
      try {
        // Validate form
        const valid = await tankFormRef.value.validate()
        if (!valid) return
        
        saving.value = true
        
        // Update tank
        const result = await tanksStore.updateTank(tank.value.id, tankForm)
        
        if (result.success) {
          // Upload new photo if provided
          if (tankForm.photo) {
            try {
              await uploadTankPhoto(tank.value.id, tankForm.photo)
              ElMessage.success('Cập nhật hồ cá và ảnh thành công!')
            } catch (uploadError) {
              ElMessage.warning('Cập nhật hồ cá thành công nhưng không thể upload ảnh: ' + uploadError.message)
            }
          } else {
            ElMessage.success('Cập nhật hồ cá thành công!')
          }
          
          // Navigate back to tank detail
          router.push(`/tanks/${tank.value.id}`)
        } else {
          ElMessage.error(result.error || 'Có lỗi xảy ra khi cập nhật hồ cá')
        }
      } catch (error) {
        console.error('Error saving tank:', error)
        ElMessage.error('Có lỗi xảy ra khi lưu thông tin hồ cá')
      } finally {
        saving.value = false
      }
    }
    
    const uploadTankPhoto = async (tankId, file) => {
      const formData = new FormData()
      formData.append('photo', file)
      
      const response = await axios.post(`/tanks/${tankId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Upload failed')
      }
      
      return response.data
    }
    
    const handleFileChange = (file) => {
      tankForm.photo = file.raw
    }
    
    const handleFileRemove = () => {
      tankForm.photo = null
    }
    
    const removeCurrentPhoto = () => {
      tankForm.removeCurrentPhoto = true
      ElMessage.info('Ảnh sẽ được xóa khi lưu thay đổi')
    }
    
    onMounted(() => {
      loadTank()
    })
    
    return {
      loading,
      saving,
      tank,
      tankFormRef,
      uploadRef,
      tankForm,
      tankRules,
      saveTank,
      handleFileChange,
      handleFileRemove,
      removeCurrentPhoto
    }
  }
}
</script>

<style scoped>
.tank-edit {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
}

.header-content h1 {
  margin: 8px 0;
  font-size: 28px;
  font-weight: 700;
}

.header-content p {
  margin: 0;
  opacity: 0.9;
  font-size: 16px;
}

.edit-form-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}

.tank-edit-form {
  max-width: 800px;
}

.current-photo {
  margin-bottom: 16px;
}

.current-photo-label {
  font-weight: 600;
  margin-bottom: 8px;
  color: #606266;
}

.current-photo-container {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.current-photo-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.current-photo-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tank-photo-upload {
  width: 100%;
}

.form-actions {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
}

.loading {
  padding: 40px;
}

.error {
  padding: 40px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .tank-edit {
    padding: 16px;
  }
  
  .page-header {
    padding: 24px 20px;
  }
  
  .edit-form-card {
    padding: 24px 20px;
  }
  
  .tank-edit-form {
    max-width: 100%;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .form-actions .el-button {
    width: 100%;
  }
  
  .current-photo-container {
    flex-direction: column;
    text-align: center;
  }
  
  .current-photo-actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-header {
    padding: 20px 16px;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .edit-form-card {
    padding: 20px 16px;
  }
}
</style>
