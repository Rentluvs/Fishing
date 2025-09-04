<template>
  <div class="tank-detail">
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
          <h1>{{ tank.tank?.name }}</h1>
          <p>Chi tiết thông tin hồ cá</p>
        </div>
        <div class="header-actions">
          <el-button @click="editTank" icon="Edit">Chỉnh sửa</el-button>
          <el-button type="danger" @click="deleteTank" icon="Delete">Xóa hồ cá</el-button>
        </div>
      </div>
      
      <!-- Tank Info -->
      <div class="tank-info-card">
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Tên hồ cá:</span>
            <span class="value">{{ tank.tank?.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">Loại cá:</span>
            <span class="value">{{ tank.tank?.fish_type || 'Chưa xác định' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Ngày thả:</span>
            <span class="value">{{ formatDate(tank.tank?.release_date) || 'Chưa có' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Ngày đẻ:</span>
            <span class="value">{{ formatDate(tank.tank?.spawn_date) || 'Chưa có' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Loại hồ:</span>
            <span class="value">{{ tank.tank?.tank_type || 'Chưa xác định' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Nhiệt độ:</span>
            <span class="value">{{ tank.tank?.current_temperature ? `${tank.tank.current_temperature}°C` : '--' }}</span>
          </div>
          <div class="info-item">
            <span class="label">Ngày tạo:</span>
            <span class="value">{{ formatDate(tank.tank?.created_at) }}</span>
          </div>
        </div>
        
        <div v-if="tank.tank?.notes" class="tank-notes">
          <h4>Ghi chú:</h4>
          <p>{{ tank.tank.notes }}</p>
        </div>
      </div>
      
      <!-- Batches -->
      <div class="section">
        <div class="section-header">
          <h2>Lứa cá trong hồ ({{ tank.batches?.length || 0 }})</h2>
          <el-button type="primary" @click="openAddBatch()" icon="Plus">
            Thêm lứa cá mới
          </el-button>
        </div>
        
        <div v-if="tank.batches?.length === 0" class="empty-state">
          <p>Chưa có lứa cá nào trong hồ này</p>
          <el-button type="primary" @click="openAddBatch()">
            Thêm lứa cá đầu tiên
          </el-button>
        </div>
        
        <div v-else class="batches-grid">
          <div v-for="batch in tank.batches" :key="batch.id" class="batch-card">
            <div class="batch-header">
              <h4>{{ batch.batch_name || `Lứa ${batch.id}` }}</h4>
              <span class="batch-date">{{ formatDate(batch.spawn_date) }}</span>
            </div>
            
            <div class="batch-stats">
              <div class="stat">
                <span class="stat-label">Ban đầu:</span>
                <span class="stat-value">{{ batch.initial_count }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Hiện tại:</span>
                <span class="stat-value">{{ batch.current_count || batch.initial_count }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tỷ lệ sống:</span>
                <span class="stat-value">
                  {{ Math.round((batch.current_count || batch.initial_count) / batch.initial_count * 100) }}%
                </span>
              </div>
            </div>
            
            <div class="batch-actions">
              <el-button size="small" @click="$router.push(`/batches/${batch.id}`)">
                Chi tiết
              </el-button>
              <el-button size="small" type="danger" @click="detachBatch(batch)" style="margin-left: 8px;">
                Gỡ khỏi hồ
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add Batch Modal -->
    <el-dialog v-model="showAddBatch" title="Thêm lứa cá mới" width="700px">
      <el-tabs v-model="addMode" type="card">
        <el-tab-pane label="Tạo mới" name="create">
          <el-form :model="batchForm" label-width="120px">
            <el-form-item label="Tên lứa cá">
              <el-input v-model="batchForm.batch_name" placeholder="Tùy chọn" />
            </el-form-item>
            
            <el-form-item label="Ngày đẻ" required>
              <el-date-picker 
                v-model="batchForm.spawn_date" 
                type="date" 
                style="width: 100%"
                format="DD/MM/YYYY"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            
            <el-form-item label="Số lượng cá bột" required>
              <el-input-number v-model="batchForm.initial_count" :min="1" style="width: 100%" />
            </el-form-item>
            
            <el-form-item label="Chủng loại">
              <el-input v-model="batchForm.fish_species" placeholder="Loại cá" />
            </el-form-item>
            
            <el-form-item label="Ghi chú">
              <el-input v-model="batchForm.notes" type="textarea" :rows="3" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="Chọn từ danh sách có sẵn" name="attach">
          <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <el-input v-model="availableSearch" placeholder="Tìm theo tên hoặc loài cá" clearable style="max-width: 320px;" />
            <el-button @click="loadAvailableBatches" :loading="loadingAvailable">Tải lại</el-button>
          </div>
          <el-table :data="filteredAvailable" style="width: 100%" height="300">
            <el-table-column prop="id" label="#" width="60" />
            <el-table-column prop="batch_name" label="Tên lứa" />
            <el-table-column prop="fish_species" label="Chủng loại" width="160" />
            <el-table-column prop="spawn_date" label="Ngày đẻ" width="140">
              <template #default="scope">{{ formatDate(scope.row.spawn_date) }}</template>
            </el-table-column>
            <el-table-column prop="initial_count" label="SL ban đầu" width="120" />
            <el-table-column label="" width="120">
              <template #default="scope">
                <el-button size="small" type="primary" @click="attachExisting(scope.row)">Gắn vào hồ</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showAddBatch = false">Đóng</el-button>
          <el-button v-if="addMode === 'create'" type="primary" @click="addBatch">Thêm lứa cá</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

export default {
  name: 'TankDetail',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const tanksStore = useTanksStore()
    
    const loading = ref(true)
    const tank = ref(null)
    const showAddBatch = ref(false)
    const addMode = ref('create') // create | attach

    const loadingAvailable = ref(false)
    const availableBatches = ref([])
    const availableSearch = ref('')
    
    const batchForm = reactive({
      tank_id: parseInt(route.params.id),
      batch_name: '',
      spawn_date: '',
      initial_count: 100,
      fish_species: '',
      notes: ''
    })
    
    const filteredAvailable = computed(() => {
      const q = availableSearch.value.trim().toLowerCase()
      if (!q) return availableBatches.value
      return availableBatches.value.filter(b =>
        (b.batch_name || '').toLowerCase().includes(q) ||
        (b.fish_species || '').toLowerCase().includes(q)
      )
    })

    const formatDate = (dateStr) => {
      if (!dateStr) return null
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const loadTankDetail = async () => {
      try {
        loading.value = true
        const data = await tanksStore.fetchTankById(route.params.id)
        tank.value = data
      } catch (error) {
        ElMessage.error('Lỗi tải thông tin hồ cá')
        console.error(error)
      } finally {
        loading.value = false
      }
    }

    const loadAvailableBatches = async () => {
      try {
        loadingAvailable.value = true
        const res = await axios.get('/batches/available')
        if (res.data?.success) {
          availableBatches.value = res.data.data
        }
      } catch (e) {
        ElMessage.error('Lỗi tải danh sách lứa cá có sẵn')
      } finally {
        loadingAvailable.value = false
      }
    }
    
    const openAddBatch = () => {
      addMode.value = 'create'
      showAddBatch.value = true
      // Preload available list for quick switch
      loadAvailableBatches()
    }

    const editTank = () => {
      router.push(`/tanks/${route.params.id}/edit`)
    }
    
    const deleteTank = async () => {
      try {
        await ElMessageBox.confirm(
          'Bạn có chắc chắn muốn xóa hồ cá này? Tất cả dữ liệu liên quan sẽ bị xóa.',
          'Xác nhận xóa',
          {
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
            type: 'warning',
          }
        )
        
        const result = await tanksStore.deleteTank(route.params.id)
        if (result.success) {
          ElMessage.success('Xóa hồ cá thành công!')
          router.push('/tanks')
        } else {
          ElMessage.error(result.error || 'Lỗi xóa hồ cá')
        }
      } catch (error) {
        // User cancelled
      }
    }
    
    const addBatch = async () => {
      try {
        const response = await axios.post('/batches', batchForm)
        if (response.data.success) {
          ElMessage.success('Thêm lứa cá thành công!')
          showAddBatch.value = false
          loadTankDetail()
        } else {
          ElMessage.error('Lỗi thêm lứa cá')
        }
      } catch (error) {
        ElMessage.error('Lỗi thêm lứa cá')
        console.error(error)
      }
    }

    const attachExisting = async (row) => {
      try {
        const response = await axios.patch(`/batches/${row.id}/attach`, { tank_id: parseInt(route.params.id) })
        if (response.data?.success) {
          ElMessage.success('Đã gắn lứa cá vào hồ')
          await loadTankDetail()
          await loadAvailableBatches()
        } else {
          ElMessage.error(response.data?.message || 'Lỗi gắn lứa cá')
        }
      } catch (error) {
        ElMessage.error('Lỗi gắn lứa cá')
        console.error(error)
      }
    }

    const detachBatch = async (batch) => {
      try {
        await ElMessageBox.confirm(
          `Gỡ lứa cá "${batch.batch_name || 'Lứa ' + batch.id}" khỏi hồ? Lứa cá sẽ vẫn tồn tại trong danh sách lứa cá.`,
          'Xác nhận gỡ',
          {
            confirmButtonText: 'Gỡ',
            cancelButtonText: 'Hủy',
            type: 'warning',
          }
        )
        const response = await axios.patch(`/batches/${batch.id}/detach`)
        if (response.data?.success) {
          ElMessage.success('Đã gỡ lứa cá khỏi hồ')
          await loadTankDetail()
        } else {
          ElMessage.error(response.data?.message || 'Lỗi gỡ lứa cá khỏi hồ')
        }
      } catch (error) {
        if (error && error !== 'cancel') {
          ElMessage.error('Lỗi gỡ lứa cá khỏi hồ')
          console.error(error)
        }
      }
    }
    
    onMounted(() => {
      loadTankDetail()
    })
    
    return {
      loading,
      tank,
      showAddBatch,
      addMode,
      batchForm,
      formatDate,
      editTank,
      deleteTank,
      addBatch,
      detachBatch,
      // available
      availableBatches,
      availableSearch,
      filteredAvailable,
      loadingAvailable,
      loadAvailableBatches,
      openAddBatch,
      attachExisting
    }
  }
}
</script>

<style scoped>
.tank-detail {
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

.tank-info-card {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
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

.tank-notes {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 4px solid #1890ff;
}

.tank-notes h4 {
  margin: 0 0 8px 0;
  color: #2c3e50;
}

.tank-notes p {
  margin: 0;
  color: #555;
  line-height: 1.6;
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

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #7f8c8d;
}

.batches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.batch-card {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 16px;
  transition: all 0.3s;
}

.batch-card:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.batch-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.batch-header h4 {
  margin: 0;
  color: #2c3e50;
}

.batch-date {
  font-size: 12px;
  color: #7f8c8d;
}

.batch-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat {
  text-align: center;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-weight: 600;
  color: #2c3e50;
}

.batch-actions {
  text-align: center;
}

.loading {
  padding: 40px 0;
}

.error {
  padding: 40px 0;
}
</style>
