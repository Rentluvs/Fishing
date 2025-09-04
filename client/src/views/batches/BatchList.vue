<template>
  <div class="batch-list">
    <div class="page-header">
      <div class="header-content">
        <h1>Theo dõi lứa cá</h1>
        <p>Quản lý và theo dõi các lứa cá của bạn</p>
      </div>
      <el-button type="primary" @click="showCreateForm = true" icon="Plus">
        Thêm lứa cá mới
      </el-button>
    </div>
    
    <!-- Quick Stats -->
    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-content">
          <h3>{{ batches.length }}</h3>
          <p>Tổng số lứa</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-content">
          <h3>{{ totalFish }}</h3>
          <p>Tổng số cá</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-content">
          <h3>{{ avgSurvivalRate }}%</h3>
          <p>Tỷ lệ sống TB</p>
        </div>
      </div>
      <div class="stats-card">
        <div class="stats-content">
          <h3>{{ activeBatches }}</h3>
          <p>Lứa đang hoạt động</p>
        </div>
      </div>
    </div>
    
    <!-- Search Filters -->
    <CollapsibleSearch 
      v-model="searchTerm" 
      placeholder="Tìm kiếm lứa cá..."
      @search="handleSearch"
    >
      <template #filters>
        <el-input 
          v-model="searchTerm" 
          placeholder="Tìm kiếm lứa cá..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select 
          v-model="tankFilter" 
          placeholder="Lọc theo hồ cá" 
          clearable 
          class="filter-select"
        >
          <el-option label="Tất cả hồ cá" value="" />
          <el-option 
            v-for="tank in tanks" 
            :key="tank.id" 
            :label="tank.name" 
            :value="tank.id" 
          />
        </el-select>
        <el-select 
          v-model="stageFilter" 
          placeholder="Lọc theo giai đoạn" 
          clearable 
          class="filter-select"
        >
          <el-option label="Tất cả giai đoạn" value="" />
          <el-option label="Giai đoạn cá bột" value="Giai đoạn cá bột" />
          <el-option label="Giai đoạn con non" value="Giai đoạn con non" />
          <el-option label="Giai đoạn phát triển" value="Giai đoạn phát triển" />
          <el-option label="Giai đoạn trưởng thành" value="Giai đoạn trưởng thành" />
        </el-select>
      </template>
    </CollapsibleSearch>
    
    <!-- Batch List -->
    <div v-if="loading" class="loading">
      <el-skeleton :rows="5" />
    </div>
    
    <div v-else-if="filteredBatches.length === 0" class="empty-state">
      <div class="empty-content">
        <el-icon size="64"><List /></el-icon>
        <h3>{{ searchTerm || tankFilter || stageFilter ? 'Không tìm thấy lứa cá nào' : 'Chưa có lứa cá nào' }}</h3>
        <p>{{ searchTerm || tankFilter || stageFilter ? 'Thử thay đổi bộ lọc' : 'Hãy thêm lứa cá đầu tiên' }}</p>
        <el-button v-if="!searchTerm && !tankFilter && !stageFilter" type="primary" @click="showCreateForm = true">
          Thêm lứa cá đầu tiên
        </el-button>
      </div>
    </div>
    
    <div v-else class="batch-grid">
      <div v-for="batch in paginatedBatches" :key="batch.id" class="batch-card">
        <div class="batch-header">
          <div class="batch-title-section">
            <el-avatar 
              v-if="batch.latest_photo" 
              :src="batch.latest_photo" 
              :size="70" 
              shape="square"
              @click="viewBatchPhoto(batch)"
              class="batch-avatar batch-avatar--photo"
            >
              <el-icon><Picture /></el-icon>
            </el-avatar>
            <el-avatar 
              v-else
              :size="70" 
              shape="square"
              class="batch-avatar batch-avatar--placeholder"
              @click="openUploadPhoto(batch)"
            >
              <el-icon><Plus /></el-icon>
            </el-avatar>
            <div class="batch-title">
              <h3>{{ batch.batch_name || `Lứa ${batch.id}` }}</h3>
              <span class="batch-stage">{{ batch.current_stage }}</span>
            </div>
          </div>
        </div>
        
        <div class="batch-info">
          <div class="info-row">
            <span class="label">Hồ cá:</span>
            <span class="value">{{ batch.tank_name || '🐟 Không thuộc hồ nào' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Ngày đẻ:</span>
            <span class="value">{{ formatDate(batch.spawn_date) }}</span>
          </div>
          <div class="info-row">
            <span class="label">Chủng loại:</span>
            <span class="value">{{ batch.fish_species || 'Chưa xác định' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Tuổi:</span>
            <span class="value">{{ calculateAge(batch.spawn_date) }} ngày</span>
          </div>
        </div>
        
        <div class="batch-stats">
          <div class="stat-item">
            <span class="stat-number">{{ batch.initial_count }}</span>
            <span class="stat-label">Ban đầu</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ batch.current_count || batch.initial_count }}</span>
            <span class="stat-label">Hiện tại</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ calculateSurvivalRate(batch) }}%</span>
            <span class="stat-label">Tỷ lệ sống</span>
          </div>
        </div>
        
        <div class="batch-actions">
          <el-button 
            class="action-btn"
            @click="$router.push(`/batches/${batch.id}`)"
            icon="View"
          >
            Chi tiết
          </el-button>
          <el-button 
            class="action-btn"
            type="primary" 
            @click="quickTrack(batch)"
            icon="Edit"
          >
            Cập nhật
          </el-button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
   <div v-if="filteredBatches.length > 0" class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[6, 12, 18, 24]"
        :total="totalBatches"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="batch-pagination"
      />
    </div>
    
    <!-- Create Batch Modal -->
    <el-dialog 
      v-model="showCreateForm" 
      title="Thêm lứa cá mới" 
      width="600px"
      class="batch-form-dialog"
      :fullscreen="isMobile"
    >
      <el-form 
        ref="batchFormRef"
        :model="batchForm"
        :rules="batchRules"
        label-width="120px"
      >
        <el-form-item label="Hồ cá" prop="tank_id">
          <el-select 
            v-model="batchForm.tank_id" 
            placeholder="Chọn hồ cá hoặc để trống" 
            style="width: 100%"
            @change="onTankChange"
            clearable
          >
            <el-option 
              label="🐟 Không thuộc hồ nào (lứa cá riêng biệt)" 
              value="" 
            />
            <el-option 
              v-for="tank in tanks" 
              :key="tank.id" 
              :label="`🏞️ ${tank.name}`" 
              :value="tank.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Tên lứa cá">
          <el-input v-model="batchForm.batch_name" placeholder="Tùy chọn" />
        </el-form-item>
        
        <el-form-item label="Ngày đẻ" prop="spawn_date" required>
          <el-date-picker 
            v-model="batchForm.spawn_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Số lượng cá bột" prop="initial_count" required>
          <el-input-number v-model="batchForm.initial_count" :min="1" style="width: 100%" />
        </el-form-item>
        
        <el-form-item label="Chủng loại">
          <el-input v-model="batchForm.fish_species" placeholder="Ví dụ: Cá koi Nhật" />
          <div v-if="selectedTankFishType" style="margin-top: 4px; font-size: 12px; color: #909399;">
            💡 Hồ cá này nuôi: {{ selectedTankFishType }}
          </div>
        </el-form-item>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="batchForm.notes" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="Hình ảnh">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
          >
            <el-button type="primary" icon="Upload">Chọn ảnh lứa cá</el-button>
            <template #tip>
              <div class="el-upload__tip">
                Chỉ được upload file ảnh, kích thước tối đa 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateForm = false">Hủy</el-button>
          <el-button type="primary" :loading="creating" @click="createBatch">
            Tạo lứa cá
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Quick Track Modal -->
    <el-dialog 
      v-model="showQuickTrack" 
      title="Cập nhật nhanh" 
      width="450px"
      class="batch-track-dialog"
      :fullscreen="isMobile"
    >
      <el-form :model="trackForm" label-width="150px">
        <el-form-item label="Ngày cập nhật">
          <el-date-picker 
            v-model="trackForm.tracking_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Số hiện tại">
          <el-text style="color: #1890ff; font-weight: 600;">
            {{ trackForm.alive_count }} con
          </el-text>
          <el-text type="info" style="margin-left: 10px; font-size: 12px;">
            (Trước đó: {{ selectedBatch ? (selectedBatch.current_count || selectedBatch.initial_count) : 0 }} con)
          </el-text>
        </el-form-item>
        
        <el-form-item label="Số lượng chết mới">
          <el-input-number 
            v-model="trackForm.dead_count" 
            :min="0" 
            :max="selectedBatch ? (selectedBatch.current_count || selectedBatch.initial_count) : 999"
            style="width: 100%" 
            @change="updateAliveCount"
            placeholder="Nhập số cá chết"
          />
          <el-text type="warning" style="font-size: 12px; margin-top: 5px; display: block;">
            Số sống sẽ tự động cập nhật: {{ (selectedBatch ? (selectedBatch.current_count || selectedBatch.initial_count) : 0) }} - {{ trackForm.dead_count || 0 }} = {{ trackForm.alive_count }}
          </el-text>
        </el-form-item>
        
        <el-form-item label="Hoặc nhập số sống">
          <el-input-number 
            v-model="trackForm.alive_count" 
            :min="0" 
            style="width: 100%"
            placeholder="Nhập trực tiếp số sống"
          />
        </el-form-item>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="trackForm.notes" type="textarea" :rows="2" placeholder="Ghi chú về tình trạng..." />
        </el-form-item>
        
        <el-form-item label="Hình ảnh cập nhật">
          <el-upload
            ref="trackUploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            :on-change="handleTrackFileChange"
            :on-remove="handleTrackFileRemove"
          >
            <el-button type="warning" icon="Camera">Thêm ảnh cập nhật</el-button>
            <template #tip>
              <div class="el-upload__tip">
                Tùy chọn: Upload ảnh minh họa cho lần cập nhật này
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showQuickTrack = false">Hủy</el-button>
          <el-button type="primary" @click="saveQuickTrack">Cập nhật</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Photo Viewer Modal -->
    <el-dialog v-model="showPhotoViewer" title="Xem ảnh" width="80%" center>
      <div class="photo-viewer">
        <img 
          v-if="selectedBatchPhoto" 
          :src="selectedBatchPhoto" 
          style="width: 100%; height: auto; max-height: 70vh; object-fit: contain;"
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPhotoViewer = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Upload Photo Modal -->
    <el-dialog 
      v-model="showUploadDialog" 
      title="Upload ảnh lứa cá" 
      width="500px" 
      center
      class="batch-upload-dialog"
      :fullscreen="isMobile"
    >
      <el-form label-width="120px">
        <el-form-item label="Chọn ảnh">
          <el-upload
            ref="uploadDialogRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            :on-change="handleDialogFileChange"
            :on-remove="handleDialogFileRemove"
          >
            <el-button type="primary" icon="Upload">Chọn ảnh</el-button>
            <template #tip>
              <div class="el-upload__tip">
                Chỉ được upload file ảnh, kích thước tối đa 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        
        <el-form-item label="Mô tả">
          <el-input v-model="uploadForm.caption" placeholder="Mô tả ảnh (tùy chọn)" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showUploadDialog = false">Hủy</el-button>
          <el-button 
            type="primary" 
            :loading="uploading" 
            @click="handleUploadPhoto"
            :disabled="!uploadForm.photo"
          >
            Upload
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage } from 'element-plus'
import { Picture, Plus, Upload, Camera } from '@element-plus/icons-vue'
import axios from 'axios'
import config from '@/config'
import CollapsibleSearch from '@/components/CollapsibleSearch.vue'

export default {
  name: 'BatchList',
  components: {
    CollapsibleSearch,
    Picture,
    Plus,
    Upload,
    Camera
  },
  setup() {
    const router = useRouter()
    const tanksStore = useTanksStore()
    
    const loading = ref(true)
    const creating = ref(false)
    const batches = ref([])
    const tanks = ref([])
    const showCreateForm = ref(false)
    const showQuickTrack = ref(false)
    const showPhotoViewer = ref(false)
    const showUploadDialog = ref(false)
    const selectedBatch = ref(null)
    const selectedBatchPhoto = ref(null)
    const uploading = ref(false)
    const selectedTankFishType = ref('')
    
    const searchTerm = ref('')
    const tankFilter = ref('')
    const stageFilter = ref('')
    
    // Pagination
    const currentPage = ref(1)
    const pageSize = ref(6)  // 6 cards per page by default
    
    const batchFormRef = ref()
    const uploadRef = ref()
    const uploadDialogRef = ref()
    const trackUploadRef = ref()
    const batchForm = reactive({
      tank_id: '',
      batch_name: '',
      spawn_date: '',
      initial_count: 100,
      fish_species: '',
      notes: '',
      photo: null
    })
    
    const trackForm = reactive({
      tracking_date: new Date().toISOString().split('T')[0],
      alive_count: 0,
      dead_count: 0,
      notes: '',
      photo: null
    })
    
    const uploadForm = reactive({
      photo: null,
      caption: ''
    })
    
    const batchRules = {
      // tank_id không còn bắt buộc - cho phép lứa cá không thuộc hồ nào
      spawn_date: [{ required: true, message: 'Vui lòng chọn ngày đẻ', trigger: 'change' }],
      initial_count: [{ required: true, message: 'Vui lòng nhập số lượng cá bột', trigger: 'blur' }]
    }
    
    const filteredBatches = computed(() => {
      let filtered = batches.value
      
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        filtered = filtered.filter(batch => 
          (batch.batch_name && batch.batch_name.toLowerCase().includes(term)) ||
          batch.tank_name.toLowerCase().includes(term) ||
          (batch.fish_species && batch.fish_species.toLowerCase().includes(term))
        )
      }
      
      if (tankFilter.value) {
        filtered = filtered.filter(batch => batch.tank_id === tankFilter.value)
      }
      
      if (stageFilter.value) {
        filtered = filtered.filter(batch => batch.current_stage === stageFilter.value)
      }
      
      return filtered
    })

    const totalBatches = computed(() => filteredBatches.value.length)

    const paginatedBatches = computed(() => {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      return filteredBatches.value.slice(start, end)
    })
    
    const totalFish = computed(() => {
      return batches.value.reduce((sum, batch) => sum + (batch.current_count || batch.initial_count), 0)
    })
    
    const avgSurvivalRate = computed(() => {
      if (batches.value.length === 0) return 0
      const totalRate = batches.value.reduce((sum, batch) => sum + calculateSurvivalRate(batch), 0)
      return Math.round(totalRate / batches.value.length)
    })
    
    const activeBatches = computed(() => {
      return batches.value.filter(batch => (batch.current_count || batch.initial_count) > 0).length
    })

    const isMobile = computed(() => {
      return window.innerWidth <= 768
    })
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const calculateAge = (spawnDate) => {
      const now = new Date()
      const spawn = new Date(spawnDate)
      return Math.floor((now - spawn) / (1000 * 60 * 60 * 24))
    }
    
    const calculateSurvivalRate = (batch) => {
      const current = batch.current_count || batch.initial_count
      return Math.round((current / batch.initial_count) * 100)
    }
    
    const loadData = async () => {
      try {
        loading.value = true
        
        // Load batches
        const batchResponse = await axios.get('/batches')
        if (batchResponse.data.success) {
          batches.value = batchResponse.data.data
          
          // Load latest photo for each batch
          for (const batch of batches.value) {
            try {
              const photoResponse = await axios.get(`/batches/${batch.id}/photos`)
              if (photoResponse.data.success && photoResponse.data.data.length > 0) {
                batch.latest_photo = config.buildUrl(photoResponse.data.data[0].photo_path)
              }
            } catch (photoError) {
              // Ignore photo loading errors
              console.warn(`Không thể tải ảnh cho lứa ${batch.id}:`, photoError)
            }
          }
        }
        
        // Load tanks
        await tanksStore.fetchTanks()
        tanks.value = tanksStore.tanks
        
      } catch (error) {
        ElMessage.error('Lỗi tải dữ liệu')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    const createBatch = async () => {
      try {
        const valid = await batchFormRef.value.validate()
        if (!valid) return
        
        creating.value = true
        
        // Chuẩn bị dữ liệu để gửi - loại bỏ tank_id nếu null
        const batchData = { ...batchForm }
        if (batchData.tank_id === null || batchData.tank_id === '') {
          delete batchData.tank_id // Loại bỏ hoàn toàn field tank_id nếu không có giá trị
        }
        
        // Debug log
        console.log('=== CREATE BATCH DEBUG ===')
        console.log('Original form data:', JSON.stringify(batchForm, null, 2))
        console.log('Payload being sent:', JSON.stringify(batchData, null, 2))
        console.log('Auth token exists:', !!localStorage.getItem('token'))
        
        const response = await axios.post('/batches', batchData)
        
        if (response.data.success) {
          // Upload ảnh nếu có
          if (batchForm.photo && response.data.data?.id) {
            try {
              await uploadBatchPhoto(response.data.data.id, batchForm.photo)
              ElMessage.success('Tạo lứa cá và upload ảnh thành công!')
            } catch (uploadError) {
              console.warn('Lỗi upload ảnh:', uploadError)
              ElMessage.warning('Tạo lứa cá thành công nhưng không thể upload ảnh')
            }
          } else {
            ElMessage.success('Tạo lứa cá thành công!')
          }
          showCreateForm.value = false
          resetBatchForm()
          loadData()
        } else {
          ElMessage.error(response.data.message || 'Lỗi tạo lứa cá')
          console.error('API Error:', response.data)
        }
      } catch (error) {
        console.error('Create batch error:', error)
        
        if (error.response) {
          // Server responded with error status
          console.error('Response data:', error.response.data)
          console.error('Response status:', error.response.status)
          console.error('Response errors:', error.response.data.errors)
          
          // Hiển thị lỗi chi tiết nếu có
          if (error.response.data.errors && error.response.data.errors.length > 0) {
            const errorMessages = error.response.data.errors.map(err => err.msg || err.message || err).join(', ')
            ElMessage.error(`Lỗi validation: ${errorMessages}`)
          } else {
            ElMessage.error(error.response.data.message || 'Lỗi tạo lứa cá')
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('No response received:', error.request)
          ElMessage.error('Không thể kết nối đến server')
        } else {
          // Something else happened
          console.error('Error message:', error.message)
          ElMessage.error('Lỗi tạo lứa cá: ' + error.message)
        }
      } finally {
        creating.value = false
      }
    }
    
    const quickTrack = (batch) => {
      selectedBatch.value = batch
      trackForm.alive_count = batch.current_count || batch.initial_count
      trackForm.dead_count = 0
      showQuickTrack.value = true
    }
    
    const updateAliveCount = () => {
      if (selectedBatch.value && trackForm.dead_count >= 0) {
        const currentCount = selectedBatch.value.current_count || selectedBatch.value.initial_count
        trackForm.alive_count = Math.max(0, currentCount - trackForm.dead_count)
      }
    }
    
    const saveQuickTrack = async () => {
      try {
        const response = await axios.post(`/batches/${selectedBatch.value.id}/tracking`, trackForm)
        
        if (response.data.success) {
          // Upload ảnh nếu có
          if (trackForm.photo) {
            try {
              const formData = new FormData()
              formData.append('photo', trackForm.photo)
              formData.append('caption', `Cập nhật lứa cá ngày ${trackForm.tracking_date} - ${trackForm.alive_count} con sống`)
              formData.append('photo_date', trackForm.tracking_date)
              
              await axios.post(`/batches/${selectedBatch.value.id}/photos`, formData, {
                headers: {
                  'Content-Type': 'multipart/form-data'
                }
              })
              
              ElMessage.success('Cập nhật và upload ảnh thành công!')
            } catch (photoError) {
              console.error('Lỗi upload ảnh:', photoError)
              ElMessage.success('Cập nhật thành công, nhưng có lỗi upload ảnh')
            }
          } else {
            ElMessage.success('Cập nhật thành công!')
          }
          
          // Reset form
          showQuickTrack.value = false
          trackForm.photo = null
          trackUploadRef.value?.clearFiles()
          loadData()
        } else {
          ElMessage.error('Lỗi cập nhật')
        }
      } catch (error) {
        ElMessage.error('Lỗi cập nhật')
        console.error(error)
      }
    }
    
    const viewBatchPhoto = (batch) => {
      if (batch.latest_photo) {
        selectedBatchPhoto.value = batch.latest_photo
        showPhotoViewer.value = true
      }
    }
    
    const resetBatchForm = () => {
      Object.keys(batchForm).forEach(key => {
        if (key === 'photo') {
          batchForm[key] = null
        } else if (typeof batchForm[key] === 'string') {
          batchForm[key] = ''
        } else if (key === 'initial_count') {
          batchForm[key] = 100
        } else {
          batchForm[key] = null
        }
      })
      selectedTankFishType.value = ''
      uploadRef.value?.clearFiles()
    }

    const onTankChange = (tankId) => {
      if (!tankId || tankId === '') {
        selectedTankFishType.value = ''
        ElMessage.info('💡 Lứa cá này sẽ không thuộc hồ nào cụ thể')
        return
      }

      // Tìm thông tin tank đã chọn
      const selectedTank = tanks.value.find(tank => tank.id === tankId)
      if (selectedTank && selectedTank.fish_type) {
        selectedTankFishType.value = selectedTank.fish_type
        
        // Auto-fill fish_species nếu chưa có dữ liệu
        if (!batchForm.fish_species.trim()) {
          batchForm.fish_species = selectedTank.fish_type
          ElMessage.info(`Đã tự động điền loại cá: ${selectedTank.fish_type}`)
        }
      } else {
        selectedTankFishType.value = ''
      }
    }
    
    const handleSearch = (value) => {
      // Search functionality is handled by computed filteredBatches
      console.log('Search:', value)
    }
    
    const handleFileChange = (file) => {
      batchForm.photo = file.raw
    }
    
    const handleFileRemove = () => {
      batchForm.photo = null
    }

    // Pagination handlers
    const handleSizeChange = (val) => {
      pageSize.value = val
      currentPage.value = 1 // Reset to first page when changing page size
    }

    const handleCurrentChange = (val) => {
      currentPage.value = val
    }

    // Reset pagination when filters change
    watch([searchTerm, tankFilter, stageFilter], () => {
      currentPage.value = 1
    })
    
    const openUploadPhoto = (batch) => {
      selectedBatch.value = batch
      uploadForm.photo = null
      uploadForm.caption = ''
      showUploadDialog.value = true
      uploadDialogRef.value?.clearFiles()
    }
    
    const uploadBatchPhoto = async (batchId, file) => {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('photo_date', new Date().toISOString().split('T')[0])
      formData.append('caption', uploadForm.caption || 'Ảnh lứa cá')
      
      const token = localStorage.getItem('token')
      const response = await axios.post(`/batches/${batchId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      
      return response.data
    }
    
    const handleDialogFileChange = (file) => {
      uploadForm.photo = file.raw
    }
    
    const handleDialogFileRemove = () => {
      uploadForm.photo = null
    }
    
    const handleTrackFileChange = (file) => {
      trackForm.photo = file.raw
    }
    
    const handleTrackFileRemove = () => {
      trackForm.photo = null
    }
    
    const handleUploadPhoto = async () => {
      if (!uploadForm.photo || !selectedBatch.value) return
      
      try {
        uploading.value = true
        await uploadBatchPhoto(selectedBatch.value.id, uploadForm.photo)
        ElMessage.success('Upload ảnh thành công!')
        showUploadDialog.value = false
        loadData() // Reload để cập nhật ảnh
      } catch (error) {
        console.error('Upload error:', error)
        ElMessage.error('Lỗi upload ảnh')
      } finally {
        uploading.value = false
      }
    }
    
    onMounted(() => {
      loadData()
    })
    
    return {
      loading,
      creating,
      batches,
      tanks,
      showCreateForm,
      showQuickTrack,
      showPhotoViewer,
      selectedBatchPhoto,
      selectedTankFishType,
      searchTerm,
      tankFilter,
      stageFilter,
      batchFormRef,
      batchForm,
      trackForm,
      batchRules,
      filteredBatches,
      paginatedBatches,
      totalBatches,
      currentPage,
      pageSize,
      totalFish,
      avgSurvivalRate,
      activeBatches,
      isMobile,
      onTankChange,
      formatDate,
      calculateAge,
      calculateSurvivalRate,
      createBatch,
      quickTrack,
      updateAliveCount,
      saveQuickTrack,
      viewBatchPhoto,
      handleSearch,
      handleFileChange,
      handleFileRemove,
      handleSizeChange,
      handleCurrentChange,
      openUploadPhoto,
      uploadRef,
      // Upload dialog
      showUploadDialog,
      uploadDialogRef,
      uploadForm,
      uploading,
      handleDialogFileChange,
      handleDialogFileRemove,
      handleUploadPhoto,
      // Track upload
      trackUploadRef,
      handleTrackFileChange,
      handleTrackFileRemove
    }
  }
}
</script>

<style scoped>
.batch-list {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-content h1 {
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-content p {
  margin: 0;
  color: #6b7280;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stats-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:nth-child(1)::before { background: linear-gradient(90deg, #667eea, #764ba2); }
.stats-card:nth-child(2)::before { background: linear-gradient(90deg, #f093fb, #f5576c); }
.stats-card:nth-child(3)::before { background: linear-gradient(90deg, #4facfe, #00f2fe); }
.stats-card:nth-child(4)::before { background: linear-gradient(90deg, #43e97b, #38f9d7); }

.stats-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
}

.stats-card:hover::before {
  opacity: 1;
}

.stats-content h3 {
  margin: 0 0 8px 0;
  font-size: 32px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stats-content p {
  margin: 0;
  color: #6b7280;
  font-size: 15px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filter-select {
  min-width: 180px;
}

@media (max-width: 768px) {
  .search-input {
    min-width: auto;
    flex: none;
  }
  
  .filter-select {
    min-width: auto;
  }
}

.batch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 24px;
}

.batch-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s;
  border: 1px solid #f0f0f0;
}

.batch-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.batch-title-section {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 16px;
}

.batch-title h3 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2c3e50;
}

.batch-title p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.batch-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #7f8c8d;
  font-size: 14px;
}

.value {
  color: #2c3e50;
  font-size: 14px;
  text-align: right;
  max-width: 200px;
  word-break: break-word;
}

.batch-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-label {
  font-size: 12px;
  color: #7f8c8d;
}

.batch-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.action-btn .el-icon {
  font-size: 16px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
}

.empty-content h3 {
  margin: 16px 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
}

.empty-content p {
  margin: 0 0 20px 0;
  color: #7f8c8d;
  font-size: 16px;
}

.loading {
  padding: 40px 0;
}

/* Photo Viewer styles */
.photo-viewer {
  text-align: center;
}

/* Batch Avatar Styles */
.batch-avatar {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid #f3f4f6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.batch-avatar--photo {
  border-color: #f59e0b;
}

.batch-avatar--photo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(245, 158, 11, 0.2);
}

.batch-avatar--placeholder {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #9ca3af;
  border-style: dashed;
  border-color: #d1d5db;
}

.batch-avatar--placeholder:hover {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #6b7280;
  border-color: #9ca3af;
  transform: scale(1.02);
}

.batch-stage {
  display: inline-block;
  background: #f0f8ff;
  color: #1890ff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

/* Desktop Optimization Styles */
@media (min-width: 1024px) {
  .batch-list {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px;
  }
  
  .page-header {
    margin-bottom: 48px;
    padding: 32px;
  }
  
  .header-content h1 {
    font-size: 42px;
  }
  
  .header-content p {
    font-size: 20px;
  }
  
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    margin-bottom: 48px;
  }
  
  .stats-card {
    padding: 32px;
    min-height: 160px;
  }
  
  .batch-grid {
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 32px;
  }
  
  .batch-card {
    padding: 32px;
    min-height: 300px;
  }
  
  .batch-avatar {
    width: 90px !important;
    height: 90px !important;
  }
  
  .batch-title h3 {
    font-size: 22px;
  }
  
  /* Image constraints for desktop */
  .batch-avatar img {
    max-width: 100%;
    max-height: 100%;
    object-fit: cover;
  }
  
  .photo-viewer img {
    max-width: 90%;
    max-height: 80vh;
    object-fit: contain;
  }
}

/* Tablet Optimization */
@media (min-width: 769px) and (max-width: 1023px) {
  .batch-list {
    padding: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  
  .batch-grid {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 24px;
  }
  
  .batch-card {
    padding: 24px;
  }
  
  .batch-avatar {
    width: 80px !important;
    height: 80px !important;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .batch-list {
    padding: 20px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 32px;
    padding: 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
    border: 1px solid #f3f4f6;
  }
  
  .header-content {
    text-align: center;
    margin-bottom: 20px;
  }
  
  .header-content h1 {
    font-size: 28px;
    font-weight: 700;
    color: #1f2937;
  }
  
  .header-content p {
    font-size: 16px;
    color: #6b7280;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px 12px;
    margin-bottom: 32px;
  }
  
  .stats-card {
    padding: 20px;
    border-radius: 14px;
  }
  
  .stats-content h3 {
    font-size: 24px;
  }
  
  .stats-content p {
    font-size: 13px;
  }
  
  .batch-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  /* Mobile Batch Card Layout - Following Image 2 Design */
  .batch-card {
    padding: 0;
    border-radius: 16px;
    background: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    border: 1px solid #f3f4f6;
    overflow: hidden;
  }
  
  .batch-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px;
    margin-bottom: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .batch-title-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
  }
  
  .batch-avatar {
    border: 3px solid #f59e0b !important;
    border-radius: 12px !important;
    flex-shrink: 0;
  }
  
  .batch-title {
    flex: 1;
    text-align: right;
  }
  
  .batch-title h3 {
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 6px 0;
  }
  
  .batch-stage {
    background: #e1f5fe !important;
    color: #0277bd !important;
    padding: 4px 8px !important;
    border-radius: 6px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
  }
  
  .batch-info {
    padding: 16px;
    margin-bottom: 0;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  
  .info-row:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
  
  .label {
    font-size: 13px;
    font-weight: 600;
    color: #6b7280;
  }
  
  .value {
    font-size: 14px;
    font-weight: 500;
    color: #1f2937;
    text-align: right;
  }
  
  /* Batch Stats Mobile Layout - Horizontal */
  .batch-stats {
    display: flex;
    justify-content: space-around;
    padding: 16px;
    background: #f8fafc;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    margin: 0;
    gap: 0;
    grid-template-columns: none;
  }
  
  .stat-item {
    text-align: center;
    padding: 8px;
    flex: 1;
  }
  
  .stat-number {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: #059669;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* Batch Actions Mobile - Two Buttons */
  .batch-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0;
    padding: 0;
    border-top: none;
  }
  
  .action-btn {
    height: 48px;
    font-size: 14px;
    font-weight: 600;
    border-radius: 0;
    border: none;
    border-right: 1px solid #e5e7eb;
  }
  
  .action-btn:last-child {
    border-right: none;
  }
  
  .action-btn:first-child {
    background: #f8fafc;
    color: #4b5563;
  }
  
  .action-btn:first-child:hover {
    background: #f1f5f9;
    color: #1f2937;
  }
  
  .action-btn:last-child {
    background: #059669;
    color: white;
  }
  
  .action-btn:last-child:hover {
    background: #047857;
  }
  
  .empty-state {
    padding: 60px 24px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
  }
  
  .empty-content h3 {
    font-size: 20px;
  }
  
  .empty-content p {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .batch-list {
    padding: 16px;
  }
  
  .page-header {
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .header-content p {
    font-size: 15px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px 8px;
    margin-bottom: 24px;
  }
  
  .stats-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .stats-content h3 {
    font-size: 20px;
  }
  
  .stats-content p {
    font-size: 12px;
  }
  
  .batch-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .batch-avatar {
    width: 60px !important;
    height: 60px !important;
  }
  
  .batch-title h3 {
    font-size: 16px;
  }
  
  .batch-stage {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .info-row {
    padding: 10px 0;
  }
  
  .label {
    font-size: 12px;
  }
  
  .value {
    font-size: 14px;
  }
  
  .action-btn {
    height: 44px;
    font-size: 13px;
  }
  
  .action-btn .el-icon {
    font-size: 14px;
  }
}

/* Batch Form Dialog Responsive Styles */
.batch-form-dialog .el-dialog__header,
.batch-track-dialog .el-dialog__header,
.batch-upload-dialog .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
}

.batch-form-dialog .el-dialog__title,
.batch-track-dialog .el-dialog__title,
.batch-upload-dialog .el-dialog__title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.batch-form-dialog .el-dialog__body,
.batch-track-dialog .el-dialog__body,
.batch-upload-dialog .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.batch-form-dialog .el-dialog__footer,
.batch-track-dialog .el-dialog__footer,
.batch-upload-dialog .el-dialog__footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

/* Form Elements */
.batch-form-dialog .el-form,
.batch-track-dialog .el-form,
.batch-upload-dialog .el-form {
  max-width: none;
}

.batch-form-dialog .el-form-item,
.batch-track-dialog .el-form-item,
.batch-upload-dialog .el-form-item {
  margin-bottom: 20px;
}

.batch-form-dialog .el-form-item__label,
.batch-track-dialog .el-form-item__label,
.batch-upload-dialog .el-form-item__label {
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
  padding-bottom: 8px;
}

.batch-form-dialog .el-input,
.batch-form-dialog .el-date-picker,
.batch-form-dialog .el-input-number,
.batch-form-dialog .el-select,
.batch-track-dialog .el-input,
.batch-track-dialog .el-date-picker,
.batch-track-dialog .el-input-number,
.batch-upload-dialog .el-input {
  width: 100%;
}

.batch-form-dialog .el-input__wrapper,
.batch-track-dialog .el-input__wrapper,
.batch-upload-dialog .el-input__wrapper {
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  min-height: 44px;
}

.batch-form-dialog .el-input__wrapper:hover,
.batch-track-dialog .el-input__wrapper:hover,
.batch-upload-dialog .el-input__wrapper:hover {
  border-color: #d1d5db;
}

.batch-form-dialog .el-input__wrapper.is-focus,
.batch-track-dialog .el-input__wrapper.is-focus,
.batch-upload-dialog .el-input__wrapper.is-focus {
  border-color: #059669;
  box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
}

/* Mobile Responsive for All Form Dialogs */
@media (max-width: 768px) {
  .batch-form-dialog.el-dialog,
  .batch-track-dialog.el-dialog,
  .batch-upload-dialog.el-dialog {
    width: 95% !important;
    margin: 16px auto !important;
    max-width: none !important;
  }
  
  .batch-form-dialog.el-dialog.is-fullscreen,
  .batch-track-dialog.el-dialog.is-fullscreen,
  .batch-upload-dialog.el-dialog.is-fullscreen {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
  
  .batch-form-dialog .el-dialog__header,
  .batch-track-dialog .el-dialog__header,
  .batch-upload-dialog .el-dialog__header {
    padding: 16px 20px 14px;
  }
  
  .batch-form-dialog .el-dialog__title,
  .batch-track-dialog .el-dialog__title,
  .batch-upload-dialog .el-dialog__title {
    font-size: 18px;
  }
  
  .batch-form-dialog .el-dialog__body,
  .batch-track-dialog .el-dialog__body,
  .batch-upload-dialog .el-dialog__body {
    padding: 20px;
    max-height: calc(100vh - 140px);
  }
  
  .batch-form-dialog .el-dialog__footer,
  .batch-track-dialog .el-dialog__footer,
  .batch-upload-dialog .el-dialog__footer {
    padding: 14px 20px 16px;
    position: sticky;
    bottom: 0;
    background: white;
  }
  
  .batch-form-dialog .el-form-item,
  .batch-track-dialog .el-form-item,
  .batch-upload-dialog .el-form-item {
    margin-bottom: 18px;
  }
  
  .batch-form-dialog .el-form-item__label,
  .batch-track-dialog .el-form-item__label,
  .batch-upload-dialog .el-form-item__label {
    font-size: 15px;
    margin-bottom: 6px;
    display: block;
    width: 100% !important;
    text-align: left !important;
    padding-bottom: 6px;
  }
  
  .batch-form-dialog .el-input__wrapper,
  .batch-form-dialog .el-date-picker,
  .batch-form-dialog .el-input-number .el-input__wrapper,
  .batch-track-dialog .el-input__wrapper,
  .batch-track-dialog .el-date-picker,
  .batch-track-dialog .el-input-number .el-input__wrapper,
  .batch-upload-dialog .el-input__wrapper {
    min-height: 48px;
    border-radius: 10px;
    font-size: 16px;
  }
  
  .batch-form-dialog .el-input__inner,
  .batch-track-dialog .el-input__inner,
  .batch-upload-dialog .el-input__inner {
    font-size: 16px;
    line-height: 1.5;
  }
  
  .batch-form-dialog .el-button,
  .batch-track-dialog .el-button,
  .batch-upload-dialog .el-button {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 10px;
    font-weight: 600;
  }
  
  .batch-form-dialog .dialog-footer,
  .batch-track-dialog .dialog-footer,
  .batch-upload-dialog .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: stretch;
  }
  
  .batch-form-dialog .dialog-footer .el-button,
  .batch-track-dialog .dialog-footer .el-button,
  .batch-upload-dialog .dialog-footer .el-button {
    flex: 1;
  }
  
  /* Select dropdown mobile optimization */
  .batch-form-dialog .el-select .el-input__wrapper {
    min-height: 48px;
  }
  
  .batch-form-dialog .el-select .el-input__inner {
    font-size: 16px;
    line-height: 1.5;
  }
  
  /* Upload component mobile optimization */
  .batch-form-dialog .el-upload,
  .batch-upload-dialog .el-upload {
    width: 100%;
  }
  
  /* Track form specific styles */
  .batch-track-dialog .el-text {
    font-size: 16px !important;
  }
  
  .batch-track-dialog .el-text--info {
    font-size: 14px !important;
  }
  
  .batch-track-dialog .el-text[style*="font-size: 12px"] {
    font-size: 14px !important;
    line-height: 1.4 !important;
    margin-top: 8px !important;
  }
}

@media (max-width: 480px) {
  .batch-form-dialog.el-dialog,
  .batch-track-dialog.el-dialog,
  .batch-upload-dialog.el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100% !important;
  }
  
  .batch-form-dialog .el-dialog__header,
  .batch-track-dialog .el-dialog__header,
  .batch-upload-dialog .el-dialog__header {
    padding: 14px 16px 12px;
  }
  
  .batch-form-dialog .el-dialog__title,
  .batch-track-dialog .el-dialog__title,
  .batch-upload-dialog .el-dialog__title {
    font-size: 17px;
  }
  
  .batch-form-dialog .el-dialog__body,
  .batch-track-dialog .el-dialog__body,
  .batch-upload-dialog .el-dialog__body {
    padding: 16px;
    max-height: calc(100vh - 120px);
  }
  
  .batch-form-dialog .el-dialog__footer,
  .batch-track-dialog .el-dialog__footer,
  .batch-upload-dialog .el-dialog__footer {
    padding: 12px 16px 14px;
  }
  
  .batch-form-dialog .el-form-item,
  .batch-track-dialog .el-form-item,
  .batch-upload-dialog .el-form-item {
    margin-bottom: 16px;
  }
  
  .batch-form-dialog .el-form-item__label,
  .batch-track-dialog .el-form-item__label,
  .batch-upload-dialog .el-form-item__label {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .batch-form-dialog .el-input__wrapper,
  .batch-form-dialog .el-date-picker,
  .batch-form-dialog .el-input-number .el-input__wrapper,
  .batch-track-dialog .el-input__wrapper,
  .batch-track-dialog .el-date-picker,
  .batch-track-dialog .el-input-number .el-input__wrapper,
  .batch-upload-dialog .el-input__wrapper {
    min-height: 46px;
    border-radius: 8px;
  }
  
  .batch-form-dialog .el-button,
  .batch-track-dialog .el-button,
  .batch-upload-dialog .el-button {
    min-height: 46px;
    font-size: 15px;
  }
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  margin-top: 24px;
}

.batch-pagination :deep(.el-pagination) {
  gap: 8px;
}

.batch-pagination :deep(.el-pager li) {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  font-weight: 500;
}

.batch-pagination :deep(.el-pager li:hover),
.batch-pagination :deep(.el-pager li.is-active) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #6366f1;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.batch-pagination :deep(.btn-prev),
.batch-pagination :deep(.btn-next) {
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  transition: all 0.3s ease;
  font-weight: 500;
}

.batch-pagination :deep(.btn-prev:hover),
.batch-pagination :deep(.btn-next:hover) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-color: #6366f1;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Mobile pagination styles */
@media (max-width: 768px) {
  .pagination-container {
    padding: 20px 12px;
    margin-top: 16px;
    border-radius: 12px;
    overflow-x: auto;
  }
  
  .batch-pagination {
    min-width: 100%;
  }
  
  .batch-pagination :deep(.el-pagination) {
    flex-wrap: nowrap;
    gap: 4px;
    justify-content: center;
    align-items: center;
    min-width: fit-content;
  }
  
  .batch-pagination :deep(.el-pagination__total),
  .batch-pagination :deep(.el-pagination__sizes),
  .batch-pagination :deep(.el-pagination__jump) {
    display: none;
  }
  
  .batch-pagination :deep(.el-pager) {
    flex: 1;
    justify-content: center;
    overflow: visible;
  }
}

@media (max-width: 480px) {
  .pagination-container {
    padding: 16px 8px;
    border-radius: 8px;
  }
  
  .batch-pagination :deep(.el-pagination) {
    transform: scale(0.9);
    transform-origin: center;
  }
  
  .batch-pagination :deep(.el-pager li),
  .batch-pagination :deep(.btn-prev),
  .batch-pagination :deep(.btn-next) {
    min-width: 28px;
    height: 28px;
    line-height: 26px;
    font-size: 12px;
    margin: 0 1px;
  }
  
  .batch-pagination :deep(.el-pager li.more) {
    min-width: 24px;
  }
}

@media (max-width: 360px) {
  .batch-pagination :deep(.el-pagination) {
    transform: scale(0.8);
  }
  
  .batch-pagination :deep(.el-pager li),
  .batch-pagination :deep(.btn-prev),
  .batch-pagination :deep(.btn-next) {
    min-width: 24px;
    height: 24px;
    line-height: 22px;
    font-size: 11px;
    margin: 0;
  }
}
</style>
