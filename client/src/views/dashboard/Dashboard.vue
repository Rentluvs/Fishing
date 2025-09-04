<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Dashboard</h1>
      <p>Chào mừng bạn trở lại, {{ authStore.user?.fullName || authStore.user?.username }}!</p>
    </div>
    
    <!-- Enhanced Stats Cards with Quick Actions -->
    <div class="stats-grid">
      <div class="stats-card" @click="openQuickAddTank">
        <div class="stats-icon tank">
          <el-icon><Box /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ dashboardStats.totalTanks }}</h3>
          <p>Hồ cá</p>
        </div>
        <div class="stats-action">
          <el-icon class="action-plus"><Plus /></el-icon>
        </div>
      </div>
      
      <div class="stats-card" @click="openQuickAddBatch">
        <div class="stats-icon batch">
          <el-icon><List /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ dashboardStats.totalBatches }}</h3>
          <p>Lứa cá</p>
        </div>
        <div class="stats-action">
          <el-icon class="action-plus"><Plus /></el-icon>
        </div>
      </div>
      
      <div class="stats-card" @click="openQuickAddEnvironment">
        <div class="stats-icon fish">
          <el-icon><Food /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ dashboardStats.totalFish }}</h3>
          <p>Tổng số cá</p>
          <small class="stats-subtitle">Nhật ký môi trường</small>
        </div>
        <div class="stats-action">
          <el-icon class="action-plus"><Plus /></el-icon>
        </div>
      </div>
      
      <div class="stats-card" @click="openQuickAddExpense">
        <div class="stats-icon expense">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stats-content">
          <h3>{{ formatCurrency(dashboardStats.totalExpenses) }}</h3>
          <p>Chi phí tháng này</p>
        </div>
        <div class="stats-action">
          <el-icon class="action-plus"><Plus /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- Breeding Notifications (Dashboard) -->
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
    

    <!-- Recent Activities -->
    <div class="dashboard-section">
      <div class="section-grid">
        <!-- Recent Tanks -->
        <div class="section-card">
          <div class="section-header-enhanced">
            <div class="section-title-group">
              <h2>Hồ cá nổi bật</h2>
              <p class="section-subtitle">Được sắp xếp theo mức độ hoạt động và thông tin</p>
            </div>
            <el-button 
              type="text" 
              @click="$router.push('/tanks')"
              class="view-all-btn"
            >
              Xem tất cả
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div v-if="loading" class="loading">
            <el-skeleton :rows="3" />
          </div>
          <div v-else-if="recentTanks.length === 0" class="empty-state">
            <p>Chưa có hồ cá nào</p>
            <el-button type="primary" @click="$router.push('/tanks')">
              Tạo hồ cá đầu tiên
            </el-button>
          </div>
          <div v-else class="recent-list">
            <div 
              v-for="tank in recentTanks" 
              :key="tank.id" 
              class="recent-item"
              @click="$router.push(`/tanks/${tank.id}`)"
            >
              <div 
                v-if="tank.latest_photo" 
                class="item-image-full image-container"
                @click.stop="openImageViewer(tank.latest_photo)"
              >
                <img :src="tank.latest_photo" alt="Tank photo" class="tank-image-full professional-image" />
                <div class="image-overlay">
                  <el-icon class="zoom-icon overlay-action"><ZoomIn /></el-icon>
                </div>
              </div>
              <div 
                v-else
                class="item-image-full item-image-full--placeholder image-placeholder"
              >
                <el-icon class="placeholder-icon"><Picture /></el-icon>
                <span class="placeholder-text">Không có ảnh</span>
              </div>
              
              <div class="item-content">
                <div class="item-header">
                  <div class="tank-title-section">
                <h4>{{ tank.name }}</h4>
                    <div class="tank-status-indicators">
                      <span v-if="tank.latest_photo" class="status-dot status-dot--photo" title="Có ảnh"></span>
                      <span v-if="(tank.total_fish || 0) > 0" class="status-dot status-dot--active" title="Có cá"></span>
                      <span v-if="tank.spawn_date" class="status-dot status-dot--breeding" title="Đang sinh sản"></span>
              </div>
                  </div>
                </div>
                
                <div class="tank-metadata">
                  <div class="metadata-row">
                    <span class="metadata-label">Loại cá: </span>
                    <span class="metadata-value">{{ tank.fish_type || 'Chưa xác định' }}</span>
                  </div>
                  <div class="metadata-row" v-if="tank.spawn_date">
                    <span class="metadata-label">Ngày đẻ: </span>
                    <span class="metadata-value">{{ formatDate(tank.spawn_date) }}</span>
                  </div>
                  <div class="metadata-row">
                    <span class="metadata-label">Nhiệt độ: </span>
                    <span class="metadata-value">{{ tank.current_temperature ? `${tank.current_temperature}°C` : '--' }}</span>
                  </div>
                </div>
                
              <div class="item-stats">
                  <span class="stat-badge stat-badge--primary">
                    <el-icon><Collection /></el-icon>
                    {{ tank.batch_count || 0 }} lứa cá
                  </span>
                  <span class="stat-badge stat-badge--success">
                    <el-icon><Food /></el-icon>
                    {{ tank.total_fish || 0 }} con cá
                  </span>
                  <span v-if="tank.current_temperature" class="stat-badge stat-badge--info">
                    <el-icon><Sunny /></el-icon>
                    {{ tank.current_temperature }}°C
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Environment Reminders -->
        <div class="section-card">
          <h2>Nhắc nhở môi trường</h2>
          <div v-if="loading" class="loading">
            <el-skeleton :rows="3" />
          </div>
          <div v-else-if="reminders.length === 0" class="empty-state">
            <p>Không có nhắc nhở nào</p>
          </div>
          <div v-else class="reminder-list">
            <div 
              v-for="reminder in reminders" 
              :key="reminder.id"
              class="reminder-item"
              :class="{ 'overdue': isOverdue(reminder.reminder_date) }"
            >
              <div class="reminder-layout">
                <div class="reminder-left">
                  <div class="reminder-icon">
                    <el-icon size="18" :class="isOverdue(reminder.reminder_date) ? 'icon-overdue' : 'icon-normal'">
                      <Warning v-if="isOverdue(reminder.reminder_date)" />
                      <Bell v-else />
                    </el-icon>
                  </div>
              <div class="reminder-content">
                <div class="reminder-title-section">
                <h4>{{ getActivityTypeName(reminder.activity_type) }}</h4>
                  <div class="reminder-meta-tags">
                    <span v-if="reminder.tank_name" class="meta-tag tank-tag">
                      <el-icon><Box /></el-icon>
                      {{ reminder.tank_name }}
                    </span>
                    <span v-if="reminder.batch_name" class="meta-tag batch-tag">
                      <el-icon><Collection /></el-icon>
                      {{ reminder.batch_name }}
                    </span>
                  </div>
                </div>
                <p>{{ reminder.notes || 'Không có ghi chú' }}</p>
                <div class="reminder-footer">
                  <small class="reminder-date">{{ formatDate(reminder.reminder_date) }}</small>
                  <small v-if="reminder.tank_name || reminder.batch_name" class="reminder-context">
                    {{ getContextText(reminder) }}
                  </small>
                </div>
              </div>
                </div>
                <div class="reminder-right">
              <el-button 
                size="small" 
                @click="markReminderCompleted(reminder.id)"
                    type="danger"
                    class="reminder-btn"
              >
                    <el-icon><Check /></el-icon>
                Hoàn thành
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
      </div>
    </div>
    
    <!-- Image Viewer Dialog -->
    <el-dialog 
      v-model="showImageViewer" 
      title="Xem ảnh hồ cá" 
      width="80%" 
      center
      class="image-viewer-dialog"
    >
      <div class="image-viewer-content">
        <img 
          v-if="currentImageSrc" 
          :src="currentImageSrc" 
          alt="Tank photo"
          class="viewer-image"
        />
      </div>
      
      <template #footer>
        <el-button @click="showImageViewer = false">Đóng</el-button>
      </template>
    </el-dialog>

    <!-- Quick Tank Form Modal -->
    <el-dialog 
      v-model="showQuickTankForm" 
      title="Thêm hồ cá mới" 
      width="500px"
      class="quick-form-dialog"
    >
      <el-form :model="quickTankForm" :rules="quickTankRules" ref="quickTankFormRef" label-width="120px">
        <el-form-item label="Tên hồ" prop="name">
          <el-input v-model="quickTankForm.name" placeholder="Nhập tên hồ cá" />
        </el-form-item>
        <el-form-item label="Loại cá" prop="fish_type">
          <el-input v-model="quickTankForm.fish_type" placeholder="Nhập loại cá" />
        </el-form-item>
        <el-form-item label="Dung tích (L)" prop="capacity">
          <el-input-number v-model="quickTankForm.capacity" :min="1" placeholder="Dung tích" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickTankForm = false">Hủy</el-button>
        <el-button type="primary" @click="createQuickTank" :loading="creating">Tạo</el-button>
      </template>
    </el-dialog>

    <!-- Quick Batch Form Modal -->
    <el-dialog 
      v-model="showQuickBatchForm" 
      title="Thêm lứa cá mới" 
      width="500px"
      class="quick-form-dialog"
    >
      <el-form :model="quickBatchForm" :rules="quickBatchRules" ref="quickBatchFormRef" label-width="120px">
        <el-form-item label="Tên lứa cá">
          <el-input v-model="quickBatchForm.batch_name" placeholder="Nhập tên lứa cá (tùy chọn)" />
        </el-form-item>
        <el-form-item label="Hồ cá">
          <el-select v-model="quickBatchForm.tank_id" placeholder="Chọn hồ cá hoặc để trống" style="width: 100%" clearable>
            <el-option label="🐟 Không thuộc hồ nào" value="" />
            <el-option v-for="tank in tanks" :key="tank.id" :label="`🏞️ ${tank.name}`" :value="tank.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Ngày đẻ" prop="spawn_date">
          <el-date-picker v-model="quickBatchForm.spawn_date" type="date" placeholder="Chọn ngày đẻ" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Số lượng cá bột" prop="initial_count">
          <el-input-number v-model="quickBatchForm.initial_count" :min="1" placeholder="Số lượng" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Chủng loại">
          <el-input v-model="quickBatchForm.fish_species" placeholder="Nhập chủng loại cá" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickBatchForm = false">Hủy</el-button>
        <el-button type="primary" @click="createQuickBatch" :loading="creating">Tạo</el-button>
      </template>
    </el-dialog>

    <!-- Quick Environment Form Modal -->
    <el-dialog 
      v-model="showQuickEnvironmentForm" 
      title="Ghi nhật ký môi trường" 
      width="500px"
      class="quick-form-dialog"
    >
      <el-form :model="quickEnvironmentForm" :rules="quickEnvironmentRules" ref="quickEnvironmentFormRef" label-width="140px">
        <el-form-item label="Hồ cá" prop="tank_id">
          <el-select v-model="quickEnvironmentForm.tank_id" placeholder="Chọn hồ cá" style="width: 100%">
            <el-option v-for="tank in tanks" :key="tank.id" :label="`🏞️ ${tank.name}`" :value="tank.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Loại hoạt động" prop="activity_type">
          <el-select v-model="quickEnvironmentForm.activity_type" placeholder="Chọn loại hoạt động" style="width: 100%">
            <el-option label="Thay nước" value="water_change" />
            <el-option label="Vệ sinh hồ" value="cleaning" />
            <el-option label="Kiểm tra pH" value="ph_test" />
            <el-option label="Cho ăn" value="feeding" />
            <el-option label="Dùng thuốc" value="medication" />
            <el-option label="Khác" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Nhiệt độ (°C)">
          <el-input-number v-model="quickEnvironmentForm.temperature" :min="15" :max="35" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="pH">
          <el-input-number v-model="quickEnvironmentForm.ph_level" :min="5" :max="9" :precision="1" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickEnvironmentForm = false">Hủy</el-button>
        <el-button type="primary" @click="createQuickEnvironment" :loading="creating">Lưu</el-button>
      </template>
    </el-dialog>

    <!-- Quick Expense Form Modal -->
    <el-dialog 
      v-model="showQuickExpenseForm" 
      title="Thêm chi phí" 
      width="500px"
      class="quick-form-dialog"
    >
      <el-form :model="quickExpenseForm" :rules="quickExpenseRules" ref="quickExpenseFormRef" label-width="120px">
        <el-form-item label="Danh mục" prop="category">
          <el-select v-model="quickExpenseForm.category" placeholder="Chọn danh mục" style="width: 100%">
            <el-option label="Thức ăn" value="food" />
            <el-option label="Thuốc" value="medicine" />
            <el-option label="Thiết bị" value="equipment" />
            <el-option label="Điện" value="electricity" />
            <el-option label="Nước" value="water" />
            <el-option label="Khác" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="Số tiền" prop="amount">
          <el-input-number v-model="quickExpenseForm.amount" :min="0" :precision="0" placeholder="Số tiền" style="width: 100%" />
        </el-form-item>
        <el-form-item label="Hồ cá">
          <el-select v-model="quickExpenseForm.tank_id" placeholder="Chọn hồ cá (tùy chọn)" style="width: 100%" clearable>
            <el-option v-for="tank in tanks" :key="tank.id" :label="`🏞️ ${tank.name}`" :value="tank.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="Mô tả">
          <el-input v-model="quickExpenseForm.description" type="textarea" placeholder="Mô tả chi phí" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showQuickExpenseForm = false">Hủy</el-button>
        <el-button type="primary" @click="createQuickExpense" :loading="creating">Thêm</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTanksStore } from '@/stores/tanks'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { Picture, Warning, Bell, Check, ZoomIn, Collection, Food, ArrowDown, Box, List, Sunny, Money, ArrowRight, Close, Calendar, Fish, Plus } from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  components: {
    Picture,
    Warning,
    Bell,
    Check,
    ZoomIn,
    Collection,
    Food,
    ArrowDown,
    Box,
    List,
    Sunny,
    Money,
    ArrowRight,
    Close,
    Calendar,
    Fish,
    Plus
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const tanksStore = useTanksStore()
    
    const loading = ref(true)
    
    // Quick action modals
    const showQuickTankForm = ref(false)
    const showQuickBatchForm = ref(false)
    const showQuickEnvironmentForm = ref(false)
    const showQuickExpenseForm = ref(false)
    
    const dashboardStats = reactive({
      totalTanks: 0,
      totalBatches: 0,
      totalFish: 0,
      totalExpenses: 0
    })
    
    const recentTanks = ref([])
    const tanks = ref([])
    const reminders = ref([])
    const showImageViewer = ref(false)
    const currentImageSrc = ref('')
    const creating = ref(false)
    const environmentLogsCount = ref(0)
    const showBreedingNotifications = ref(true)
    const notificationExpanded = ref(false)

    // Quick form refs
    const quickTankFormRef = ref()
    const quickBatchFormRef = ref()
    const quickEnvironmentFormRef = ref()
    const quickExpenseFormRef = ref()

    // Quick form data
    const quickTankForm = reactive({
      name: '',
      fish_type: '',
      capacity: 100
    })

    const quickBatchForm = reactive({
      batch_name: '',
      tank_id: '',
      spawn_date: '',
      initial_count: 100,
      fish_species: ''
    })

    const quickEnvironmentForm = reactive({
      tank_id: '',
      activity_type: '',
      temperature: 25,
      ph_level: 7.0,
      log_date: new Date().toISOString().split('T')[0]
    })

    const quickExpenseForm = reactive({
      category: '',
      amount: 0,
      tank_id: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    })

    // Validation rules
    const quickTankRules = {
      name: [{ required: true, message: 'Vui lòng nhập tên hồ cá', trigger: 'blur' }]
    }

    const quickBatchRules = {
      spawn_date: [{ required: true, message: 'Vui lòng chọn ngày đẻ', trigger: 'change' }],
      initial_count: [{ required: true, message: 'Vui lòng nhập số lượng cá bột', trigger: 'blur' }]
    }

    const quickEnvironmentRules = {
      tank_id: [{ required: true, message: 'Vui lòng chọn hồ cá', trigger: 'change' }],
      activity_type: [{ required: true, message: 'Vui lòng chọn loại hoạt động', trigger: 'change' }]
    }

    const quickExpenseRules = {
      category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
      amount: [{ required: true, message: 'Vui lòng nhập số tiền', trigger: 'blur' }]
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount || 0)
    }

    const formatCompactCurrency = (amount) => {
      if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`
      } else if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`
      }
      return amount ? amount.toString() : '0'
    }
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }

    const activityTypeNames = {
      'water_change': 'Thay nước',
      'cleaning': 'Vệ sinh hồ',
      'ph_test': 'Kiểm tra pH',
      'feeding': 'Cho ăn',
      'medication': 'Dùng thuốc',
      'other': 'Khác'
    }

    const getActivityTypeName = (type) => activityTypeNames[type] || type
    
    const getContextText = (reminder) => {
      const parts = []
      if (reminder.tank_name && reminder.batch_name) {
        parts.push(`Hồ: ${reminder.tank_name}`)
        parts.push(`Lứa: ${reminder.batch_name}`)
      } else if (reminder.tank_name) {
        parts.push(`Áp dụng cho hồ: ${reminder.tank_name}`)
      } else if (reminder.batch_name) {
        parts.push(`Áp dụng cho lứa: ${reminder.batch_name}`)
      }
      return parts.join(' • ')
    }
    
    const isOverdue = (dateStr) => {
      return new Date(dateStr) < new Date()
    }
    
    const loadDashboardData = async () => {
      try {
        loading.value = true
        
        // Load tanks
        await tanksStore.fetchTanks()
        tanks.value = tanksStore.tanks
        // Sort tanks by relevance and activity
        const sortedTanks = [...tanksStore.tanks]
          .sort((a, b) => {
            // Priority 1: Tanks with photos
            const aHasPhoto = a.latest_photo ? 1 : 0
            const bHasPhoto = b.latest_photo ? 1 : 0
            if (aHasPhoto !== bHasPhoto) return bHasPhoto - aHasPhoto
            
            // Priority 2: Tanks with fish (have activity)
            const aHasFish = (a.total_fish || 0) > 0 ? 1 : 0
            const bHasFish = (b.total_fish || 0) > 0 ? 1 : 0
            if (aHasFish !== bHasFish) return bHasFish - aHasFish
            
            // Priority 3: Tanks with spawn date (breeding activity)
            const aHasSpawn = a.spawn_date ? 1 : 0
            const bHasSpawn = b.spawn_date ? 1 : 0
            if (aHasSpawn !== bHasSpawn) return bHasSpawn - aHasSpawn
            
            // Priority 4: Most recent by creation date
            return new Date(b.created_at) - new Date(a.created_at)
          })
        
        recentTanks.value = sortedTanks.slice(0, 5)
        dashboardStats.totalTanks = tanksStore.tanks.length
        
        // Calculate total fish and batches
        dashboardStats.totalFish = tanksStore.tanks.reduce((sum, tank) => sum + (tank.total_fish || 0), 0)
        dashboardStats.totalBatches = tanksStore.tanks.reduce((sum, tank) => sum + (tank.batch_count || 0), 0)
        
        // Load reminders
        const remindersResponse = await axios.get('/environment/reminders')
        if (remindersResponse.data.success) {
          reminders.value = [
            ...remindersResponse.data.data.overdue,
            ...remindersResponse.data.data.today,
            ...remindersResponse.data.data.upcoming
          ].slice(0, 5)
        }
        
        // Load current month expenses
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const expensesResponse = await axios.get(`/expenses?year=${currentYear}&month=${currentMonth}`)
        if (expensesResponse.data.success) {
          dashboardStats.totalExpenses = expensesResponse.data.data.reduce((sum, expense) => sum + expense.amount, 0)
        }

        // Load environment logs count
        const envResponse = await axios.get('/environment')
        if (envResponse.data.success) {
          environmentLogsCount.value = envResponse.data.data.length
        }
        
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        ElMessage.error('Lỗi tải dữ liệu dashboard')
      } finally {
        loading.value = false
      }
    }
    
    const markReminderCompleted = async (reminderId) => {
      try {
        const response = await axios.put(`/environment/${reminderId}`, {
          completed: true
        })
        
        if (response.data.success) {
          reminders.value = reminders.value.filter(r => r.id !== reminderId)
          ElMessage.success('Đã đánh dấu hoàn thành')
        }
      } catch (error) {
        ElMessage.error('Lỗi cập nhật trạng thái')
      }
    }
    
    const openImageViewer = (imageSrc) => {
      currentImageSrc.value = imageSrc
      showImageViewer.value = true
    }
    
    const openQuickAddTank = () => {
      showQuickTankForm.value = true
    }
    
    const openQuickAddBatch = () => {
      showQuickBatchForm.value = true
    }
    
    const openQuickAddExpense = () => {
      showQuickExpenseForm.value = true
    }
    
    const openQuickAddEnvironment = () => {
      showQuickEnvironmentForm.value = true
    }



    // Quick create functions
    const createQuickTank = async () => {
      try {
        await quickTankFormRef.value.validate()
        creating.value = true
        
        const response = await axios.post('/tanks', quickTankForm)
        if (response.data.success) {
          ElMessage.success('Tạo hồ cá thành công!')
          showQuickTankForm.value = false
          // Reset form
          Object.keys(quickTankForm).forEach(key => {
            if (key === 'capacity') quickTankForm[key] = 100
            else quickTankForm[key] = ''
          })
          // Reload data
          loadDashboardData()
        }
      } catch (error) {
        console.error('Create tank error:', error)
        ElMessage.error(error.response?.data?.message || 'Lỗi tạo hồ cá')
      } finally {
        creating.value = false
      }
    }

    const createQuickBatch = async () => {
      try {
        await quickBatchFormRef.value.validate()
        creating.value = true
        
        // Prepare data
        const batchData = { ...quickBatchForm }
        if (batchData.tank_id === '') {
          delete batchData.tank_id
        }
        
        const response = await axios.post('/batches', batchData)
        if (response.data.success) {
          ElMessage.success('Tạo lứa cá thành công!')
          showQuickBatchForm.value = false
          // Reset form
          Object.keys(quickBatchForm).forEach(key => {
            if (key === 'initial_count') quickBatchForm[key] = 100
            else quickBatchForm[key] = ''
          })
          // Reload data
          loadDashboardData()
        }
      } catch (error) {
        console.error('Create batch error:', error)
        ElMessage.error(error.response?.data?.message || 'Lỗi tạo lứa cá')
      } finally {
        creating.value = false
      }
    }

    const createQuickEnvironment = async () => {
      try {
        await quickEnvironmentFormRef.value.validate()
        creating.value = true
        
        const response = await axios.post('/environment', quickEnvironmentForm)
        if (response.data.success) {
          ElMessage.success('Lưu nhật ký môi trường thành công!')
          showQuickEnvironmentForm.value = false
          // Reset form
          Object.keys(quickEnvironmentForm).forEach(key => {
            if (key === 'temperature') quickEnvironmentForm[key] = 25
            else if (key === 'ph_level') quickEnvironmentForm[key] = 7.0
            else if (key === 'log_date') quickEnvironmentForm[key] = new Date().toISOString().split('T')[0]
            else quickEnvironmentForm[key] = ''
          })
          // Reload data
          loadDashboardData()
        }
      } catch (error) {
        console.error('Create environment error:', error)
        ElMessage.error(error.response?.data?.message || 'Lỗi lưu nhật ký môi trường')
      } finally {
        creating.value = false
      }
    }

    const createQuickExpense = async () => {
      try {
        await quickExpenseFormRef.value.validate()
        creating.value = true
        
        const response = await axios.post('/expenses', quickExpenseForm)
        if (response.data.success) {
          ElMessage.success('Thêm chi phí thành công!')
          showQuickExpenseForm.value = false
          // Reset form
          Object.keys(quickExpenseForm).forEach(key => {
            if (key === 'amount') quickExpenseForm[key] = 0
            else if (key === 'expense_date') quickExpenseForm[key] = new Date().toISOString().split('T')[0]
            else quickExpenseForm[key] = ''
          })
          // Reload data
          loadDashboardData()
        }
      } catch (error) {
        console.error('Create expense error:', error)
        ElMessage.error(error.response?.data?.message || 'Lỗi thêm chi phí')
      } finally {
        creating.value = false
      }
    }

    // Keyboard shortcuts handler
    const handleKeydown = (event) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 't':
            event.preventDefault()
            openQuickAddTank()
            break
          case 'b':
            event.preventDefault() 
            openQuickAddBatch()
            break
          case 'e':
            event.preventDefault()
            openQuickAddEnvironment()
            break
          case 'm':
            event.preventDefault()
            openQuickAddExpense()
            break
        }
      }
    }
    
    onMounted(() => {
      loadDashboardData()
      document.addEventListener('keydown', handleKeydown)
    })

    // Breeding logic (same as TankList)
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

    const breedingSoonTanks = computed(() => {
      return recentTanks.value.filter(tank => isBreedingSoon(tank))
    })

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

    onUnmounted(() => {
      document.removeEventListener('keydown', handleKeydown)
    })
    
    return {
      authStore,
      loading,
      dashboardStats,
      recentTanks,
      tanks,
      reminders,
      showImageViewer,
      currentImageSrc,
      creating,
      environmentLogsCount,
      // Quick modal states
      showQuickTankForm,
      showQuickBatchForm,
      showQuickEnvironmentForm,
      showQuickExpenseForm,
      // Quick form refs
      quickTankFormRef,
      quickBatchFormRef,
      quickEnvironmentFormRef,
      quickExpenseFormRef,
      // Quick form data
      quickTankForm,
      quickBatchForm,
      quickEnvironmentForm,
      quickExpenseForm,
      // Quick form rules
      quickTankRules,
      quickBatchRules,
      quickEnvironmentRules,
      quickExpenseRules,
      // Functions
      formatCurrency,
      formatCompactCurrency,
      formatDate,
      getActivityTypeName,
      getContextText,
      isOverdue,
      markReminderCompleted,
      openImageViewer,
      openQuickAddTank,
      openQuickAddBatch,
      openQuickAddExpense,
      openQuickAddEnvironment,
      createQuickTank,
      createQuickBatch,
      createQuickEnvironment,
      createQuickExpense,
      // Breeding functions
      breedingSoonTanks,
      isBreedingSoon,
      getDaysUntilBreeding,
      getNextBreedingDate,
      getUrgencyClass,
      showBreedingNotifications,
      notificationExpanded,
      dismissBreedingNotifications,
      toggleNotificationExpansion,
      goToTankDetail
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: calc(100vh - 64px);
  animation: fadeInUp 0.6s ease-out;
}

.dashboard-header {
  margin-bottom: 48px;
  text-align: center;
  position: relative;
  padding: 40px 0;
}

.dashboard-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
  border-radius: 2px;
  animation: slideInDown 0.8s ease-out;
}

.dashboard-header h1 {
  font-size: 42px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f2937, #374151, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  animation: slideInDown 0.6s ease-out 0.2s both;
}

.dashboard-header p {
  font-size: 18px;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
  opacity: 0.9;
  animation: slideInDown 0.6s ease-out 0.4s both;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
  margin-bottom: 56px;
}

.stats-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #f3f4f6;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stats-card:nth-child(1)::before { background: linear-gradient(90deg, #667eea, #764ba2); }
.stats-card:nth-child(2)::before { background: linear-gradient(90deg, #f093fb, #f5576c); }
.stats-card:nth-child(3)::before { background: linear-gradient(90deg, #4facfe, #00f2fe); }
.stats-card:nth-child(4)::before { background: linear-gradient(90deg, #43e97b, #38f9d7); }

.stats-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}

.stats-card:hover::before {
  opacity: 1;
}

.stats-card:hover .stats-icon {
  transform: scale(1.1) rotate(5deg);
  animation: gentlePulse 2s ease-in-out infinite;
}

.stats-card:hover .stats-content h3 {
  transform: scale(1.05);
}

.stats-icon {
  width: 50px;
  height: 50px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24px;
  font-size: 32px;
  color: white;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stats-icon::after {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: inherit;
  border-radius: 22px;
  opacity: 0.3;
  filter: blur(8px);
  z-index: -1;
}

.stats-icon.tank { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.stats-icon.batch { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.stats-icon.fish { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.stats-icon.expense { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stats-content h3 {
  margin: 0 0 8px 0;
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #1f2937, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
  line-height: 1.2;
}

.stats-content p {
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.8;
}

.stats-subtitle {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
  margin-top: 4px;
  font-style: italic;
  text-transform: none;
}

/* Stats Action Button */
.stats-action {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: scale(0.8) translateY(-10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.stats-card:hover .stats-action {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.action-plus {
  color: white;
  font-size: 18px;
  font-weight: bold;
  transition: transform 0.2s ease;
}

.stats-action:hover .action-plus {
  transform: rotate(90deg) scale(1.1);
}

.dashboard-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Specific styling for quick actions section */
.dashboard-section:has(.compact-actions) {
  padding: 20px 24px;
}

.dashboard-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
  opacity: 0.7;
}

.dashboard-section:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
}

.dashboard-section h2 {
  margin: 0 0 24px 0;
  color: #1f2937;
  font-size: 24px;
  font-weight: 700;
  position: relative;
  padding-left: 16px;
}

.dashboard-section h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 2px;
}

/* Section Header for Collapsible */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  padding: 8px 0;
  border-radius: 8px;
  margin: -8px 0 16px 0;
  border-left: 4px solid #6366f1;
  padding-left: 16px;
}

.section-header:hover {
  background: rgba(99, 102, 241, 0.05);
  transform: translateX(4px);
}

.section-header h2 {
  margin: 0;
  transition: color 0.3s ease;
}

.section-header:hover h2 {
  color: #6366f1;
}

.toggle-icon {
  font-size: 20px;
  color: #6b7280;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 4px;
}

.toggle-icon:hover {
  color: #6366f1;
  transform: scale(1.1);
}

.toggle-icon.rotated {
  transform: rotate(180deg);
  color: #6366f1;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.quick-actions .el-button {
  height: 56px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.quick-actions .el-button:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.15);
}

.quick-actions .el-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: width 0.3s ease, height 0.3s ease;
  transform: translate(-50%, -50%);
}

.quick-actions .el-button:active::before {
  width: 300px;
  height: 300px;
}

/* Beautiful Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 6px;
  margin: 8px 0;
  animation: slideInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.quick-action-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  min-height: 40px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.quick-action-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  transition: all 0.3s ease;
}

.quick-action-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border-color: transparent;
}

.quick-action-card:hover::before {
  height: 100%;
  opacity: 0.03;
}

.quick-action-card:active {
  transform: translateY(-2px) scale(1.01);
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  flex-shrink: 0;
  position: relative;
}

.tank-icon {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.batch-icon {
  background: linear-gradient(135deg, #10b981, #059669);
}

.env-icon {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.expense-icon {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-content h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.action-count {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.action-arrow {
  color: #9ca3af;
  font-size: 16px;
  transition: all 0.3s ease;
  opacity: 0.6;
}

.quick-action-card:hover .action-arrow {
  color: #374151;
  transform: translateX(4px);
  opacity: 1;
}

/* Card specific hover effects */
.quick-action-card:hover:nth-child(1)::before {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
}

.quick-action-card:hover:nth-child(2)::before {
  background: linear-gradient(135deg, #10b981, #059669);
}

.quick-action-card:hover:nth-child(3)::before {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.quick-action-card:hover:nth-child(4)::before {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
}

/* Icon pulse effect on hover */
.quick-action-card:hover .action-icon {
  animation: iconPulse 1s ease-in-out;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

/* Keep useful animations */

/* Enhanced section header */
.section-header {
  position: relative;
  overflow: hidden;
}

.section-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(99, 102, 241, 0.1),
    transparent
  );
  transition: left 0.5s;
}

.section-header:hover::after {
  left: 100%;
}

/* Focus management for accessibility */
.quick-action-card:focus {
  outline: 3px solid rgba(99, 102, 241, 0.5);
  outline-offset: 2px;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 32px;
}

.section-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 16px;
  padding: 24px;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.section-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #06b6d4, #10b981);
  opacity: 0.7;
}

.section-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.section-card h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
  position: relative;
  padding-left: 12px;
}

.section-card h2::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: linear-gradient(135deg, #06b6d4, #10b981);
  border-radius: 2px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.recent-list > *, .reminder-list > * {
  margin-bottom: 12px;
}

.recent-list > *:last-child, .reminder-list > *:last-child {
  margin-bottom: 0;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #eee;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 16px;
}

.recent-item:hover {
  background: white;
  border-color: #1890ff;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.item-info h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.item-info p {
  margin: 0 0 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.item-info small {
  color: #bbb;
  font-size: 12px;
}

.item-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.item-stats span {
  font-size: 12px;
  padding: 2px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  color: #666;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 12px;
}

.reminder-item.overdue {
  border-color: #f5222d;
  background: #fff2f0;
}

.reminder-content h4 {
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.reminder-content p {
  margin: 0 0 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.reminder-content small {
  color: #bbb;
  font-size: 12px;
}

.loading {
  padding: 20px 0;
}

/* Enhanced Mobile Responsive Styles */
@media (max-width: 768px) {
  .dashboard {
    padding: 20px;
    animation: fadeInUp 0.4s ease-out;
  }
  
  .dashboard-header {
    margin-bottom: 32px;
    padding: 24px 0;
  }
  
  .dashboard-header h1 {
    font-size: 32px;
  }
  
  .dashboard-header p {
    font-size: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 16px 12px;
    margin-bottom: 32px;
  }
  
  .stats-card {
    padding: 20px;
    border-radius: 16px;
    flex-direction: column;
    text-align: center;
    min-height: 140px;
    justify-content: center;
  }
  
  .stats-icon {
    width: 56px;
    height: 56px;
    font-size: 22px;
    margin-right: 0;
    margin-bottom: 12px;
    border-radius: 14px;
    align-self: center;
  }
  
  .stats-content {
    align-items: center;
  }
  
  .stats-content h3 {
    font-size: 24px;
    margin-bottom: 6px;
  }
  
  .stats-content p {
    font-size: 13px;
    text-align: center;
  }
  
  .dashboard-section {
    padding: 24px;
    margin-bottom: 24px;
    border-radius: 16px;
  }
  
  .dashboard-section h2 {
    font-size: 20px;
    margin-bottom: 20px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr 1fr;
    gap: 12px 10px;
  }
  
  .quick-actions .el-button {
    height: 50px;
    font-size: 14px;
    padding: 0 16px;
    border-radius: 12px;
  }
  
  /* Mobile responsive quick actions */
  .quick-actions-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin: 12px 0;
  }
  
  .quick-action-card {
    padding: 14px;
    border-radius: 12px;
    min-height: 65px;
    gap: 10px;
  }
  
  .action-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
  
  .action-content h4 {
    font-size: 14px;
  }
  
  .action-count {
    font-size: 12px;
  }
  
  .action-arrow {
    font-size: 14px;
  }
  
  .section-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .section-card {
    padding: 20px;
    border-radius: 12px;
  }
  
  .recent-item, .reminder-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
  }
  
  .item-stats {
    align-items: flex-start;
    flex-direction: row;
    gap: 12px;
    width: 100%;
  }
  
  .item-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 16px;
}

.item-text {
  flex: 1;
}

.item-stats {
  display: flex;
    gap: 8px;
  margin-top: 8px;
}

.item-stats span {
  background: #e8f4fd;
  color: #1976d2;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.item-image {
  flex-shrink: 0;
  margin-left: 16px;
}

.tank-image {
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.tank-image--placeholder {
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #9ca3af;
}

.tank-image:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  border-color: #3b82f6;
}

/* Reminder Items Styling */
.reminder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.reminder-item:hover {
  background: #f0f9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);
  border-color: #3b82f6;
}

.reminder-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-normal {
  background: #e1f5fe;
  color: #0288d1;
}

.icon-overdue {
  background: #ffebee;
  color: #f44336;
}

.reminder-content {
  flex: 1;
  min-width: 0;
}

.reminder-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.reminder-content h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 15px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reminder-meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.tank-tag {
  background: #e3f2fd;
  color: #1976d2;
}

.batch-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

.meta-tag .el-icon {
  font-size: 10px;
}

.reminder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  gap: 12px;
}

.reminder-date {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
}

.reminder-context {
  color: #6b7280;
  font-size: 11px;
  font-weight: 500;
  font-style: italic;
}

.reminder-content p {
  margin: 0 0 4px 0;
  color: #7f8c8d;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reminder-content small {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 500;
}

.reminder-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
}

/* New Dashboard Styles */

/* Recent Tanks Full Image Layout */
.recent-item {
  display: block !important;
  position: relative;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  border: 1px solid #f3f4f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  margin-bottom: 20px;
}

.recent-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  border-color: #3b82f6;
}

.item-image-full {
  width: 100%;
  height: 200px;
  position: relative;
  overflow: hidden;
  cursor: zoom-in;
}

.item-image-full--placeholder {
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: default;
}

.tank-image-full {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.item-image-full:hover .tank-image-full {
  transform: scale(1.05);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.item-image-full:hover .image-overlay {
  opacity: 1;
}

.zoom-icon {
  color: white;
  font-size: 24px;
}

.placeholder-icon {
  font-size: 48px;
  color: #9ca3af;
}

.placeholder-text {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.item-content {
  padding: 20px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.tank-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.tank-status-indicators {
  display: flex;
  gap: 6px;
  align-items: center;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-dot--photo {
  background: #3b82f6;
}

.status-dot--active {
  background: #10b981;
}

.status-dot--breeding {
  background: #f59e0b;
  animation: pulse 2s infinite;
}

.tank-metadata {
  margin-bottom: 16px;
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border-left: 3px solid #e2e8f0;
}

.metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.metadata-row:last-child {
  margin-bottom: 0;
}

.metadata-label {
  font-size: 8px;
  color: #6b7280;
  font-weight: 600;
  min-width: 80px;
}

.metadata-value {
  font-size: 12px;
  color: #374151;
  font-weight: 500;
  text-align: right;
}

.item-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.tank-id {
  background: #f3f4f6;
  color: #6b7280;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.tank-type {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 14px;
}

.tank-date {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 500;
}

.item-stats {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.stat-badge--primary {
  background: #dbeafe;
  color: #1d4ed8;
}

.stat-badge--success {
  background: #d1fae5;
  color: #059669;
}

.stat-badge--info {
  background: #e0f2fe;
  color: #0284c7;
}

.stat-badge .el-icon {
  font-size: 14px;
}

/* Enhanced Section Header */
.section-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f1f5f9;
}

.section-title-group h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.section-subtitle {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.view-all-btn {
  color: #3b82f6;
  font-weight: 600;
  font-size: 14px;
  padding: 8px 16px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.view-all-btn:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

/* Reminder Layout Updates */
.reminder-item {
  padding: 16px !important;
}

.reminder-layout {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.reminder-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.reminder-right {
  flex-shrink: 0;
  margin-left: 12px;
}

.reminder-btn {
  width: auto !important;
  height: 32px !important;
  padding: 0 12px !important;
  border-radius: 8px !important;
  font-size: 12px;
  font-weight: 600;
  gap: 6px;
}

/* Image Viewer Styles */
.image-viewer-dialog .el-dialog__body {
  padding: 20px;
}

.image-viewer-content {
  text-align: center;
}

.viewer-image {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}
}

/* Desktop Optimization Styles */
@media (min-width: 1024px) {
  .dashboard {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px;
  }
  
  .dashboard-header {
    margin-bottom: 48px;
    padding: 40px 0;
  }
  
  .dashboard-header h1 {
    font-size: 48px;
  }
  
  .dashboard-header p {
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
  
  .stats-content h3 {
    font-size: 36px;
  }
  
  .stats-content p {
    font-size: 16px;
  }
  
  .section-grid {
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }
  
  .dashboard-section,
  .section-card {
    padding: 32px;
    min-height: 100px;
  }
  
  .dashboard-section h2 {
    font-size: 24px;
    margin-bottom: 28px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .quick-actions .el-button {
    height: 100px;
    font-size: 16px;
    padding: 20px;
    border-radius: 16px;
  }
  
  /* Image size constraints for desktop */
  .tank-image-full,
  .recent-item .item-image-full img {
    max-width: 100%;
    max-height: 180px;
    object-fit: cover;
    border-radius: 12px;
  }
  
  .item-image-full {
    height: 180px;
    overflow: hidden;
    border-radius: 12px;
  }
  
  .recent-item {
    margin-bottom: 20px;
  }
  
  .reminder-item {
    padding: 20px 24px;
    margin-bottom: 16px;
  }
}

/* Tablet Optimization */
@media (min-width: 769px) and (max-width: 1023px) {
  .dashboard {
    padding: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  
  .stats-card {
    padding: 24px;
    min-height: 140px;
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 32px;
  }
  
  .quick-actions .el-button {
    height: 80px;
    font-size: 14px;
  }
  
  .section-grid {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
  
  .dashboard-section {
    padding: 24px;
    min-height: 350px;
  }
  
  /* Image constraints for tablet */
  .tank-image-full,
  .recent-item .item-image-full img {
    max-height: 140px;
    object-fit: cover;
  }
  
  .item-image-full {
    height: 140px;
  }
}

/* Mobile Responsive Base */
@media (max-width: 768px) {
  .dashboard {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 32px;
  }
  
  .quick-actions {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 32px;
  }
  
  .section-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

/* Extra Small Mobile Screens */
@media (max-width: 480px) {
  .dashboard {
    padding: 16px;
  }
  
  .dashboard-header {
    padding: 20px 0;
    margin-bottom: 24px;
  }
  
  .dashboard-header h1 {
    font-size: 28px;
  }
  
  .dashboard-header p {
    font-size: 15px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
    gap: 12px 8px;
    margin-bottom: 24px;
  }
  
  .stats-card {
    padding: 16px 12px;
    border-radius: 12px;
    flex-direction: column;
    text-align: center;
    min-height: 110px;
    justify-content: center;
  }
  
  .stats-icon {
    width: 44px;
    height: 44px;
    font-size: 16px;
    margin: 0 0 8px 0;
    border-radius: 10px;
    align-self: center;
  }
  
  .stats-content {
    align-items: center;
  }
  
  .stats-content h3 {
    font-size: 18px;
    margin-bottom: 2px;
    line-height: 1.2;
  }
  
  .stats-content p {
    font-size: 11px;
    text-align: center;
    line-height: 1.3;
  }
  
  .dashboard-section {
    padding: 18px;
    border-radius: 14px;
  }
  
  .dashboard-section h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr 1fr;
    gap: 10px 8px;
  }
  
  .quick-action-card {
    padding: 12px;
    min-height: 60px;
    gap: 8px;
  }
  
  .action-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
  
  .action-content h4 {
    font-size: 13px;
  }
  
  .action-count {
    font-size: 11px;
  }
  
  .quick-actions .el-button {
    height: 42px;
    font-size: 12px;
    padding: 0 8px;
    border-radius: 10px;
    line-height: 1.2;
  }
  
  .section-card {
    padding: 16px;
    border-radius: 10px;
  }
  
  .section-card h2 {
    font-size: 16px;
    margin-bottom: 16px;
  }
}

/* Very Small Screens (≤360px) */
@media (max-width: 360px) {
  .dashboard {
    padding: 12px;
  }
  
  .stats-grid {
    gap: 10px 6px;
  }
  
  .stats-card {
    padding: 14px 10px;
    min-height: 100px;
  }
  
  .stats-icon {
    width: 40px;
    height: 40px;
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .stats-content h3 {
    font-size: 16px;
  }
  
  .stats-content p {
    font-size: 10px;
  }
  
  .quick-actions-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px 6px;
  }
  
  .quick-action-card {
    padding: 10px;
    min-height: 55px;
    gap: 6px;
  }
  
  .action-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  
  .action-content h4 {
    font-size: 12px;
  }
  
  .action-count {
    font-size: 10px;
  }
  
  .quick-actions {
    gap: 8px 6px;
  }
  
  .quick-actions .el-button {
    height: 40px;
    font-size: 11px;
    padding: 0 6px;
    border-radius: 8px;
  }
  
  .dashboard-section {
    padding: 16px;
  }
}

/* Quick Form Dialog Styles */
.quick-form-dialog .el-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.quick-form-dialog .el-dialog__header {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  padding: 20px 24px;
}

.quick-form-dialog .el-dialog__title {
  color: white;
  font-weight: 600;
  font-size: 18px;
}

.quick-form-dialog .el-dialog__headerbtn .el-dialog__close {
  color: white;
  font-size: 18px;
}

.quick-form-dialog .el-dialog__body {
  padding: 24px;
}

.quick-form-dialog .el-form-item {
  margin-bottom: 20px;
}

.quick-form-dialog .el-input__wrapper,
.quick-form-dialog .el-select .el-input__wrapper,
.quick-form-dialog .el-date-picker .el-input__wrapper,
.quick-form-dialog .el-input-number .el-input__wrapper {
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
}

.quick-form-dialog .el-input__wrapper:hover,
.quick-form-dialog .el-select .el-input__wrapper:hover,
.quick-form-dialog .el-date-picker .el-input__wrapper:hover,
.quick-form-dialog .el-input-number .el-input__wrapper:hover {
  border-color: #d1d5db;
}

.quick-form-dialog .el-input__wrapper.is-focus,
.quick-form-dialog .el-select .el-input__wrapper.is-focus,
.quick-form-dialog .el-date-picker .el-input__wrapper.is-focus,
.quick-form-dialog .el-input-number .el-input__wrapper.is-focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.quick-form-dialog .el-dialog__footer {
  padding: 20px 24px;
  background: #f8fafc;
  text-align: right;
}

.quick-form-dialog .el-button {
  border-radius: 10px;
  padding: 12px 24px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.quick-form-dialog .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Mobile quick form styles */
@media (max-width: 768px) {
  .quick-form-dialog .el-dialog {
    margin: 5vh auto;
    width: 95% !important;
    max-width: 95% !important;
  }
  
  .quick-form-dialog .el-dialog__body {
    padding: 20px;
  }
  
  .quick-form-dialog .el-form-item__label {
    font-size: 14px;
  }
  
  .quick-form-dialog .el-input__inner,
  .quick-form-dialog .el-textarea__inner {
    font-size: 16px;
  }
}

/* Tablet Responsive Design */
@media (min-width: 769px) and (max-width: 1024px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
  
  .quick-action-card {
    padding: 18px;
    min-height: 75px;
    gap: 14px;
  }
  
  .action-icon {
    width: 44px;
    height: 44px;
    font-size: 19px;
  }
  
  .action-content h4 {
    font-size: 15px;
  }
  
  .action-count {
    font-size: 13px;
  }
}

/* Floating Breeding Notifications - Dashboard */
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

/* Mobile Responsive for Recent Tanks */
@media (max-width: 768px) {
  .recent-item {
    margin-bottom: 16px;
  }
  
  .item-image-full {
    height: 160px;
  }
  
  .item-content {
    padding: 16px;
  }
  
  .tank-metadata {
    padding: 10px;
    margin-bottom: 12px;
  }
  
  .metadata-row {
    margin-bottom: 4px;
  }
  
  .metadata-label {
    min-width: 70px;
  }
  
  .item-stats {
    gap: 6px;
    flex-wrap: wrap;
  }
  
  .stat-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .item-image-full {
    height: 140px;
  }
  
  .item-content {
    padding: 12px;
  }
  
  .item-header h4 {
    font-size: 16px;
  }
  
  .tank-id {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .status-dot {
    width: 6px;
    height: 6px;
  }
  
  .tank-metadata {
    padding: 8px;
  }
  
  .metadata-label,
  .metadata-value {
    font-size: 11px;
  }
  
  .stat-badge {
    font-size: 10px;
    padding: 3px 6px;
  }
}

/* Mobile Responsive for Dashboard Notifications */
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
  
  .notification-item {
    padding: 12px 16px;
    gap: 10px;
  }
  
  .tank-thumb,
  .tank-thumb-placeholder {
    width: 40px;
    height: 40px;
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px 12px 0 0;
  }
  
  .notification-title {
    color: white;
  }
  
  .notification-icon {
    color: white;
  }
  
  .notification-count {
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
  
  .tank-name {
    font-size: 12px;
  }
  
  .urgency-badge {
    font-size: 9px;
    padding: 2px 5px;
  }
}
</style>
