<template>
  <div class="tank-list">
    <div class="page-header">
      <div class="header-content">
        <h1>Quản lý hồ cá</h1>
        <p>Quản lý thông tin các hồ cá của bạn</p>
      </div>
      <el-button type="primary" @click="showCreateForm = true" icon="Plus">
        Thêm hồ cá mới
      </el-button>
    </div>
    
    <!-- Search Filters -->
    <CollapsibleSearch 
      v-model="searchTerm" 
      placeholder="Tìm kiếm theo tên hồ hoặc loại cá..."
      @search="handleSearch"
    >
      <template #filters>
        <el-input 
          v-model="searchTerm" 
          placeholder="Tìm kiếm theo tên hồ hoặc loại cá..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-select 
          v-model="fishTypeFilter" 
          placeholder="Lọc theo loại cá" 
          clearable 
          class="filter-select"
        >
          <el-option label="Tất cả" value="" />
          <el-option 
            v-for="type in fishTypes" 
            :key="type" 
            :label="type" 
            :value="type" 
          />
        </el-select>
      </template>
    </CollapsibleSearch>
    
    <!-- Breeding Notifications (Top Right) -->
    <div v-if="breedingSoonTanks.length > 0 && showBreedingNotifications" class="breeding-notifications-floating">
      <!-- Compact Notification -->
      <div v-if="!notificationExpanded" class="notification-compact" @click="toggleNotificationExpansion">
        <div class="compact-bell">
          <el-icon class="bell-icon"><Bell /></el-icon>
          <span class="compact-count">{{ breedingSoonTanks.length }}</span>
        </div>
      </div>
      
      <!-- Expanded Notification -->
      <div v-else class="notification-container">
        <div class="notification-header">
          <div class="notification-title">
            <el-icon class="notification-icon"><Bell /></el-icon>
            <span>🐟 Hồ cá sắp đẻ</span>
            <span class="notification-count">{{ breedingSoonTanks.length }}</span>
          </div>
          <div class="header-actions">
            <el-button 
              @click="toggleNotificationExpansion"
              type="text" 
              size="small"
              class="collapse-btn"
              title="Thu gọn"
            >
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <el-button 
              @click="dismissBreedingNotifications"
              type="text" 
              size="small"
              class="dismiss-btn"
              title="Đóng"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        
        <div class="notification-content">
          <div 
            v-for="(tank, index) in breedingSoonTanks.slice(0, 3)" 
            :key="`breeding-${tank.id}`"
            @click="goToTankDetail(tank.id)"
            class="notification-item"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="tank-avatar">
              <div v-if="tank.latest_photo" class="tank-thumb">
                <img :src="tank.latest_photo" :alt="tank.name" />
              </div>
              <div v-else class="tank-thumb-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </div>
            
            <div class="tank-details">
              <div class="tank-header">
                <span class="tank-name">{{ tank.name }}</span>
                <span class="urgency-badge" :class="getUrgencyClass(tank)">
                  {{ getDaysUntilBreeding(tank) }}
                </span>
              </div>
              
              <div class="tank-meta">
                <div class="meta-item">
                  <el-icon class="meta-icon"><Calendar /></el-icon>
                  <span>Ngày đẻ: {{ formatDate(tank.spawn_date) }}</span>
                </div>
                <div v-if="tank.fish_type" class="meta-item">
                  <el-icon class="meta-icon"><Fish /></el-icon>
                  <span>{{ tank.fish_type }}</span>
                </div>
                <div v-else class="meta-item">
                  <el-icon class="meta-icon"><Fish /></el-icon>
                  <span class="no-data">Chưa xác định loại cá</span>
                </div>
              </div>
              
              <div class="next-breeding">
                <el-icon class="breeding-icon"><Bell /></el-icon>
                <span>Đẻ tiếp theo: {{ formatDate(getNextBreedingDate(tank)) }}</span>
              </div>
            </div>
            
            <div class="notification-actions">
              <el-icon class="arrow-icon"><ArrowRight /></el-icon>
            </div>
          </div>
          
          <div v-if="breedingSoonTanks.length > 3" class="more-tanks">
            <span>Và {{ breedingSoonTanks.length - 3 }} hồ khác...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Tank Grid -->
    <div v-if="tanksStore.loading" class="loading">
      <el-skeleton :rows="3" />
    </div>
    
    <div v-else-if="filteredTanks.length === 0" class="empty-state">
      <div class="empty-content">
        <el-icon size="64"><Box /></el-icon>
        <h3>{{ searchTerm || fishTypeFilter ? 'Không tìm thấy hồ cá nào' : 'Chưa có hồ cá nào' }}</h3>
        <p>{{ searchTerm || fishTypeFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' : 'Hãy tạo hồ cá đầu tiên của bạn' }}</p>
        <el-button v-if="!searchTerm && !fishTypeFilter" type="primary" @click="showCreateForm = true">
          Tạo hồ cá đầu tiên
        </el-button>
      </div>
    </div>
    
    <div v-else class="tank-grid">
      <div v-for="tank in filteredTanks" :key="tank.id" class="tank-card" :class="{ 'breeding-soon': isBreedingSoon(tank) }">
        <!-- Breeding Badge -->
        <div v-if="isBreedingSoon(tank)" class="breeding-badge">
          <el-icon><Bell /></el-icon>
          <span>Sắp đẻ</span>
        </div>
        
        <div class="tank-header">
          <div class="tank-title-section">
            <div 
              v-if="tank.latest_photo" 
              @click="viewTankPhoto(tank)"
              class="image-container image-lg image-square professional-avatar"
            >
              <img 
                :src="tank.latest_photo" 
                :alt="`Hình ảnh hồ ${tank.name}`"
                class="professional-image"
              />
              <div class="image-overlay">
                <el-icon class="overlay-action"><ZoomIn /></el-icon>
              </div>
            </div>
            <div 
              v-else
              class="image-placeholder image-lg image-square professional-avatar"
            >
              <el-icon class="placeholder-icon"><Picture /></el-icon>
              <span class="placeholder-text">Chưa có ảnh</span>
            </div>
            <div class="tank-title">
              <h3>{{ tank.name }}</h3>
              <div v-if="isBreedingSoon(tank)" class="breeding-info">
                <small>{{ getDaysUntilBreeding(tank) }}</small>
              </div>
            </div>
          </div>
          <el-dropdown @command="handleTankAction">
            <el-button type="text" icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item :command="`view-${tank.id}`" icon="View">
                  Xem chi tiết
                </el-dropdown-item>
                <el-dropdown-item :command="`edit-${tank.id}`" icon="Edit">
                  Chỉnh sửa
                </el-dropdown-item>
                <el-dropdown-item :command="`delete-${tank.id}`" icon="Delete" divided>
                  Xóa hồ cá
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        
        <div class="tank-info">
          <div class="info-row">
            <span class="label">Loại cá:</span>
            <span class="value">{{ tank.fish_type || 'Chưa xác định' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Ngày thả:</span>
            <span class="value">{{ formatDate(tank.release_date) || 'Chưa có' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Ngày đẻ:</span>
            <span class="value">{{ formatDate(tank.spawn_date) || 'Chưa có' }}</span>
          </div>
          <div class="info-row">
            <span class="label">Loại hồ:</span>
            <span class="value">{{ tank.tank_type || 'Chưa xác định' }}</span>
          </div>
        </div>
        
        <div class="tank-stats">
          <div class="stat-item">
            <span class="stat-number">{{ tank.batch_count || 0 }}</span>
            <span class="stat-label">Lứa cá</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ tank.total_fish || 0 }}</span>
            <span class="stat-label">Tổng cá</span>
          </div>

          <div class="stat-item">
            <span class="stat-number">{{ tank.current_temperature ? `${tank.current_temperature}°C` : '--' }}</span>
            <span class="stat-label">Nhiệt độ</span>
          </div>
        </div>
        
        <div v-if="tank.notes" class="tank-notes">
          <p>{{ tank.notes }}</p>
        </div>
        
        <div class="tank-actions">
          <el-button 
            class="action-btn"
            @click="$router.push(`/tanks/${tank.id}`)"
            icon="View"
          >
            Chi tiết
          </el-button>
          <el-button 
            class="action-btn"
            type="primary" 
            @click="editTank(tank)"
            icon="Edit"
          >
            Chỉnh sửa
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Create/Edit Tank Modal -->
    <el-dialog 
      v-model="showCreateForm" 
      :title="editingTank ? 'Chỉnh sửa hồ cá' : 'Thêm hồ cá mới'"
      width="600px"
      @close="resetForm"
      class="tank-form-dialog"
      :fullscreen="isMobile"
    >
      <el-form 
        ref="tankFormRef"
        :model="tankForm"
        :rules="tankRules"
        label-width="120px"
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
          
          <!-- Upload component -->
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :show-file-list="true"
            :limit="1"
            accept="image/*"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
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
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateForm = false">Hủy</el-button>
          <el-button 
            type="primary" 
            :loading="tanksStore.loading"
            @click="saveTank"
          >
            {{ editingTank ? 'Cập nhật' : 'Tạo mới' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Photo Viewer Modal -->
    <el-dialog v-model="showPhotoViewer" title="Xem ảnh hồ cá" width="80%" center>
      <div class="photo-viewer">
        <img 
          v-if="selectedTankPhoto" 
          :src="selectedTankPhoto" 
          style="width: 100%; height: auto; max-height: 70vh; object-fit: contain;"
        />
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPhotoViewer = false">Đóng</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Picture, ZoomIn, Bell, Close, ArrowRight, ArrowDown, Calendar, Fish } from '@element-plus/icons-vue'
import axios from 'axios'
import CollapsibleSearch from '@/components/CollapsibleSearch.vue'

export default {
  name: 'TankList',
  components: {
    CollapsibleSearch
  },
  setup() {
    const router = useRouter()
    const tanksStore = useTanksStore()
    
    const tankFormRef = ref()
    const uploadRef = ref()
    const showCreateForm = ref(false)
    const showPhotoViewer = ref(false)
    const editingTank = ref(null)
    const selectedTankPhoto = ref(null)
    const searchTerm = ref('')
    const fishTypeFilter = ref('')
    
    const weatherLoading = ref(false)
    const weatherInfo = ref(null)
    const showBreedingNotifications = ref(true)
    const notificationExpanded = ref(false)
    
    const tankForm = reactive({
      name: '',
      fish_type: '',
      release_date: '',
      spawn_date: '',
      tank_type: '',
      current_temperature: 32, // Mặc định 32°C
      notes: '',
      photo: null,
      removeCurrentPhoto: false
    })
    
    const tankRules = {
      name: [
        { required: true, message: 'Vui lòng nhập tên hồ cá', trigger: 'blur' }
      ]
    }
    
    const filteredTanks = computed(() => {
      let tanks = tanksStore.tanks
      
      if (searchTerm.value) {
        const term = searchTerm.value.toLowerCase()
        tanks = tanks.filter(tank => 
          tank.name.toLowerCase().includes(term) ||
          (tank.fish_type && tank.fish_type.toLowerCase().includes(term))
        )
      }
      
      if (fishTypeFilter.value) {
        tanks = tanks.filter(tank => tank.fish_type === fishTypeFilter.value)
      }
      
      return tanks
    })

    const isMobile = computed(() => {
      return window.innerWidth <= 768
    })
    
    const fishTypes = computed(() => {
      const types = new Set()
      tanksStore.tanks.forEach(tank => {
        if (tank.fish_type) {
          types.add(tank.fish_type)
        }
      })
      return Array.from(types)
    })

    // Breeding logic
    const getNextBreedingDate = (tank) => {
      if (!tank.spawn_date) return null
      const lastSpawnDate = new Date(tank.spawn_date)
      const nextBreedingDate = new Date(lastSpawnDate)
      nextBreedingDate.setDate(nextBreedingDate.getDate() + 20)
      return nextBreedingDate
    }

    const isBreedingSoon = (tank) => {
      const nextBreedingDate = getNextBreedingDate(tank)
      if (!nextBreedingDate) return false
      
      const today = new Date()
      const diffTime = nextBreedingDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      // Thông báo từ 3 ngày trước đến 2 ngày sau ngày đẻ dự kiến
      return diffDays >= -2 && diffDays <= 3
    }

    const getDaysUntilBreeding = (tank) => {
      const nextBreedingDate = getNextBreedingDate(tank)
      if (!nextBreedingDate) return ''
      
      const today = new Date()
      const diffTime = nextBreedingDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0) {
        return `Còn ${diffDays} ngày`
      } else if (diffDays === 0) {
        return 'Hôm nay'
      } else {
        return `Quá ${Math.abs(diffDays)} ngày`
      }
    }

    const breedingSoonTanks = computed(() => {
      return filteredTanks.value.filter(tank => isBreedingSoon(tank))
    })
    
    const formatDate = (dateStr) => {
      if (!dateStr) return null
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const resetForm = () => {
      Object.keys(tankForm).forEach(key => {
        if (key === 'photo') {
          tankForm[key] = null
        } else if (key === 'current_temperature') {
          tankForm[key] = 32 // Reset về nhiệt độ mặc định 32°C
        } else if (key === 'removeCurrentPhoto') {
          tankForm[key] = false
        } else if (typeof tankForm[key] === 'string') {
          tankForm[key] = ''
        } else {
          tankForm[key] = null
        }
      })
      editingTank.value = null
      tankFormRef.value?.resetFields()
      uploadRef.value?.clearFiles()
    }
    
    const editTank = (tank) => {
      editingTank.value = tank
      Object.keys(tankForm).forEach(key => {
        tankForm[key] = tank[key] || (typeof tankForm[key] === 'string' ? '' : null)
      })
      showCreateForm.value = true
    }
    
    const saveTank = async () => {
      try {
        const valid = await tankFormRef.value.validate()
        if (!valid) return
        
        // Auto-fill fish_type từ lứa cá nếu để trống 
        if (!tankForm.fish_type.trim()) {
          try {
            // Lấy tất cả batches của user để tìm loại cá phổ biến nhất
            const batchResponse = await axios.get('/batches')
            if (batchResponse.data.success && batchResponse.data.data.length > 0) {
              const batches = batchResponse.data.data
              
              // Nếu đang edit tank, ưu tiên lấy từ tên lứa cá của tank đó
              if (editingTank.value?.id) {
                const tankBatches = batches.filter(b => b.tank_id === editingTank.value.id)
                if (tankBatches.length > 0 && tankBatches[0].batch_name) {
                  tankForm.fish_type = tankBatches[0].batch_name
                  ElMessage.info(`Đã tự động điền loại cá từ tên lứa cá: ${tankBatches[0].batch_name}`)
                }
              } else {
                // Nếu tạo mới, lấy tên lứa cá phổ biến nhất từ tất cả lứa cá
                const batchNameCount = {}
                batches.forEach(b => {
                  if (b.batch_name) {
                    batchNameCount[b.batch_name] = (batchNameCount[b.batch_name] || 0) + 1
                  }
                })
                
                const batchNames = Object.keys(batchNameCount)
                const mostCommon = batchNames.length > 0 
                  ? batchNames.reduce((a, b) => batchNameCount[a] > batchNameCount[b] ? a : b)
                  : null
                
                if (mostCommon) {
                  tankForm.fish_type = mostCommon
                  ElMessage.info(`Đã tự động điền loại cá từ tên lứa phổ biến: ${mostCommon}`)
                }
              }
            }
          } catch (batchError) {
            console.warn('Không thể lấy thông tin lứa cá:', batchError)
          }
        }
        
        let result
        if (editingTank.value) {
          result = await tanksStore.updateTank(editingTank.value.id, tankForm)
        } else {
          result = await tanksStore.createTank(tankForm)
        }
        
        if (result.success) {
          // Upload ảnh nếu có
          if (tankForm.photo && result.data?.id) {
            try {
              console.log('Đang upload ảnh cho tank ID:', result.data.id)
              const uploadResult = await uploadTankPhoto(result.data.id, tankForm.photo)
              console.log('Upload result:', uploadResult)
              ElMessage.success('Tạo hồ cá và upload ảnh thành công!')
            } catch (uploadError) {
              console.error('Chi tiết lỗi upload ảnh:', uploadError)
              console.error('Response data:', uploadError.response?.data)
              console.error('Response status:', uploadError.response?.status)
              ElMessage.warning('Tạo hồ cá thành công nhưng không thể upload ảnh: ' + (uploadError.response?.data?.message || uploadError.message))
            }
          } else {
            ElMessage.success(editingTank.value ? 'Cập nhật hồ cá thành công!' : 'Tạo hồ cá mới thành công!')
          }
          
          showCreateForm.value = false
          resetForm()
          try {
            await loadData() // Reload data để hiển thị ảnh mới
          } catch (loadError) {
            console.error('Lỗi reload data:', loadError)
            // Không hiện thông báo lỗi vì tank và ảnh đã tạo thành công
          }
        } else {
          ElMessage.error(result.error || 'Có lỗi xảy ra')
        }
      } catch (error) {
        console.error('Lỗi trong saveTank:', error)
        ElMessage.error('Có lỗi xảy ra khi lưu thông tin hồ cá')
      }
    }
    
    const handleTankAction = async (command) => {
      const [action, tankId] = command.split('-')
      const id = parseInt(tankId)
      
      switch (action) {
        case 'view':
          // $router.push(`/tanks/${id}`)
          break
        case 'edit':
          const tank = tanksStore.getTankById(id)
          if (tank) editTank(tank)
          break
        case 'delete':
          try {
            await ElMessageBox.confirm(
              'Bạn có chắc chắn muốn xóa hồ cá này? Hành động này không thể hoàn tác.',
              'Xác nhận xóa',
              {
                confirmButtonText: 'Xóa',
                cancelButtonText: 'Hủy',
                type: 'warning',
              }
            )
            
            const result = await tanksStore.deleteTank(id)
            if (result.success) {
              ElMessage.success('Xóa hồ cá thành công!')
            } else {
              ElMessage.error(result.error || 'Lỗi xóa hồ cá')
            }
          } catch (error) {
            // User cancelled
          }
          break
      }
    }
    
    const handleFileChange = (file) => {
      tankForm.photo = file.raw
    }
    
    const handleFileRemove = () => {
      tankForm.photo = null
    }

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
    
    const uploadTankPhoto = async (tankId, file) => {
      const formData = new FormData()
      formData.append('photo', file)
      formData.append('photo_date', new Date().toISOString().split('T')[0])
      formData.append('caption', 'Ảnh hồ cá')
      
      const token = localStorage.getItem('token')
      const response = await axios.post(`/tanks/${tankId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      })
      
      return response.data
    }
    
    const viewTankPhoto = (tank) => {
      if (tank.latest_photo) {
        selectedTankPhoto.value = tank.latest_photo
        showPhotoViewer.value = true
      }
    }
    
    const handleSearch = (value) => {
      // Search functionality is handled by computed filteredTanks
      console.log('Search:', value)
    }

    // Breeding notification functions
    const dismissBreedingNotifications = () => {
      showBreedingNotifications.value = false
      ElMessage.success('Đã ẩn thông báo hồ cá sắp đẻ')
    }

    const toggleNotificationExpansion = () => {
      notificationExpanded.value = !notificationExpanded.value
    }

    const goToTankDetail = (tankId) => {
      if (!notificationExpanded.value) {
        notificationExpanded.value = true
        return
      }
      router.push(`/tanks/${tankId}`)
    }

    const getUrgencyClass = (tank) => {
      const nextBreedingDate = getNextBreedingDate(tank)
      if (!nextBreedingDate) return 'normal'
      
      const today = new Date()
      const diffTime = nextBreedingDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 0) return 'overdue'
      if (diffDays === 1) return 'urgent'
      if (diffDays <= 2) return 'warning'
      return 'normal'
    }
    
    onMounted(() => {
      tanksStore.fetchTanks()
    })
    
    return {
      tanksStore,
      tankFormRef,
      uploadRef,
      showCreateForm,
      showPhotoViewer,
      editingTank,
      selectedTankPhoto,
      searchTerm,
      fishTypeFilter,
      weatherLoading,
      weatherInfo,
      tankForm,
      tankRules,
      filteredTanks,
      fishTypes,
      isMobile,
      formatDate,
      resetForm,
      editTank,
      saveTank,
      // Breeding functions
      breedingSoonTanks,
      isBreedingSoon,
      getDaysUntilBreeding,
      getNextBreedingDate,
      showBreedingNotifications,
      notificationExpanded,
      dismissBreedingNotifications,
      toggleNotificationExpansion,
      goToTankDetail,
      getUrgencyClass,
      handleTankAction,
      handleFileChange,
      handleFileRemove,
      removeCurrentPhoto,
      viewTankPhoto,
      handleSearch
    }
  }
}
</script>

<style scoped>
/* Current photo styles */
.current-photo {
  margin-bottom: 16px;
}

.current-photo-label {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
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

.current-photo-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.hidden-upload {
  display: none;
}

.current-photo-actions .el-button {
  width: 100%;
  max-width: 120px;
}
.tank-list {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  animation: fadeInUp 0.6s ease-out;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  flex-wrap: wrap;
  gap: 24px;
  background: white;
  padding: 32px;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
}

.header-content h1 {
  margin: 0 0 12px 0;
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f2937, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content p {
  margin: 0;
  color: #6b7280;
  font-size: 18px;
  font-weight: 500;
  opacity: 0.9;
}

.search-input {
  flex: 1;
  min-width: 250px;
}

.filter-select {
  min-width: 200px;
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

.tank-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 32px;
}

.tank-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
}

.tank-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #06b6d4, #10b981, #22c55e);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.tank-card:hover {
  transform: translateY(-6px) scale(1.01);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.tank-card:hover::before {
  opacity: 1;
}

.tank-card:hover .tank-title h3 {
  color: #6366f1;
  transform: scale(1.02);
}

.tank-card:hover .el-avatar {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.tank-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
}

.tank-title-section {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 20px;
}

.tank-title h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  transition: all 0.3s ease;
  line-height: 1.3;
}

.tank-info {
  margin-bottom: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.info-row:hover {
  background-color: #f8fafc;
  margin: 0 -16px;
  padding: 12px 16px;
  border-radius: 8px;
  border-bottom: 1px solid transparent;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #6b7280;
  font-size: 15px;
  letter-spacing: 0.025em;
}

.value {
  color: #1f2937;
  font-size: 15px;
  font-weight: 500;
  text-align: right;
  max-width: 220px;
  word-break: break-word;
}

.tank-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: white;
  border-radius: 10px;
  transition: all 0.3s ease;
  border: 1px solid #f3f4f6;
}

.stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #ffffff, #f8fafc);
}

.stat-number {
  display: block;
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tank-notes {
  margin-bottom: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
  position: relative;
}

.tank-notes::before {
  content: '💬';
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 16px;
  opacity: 0.6;
}

.tank-notes p {
  margin: 0;
  font-size: 15px;
  color: #1e40af;
  font-weight: 500;
  line-height: 1.5;
}

.tank-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #f3f4f6;
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
  padding: 80px 40px;
  color: #6b7280;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
}

.empty-state::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6b7280, #9ca3af);
  opacity: 0.5;
}

.empty-content h3 {
  margin: 24px 0 12px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
}

.empty-content p {
  margin: 0 0 32px 0;
  color: #6b7280;
  font-size: 18px;
  font-weight: 500;
  line-height: 1.6;
}

.loading {
  padding: 40px 0;
}

/* Photo Viewer styles */
.photo-viewer {
  text-align: center;
}

/* Tank Avatar Styles */
.tank-avatar {
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 3px solid #f3f4f6;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.tank-avatar--photo {
  border-color: #10b981;
}

.tank-avatar--photo:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
}

.tank-avatar--placeholder {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #9ca3af;
}

.tank-avatar--placeholder:hover {
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  color: #6b7280;
}

/* Desktop Optimization Styles */
@media (min-width: 1024px) {
  .tank-list {
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
  
  .tank-grid {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 32px;
  }
  
  .tank-card {
    padding: 32px;
    min-height: 280px;
  }
  
  .tank-avatar {
    width: 100px !important;
    height: 100px !important;
  }
  
  .tank-title h3 {
    font-size: 24px;
  }
  
  /* Image constraints for desktop */
  .tank-avatar img {
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
  .tank-list {
    padding: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .tank-grid {
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 24px;
  }
  
  .tank-card {
    padding: 24px;
  }
  
  .tank-avatar {
    width: 80px !important;
    height: 80px !important;
  }
}

/* Enhanced Mobile Responsive Styles */
@media (max-width: 768px) {
  .tank-list {
    padding: 20px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 32px;
    padding: 24px;
    gap: 20px;
  }
  
  .header-content {
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 28px;
  }
  
  .header-content p {
    font-size: 16px;
  }
  
  .tank-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  /* Mobile Tank Card Layout - Following Image 1 Design */
  .tank-card {
    padding: 0;
    border-radius: 16px;
    background: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
    border: 1px solid #f3f4f6;
    overflow: hidden;
  }
  
  .tank-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px;
    margin-bottom: 0;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .tank-title-section {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    flex: 1;
  }
  
  .tank-avatar {
    border: 3px solid #10b981 !important;
    border-radius: 12px !important;
    flex-shrink: 0;
  }
  
  .tank-title {
    flex: 1;
    text-align: right;
  }
  
  .tank-title h3 {
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 4px 0;
  }
  
  .tank-info {
    padding: 16px;
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
  
  .info-row:hover {
    margin: 0;
    padding: 8px 0;
    background: transparent;
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
  
  /* Tank Stats Mobile Layout - Horizontal */
  .tank-stats {
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
    color: #3b82f6;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  /* Tank Actions Mobile - Two Buttons */
  .tank-actions {
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
    background: #3b82f6;
    color: white;
  }
  
  .action-btn:last-child:hover {
    background: #2563eb;
  }
  
  .empty-state {
    padding: 60px 24px;
    border-radius: 16px;
  }
  
  .empty-content h3 {
    font-size: 20px;
  }
  
  .empty-content p {
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .tank-list {
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
  
  .tank-grid {
    gap: 20px;
  }
  
  .tank-card {
    padding: 20px;
    border-radius: 14px;
  }
  
  .tank-header {
    margin-bottom: 16px;
    padding-bottom: 12px;
  }
  
  .tank-title-section {
    gap: 12px;
  }
  
  .tank-avatar {
    width: 70px !important;
    height: 70px !important;
  }
  
  .tank-title h3 {
    font-size: 18px;
  }
  
  .info-row {
    padding: 12px 0;
  }
  
  .info-row:hover {
    margin: 0 -16px;
    padding: 12px 16px;
  }
  
  .label {
    font-size: 13px;
  }
  
  .value {
    font-size: 14px;
  }
  
  .tank-stats {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
    padding: 12px;
  }
  
  .stat-item {
    padding: 8px 4px;
  }
  
  .stat-number {
    font-size: 16px;
  }
  
  .stat-label {
    font-size: 10px;
  }
  
  .tank-notes {
    padding: 12px;
    margin-bottom: 16px;
  }
  
  .tank-notes p {
    font-size: 14px;
  }
  
  .tank-actions {
    gap: 8px;
    padding-top: 12px;
  }
  
  .action-btn {
    height: 44px;
    font-size: 13px;
  }
  
  .action-btn .el-icon {
    font-size: 14px;
  }
}

/* Tank Form Dialog Responsive Styles */
.tank-form-dialog .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
}

.tank-form-dialog .el-dialog__title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.tank-form-dialog .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.tank-form-dialog .el-dialog__footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

/* Form Responsive Styles */
.tank-form-dialog .el-form {
  max-width: none;
}

.tank-form-dialog .el-form-item {
  margin-bottom: 20px;
}

.tank-form-dialog .el-form-item__label {
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
  padding-bottom: 8px;
}

.tank-form-dialog .el-input,
.tank-form-dialog .el-date-picker,
.tank-form-dialog .el-input-number {
  width: 100%;
}

.tank-form-dialog .el-input__wrapper {
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  min-height: 44px;
}

.tank-form-dialog .el-input__wrapper:hover {
  border-color: #d1d5db;
}

.tank-form-dialog .el-input__wrapper.is-focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Mobile Responsive for Form Dialog */
@media (max-width: 768px) {
  .tank-form-dialog.el-dialog {
    width: 95% !important;
    margin: 16px auto !important;
    max-width: none !important;
  }
  
  .tank-form-dialog.el-dialog.is-fullscreen {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
  
  .tank-form-dialog .el-dialog__header {
    padding: 16px 20px 14px;
  }
  
  .tank-form-dialog .el-dialog__title {
    font-size: 18px;
  }
  
  .tank-form-dialog .el-dialog__body {
    padding: 20px;
    max-height: calc(100vh - 140px);
  }
  
  .tank-form-dialog .el-dialog__footer {
    padding: 14px 20px 16px;
    position: sticky;
    bottom: 0;
    background: white;
  }
  
  .tank-form-dialog .el-form-item {
    margin-bottom: 18px;
  }
  
  .tank-form-dialog .el-form-item__label {
    font-size: 15px;
    margin-bottom: 6px;
    display: block;
    width: 100% !important;
    text-align: left !important;
    padding-bottom: 6px;
  }
  
  .tank-form-dialog .el-row {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
  
  .tank-form-dialog .el-col {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  
  .tank-form-dialog .el-row .el-col:first-child {
    margin-bottom: 18px;
  }
  
  .tank-form-dialog .el-input__wrapper,
  .tank-form-dialog .el-date-picker,
  .tank-form-dialog .el-input-number .el-input__wrapper {
    min-height: 48px;
    border-radius: 10px;
    font-size: 16px;
  }
  
  .tank-form-dialog .el-input__inner {
    font-size: 16px;
    line-height: 1.5;
  }
  
  .tank-form-dialog .el-button {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 10px;
    font-weight: 600;
  }
  
  .tank-form-dialog .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: stretch;
  }
  
  .tank-form-dialog .dialog-footer .el-button {
    flex: 1;
  }
  
  /* Upload component mobile optimization */
  .tank-form-dialog .el-upload {
    width: 100%;
  }
  
  .tank-form-dialog .current-photo-container {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 16px;
  }
  
  .tank-form-dialog .current-photo-actions {
    flex-direction: row;
    justify-content: center;
    width: 100%;
    max-width: 300px;
  }
  
  .tank-form-dialog .current-photo-actions .el-button {
    flex: 1;
    max-width: none;
  }
}

@media (max-width: 480px) {
  .tank-form-dialog.el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100% !important;
  }
  
  .tank-form-dialog .el-dialog__header {
    padding: 14px 16px 12px;
  }
  
  .tank-form-dialog .el-dialog__title {
    font-size: 17px;
  }
  
  .tank-form-dialog .el-dialog__body {
    padding: 16px;
    max-height: calc(100vh - 120px);
  }
  
  .tank-form-dialog .el-dialog__footer {
    padding: 12px 16px 14px;
  }
  
  .tank-form-dialog .el-form-item {
    margin-bottom: 16px;
  }
  
  .tank-form-dialog .el-form-item__label {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .tank-form-dialog .el-input__wrapper,
  .tank-form-dialog .el-date-picker,
  .tank-form-dialog .el-input-number .el-input__wrapper {
    min-height: 46px;
    border-radius: 8px;
  }
  
  .tank-form-dialog .el-button {
    min-height: 46px;
    font-size: 15px;
  }
}

/* Floating Breeding Notifications */
.breeding-notifications-floating {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  animation: slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Compact Notification */
.notification-compact {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  box-shadow: 
    0 8px 16px rgba(245, 158, 11, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid rgba(245, 158, 11, 0.3);
  animation: gentleBounce 3s ease-in-out infinite;
}

.notification-compact:hover {
  transform: scale(1.05);
  box-shadow: 
    0 12px 24px rgba(245, 158, 11, 0.3),
    0 6px 12px rgba(0, 0, 0, 0.15);
  border-color: rgba(245, 158, 11, 0.5);
}

@keyframes gentleBounce {
  0%, 100% { 
    transform: translateY(0px);
  }
  50% { 
    transform: translateY(-2px);
  }
}

.compact-bell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  gap: 8px;
  position: relative;
}

.bell-icon {
  color: #f59e0b;
  font-size: 20px;
  animation: ringBell 2s ease-in-out infinite;
}

.compact-count {
  background: #dc2626;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
  position: absolute;
  top: 6px;
  right: 6px;
  animation: pulse 2s infinite;
  box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-container {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 16px;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04),
    0 0 0 1px rgba(245, 158, 11, 0.1);
  min-width: 380px;
  max-width: 420px;
  overflow: hidden;
  animation: breatheNotification 4s ease-in-out infinite;
}

@keyframes breatheNotification {
  0%, 100% { 
    box-shadow: 
      0 20px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04),
      0 0 0 1px rgba(245, 158, 11, 0.1);
  }
  50% { 
    box-shadow: 
      0 25px 30px -5px rgba(245, 158, 11, 0.15),
      0 15px 15px -5px rgba(245, 158, 11, 0.08),
      0 0 0 1px rgba(245, 158, 11, 0.2);
  }
}

.notification-header {
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(245, 158, 11, 0.2);
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #92400e;
  font-size: 15px;
}

.notification-icon {
  color: #f59e0b;
  font-size: 16px;
  animation: ringBell 2s ease-in-out infinite;
}

@keyframes ringBell {
  0%, 100% { transform: rotate(0deg); }
  10%, 30% { transform: rotate(-15deg); }
  20%, 40% { transform: rotate(15deg); }
  50% { transform: rotate(0deg); }
}

.notification-count {
  background: #f59e0b;
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
  animation: pulse 2s infinite;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.collapse-btn,
.dismiss-btn {
  color: #92400e;
  opacity: 0.7;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.collapse-btn:hover,
.dismiss-btn:hover {
  opacity: 1;
  background: rgba(245, 158, 11, 0.1);
}

.notification-content {
  padding: 8px 0;
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid rgba(245, 158, 11, 0.1);
  animation: slideInItem 0.5s ease-out both;
  position: relative;
}

@keyframes slideInItem {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item:hover {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.05), rgba(245, 158, 11, 0.02));
  transform: translateX(-2px);
  border-left: 3px solid #f59e0b;
  padding-left: 17px;
}

.notification-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  transition: width 0.3s ease;
}

.notification-item:hover::before {
  width: 3px;
}

/* Tank Avatar */
.tank-avatar {
  flex-shrink: 0;
}

.tank-thumb {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid #f3f4f6;
  transition: all 0.3s ease;
}

.tank-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tank-thumb-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  border: 2px solid #e5e7eb;
}

.notification-item:hover .tank-thumb {
  border-color: #f59e0b;
  transform: scale(1.05);
}

.notification-item:hover .tank-thumb-placeholder {
  border-color: #f59e0b;
  color: #f59e0b;
  transform: scale(1.05);
}

/* Tank Details */
.tank-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tank-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tank-name {
  font-weight: 700;
  color: #1f2937;
  font-size: 15px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.urgency-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}

.urgency-badge.overdue {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.urgency-badge.urgent {
  background: #fff7ed;
  color: #ea580c;
  border: 1px solid #fed7aa;
}

.urgency-badge.warning {
  background: #fefce8;
  color: #ca8a04;
  border: 1px solid #fef3c7;
}

.urgency-badge.normal {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

/* Tank Meta */
.tank-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.meta-icon {
  font-size: 12px;
  color: #9ca3af;
  flex-shrink: 0;
}

.meta-item .no-data {
  font-style: italic;
  color: #9ca3af;
}

/* Next Breeding */
.next-breeding {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: rgba(245, 158, 11, 0.08);
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.breeding-icon {
  font-size: 12px;
  color: #f59e0b;
  animation: gentlePulse 2s ease-in-out infinite;
}

@keyframes gentlePulse {
  0%, 100% { 
    opacity: 1;
    transform: scale(1);
  }
  50% { 
    opacity: 0.7;
    transform: scale(1.1);
  }
}

/* Notification Actions */
.notification-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 8px;
}

.arrow-icon {
  color: #9ca3af;
  font-size: 16px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.notification-item:hover .arrow-icon {
  color: #f59e0b;
  transform: translateX(4px);
  opacity: 1;
}

.more-tanks {
  padding: 12px 20px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
  font-style: italic;
  border-top: 1px solid rgba(245, 158, 11, 0.1);
  background: rgba(245, 158, 11, 0.02);
}

/* Tank Card Breeding Styles */
.tank-card.breeding-soon {
  border: 2px solid #f59e0b;
  box-shadow: 0 8px 25px rgba(245, 158, 11, 0.15);
  position: relative;
  animation: breathe 3s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { 
    box-shadow: 0 8px 25px rgba(245, 158, 11, 0.15);
  }
  50% { 
    box-shadow: 0 12px 30px rgba(245, 158, 11, 0.25);
    transform: translateY(-2px);
  }
}

.breeding-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  padding: 6px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  z-index: 10;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 1;
  }
  50% { 
    transform: scale(1.05);
    opacity: 0.9;
  }
}

.breeding-badge .el-icon {
  font-size: 12px;
}

.breeding-info {
  margin-top: 4px;
}

.breeding-info small {
  color: #f59e0b;
  font-weight: 600;
  background: rgba(245, 158, 11, 0.1);
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 11px;
}

/* Mobile Responsive for Floating Notifications */
@media (max-width: 768px) {
  .breeding-notifications-floating {
    top: 10px;
    right: 10px;
    left: 10px;
    animation: slideInDown 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .notification-compact {
    border-radius: 30px;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
  }
  
  .compact-bell {
    padding: 10px 14px;
  }
  
  .bell-icon {
    font-size: 18px;
  }
  
  .compact-count {
    font-size: 11px;
    padding: 1px 6px;
    top: 4px;
    right: 4px;
  }

  @keyframes slideInDown {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .notification-container {
    min-width: auto;
    max-width: none;
    width: 100%;
  }
  
  .notification-header {
    padding: 14px 16px;
  }
  
  .notification-title {
    font-size: 14px;
  }
  
  .notification-item {
    padding: 12px 16px;
    gap: 10px;
  }
  
  .tank-thumb,
  .tank-thumb-placeholder {
    width: 40px;
    height: 40px;
  }
  
  .tank-name {
    font-size: 13px;
  }
  
  .urgency-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .meta-item {
    font-size: 11px;
  }
  
  .next-breeding {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .arrow-icon {
    font-size: 14px;
  }
  
  .breeding-badge {
    top: -6px;
    right: -6px;
    padding: 4px 6px;
    font-size: 10px;
  }
  
  .breeding-info small {
    font-size: 10px;
  }
}

@media (max-width: 480px) {
  .breeding-notifications-floating {
    top: 12px;
    right: 12px;
    left: auto;
    width: auto;
  }
  
  .notification-compact {
    border-radius: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 
      0 6px 20px rgba(102, 126, 234, 0.4),
      0 2px 8px rgba(0, 0, 0, 0.15);
    min-width: 50px;
    min-height: 50px;
    transform: none;
    left: auto;
    right: auto;
  }
  
  .notification-compact:hover {
    transform: scale(1.08);
    box-shadow: 
      0 8px 25px rgba(102, 126, 234, 0.5),
      0 4px 12px rgba(0, 0, 0, 0.2);
  }
  
  .compact-bell {
    padding: 12px;
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .bell-icon {
    font-size: 20px;
    color: white;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  
  .compact-count {
    font-size: 11px;
    font-weight: 800;
    padding: 3px 6px;
    background: linear-gradient(135deg, #ff6b6b, #ee5a24);
    border: 2px solid white;
    box-shadow: 
      0 2px 8px rgba(238, 90, 36, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.2);
    top: -4px;
    right: -4px;
    min-width: 20px;
    border-radius: 12px;
  }
  
  .notification-container {
    border-radius: 12px;
    box-shadow: 
      0 8px 25px rgba(102, 126, 234, 0.2),
      0 4px 12px rgba(0, 0, 0, 0.1);
    margin-top: 8px;
    margin-right: -30px;
  }
  
  .notification-header {
    padding: 12px 14px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }
  
  .notification-title {
    font-size: 13px;
    gap: 6px;
    color: white;
  }
  
  .notification-icon {
    color: white;
  }
  
  .notification-count {
    font-size: 10px;
    padding: 1px 5px;
    min-width: 16px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .collapse-btn,
  .dismiss-btn {
    color: white;
    opacity: 0.9;
  }
  
  .collapse-btn:hover,
  .dismiss-btn:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .notification-item {
    padding: 10px 14px;
    gap: 8px;
  }
  
  .tank-thumb,
  .tank-thumb-placeholder {
    width: 36px;
    height: 36px;
  }
  
  .tank-details {
    gap: 4px;
  }
  
  .tank-name {
    font-size: 12px;
  }
  
  .urgency-badge {
    font-size: 9px;
    padding: 2px 5px;
  }
  
  .meta-item {
    font-size: 10px;
  }
  
  .next-breeding {
    font-size: 10px;
    padding: 3px 6px;
  }
  
  .notification-actions {
    margin-top: 4px;
  }
  
  .arrow-icon {
    font-size: 12px;
  }
  
  .more-tanks {
    padding: 10px 14px;
    font-size: 11px;
  }
}
</style>
