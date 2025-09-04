<template>
  <div class="environment-list">
    <div class="page-header">
      <div class="header-content">
        <h1>Nhật ký môi trường</h1>
        <p>Quản lý các hoạt động và nhắc nhở môi trường</p>
      </div>
      <div class="header-actions">
        <el-button @click="showQuickActions = true" type="success" icon="Lightning">
          Thao tác nhanh
        </el-button>
        <el-button @click="showCreateForm = true" type="primary" icon="Plus">
          Thêm nhật ký
        </el-button>
      </div>
    </div>
    
    <!-- Reminders Section -->
    <div class="reminders-section">
      <h2>Nhắc nhở cần chú ý</h2>
      
      <div v-if="remindersLoading" class="loading">
        <el-skeleton :rows="2" />
      </div>
      
      <div v-else-if="allReminders.length === 0" class="empty-state">
        <p>Không có nhắc nhở nào</p>
      </div>
      
      <div v-else class="reminders-grid">
        <!-- Overdue -->
        <div v-if="reminders.overdue.length > 0" class="reminder-category overdue">
          <h3>Quá hạn ({{ reminders.overdue.length }})</h3>
          <div v-for="reminder in reminders.overdue" :key="reminder.id" class="reminder-item">
            <div class="reminder-content">
              <h4>{{ getActivityTypeName(reminder.activity_type) }}</h4>
              <p>{{ reminder.tank_name }}</p>
              <small>{{ formatDate(reminder.reminder_date) }}</small>
            </div>
            <el-button size="small" type="danger" @click="markCompleted(reminder.id)">
              Hoàn thành
            </el-button>
          </div>
        </div>
        
        <!-- Today -->
        <div v-if="reminders.today.length > 0" class="reminder-category today">
          <h3>Hôm nay ({{ reminders.today.length }})</h3>
          <div v-for="reminder in reminders.today" :key="reminder.id" class="reminder-item">
            <div class="reminder-content">
              <h4>{{ getActivityTypeName(reminder.activity_type) }}</h4>
              <p>{{ reminder.tank_name }}</p>
              <small>{{ formatDate(reminder.reminder_date) }}</small>
            </div>
            <el-button size="small" type="warning" @click="markCompleted(reminder.id)">
              Hoàn thành
            </el-button>
          </div>
        </div>
        
        <!-- Upcoming -->
        <div v-if="reminders.upcoming.length > 0" class="reminder-category upcoming">
          <h3>Sắp tới ({{ reminders.upcoming.length }})</h3>
          <div v-for="reminder in reminders.upcoming" :key="reminder.id" class="reminder-item">
            <div class="reminder-content">
              <h4>{{ getActivityTypeName(reminder.activity_type) }}</h4>
              <p>{{ reminder.tank_name }}</p>
              <small>{{ formatDate(reminder.reminder_date) }}</small>
            </div>
            <el-button size="small" @click="markCompleted(reminder.id)">
              Hoàn thành
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Search Filters -->
    <CollapsibleSearch 
      placeholder="Lọc theo hồ cá và hoạt động..."
      @search="handleSearch"
    >
      <template #filters>
        <el-select 
          v-model="tankFilter" 
          placeholder="Lọc theo hồ cá" 
          clearable 
          class="filter-select"
          @change="reloadLogs"
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
          v-model="activityFilter" 
          placeholder="Lọc theo hoạt động" 
          clearable 
          class="filter-select"
          @change="reloadLogs"
        >
          <el-option label="Tất cả hoạt động" value="" />
          <el-option label="Thay nước" value="water_change" />
          <el-option label="Vệ sinh" value="cleaning" />
          <el-option label="Kiểm tra pH" value="ph_test" />
          <el-option label="Cho ăn" value="feeding" />
          <el-option label="Dùng thuốc" value="medication" />
          <el-option label="Khác" value="other" />
        </el-select>
        
        <div class="limit-control">
          <el-input-number 
            v-model="limitFilter" 
            :min="10" 
            :max="100" 
            :step="10"
            controls-position="right"
            @change="reloadLogs"
          />
          <span class="limit-label">bản ghi</span>
        </div>
      </template>
    </CollapsibleSearch>
    
    <!-- Environment Logs -->
    <div class="logs-section">
      <h2>Lịch sử hoạt động</h2>
      
      <div v-if="logsLoading" class="loading">
        <el-skeleton :rows="5" />
      </div>
      
      <div v-else-if="logs.length === 0" class="empty-state">
        <p>Chưa có nhật ký môi trường nào</p>
        <el-button type="primary" @click="showCreateForm = true">
          Thêm nhật ký đầu tiên
        </el-button>
      </div>
      
      <div v-else class="logs-timeline">
        <div v-for="log in logs" :key="log.id" class="log-item">
          <div class="log-date">
            {{ formatDate(log.log_date) }}
          </div>
          
          <div class="log-content">
            <div class="log-header">
              <h4>{{ getActivityTypeName(log.activity_type) }}</h4>
              <span class="log-tank">{{ log.tank_name }}</span>
              <span v-if="log.completed" class="status-badge completed">Hoàn thành</span>
              <span v-else class="status-badge pending">Chưa hoàn thành</span>
            </div>
            
            <div class="log-details">
              <span v-if="log.ph_level" class="detail-item">pH: {{ log.ph_level }}</span>
              <span v-if="log.temperature" class="detail-item">Nhiệt độ: {{ log.temperature }}°C</span>
              <span v-if="log.water_change_percentage" class="detail-item">
                Thay nước: {{ log.water_change_percentage }}%
              </span>
            </div>
            
            <div v-if="log.notes" class="log-notes">
              {{ log.notes }}
            </div>
            
            <div class="log-actions">
              <el-button 
                class="action-btn"
                @click="editLog(log)" 
                icon="Edit"
              >
                Sửa
              </el-button>
              <el-button 
                v-if="!log.completed" 
                class="action-btn"
                type="success" 
                @click="markCompleted(log.id)"
                icon="Check"
              >
                Hoàn thành
              </el-button>
              <el-button 
                v-else
                class="action-btn"
                disabled
                icon="CircleCheck"
              >
                Đã xong
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions Modal -->
    <el-dialog v-model="showQuickActions" title="Thao tác nhanh" width="400px">
      <div class="quick-actions-grid">
        <div class="quick-action-item" @click="quickAction('water_change')">
          <el-icon size="32"><Water /></el-icon>
          <h4>Thay nước</h4>
          <p>Ghi nhận việc thay nước định kỳ</p>
        </div>
        
        <div class="quick-action-item" @click="quickAction('feeding')">
          <el-icon size="32"><Food /></el-icon>
          <h4>Cho ăn</h4>
          <p>Ghi nhận việc cho cá ăn</p>
        </div>
        
        <div class="quick-action-item" @click="quickAction('cleaning')">
          <el-icon size="32"><Brush /></el-icon>
          <h4>Vệ sinh</h4>
          <p>Ghi nhận việc vệ sinh hồ cá</p>
        </div>
      </div>
      
      <el-form v-if="selectedQuickAction" :model="quickActionForm" label-width="100px" style="margin-top: 20px;">
        <el-form-item label="Hồ cá" required>
          <el-select v-model="quickActionForm.tank_id" placeholder="Chọn hồ cá" style="width: 100%">
            <el-option 
              v-for="tank in tanks" 
              :key="tank.id" 
              :label="tank.name" 
              :value="tank.id" 
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showQuickActions = false">Hủy</el-button>
          <el-button 
            v-if="selectedQuickAction" 
            type="primary" 
            @click="executeQuickAction"
          >
            Thực hiện
          </el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- Create/Edit Log Modal -->
    <el-dialog 
      v-model="showCreateForm" 
      :title="editingLog ? 'Chỉnh sửa nhật ký' : 'Thêm nhật ký môi trường'"
      width="600px"
    >
      <el-form :model="logForm" label-width="150px">
        <el-form-item label="Hồ cá" required>
          <el-select v-model="logForm.tank_id" placeholder="Chọn hồ cá" style="width: 100%">
            <el-option 
              v-for="tank in tanks" 
              :key="tank.id" 
              :label="tank.name" 
              :value="tank.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Ngày thực hiện" required>
          <el-date-picker 
            v-model="logForm.log_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Loại hoạt động" required>
          <el-select v-model="logForm.activity_type" placeholder="Chọn hoạt động" style="width: 100%">
            <el-option label="Thay nước" value="water_change" />
            <el-option label="Vệ sinh hồ" value="cleaning" />
            <el-option label="Kiểm tra pH" value="ph_test" />
            <el-option label="Cho ăn" value="feeding" />
            <el-option label="Dùng thuốc" value="medication" />
            <el-option label="Khác" value="other" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="% thay nước">
          <el-input-number 
            v-model="logForm.water_change_percentage" 
            :min="0" 
            :max="100" 
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="logForm.notes" type="textarea" :rows="3" />
        </el-form-item>
        
        <el-form-item label="Nhắc nhở lần sau">
          <el-date-picker 
            v-model="logForm.reminder_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
            placeholder="Tùy chọn"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateForm = false">Hủy</el-button>
          <el-button type="primary" @click="saveLog">
            {{ editingLog ? 'Cập nhật' : 'Thêm nhật ký' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage } from 'element-plus'
import axios from 'axios'
import CollapsibleSearch from '@/components/CollapsibleSearch.vue'

export default {
  name: 'EnvironmentList',
  components: {
    CollapsibleSearch
  },
  setup() {
    const tanksStore = useTanksStore()
    
    const remindersLoading = ref(true)
    const logsLoading = ref(true)
    const reminders = ref({ overdue: [], today: [], upcoming: [] })
    const logs = ref([])
    const tanks = ref([])
    
    const showQuickActions = ref(false)
    const showCreateForm = ref(false)
    const editingLog = ref(null)
    const selectedQuickAction = ref('')
    
    const tankFilter = ref('')
    const activityFilter = ref('')
    const limitFilter = ref(50)
    
    const quickActionForm = reactive({
      tank_id: ''
    })
    
    const logForm = reactive({
      tank_id: '',
      log_date: new Date().toISOString().split('T')[0],
      activity_type: '',
      water_change_percentage: null,
      notes: '',
      reminder_date: ''
    })
    
    const allReminders = computed(() => {
      return [...reminders.value.overdue, ...reminders.value.today, ...reminders.value.upcoming]
    })
    
    const activityTypeNames = {
      'water_change': 'Thay nước',
      'cleaning': 'Vệ sinh hồ',
      'ph_test': 'Kiểm tra pH',
      'feeding': 'Cho ăn',
      'medication': 'Dùng thuốc',
      'other': 'Khác'
    }
    
    const getActivityTypeName = (type) => {
      return activityTypeNames[type] || type
    }
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const loadReminders = async () => {
      try {
        remindersLoading.value = true
        const response = await axios.get('/environment/reminders')
        
        if (response.data.success) {
          reminders.value = response.data.data
        }
      } catch (error) {
        ElMessage.error('Lỗi tải nhắc nhở')
        console.error(error)
      } finally {
        remindersLoading.value = false
      }
    }
    
    const loadLogs = async () => {
      try {
        logsLoading.value = true
        const params = {
          limit: limitFilter.value
        }
        
        if (tankFilter.value) params.tank_id = tankFilter.value
        if (activityFilter.value) params.activity_type = activityFilter.value
        
        const response = await axios.get('/environment', { params })
        
        if (response.data.success) {
          logs.value = response.data.data
        }
      } catch (error) {
        ElMessage.error('Lỗi tải nhật ký')
        console.error(error)
      } finally {
        logsLoading.value = false
      }
    }
    
    const loadTanks = async () => {
      await tanksStore.fetchTanks()
      tanks.value = tanksStore.tanks
    }
    
    const markCompleted = async (logId) => {
      try {
        const response = await axios.put(`/environment/${logId}`, {
          completed: true
        })
        
        if (response.data.success) {
          ElMessage.success('Đã đánh dấu hoàn thành')
          loadReminders()
          loadLogs()
        }
      } catch (error) {
        ElMessage.error('Lỗi cập nhật trạng thái')
      }
    }
    
    const quickAction = (action) => {
      selectedQuickAction.value = action
      quickActionForm.tank_id = ''
    }
    
    const executeQuickAction = async () => {
      if (!quickActionForm.tank_id) {
        ElMessage.warning('Vui lòng chọn hồ cá')
        return
      }
      
      try {
        const response = await axios.post('/environment/quick-actions', {
          tank_id: quickActionForm.tank_id,
          action: selectedQuickAction.value
        })
        
        if (response.data.success) {
          ElMessage.success('Thao tác nhanh thành công!')
          showQuickActions.value = false
          selectedQuickAction.value = ''
          loadLogs()
        }
      } catch (error) {
        ElMessage.error('Lỗi thực hiện thao tác')
      }
    }
    
    const editLog = (log) => {
      editingLog.value = log
      Object.keys(logForm).forEach(key => {
        logForm[key] = log[key] || (typeof logForm[key] === 'string' ? '' : null)
      })
      showCreateForm.value = true
    }
    
    const saveLog = async () => {
      try {
        let response
        if (editingLog.value) {
          response = await axios.put(`/environment/${editingLog.value.id}`, logForm)
        } else {
          response = await axios.post('/environment', logForm)
        }
        
        if (response.data.success) {
          ElMessage.success(editingLog.value ? 'Cập nhật thành công!' : 'Thêm nhật ký thành công!')
          showCreateForm.value = false
          resetLogForm()
          loadLogs()
        }
      } catch (error) {
        ElMessage.error('Lỗi lưu nhật ký')
      }
    }
    
    const resetLogForm = () => {
      editingLog.value = null
      Object.keys(logForm).forEach(key => {
        if (key === 'log_date') {
          logForm[key] = new Date().toISOString().split('T')[0]
        } else if (typeof logForm[key] === 'string') {
          logForm[key] = ''
        } else {
          logForm[key] = null
        }
      })
    }
    
    const handleSearch = (value) => {
      // Search functionality can be extended if needed
      console.log('Search:', value)
    }
    
    // Watch filters
    const reloadLogs = () => {
      loadLogs()
    }
    
    onMounted(() => {
      loadTanks()
      loadReminders()
      loadLogs()
    })
    
    return {
      // state
      remindersLoading,
      logsLoading,
      reminders,
      logs,
      tanks,
      showQuickActions,
      showCreateForm,
      editingLog,
      selectedQuickAction,
      tankFilter,
      activityFilter,
      limitFilter,
      quickActionForm,
      logForm,
      allReminders,
      getActivityTypeName,
      formatDate,
      // methods
      executeQuickAction,
      editLog,
      saveLog,
      resetLogForm,
      reloadLogs,
      handleSearch,
      markCompleted
    }
  }
}
</script>

<style scoped>
.environment-list {
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
  padding: 32px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  flex-wrap: wrap;
  gap: 24px;
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

.header-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
}

.reminders-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.reminders-section h2 {
  margin: 0 0 28px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  position: relative;
  padding-bottom: 12px;
}

.reminders-section h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 2px;
}

.reminders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.reminder-category h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #2c3e50;
  padding: 8px 12px;
  border-radius: 6px;
  background: #f8f9fa;
}

.reminder-category.overdue h3 {
  background: #fff2f0;
  color: #f5222d;
}

.reminder-category.today h3 {
  background: #fff7e6;
  color: #fa8c16;
}

.reminder-category.upcoming h3 {
  background: #f6ffed;
  color: #52c41a;
}

.reminder-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 16px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.8));
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.reminder-item:hover {
  background: white;
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.reminder-content h4 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.reminder-content p {
  margin: 0 0 6px 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
}

.reminder-content small {
  color: #9ca3af;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-select {
  min-width: 180px;
}

.limit-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.limit-control .el-input-number {
  width: 120px;
}

.limit-label {
  color: #6b7280;
  font-size: 14px;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .filter-select {
    min-width: auto;
  }
  
  .limit-control {
    justify-content: space-between;
    width: 100%;
  }
  
  .limit-control .el-input-number {
    flex: 1;
    max-width: 150px;
  }
}

.logs-section {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
}

.logs-section h2 {
  margin: 0 0 28px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  position: relative;
  padding-bottom: 12px;
}

.logs-section h2::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 2px;
}

.logs-table {
  width: 100%;
}

.logs-table .el-table {
  border-radius: 8px;
  overflow: hidden;
}

.logs-table .el-table th {
  background: #fafafa;
  color: #2c3e50;
  font-weight: 600;
}

.logs-table .el-table td {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(229, 231, 235, 0.3);
}

/* Add missing log styles */
.logs-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 20px;
}

.log-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(249, 250, 251, 0.8));
  border: 1px solid rgba(229, 231, 235, 0.6);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.log-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08), 0 4px 8px rgba(0, 0, 0, 0.04);
  border-color: rgba(156, 163, 175, 0.6);
}

.log-date {
  color: #6b7280;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.log-content {
  margin-left: 0;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.log-header h4 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #10b981, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.log-tank {
  font-size: 16px;
  font-weight: 600;
  color: #6b7280;
  background: rgba(107, 114, 128, 0.1);
  padding: 6px 12px;
  border-radius: 20px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.completed {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.log-details {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

.detail-item {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.log-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 12px;
}

.action-btn {
  height: 36px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn .el-icon {
  font-size: 14px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.loading {
  padding: 20px 0;
}

/* Desktop Optimization Styles */
@media (min-width: 1024px) {
  .environment-list {
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px;
  }
  
  .page-header {
    margin-bottom: 56px;
    padding: 40px;
  }
  
  .header-content h1 {
    font-size: 48px;
  }
  
  .header-content p {
    font-size: 22px;
  }
  
  .reminders-section,
  .logs-section {
    padding: 40px;
    margin-bottom: 48px;
  }
  
  .reminders-section h2,
  .logs-section h2 {
    font-size: 32px;
    margin-bottom: 32px;
  }
  
  .reminder-item {
    padding: 24px 32px;
    margin-bottom: 20px;
  }
  
  .log-item {
    padding: 32px;
    margin-bottom: 28px;
  }
  
  .logs-timeline {
    gap: 28px;
  }
}

/* Tablet Optimization */
@media (min-width: 769px) and (max-width: 1023px) {
  .environment-list {
    padding: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .page-header {
    padding: 32px;
    margin-bottom: 40px;
  }
  
  .reminders-section,
  .logs-section {
    padding: 28px;
    margin-bottom: 32px;
  }
  
  .reminder-item {
    padding: 20px 24px;
  }
  
  .log-item {
    padding: 28px;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .environment-list {
    padding: 16px;
  }
  
  .page-header {
    flex-direction: column;
    align-items: stretch;
    margin-bottom: 24px;
  }
  
  .header-content {
    text-align: center;
  }
  
  .header-content h1 {
    font-size: 24px;
  }
  
  .header-content p {
    font-size: 14px;
  }
  
  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  
  .header-actions .el-button {
    height: 48px;
    font-size: 15px;
    font-weight: 600;
  }
  
  .reminders-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .reminders-section h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .reminders-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .reminder-category h3 {
    font-size: 16px;
    padding: 6px 10px;
  }
  
  .reminder-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
  }
  
  .reminder-item .el-button {
    width: 100%;
  }
  
  .log-actions {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  }
  
  .action-btn {
    height: 44px;
    font-size: 14px;
  }
  
  .logs-section {
    padding: 16px;
  }
  
  .logs-section h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .logs-table .el-table {
    font-size: 14px;
  }
  
  .logs-table .el-table td {
    padding: 12px 6px;
  }
  

  
  .empty-state {
    padding: 30px 16px;
  }
  
  .empty-state p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .environment-list {
    padding: 12px;
  }
  
  .reminders-section {
    padding: 12px;
  }
  
  .reminder-item {
    padding: 10px;
  }
  
  .logs-section {
    padding: 12px;
  }
  
  .logs-table .el-table {
    font-size: 13px;
  }
  
  .logs-table .el-table td {
    padding: 8px 4px;
  }
}
</style>
