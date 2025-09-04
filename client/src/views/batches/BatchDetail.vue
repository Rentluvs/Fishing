<template>
  <div class="batch-detail">
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" />
    </div>
    
    <div v-else-if="!batch" class="error">
      <el-result
        icon="error"
        title="Không tìm thấy lứa cá"
        sub-title="Lứa cá không tồn tại hoặc đã bị xóa"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/batches')">
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
          <h1>{{ batch.batch?.batch_name || `Lứa ${batch.batch?.id}` }}</h1>
          <p>Chi tiết theo dõi lứa cá</p>
        </div>
        <div class="header-actions">
          <el-button @click="showTrackForm = true" type="primary" icon="Plus">
            Thêm theo dõi
          </el-button>
          <el-button @click="showDevLogForm = true" type="success" icon="Document">
            Nhật ký phát triển
          </el-button>
        </div>
      </div>
      
      <!-- Batch Summary -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="summary-header">
            <h3>Thông tin cơ bản</h3>
          </div>
          <div class="summary-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Hồ cá:</span>
                <span class="value">{{ batch.batch?.tank_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">Ngày đẻ:</span>
                <span class="value">{{ formatDate(batch.batch?.spawn_date) }}</span>
              </div>
              <div class="info-item">
                <span class="label">Tuổi:</span>
                <span class="value">{{ batch.batch?.age_in_days }} ngày</span>
              </div>
              <div class="info-item">
                <span class="label">Chủng loại:</span>
                <span class="value">{{ batch.batch?.fish_species || 'Chưa xác định' }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="summary-header">
            <h3>Thống kê</h3>
          </div>
          <div class="summary-content">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number">{{ batch.batch?.initial_count }}</span>
                <span class="stat-label">Ban đầu</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ currentCount }}</span>
                <span class="stat-label">Hiện tại</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ batch.stats?.survival_rate }}%</span>
                <span class="stat-label">Tỷ lệ sống</span>
              </div>
              <div class="stat-item">
                <span class="stat-number">{{ batch.stats?.tracking_records || 0 }}</span>
                <span class="stat-label">Lần theo dõi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tracking History -->
      <div class="section">
        <div class="section-header">
          <h2>Lịch sử theo dõi</h2>
          <el-button @click="showTrackForm = true" type="primary" size="small" icon="Plus">
            Thêm theo dõi
          </el-button>
        </div>
        
        <div v-if="batch.tracking?.length === 0" class="empty-state">
          <p>Chưa có dữ liệu theo dõi nào</p>
          <el-button type="primary" @click="showTrackForm = true">
            Thêm theo dõi đầu tiên
          </el-button>
        </div>
        
        <div v-else class="tracking-timeline">
          <div v-for="track in batch.tracking" :key="track.id" class="timeline-item">
            <div class="timeline-date">
              {{ formatDate(track.tracking_date) }}
            </div>
            <div class="timeline-content">
              <div class="track-header">
                <span class="track-stage">{{ track.stage || 'Không xác định' }}</span>
              </div>
              <div class="track-stats">
                <span class="track-stat alive">Sống: {{ track.alive_count }}</span>
                <span class="track-stat dead">Chết: {{ track.dead_count }}</span>
                <span class="track-stat rate">
                  Tỷ lệ: {{ Math.round((track.alive_count / batch.batch?.initial_count) * 100) }}%
                </span>
              </div>
              <div v-if="track.notes" class="track-notes">
                {{ track.notes }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Development Logs -->
      <div class="section">
        <div class="section-header">
          <h2>Nhật ký phát triển</h2>
          <el-button @click="showDevLogForm = true" type="success" size="small" icon="Document">
            Thêm nhật ký
          </el-button>
        </div>
        
        <div v-if="batch.developmentLogs?.length === 0" class="empty-state">
          <p>Chưa có nhật ký phát triển nào</p>
          <el-button type="success" @click="showDevLogForm = true">
            Thêm nhật ký đầu tiên
          </el-button>
        </div>
        
        <div v-else class="dev-logs">
          <div v-for="log in batch.developmentLogs" :key="log.id" class="dev-log-card">
            <div class="log-header">
              <h4>{{ formatDate(log.log_date) }}</h4>
              <span class="log-stage">{{ log.stage || 'Giai đoạn không xác định' }}</span>
            </div>
            
            <div v-if="log.description" class="log-description">
              {{ log.description }}
            </div>
            
            <div v-if="log.weight || log.length" class="log-measurements">
              <span v-if="log.weight" class="measurement">Cân nặng: {{ log.weight }}g</span>
              <span v-if="log.length" class="measurement">Chiều dài: {{ log.length }}cm</span>
            </div>
            
            <div v-if="log.notes" class="log-notes">
              {{ log.notes }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Photos -->
      <div class="section">
        <div class="section-header">
          <h2>Hình ảnh</h2>
          <el-button @click="showPhotoForm = true" type="warning" size="small" icon="Camera">
            Thêm ảnh
          </el-button>
        </div>
        
        <div v-if="photos.length === 0" class="empty-state">
          <p>Chưa có hình ảnh nào</p>
          <el-button type="warning" @click="showPhotoForm = true">
            Thêm ảnh đầu tiên
          </el-button>
        </div>
        
        <div v-else class="image-gallery">
          <div v-for="photo in photos" :key="photo.id" class="gallery-item">
            <img 
              :src="config.buildUrl(photo.photo_path)" 
              :alt="photo.caption || 'Ảnh lứa cá'"
              @click="viewPhoto(photo)"
              class="gallery-image"
            />
            <div class="image-overlay">
              <el-icon class="overlay-action" @click.stop="viewPhoto(photo)"><ZoomIn /></el-icon>
              <el-button 
                type="danger" 
                size="small" 
                icon="Delete" 
                circle
                @click.stop="deletePhoto(photo.id)"
                style="margin-left: 8px"
              />
            </div>
            <div class="gallery-overlay">
              <div class="photo-date">{{ formatDate(photo.photo_date) }}</div>
              <div v-if="photo.caption" class="photo-caption">{{ photo.caption }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Tracking Modal -->
    <el-dialog v-model="showTrackForm" title="Thêm theo dõi mới" width="500px">
      <el-form :model="trackForm" label-width="120px">
        <el-form-item label="Ngày theo dõi" required>
          <el-date-picker 
            v-model="trackForm.tracking_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Giai đoạn">
          <el-select v-model="trackForm.stage" placeholder="Chọn giai đoạn" style="width: 100%">
            <el-option label="Giai đoạn cá bột" value="Giai đoạn cá bột" />
            <el-option label="Giai đoạn con non" value="Giai đoạn con non" />
            <el-option label="Giai đoạn phát triển" value="Giai đoạn phát triển" />
            <el-option label="Giai đoạn trưởng thành" value="Giai đoạn trưởng thành" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Số hiện tại">
          <el-text style="color: #1890ff; font-weight: 600;">
            {{ trackForm.alive_count }} con
          </el-text>
          <el-text type="info" style="margin-left: 10px; font-size: 12px;">
            (Trước đó: {{ currentCount }} con)
          </el-text>
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Số lượng chết mới">
              <el-input-number 
                v-model="trackForm.dead_count" 
                :min="0" 
                :max="currentCount"
                style="width: 100%"
                @change="updateAliveCountInDetail"
                placeholder="Số cá chết"
              />
              <el-text type="warning" style="font-size: 11px; margin-top: 3px; display: block;">
                Sống = {{ currentCount }} - {{ trackForm.dead_count || 0 }} = {{ trackForm.alive_count }}
              </el-text>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Hoặc nhập số sống" required>
              <el-input-number v-model="trackForm.alive_count" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="trackForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showTrackForm = false">Hủy</el-button>
          <el-button type="primary" @click="addTracking">Thêm theo dõi</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Add Development Log Modal -->
    <el-dialog v-model="showDevLogForm" title="Thêm nhật ký phát triển" width="500px">
      <el-form :model="devLogForm" label-width="120px">
        <el-form-item label="Ngày ghi nhật ký" required>
          <el-date-picker 
            v-model="devLogForm.log_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Giai đoạn">
          <el-select v-model="devLogForm.stage" placeholder="Chọn giai đoạn" style="width: 100%">
            <el-option label="Giai đoạn cá bột" value="Giai đoạn cá bột" />
            <el-option label="Giai đoạn con non" value="Giai đoạn con non" />
            <el-option label="Giai đoạn phát triển" value="Giai đoạn phát triển" />
            <el-option label="Giai đoạn trưởng thành" value="Giai đoạn trưởng thành" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Mô tả">
          <el-input v-model="devLogForm.description" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="Cân nặng (g)">
              <el-input-number v-model="devLogForm.weight" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="Chiều dài (cm)">
              <el-input-number v-model="devLogForm.length" :min="0" :step="0.1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="devLogForm.notes" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showDevLogForm = false">Hủy</el-button>
          <el-button type="success" @click="addDevLog">Thêm nhật ký</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Add Photo Modal -->
    <el-dialog v-model="showPhotoForm" title="Thêm hình ảnh" width="500px">
      <el-form :model="photoForm" label-width="120px">
        <el-form-item label="Chọn ảnh" required>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary" icon="Upload">Chọn file ảnh</el-button>
            <template #tip>
              <div class="el-upload__tip">
                Chỉ được upload file ảnh, kích thước tối đa 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="Ngày chụp">
          <el-date-picker 
            v-model="photoForm.photo_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Mô tả">
          <el-input v-model="photoForm.caption" type="textarea" :rows="3" placeholder="Mô tả về ảnh..." />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPhotoForm = false">Hủy</el-button>
          <el-button type="warning" @click="uploadPhoto" :loading="uploading">
            {{ uploading ? 'Đang upload...' : 'Upload ảnh' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Photo Viewer Modal -->
    <el-dialog v-model="showPhotoViewer" :title="selectedPhoto?.caption || 'Xem ảnh'" width="80%" center>
      <div class="photo-viewer">
        <img 
          v-if="selectedPhoto" 
          :src="config.buildUrl(selectedPhoto.photo_path)" 
          :alt="selectedPhoto.caption"
          style="width: 100%; height: auto; max-height: 70vh; object-fit: contain;"
        />
        <div v-if="selectedPhoto" class="photo-details">
          <p><strong>Ngày chụp:</strong> {{ formatDate(selectedPhoto.photo_date) }}</p>
          <p v-if="selectedPhoto.caption"><strong>Mô tả:</strong> {{ selectedPhoto.caption }}</p>
          <p><strong>Kích thước file:</strong> {{ formatFileSize(selectedPhoto.file_size) }}</p>
        </div>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPhotoViewer = false">Đóng</el-button>
          <el-button type="danger" @click="deletePhoto(selectedPhoto?.id)">
            Xóa ảnh
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, ZoomIn } from '@element-plus/icons-vue'
import axios from 'axios'
import config from '@/config'

export default {
  name: 'BatchDetail',
  setup() {
    const route = useRoute()
    
    const loading = ref(true)
    const batch = ref(null)
    const showTrackForm = ref(false)
    const showDevLogForm = ref(false)
    const showPhotoForm = ref(false)
    const showPhotoViewer = ref(false)
    const uploading = ref(false)
    const uploadRef = ref()
    const selectedPhoto = ref(null)
    const photos = ref([])
    
    const trackForm = reactive({
      tracking_date: new Date().toISOString().split('T')[0],
      stage: '',
      alive_count: 0,
      dead_count: 0,
      notes: ''
    })
    
    const devLogForm = reactive({
      log_date: new Date().toISOString().split('T')[0],
      stage: '',
      description: '',
      weight: null,
      length: null,
      notes: ''
    })
    
    const photoForm = reactive({
      photo_date: new Date().toISOString().split('T')[0],
      caption: '',
      file: null
    })
    
    const currentCount = computed(() => {
      if (!batch.value?.tracking || batch.value.tracking.length === 0) {
        return batch.value?.batch?.initial_count || 0
      }
      return batch.value.tracking[0].alive_count
    })
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const loadBatchDetail = async () => {
      try {
        loading.value = true
        const response = await axios.get(`/batches/${route.params.id}`)
        
        if (response.data.success) {
          batch.value = response.data.data
          
          // Set initial values for tracking form
          const latestCount = batch.value.tracking && batch.value.tracking.length > 0 
            ? batch.value.tracking[0].alive_count 
            : batch.value.batch?.initial_count || 0
          trackForm.alive_count = latestCount
        }
      } catch (error) {
        ElMessage.error('Lỗi tải thông tin lứa cá')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    const updateAliveCountInDetail = () => {
      if (trackForm.dead_count >= 0 && currentCount.value) {
        trackForm.alive_count = Math.max(0, currentCount.value - trackForm.dead_count)
      }
    }
    
    const addTracking = async () => {
      try {
        const response = await axios.post(`/batches/${route.params.id}/tracking`, trackForm)
        
        if (response.data.success) {
          ElMessage.success('Thêm theo dõi thành công!')
          showTrackForm.value = false
          loadBatchDetail()
        } else {
          ElMessage.error('Lỗi thêm theo dõi')
        }
      } catch (error) {
        ElMessage.error('Lỗi thêm theo dõi')
        console.error(error)
      }
    }
    
    const addDevLog = async () => {
      try {
        const response = await axios.post(`/batches/${route.params.id}/development-log`, devLogForm)
        
        if (response.data.success) {
          ElMessage.success('Thêm nhật ký phát triển thành công!')
          showDevLogForm.value = false
          loadBatchDetail()
        } else {
          ElMessage.error('Lỗi thêm nhật ký phát triển')
        }
      } catch (error) {
        ElMessage.error('Lỗi thêm nhật ký phát triển')
        console.error(error)
      }
    }
    
    const loadPhotos = async () => {
      try {
        const response = await axios.get(`/batches/${route.params.id}/photos`)
        if (response.data.success) {
          photos.value = response.data.data
        }
      } catch (error) {
        console.error('Lỗi tải ảnh:', error)
      }
    }
    
    const handleFileChange = (file) => {
      photoForm.file = file.raw
    }
    
    const handleFileRemove = () => {
      photoForm.file = null
    }
    
    const uploadPhoto = async () => {
      if (!photoForm.file) {
        ElMessage.warning('Vui lòng chọn file ảnh')
        return
      }
      
      try {
        uploading.value = true
        const formData = new FormData()
        formData.append('photo', photoForm.file)
        formData.append('caption', photoForm.caption)
        formData.append('photo_date', photoForm.photo_date)
        
        const response = await axios.post(`/batches/${route.params.id}/photos`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        if (response.data.success) {
          ElMessage.success('Upload ảnh thành công!')
          showPhotoForm.value = false
          
          // Reset form
          photoForm.caption = ''
          photoForm.photo_date = new Date().toISOString().split('T')[0]
          photoForm.file = null
          uploadRef.value?.clearFiles()
          
          // Reload photos
          loadPhotos()
        } else {
          ElMessage.error('Lỗi upload ảnh')
        }
      } catch (error) {
        ElMessage.error('Lỗi upload ảnh')
        console.error(error)
      } finally {
        uploading.value = false
      }
    }
    
    const viewPhoto = (photo) => {
      selectedPhoto.value = photo
      showPhotoViewer.value = true
    }
    
    const deletePhoto = async (photoId) => {
      try {
        await ElMessageBox.confirm('Bạn có chắc muốn xóa ảnh này?', 'Xác nhận xóa', {
          confirmButtonText: 'Xóa',
          cancelButtonText: 'Hủy',
          type: 'warning'
        })
        
        const response = await axios.delete(`/photos/${photoId}`)
        
        if (response.data.success) {
          ElMessage.success('Xóa ảnh thành công!')
          showPhotoViewer.value = false
          loadPhotos()
        } else {
          ElMessage.error('Lỗi xóa ảnh')
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Lỗi xóa ảnh')
          console.error(error)
        }
      }
    }
    
    const formatFileSize = (bytes) => {
      if (!bytes) return 'N/A'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    onMounted(() => {
      loadBatchDetail()
      loadPhotos()
    })
    
    return {
      loading,
      batch,
      showTrackForm,
      showDevLogForm,
      showPhotoForm,
      showPhotoViewer,
      uploading,
      uploadRef,
      selectedPhoto,
      photos,
      trackForm,
      devLogForm,
      photoForm,
      currentCount,
      config,
      formatDate,
      updateAliveCountInDetail,
      addTracking,
      addDevLog,
      loadPhotos,
      handleFileChange,
      handleFileRemove,
      uploadPhoto,
      viewPhoto,
      deletePhoto,
      formatFileSize
    }
  }
}
</script>

<style scoped>
.batch-detail {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-content h1 {
  margin: 8px 0;
  color: #2c3e50;
}

.header-content p {
  margin: 0;
  color: #7f8c8d;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.summary-header {
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.summary-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.summary-content {
  padding: 20px;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.label {
  color: #7f8c8d;
  font-weight: 500;
}

.value {
  color: #2c3e50;
  font-weight: 600;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
  text-transform: uppercase;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  color: #2c3e50;
}

.tracking-timeline {
  position: relative;
}

.tracking-timeline::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e9ecef;
}

.timeline-item {
  display: flex;
  margin-bottom: 24px;
  position: relative;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 8px;
  width: 12px;
  height: 12px;
  background: #1890ff;
  border-radius: 50%;
  border: 3px solid white;
  box-shadow: 0 0 0 2px #e9ecef;
}

.timeline-date {
  width: 120px;
  flex-shrink: 0;
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
}

.timeline-content {
  flex: 1;
  margin-left: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 6px;
}

.track-header {
  margin-bottom: 8px;
}

.track-stage {
  padding: 4px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.track-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.track-stat {
  font-size: 13px;
  font-weight: 500;
}

.track-stat.alive {
  color: #52c41a;
}

.track-stat.dead {
  color: #f5222d;
}

.track-stat.rate {
  color: #1890ff;
}

.track-notes {
  font-size: 13px;
  color: #666;
  font-style: italic;
}

.dev-logs {
  display: grid;
  gap: 16px;
}

.dev-log-card {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.log-header h4 {
  margin: 0;
  color: #2c3e50;
}

.log-stage {
  padding: 4px 8px;
  background: #f6ffed;
  color: #52c41a;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.log-description {
  margin-bottom: 12px;
  color: #2c3e50;
  line-height: 1.6;
}

.log-measurements {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.measurement {
  padding: 4px 8px;
  background: #e6f7ff;
  color: #1890ff;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.log-notes {
  font-size: 13px;
  color: #666;
  font-style: italic;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.loading {
  padding: 40px 0;
}

.error {
  padding: 40px 0;
}

/* Photos styles */
.photos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.photo-card {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e8e8e8;
  transition: all 0.3s ease;
}

.photo-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.photo-container {
  position: relative;
  width: 100%;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.photo-container .el-avatar {
  width: 100% !important;
  height: 100% !important;
  border-radius: 0 !important;
}

.photo-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.photo-container:hover .photo-overlay {
  opacity: 1;
}

.photo-info {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.photo-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.photo-caption {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  max-height: 2.8em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.photo-viewer {
  text-align: center;
}

.photo-details {
  margin-top: 16px;
  text-align: left;
  background: #f5f5f5;
  padding: 16px;
  border-radius: 6px;
}

.photo-details p {
  margin: 8px 0;
  font-size: 14px;
}
</style>
