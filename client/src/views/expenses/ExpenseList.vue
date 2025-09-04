<template>
  <div class="expense-list">
    <div class="page-header">
      <div class="header-content">
        <h1>Quản lý chi phí</h1>
        <p>Theo dõi và phân tích chi phí nuôi cá cảnh</p>
      </div>
      <el-button @click="showCreateForm = true" type="primary" icon="Plus">
        Thêm chi phí
      </el-button>
    </div>
    
    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-content">
          <h3>{{ formatCurrency(purchaseMonthTotal) }}</h3>
          <p>Chi phí mua sắm (tháng này)</p>
          <small>{{ formatCurrency(purchaseYearTotal) }} năm nay</small>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-content">
          <h3>{{ formatCurrency(saleMonthTotal) }}</h3>
          <p>Chi phí bán cá (tháng này)</p>
          <small>{{ formatCurrency(saleYearTotal) }} năm nay</small>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-content">
          <h3>{{ formatCurrency(totalProfitMonth) }}</h3>
          <p>Tổng lợi nhuận (tháng này)</p>
          <small>{{ formatCurrency(totalProfitYear) }} năm nay</small>
        </div>
      </div>
      
      <div class="summary-card">
        <div class="summary-content">
          <h3>{{ totalSaleTransactionsMonth }}</h3>
          <p>Giao dịch bán cá (tháng này)</p>
          <small>{{ totalSaleTransactionsYear }} năm nay</small>
        </div>
      </div>
    </div>
    
    <!-- Enhanced Filters -->
    <CollapsibleSearch 
      placeholder="Tìm kiếm chi phí..."
      :has-filters="!!(tankFilter || categoryFilter || monthFilter)"
    >
      <template #filters>
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
          v-model="categoryFilter" 
          placeholder="Lọc theo danh mục" 
          clearable 
          class="filter-select"
        >
          <el-option label="Tất cả danh mục" value="" />
          <el-option 
            v-for="category in categories" 
            :key="category" 
            :label="category" 
            :value="category" 
          />
        </el-select>
        
        <el-select 
          v-model="yearFilter" 
          placeholder="Năm" 
          class="filter-select"
        >
          <el-option 
            v-for="year in availableYears" 
            :key="year" 
            :label="year" 
            :value="year" 
          />
        </el-select>
        
        <el-select 
          v-model="monthFilter" 
          placeholder="Tháng" 
          clearable 
          class="filter-select"
        >
          <el-option label="Tất cả" value="" />
          <el-option 
            v-for="(month, index) in months" 
            :key="index + 1" 
            :label="month" 
            :value="index + 1" 
          />
        </el-select>
        
        <el-button @click="exportData" type="primary" class="export-btn">
          <el-icon><Download /></el-icon>
          Xuất dữ liệu
        </el-button>
      </template>
    </CollapsibleSearch>
    
    <!-- Category Statistics -->
    <div v-if="categoryStats.length > 0" class="stats-section">
      <h2>Thống kê theo danh mục</h2>
      <div class="category-stats">
        <div v-for="stat in categoryStats" :key="stat.category" class="category-stat">
          <div class="stat-header">
            <h4>{{ stat.category }}</h4>
            <span class="stat-percentage">{{ stat.percentage }}%</span>
          </div>
          <div class="stat-amount">{{ formatCurrency(stat.total_amount) }}</div>
          <div class="stat-count">{{ stat.transaction_count }} giao dịch</div>
          <div class="stat-bar">
            <div class="stat-fill" :style="{ width: stat.percentage + '%' }"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Financial Summary -->
    <div v-if="expenses.length > 0" class="financial-summary">
      <br />
      <h2>Tổng quan tài chính</h2>
      <div class="summary-cards">
        <div class="summary-card summary-card--expense">
          <div class="card-header">
            <el-icon class="card-icon"><Money /></el-icon>
            <span class="card-title">Chi phí mua</span>
          </div>
          <div class="card-amount expense-amount">
            -{{ formatCurrency(totalPurchase) }}
          </div>
          <div class="card-count">{{ filteredPurchase.length }} giao dịch</div>
        </div>
        
        <div class="summary-card summary-card--income">
          <div class="card-header">
            <el-icon class="card-icon"><Money /></el-icon>
            <span class="card-title">Doanh thu bán</span>
          </div>
          <div class="card-amount income-amount">
            +{{ formatCurrency(totalSale) }}
          </div>
          <div class="card-count">{{ filteredSale.length }} giao dịch</div>
        </div>
        
        <div class="summary-card summary-card--net">
          <div class="card-header">
            <el-icon class="card-icon"><Money /></el-icon>
            <span class="card-title">Lãi/Lỗ ròng</span>
          </div>
          <div class="card-amount" :class="netTotal >= 0 ? 'profit-amount' : 'loss-amount'">
            {{ netTotal >= 0 ? '+' : '' }}{{ formatCurrency(netTotal) }}
          </div>
          <div class="card-count">{{ filteredPurchase.length + filteredSale.length }} tổng giao dịch</div>
        </div>
        
        <div class="summary-card summary-card--total">
          <div class="card-header">
            <el-icon class="card-icon"><Money /></el-icon>
            <span class="card-title">Tổng giá trị</span>
          </div>
          <div class="card-amount total-amount">
            {{ formatCurrency(totalExpenses) }}
          </div>
          <div class="card-count">Giá trị tuyệt đối</div>
        </div>
      </div>
    </div>

    <!-- Expense List -->
    <div class="expenses-section">
      <div v-if="loading" class="loading">
        <el-skeleton :rows="6" />
      </div>
      
      <div v-else>
        <el-tabs v-model="activeTab" type="card" class="expense-tabs">
          <el-tab-pane label="Chi phí mua" name="purchase">
            <div v-if="filteredPurchase.length === 0" class="empty-state">
              <div class="empty-content">
                <el-icon size="64"><Money /></el-icon>
                <h3>Chưa có chi phí mua</h3>
                <p>Thêm chi phí để bắt đầu</p>
              </div>
            </div>
            <div v-else class="expenses-table">
              <el-table :data="filteredPurchase" style="width: 100%">
                <el-table-column prop="expense_date" label="Ngày" width="120">
                  <template #default="scope">{{ formatDate(scope.row.expense_date) }}</template>
                </el-table-column>
                <el-table-column prop="category" label="Danh mục" width="150">
                  <template #default="scope">
                    <el-tag :type="getCategoryTagType(scope.row.category)">{{ scope.row.category }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="Mô tả" min-width="200" />
                <el-table-column prop="tank_name" label="Hồ cá" width="150">
                  <template #default="scope">
                    <span v-if="scope.row.tank_name">{{ scope.row.tank_name }}</span>
                    <span v-else class="text-muted">Chung</span>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="Số tiền" width="150" align="right">
                  <template #default="scope">
                    <span class="amount negative">- {{ formatCurrency(scope.row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ảnh" width="120">
                  <template #default="scope">
                    <img 
                      v-if="scope.row.receipt_path" 
                      :src="fullUrl(scope.row.receipt_path)" 
                      @click="openImage(fullUrl(scope.row.receipt_path))"
                      alt="Hóa đơn"
                      class="receipt-image professional-image"
                      style="width: 80px; height: 60px;" 
                    />
                  </template>
                </el-table-column>
                <el-table-column label="Thao tác" width="160" align="center">
                  <template #default="scope">
                    <div class="table-actions">
                      <el-button 
                        class="action-btn action-btn--edit"
                        @click="editExpense(scope.row)" 
                        icon="Edit"
                        size="small"
                      >
                        Sửa
                      </el-button>
                      <el-button 
                        class="action-btn action-btn--delete"
                        type="danger" 
                        @click="deleteExpense(scope.row.id)" 
                        icon="Delete"
                        size="small"
                      >
                        Xóa
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="Chi phí bán cá" name="sale">
            <div v-if="filteredSale.length === 0" class="empty-state">
              <div class="empty-content">
                <el-icon size="64"><Money /></el-icon>
                <h3>Chưa có chi phí bán</h3>
                <p>Thêm giao dịch bán để bắt đầu</p>
              </div>
            </div>
            <div v-else class="expenses-table">
              <el-table :data="filteredSale" style="width: 100%">
                <el-table-column prop="expense_date" label="Ngày" width="120">
                  <template #default="scope">{{ formatDate(scope.row.expense_date) }}</template>
                </el-table-column>
                <el-table-column prop="category" label="Danh mục" width="150">
                  <template #default="scope">
                    <el-tag :type="getCategoryTagType(scope.row.category)">{{ scope.row.category }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="description" label="Mô tả" min-width="200" />
                <el-table-column prop="tank_name" label="Hồ cá" width="150">
                  <template #default="scope">
                    <span v-if="scope.row.tank_name">{{ scope.row.tank_name }}</span>
                    <span v-else class="text-muted">Chung</span>
                  </template>
                </el-table-column>
                <el-table-column prop="amount" label="Số tiền" width="150" align="right">
                  <template #default="scope">
                    <span class="amount positive">+ {{ formatCurrency(scope.row.amount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="Ảnh" width="120">
                  <template #default="scope">
                    <img 
                      v-if="scope.row.receipt_path" 
                      :src="fullUrl(scope.row.receipt_path)" 
                      @click="openImage(fullUrl(scope.row.receipt_path))"
                      alt="Hóa đơn"
                      class="receipt-image professional-image"
                      style="width: 80px; height: 60px;" 
                    />
                  </template>
                </el-table-column>
                <el-table-column label="Thao tác" width="160" align="center">
                  <template #default="scope">
                    <div class="table-actions">
                      <el-button 
                        class="action-btn action-btn--edit"
                        @click="editExpense(scope.row)" 
                        icon="Edit"
                        size="small"
                      >
                        Sửa
                      </el-button>
                      <el-button 
                        class="action-btn action-btn--delete"
                        type="danger" 
                        @click="deleteExpense(scope.row.id)" 
                        icon="Delete"
                        size="small"
                      >
                        Xóa
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
    
    <!-- Create/Edit Expense Modal -->
    <el-dialog 
      v-model="showCreateForm" 
      :title="editingExpense ? 'Chỉnh sửa chi phí' : 'Thêm chi phí mới'"
      width="600px"
      @close="resetForm"
      class="expense-form-dialog"
      :fullscreen="isMobile"
    >
      <el-form 
        ref="expenseFormRef"
        :model="expenseForm"
        :rules="expenseRules"
        label-width="120px"
      >
        <el-form-item label="Ngày chi tiêu" prop="expense_date" required>
          <el-date-picker 
            v-model="expenseForm.expense_date" 
            type="date" 
            style="width: 100%"
            format="DD/MM/YYYY"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        
        <el-form-item label="Danh mục" prop="category" required>
          <el-select 
            v-model="expenseForm.category" 
            placeholder="Chọn hoặc nhập danh mục mới"
            filterable
            allow-create
            style="width: 100%"
          >
            <el-option 
              v-for="category in defaultCategories" 
              :key="category" 
              :label="category" 
              :value="category" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Loại giao dịch">
          <el-segmented 
            v-model="expenseForm.expense_type" 
            :options="[
              { label: 'Chi phí mua', value: 'purchase' },
              { label: 'Chi phí bán cá', value: 'sale' }
            ]"
          />
        </el-form-item>
        
        <el-form-item label="Mô tả" prop="description">
          <el-input v-model="expenseForm.description" placeholder="Mô tả chi phí" />
        </el-form-item>
        
        <el-form-item label="Số tiền" prop="amount" required>
          <el-input-number 
            v-model="expenseForm.amount" 
            :min="0" 
            :step="1000"
            style="width: 100%"
            placeholder="0"
          />
        </el-form-item>
        
        <el-form-item label="Hồ cá">
          <el-select v-model="expenseForm.tank_id" placeholder="Chọn hồ cá (tùy chọn)" clearable style="width: 100%">
            <el-option 
              v-for="tank in tanks" 
              :key="tank.id" 
              :label="tank.name" 
              :value="tank.id" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="Ghi chú">
          <el-input v-model="expenseForm.notes" type="textarea" :rows="3" />
        </el-form-item>

        <el-form-item label="Ảnh hóa đơn">
          <input type="file" accept="image/*,.heic,.heif" @change="onReceiptChange" />
          <div v-if="receiptPreview" style="margin-top:8px;">
            <el-image 
              :src="receiptPreview" 
              :preview-src-list="[receiptPreview]" 
              fit="cover" 
              style="width: 160px; height: 120px; border-radius: 6px; cursor: zoom-in;" 
              :z-index="3000" 
            />
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateForm = false">Hủy</el-button>
          <el-button 
            type="primary" 
            :loading="saving"
            @click="saveExpense"
          >
            {{ editingExpense ? 'Cập nhật' : 'Thêm chi phí' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>

  <!-- Image Viewer Dialog -->
  <el-dialog 
    v-model="imageViewerVisible" 
    width="90vw"
    :append-to-body="true"
    :close-on-click-modal="true"
    :show-close="true"
  >
    <div style="display:flex;justify-content:center;align-items:center;max-height:80vh;">
      <img :src="imageViewerSrc" alt="view" style="max-width:100%; max-height:80vh; object-fit: contain; border-radius: 6px;" />
    </div>
  </el-dialog>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useTanksStore } from '@/stores/tanks'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import axios from 'axios'
import config from '@/config'
import CollapsibleSearch from '@/components/CollapsibleSearch.vue'

export default {
  name: 'ExpenseList',
  components: {
    CollapsibleSearch,
    Download
  },
  setup() {
    const tanksStore = useTanksStore()
    
    const loading = ref(true)
    const saving = ref(false)
    const receiptFile = ref(null)
    const receiptPreview = ref('')
    const imageViewerVisible = ref(false)
    const imageViewerSrc = ref('')
    const expenses = ref([])
    const tanks = ref([])
    const categories = ref([])
    const categoryStats = ref([])
    
    const showCreateForm = ref(false)
    const editingExpense = ref(null)
    
    const tankFilter = ref('')
    const categoryFilter = ref('')
    const yearFilter = ref(new Date().getFullYear())
    const monthFilter = ref('')
    
    const expenseFormRef = ref()
    const expenseForm = reactive({
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: null,
      tank_id: null,
      notes: '',
      expense_type: 'purchase'
    })
    
    const expenseRules = {
      expense_date: [{ required: true, message: 'Vui lòng chọn ngày', trigger: 'change' }],
      category: [{ required: true, message: 'Vui lòng chọn danh mục', trigger: 'change' }],
      amount: [{ required: true, message: 'Vui lòng nhập số tiền', trigger: 'blur' }]
    }
    
    const defaultCategories = [
      'Thức ăn',
      'Bán cá',     
      'Thuốc điều trị',
      'Thiết bị',
      'Mua cá', 
      'Vật liệu',
      'Khác'
    ]
    
    const months = [
      'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
    ]
    
    const availableYears = computed(() => {
      const currentYear = new Date().getFullYear()
      return Array.from({ length: 5 }, (_, i) => currentYear - i)
    })
    
    const monthlyTotal = computed(() => {
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const signed = expenses.value
        .filter(expense => {
          const expenseDate = new Date(expense.expense_date)
          return expenseDate.getMonth() + 1 === currentMonth && 
                 expenseDate.getFullYear() === currentYear
        })
        .reduce((sum, expense) => sum + (expense.expense_type === 'sale' ? expense.amount : -expense.amount), 0)
      return signed
    })
    
    const lastMonthTotal = computed(() => {
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const signed = expenses.value
        .filter(expense => {
          const expenseDate = new Date(expense.expense_date)
          return expenseDate.getMonth() === lastMonth.getMonth() && 
                 expenseDate.getFullYear() === lastMonth.getFullYear()
        })
        .reduce((sum, expense) => sum + (expense.expense_type === 'sale' ? expense.amount : -expense.amount), 0)
      return signed
    })
    
    const yearlyTotal = computed(() => {
      const currentYear = new Date().getFullYear()
      const signed = expenses.value
        .filter(expense => new Date(expense.expense_date).getFullYear() === currentYear)
        .reduce((sum, expense) => sum + (expense.expense_type === 'sale' ? expense.amount : -expense.amount), 0)
      return signed
    })
    
    const totalTransactions = computed(() => expenses.value.length)
    
    const averageExpense = computed(() => {
      if (expenses.value.length === 0) return 0
      const signedSum = expenses.value.reduce((sum, expense) => sum + (expense.expense_type === 'sale' ? expense.amount : -expense.amount), 0)
      return signedSum / expenses.value.length
    })

    // New summary metrics
    const purchaseMonthTotal = computed(() => {
      const d = new Date()
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      return expenses.value
        .filter(e => e.expense_type !== 'sale')
        .filter(e => {
          const dt = new Date(e.expense_date)
          return dt.getMonth() + 1 === m && dt.getFullYear() === y
        })
        .reduce((s, e) => s + e.amount, 0)
    })

    const purchaseYearTotal = computed(() => {
      const y = new Date().getFullYear()
      return expenses.value
        .filter(e => e.expense_type !== 'sale')
        .filter(e => new Date(e.expense_date).getFullYear() === y)
        .reduce((s, e) => s + e.amount, 0)
    })

    const saleMonthTotal = computed(() => {
      const d = new Date()
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      return expenses.value
        .filter(e => e.expense_type === 'sale')
        .filter(e => {
          const dt = new Date(e.expense_date)
          return dt.getMonth() + 1 === m && dt.getFullYear() === y
        })
        .reduce((s, e) => s + e.amount, 0)
    })

    const saleYearTotal = computed(() => {
      const y = new Date().getFullYear()
      return expenses.value
        .filter(e => e.expense_type === 'sale')
        .filter(e => new Date(e.expense_date).getFullYear() === y)
        .reduce((s, e) => s + e.amount, 0)
    })

    const totalProfitYear = computed(() => saleYearTotal.value - purchaseYearTotal.value)

    const totalSaleTransactionsYear = computed(() => {
      const y = new Date().getFullYear()
      return expenses.value
        .filter(e => e.expense_type === 'sale')
        .filter(e => new Date(e.expense_date).getFullYear() === y)
        .length
    })

    const totalProfitMonth = computed(() => saleMonthTotal.value - purchaseMonthTotal.value)

    const totalSaleTransactionsMonth = computed(() => {
      const d = new Date()
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      return expenses.value
        .filter(e => e.expense_type === 'sale')
        .filter(e => {
          const dt = new Date(e.expense_date)
          return dt.getMonth() + 1 === m && dt.getFullYear() === y
        })
        .length
    })
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount || 0)
    }
    
    const formatDate = (dateStr) => {
      return new Date(dateStr).toLocaleDateString('vi-VN')
    }
    
    const formatChange = (change) => {
      const prefix = change >= 0 ? '+' : ''
      return `${prefix}${formatCurrency(change)}`
    }
    
    const getChangeClass = (change) => {
      return change >= 0 ? 'text-success' : 'text-danger'
    }
    
    const getCategoryTagType = (category) => {
      const types = {
        'Thức ăn cá': 'primary',
        'Thuốc điều trị': 'danger',
        'Thiết bị': 'warning',
        'Điện nước': 'info',
        'Vật liệu': 'success',
        'Cá giống': 'primary',
        'Bảo trì': 'warning'
      }
      return types[category] || undefined
    }
    
    const loadExpenses = async () => {
      try {
        loading.value = true
        const params = {
          year: yearFilter.value,
          limit: 100
        }
        
        if (tankFilter.value) params.tank_id = tankFilter.value
        if (categoryFilter.value) params.category = categoryFilter.value
        if (monthFilter.value) params.month = monthFilter.value
        
        const response = await axios.get('/expenses', { params })
        
        if (response.data.success) {
          expenses.value = response.data.data
        }
      } catch (error) {
        ElMessage.error('Lỗi tải danh sách chi phí')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    const loadCategoryStats = async () => {
      try {
        const params = { year: yearFilter.value }
        if (tankFilter.value) params.tank_id = tankFilter.value
        
        const response = await axios.get('/expenses/statistics', { params })
        
        if (response.data.success) {
          categoryStats.value = response.data.data.category_statistics || []
        }
      } catch (error) {
        console.error('Error loading category stats:', error)
      }
    }
    
    const loadCategories = async () => {
      try {
        const response = await axios.get('/expenses/categories')
        if (response.data.success) {
          categories.value = response.data.data.used_categories.map(cat => cat.category)
        }
      } catch (error) {
        console.error('Error loading categories:', error)
      }
    }
    
    const loadTanks = async () => {
      await tanksStore.fetchTanks()
      tanks.value = tanksStore.tanks
    }
    
    const editExpense = (expense) => {
      editingExpense.value = expense
      Object.keys(expenseForm).forEach(key => {
        expenseForm[key] = expense[key] || (typeof expenseForm[key] === 'string' ? '' : null)
      })
      showCreateForm.value = true
    }
    
    const saveExpense = async () => {
      try {
        const valid = await expenseFormRef.value.validate()
        if (!valid) return
        
        saving.value = true
        let response
        
        const payload = {
          ...expenseForm,
          tank_id: expenseForm.tank_id || null
        }
        
        if (editingExpense.value) {
          response = await axios.put(`/expenses/${editingExpense.value.id}`, payload)
        } else {
          response = await axios.post('/expenses', payload)
        }
        
        if (response.data.success) {
          const expenseId = editingExpense.value ? editingExpense.value.id : response.data.data.id
          // Upload receipt if selected
          if (receiptFile.value) {
            const fd = new FormData()
            fd.append('receipt', receiptFile.value)
            await axios.post(`/expenses/${expenseId}/receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
          }
          ElMessage.success(editingExpense.value ? 'Cập nhật chi phí thành công!' : 'Thêm chi phí thành công!')
          showCreateForm.value = false
          resetForm()
          loadExpenses()
          loadCategoryStats()
        } else {
          ElMessage.error('Có lỗi xảy ra')
        }
      } catch (error) {
        ElMessage.error('Lỗi lưu chi phí')
        console.error(error)
      } finally {
        saving.value = false
      }
    }
    
    const deleteExpense = async (expenseId) => {
      try {
        await ElMessageBox.confirm(
          'Bạn có chắc chắn muốn xóa chi phí này?',
          'Xác nhận xóa',
          {
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
            type: 'warning',
          }
        )
        
        const response = await axios.delete(`/expenses/${expenseId}`)
        if (response.data.success) {
          ElMessage.success('Xóa chi phí thành công!')
          loadExpenses()
          loadCategoryStats()
        }
      } catch (error) {
        if (error !== 'cancel') {
          ElMessage.error('Lỗi xóa chi phí')
        }
      }
    }
    
    const resetForm = () => {
      editingExpense.value = null
      Object.keys(expenseForm).forEach(key => {
        if (key === 'expense_date') {
          expenseForm[key] = new Date().toISOString().split('T')[0]
        } else if (key === 'tank_id') {
          expenseForm[key] = null
        } else if (typeof expenseForm[key] === 'string') {
          expenseForm[key] = ''
        } else {
          expenseForm[key] = null
        }
      })
      expenseFormRef.value?.resetFields()
      receiptFile.value = null
      receiptPreview.value = ''
    }
    
    const exportData = () => {
      // Simple CSV export
      const csvContent = [
        ['Ngày', 'Danh mục', 'Mô tả', 'Hồ cá', 'Số tiền', 'Ghi chú'],
        ...expenses.value.map(expense => [
          expense.expense_date,
          expense.category,
          expense.description || '',
          expense.tank_name || 'Chung',
          expense.amount,
          expense.notes || ''
        ])
      ]
      .map(row => row.join(','))
      .join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `chi-phi-${yearFilter.value}${monthFilter.value ? `-thang-${monthFilter.value}` : ''}.csv`
      link.click()
      
      ElMessage.success('Xuất dữ liệu thành công!')
    }

    const onReceiptChange = (e) => {
      const file = e.target.files?.[0]
      if (!file) { receiptFile.value = null; receiptPreview.value = ''; return }
      receiptFile.value = file
      receiptPreview.value = URL.createObjectURL(file)
    }

    const fullUrl = (p) => {
      if (!p) return ''
      if (p.startsWith('http')) return p
      return config.buildUrl(p)
    }

    const openImage = (src) => {
      imageViewerSrc.value = src
      imageViewerVisible.value = true
    }
    
    // Watch filters
    watch([tankFilter, categoryFilter, yearFilter, monthFilter], () => {
      loadExpenses()
      loadCategoryStats()
    })
    
    onMounted(() => {
      loadExpenses()
      loadCategoryStats()
      loadCategories()
      loadTanks()
    })
    
    const activeTab = ref('purchase')

    const filteredPurchase = computed(() => expenses.value.filter(e => (e.expense_type || 'purchase') === 'purchase'))
    const filteredSale = computed(() => expenses.value.filter(e => e.expense_type === 'sale'))

    // Calculate totals
    const totalPurchase = computed(() => 
      filteredPurchase.value.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    )
    
    const totalSale = computed(() => 
      filteredSale.value.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    )
    
    const netTotal = computed(() => totalSale.value - totalPurchase.value)
    
    const totalExpenses = computed(() => totalPurchase.value + totalSale.value)

    const isMobile = computed(() => {
      return window.innerWidth <= 768
    })
    
    return {
      loading,
      saving,
      expenses,
      tanks,
      categories,
      categoryStats,
      showCreateForm,
      editingExpense,
      tankFilter,
      categoryFilter,
      yearFilter,
      monthFilter,
      expenseFormRef,
      expenseForm,
      expenseRules,
      defaultCategories,
      months,
      availableYears,
      // old metrics (kept if used elsewhere)
      monthlyTotal,
      lastMonthTotal,
      yearlyTotal,
      totalTransactions,
      averageExpense,
      // new metrics
      purchaseMonthTotal,
      purchaseYearTotal,
      saleMonthTotal,
      saleYearTotal,
      totalProfitYear,
      totalSaleTransactionsYear,
      totalProfitMonth,
      totalSaleTransactionsMonth,
      formatCurrency,
      formatDate,
      formatChange,
      getChangeClass,
      getCategoryTagType,
      editExpense,
      saveExpense,
      deleteExpense,
      resetForm,
      exportData,
      receiptPreview,
      onReceiptChange,
      fullUrl,
      imageViewerVisible,
      imageViewerSrc,
      openImage,
      // tabs
      activeTab,
      filteredPurchase,
      filteredSale,
      totalPurchase,
      totalSale,
      netTotal,
      totalExpenses,
      isMobile
    }
  }
}
</script>

<style scoped>
.expense-list {
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

.summary-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 40px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06);
  border: 1px solid #f3f4f6;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.summary-card:nth-child(1)::before { background: linear-gradient(90deg, #10b981, #059669); }
.summary-card:nth-child(2)::before { background: linear-gradient(90deg, #ef4444, #dc2626); }
.summary-card:nth-child(3)::before { background: linear-gradient(90deg, #6366f1, #4f46e5); }
.summary-card:nth-child(4)::before { background: linear-gradient(90deg, #f59e0b, #d97706); }

.summary-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
}

.summary-card:hover::before {
  opacity: 1;
}

.summary-content h3 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #2c3e50;
  font-weight: 600;
}

.summary-content p {
  margin: 0 0 4px 0;
  color: #7f8c8d;
  font-size: 14px;
}

.summary-content small {
  color: #bbb;
  font-size: 12px;
}

.text-success {
  color: #52c41a;
}

.text-danger {
  color: #f5222d;
}

.filter-select {
  min-width: 180px;
}

.filter-select--small {
  min-width: 120px;
}

.export-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: none;
  color: white;
  font-weight: 600;
}

.export-btn:hover {
  background: linear-gradient(135deg, #059669, #047857);
}

.table-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.action-btn {
  height: 32px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 0 8px;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.action-btn--edit:hover {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-color: #2563eb;
}

.action-btn--delete:hover {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  border-color: #dc2626;
}

@media (max-width: 768px) {
  .filter-select {
    min-width: auto;
  }
  
  .filter-select--small {
    min-width: auto;
  }
  
  .table-actions {
    flex-direction: column;
    gap: 4px;
  }
}

.stats-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stats-section h2 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 20px;
}

.category-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.category-stat {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e9ecef;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-header h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.stat-percentage {
  background: #1890ff;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.stat-amount {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-count {
  font-size: 12px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.stat-bar {
  width: 100%;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  overflow: hidden;
}

.stat-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1890ff, #40a9ff);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.expense-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 24px;
}

.expense-tabs .el-tabs__header {
  margin: 0;
  padding: 0 24px;
  border-bottom: 1px solid #f0f0f0;
}

.expense-tabs .el-tabs__content {
  padding: 24px;
}

.expense-table {
  width: 100%;
}

.expense-table .el-table {
  border-radius: 8px;
  overflow: hidden;
}

.expense-table .el-table th {
  background: #fafafa;
  color: #2c3e50;
  font-weight: 600;
}

.expense-table .el-table td {
  padding: 16px 8px;
}

.expense-amount {
  font-weight: 600;
  font-size: 16px;
}

.expense-amount.positive {
  color: #52c41a;
}

.expense-amount.negative {
  color: #f5222d;
}

.expense-receipt {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  transition: transform 0.2s;
}

.expense-receipt:hover {
  transform: scale(1.05);
}

.expense-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.expense-actions .el-button {
  padding: 6px 12px;
  font-size: 12px;
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

/* Desktop Optimization Styles */
@media (min-width: 1024px) {
  .expense-list {
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
  
  .summary-cards {
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    margin-bottom: 48px;
  }
  
  .summary-card {
    padding: 32px;
    min-height: 160px;
  }
  
  .summary-card h3 {
    font-size: 36px;
  }
  
  .summary-card p {
    font-size: 16px;
  }
  
  .expense-table {
    padding: 32px;
  }
  
  .expense-table h2 {
    font-size: 28px;
    margin-bottom: 32px;
  }
}

/* Tablet Optimization */
@media (min-width: 769px) and (max-width: 1023px) {
  .expense-list {
    padding: 32px;
    max-width: 1000px;
    margin: 0 auto;
  }
  
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
  
  .summary-card {
    padding: 24px;
    min-height: 140px;
  }
  
  .expense-table {
    padding: 24px;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .expense-list {
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
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
    gap: 16px 12px;
    margin-bottom: 32px;
  }
  
  .summary-card {
    padding: 16px;
  }
  
  .summary-content h3 {
    font-size: 20px;
  }
  

  
  .stats-section {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .stats-section h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }
  
  .category-stats {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .expense-tabs .el-tabs__header {
    padding: 0 16px;
  }
  
  .expense-tabs .el-tabs__content {
    padding: 16px;
  }
  
  .expense-table .el-table {
    font-size: 14px;
  }
  
  .expense-table .el-table td {
    padding: 12px 6px;
  }
  
  .expense-amount {
    font-size: 14px;
  }
  
  .expense-receipt {
    width: 50px;
    height: 50px;
  }
  
  .expense-actions {
    flex-direction: column;
    gap: 6px;
  }
  
  .expense-actions .el-button {
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
  }
  
  .empty-state {
    padding: 40px 16px;
  }
  
  .empty-content h3 {
    font-size: 18px;
  }
  
  .empty-content p {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .expense-list {
    padding: 16px;
  }
  
  .summary-cards {
    grid-template-columns: 1fr 1fr;
    gap: 12px 8px;
    margin-bottom: 24px;
  }
  
  .summary-card {
    padding: 16px;
    border-radius: 12px;
  }
  
  .summary-content h3 {
    font-size: 18px;
  }
  
  .summary-content p {
    font-size: 13px;
  }
  
  .summary-content small {
    font-size: 11px;
  }
  
  .stats-section {
    padding: 16px;
    border-radius: 10px;
  }
  
  .expenses-section {
    padding: 5px;
    border-radius: 10px;
  }
  
  .action-btn {
    height: 28px;
    font-size: 11px;
    gap: 2px;
    padding: 0 6px;
  }
  
  .expense-tabs .el-tabs__header {
    padding: 0 16px;
  }
  
  .expense-tabs .el-tabs__content {
    padding: 12px;
  }
  
  .expense-table .el-table {
    font-size: 13px;
  }
  
  .expense-table .el-table td {
    padding: 8px 4px;
  }
  
  .expense-receipt {
    width: 40px;
    height: 40px;
  }
}

/* Expense Form Dialog Responsive Styles */
.expense-form-dialog .el-dialog__header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f2f5;
  background: #fafbfc;
}

.expense-form-dialog .el-dialog__title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.expense-form-dialog .el-dialog__body {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.expense-form-dialog .el-dialog__footer {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f2f5;
  background: #fafbfc;
}

/* Form Elements */
.expense-form-dialog .el-form {
  max-width: none;
}

.expense-form-dialog .el-form-item {
  margin-bottom: 20px;
}

.expense-form-dialog .el-form-item__label {
  font-weight: 600;
  color: #374151;
  line-height: 1.5;
  padding-bottom: 8px;
}

.expense-form-dialog .el-input,
.expense-form-dialog .el-date-picker,
.expense-form-dialog .el-input-number,
.expense-form-dialog .el-select {
  width: 100%;
}

.expense-form-dialog .el-input__wrapper {
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  min-height: 44px;
}

.expense-form-dialog .el-input__wrapper:hover {
  border-color: #d1d5db;
}

.expense-form-dialog .el-input__wrapper.is-focus {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.expense-form-dialog .el-segmented {
  width: 100%;
}

/* Mobile Responsive for Expense Form Dialog */
@media (max-width: 768px) {
  .expense-form-dialog.el-dialog {
    width: 95% !important;
    margin: 16px auto !important;
    max-width: none !important;
  }
  
  .expense-form-dialog.el-dialog.is-fullscreen {
    width: 100% !important;
    height: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
  }
  
  .expense-form-dialog .el-dialog__header {
    padding: 16px 20px 14px;
  }
  
  .expense-form-dialog .el-dialog__title {
    font-size: 18px;
  }
  
  .expense-form-dialog .el-dialog__body {
    padding: 20px;
    max-height: calc(100vh - 140px);
  }
  
  .expense-form-dialog .el-dialog__footer {
    padding: 14px 20px 16px;
    position: sticky;
    bottom: 0;
    background: white;
  }
  
  .expense-form-dialog .el-form-item {
    margin-bottom: 18px;
  }
  
  .expense-form-dialog .el-form-item__label {
    font-size: 15px;
    margin-bottom: 6px;
    display: block;
    width: 100% !important;
    text-align: left !important;
    padding-bottom: 6px;
  }
  
  .expense-form-dialog .el-input__wrapper,
  .expense-form-dialog .el-date-picker,
  .expense-form-dialog .el-input-number .el-input__wrapper {
    min-height: 48px;
    border-radius: 10px;
    font-size: 16px;
  }
  
  .expense-form-dialog .el-input__inner {
    font-size: 16px;
    line-height: 1.5;
  }
  
  .expense-form-dialog .el-button {
    min-height: 48px;
    padding: 12px 20px;
    font-size: 16px;
    border-radius: 10px;
    font-weight: 600;
  }
  
  .expense-form-dialog .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: stretch;
  }
  
  .expense-form-dialog .dialog-footer .el-button {
    flex: 1;
  }
  
  /* Select dropdown mobile optimization */
  .expense-form-dialog .el-select .el-input__wrapper {
    min-height: 48px;
  }
  
  .expense-form-dialog .el-select .el-input__inner {
    font-size: 16px;
    line-height: 1.5;
  }
  
  /* Segmented control mobile optimization */
  .expense-form-dialog .el-segmented {
    width: 100%;
  }
  
  .expense-form-dialog .el-segmented .el-segmented__item {
    min-height: 44px;
    font-size: 15px;
    padding: 8px 16px;
  }
  
  /* File input mobile optimization */
  .expense-form-dialog input[type="file"] {
    width: 100%;
    padding: 12px;
    border: 2px dashed #d1d5db;
    border-radius: 10px;
    background: #f9fafb;
    font-size: 16px;
    text-align: center;
  }
  
  .expense-form-dialog .el-image {
    border-radius: 8px !important;
  }
}

@media (max-width: 480px) {
  .expense-form-dialog.el-dialog {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 0 !important;
    height: 100% !important;
  }
  
  .expense-form-dialog .el-dialog__header {
    padding: 14px 16px 12px;
  }
  
  .expense-form-dialog .el-dialog__title {
    font-size: 17px;
  }
  
  .expense-form-dialog .el-dialog__body {
    padding: 16px;
    max-height: calc(100vh - 120px);
  }
  
  .expense-form-dialog .el-dialog__footer {
    padding: 12px 16px 14px;
  }
  
  .expense-form-dialog .el-form-item {
    margin-bottom: 16px;
  }
  
  .expense-form-dialog .el-form-item__label {
    font-size: 14px;
    margin-bottom: 6px;
  }
  
  .expense-form-dialog .el-input__wrapper,
  .expense-form-dialog .el-date-picker,
  .expense-form-dialog .el-input-number .el-input__wrapper {
    min-height: 46px;
    border-radius: 8px;
  }
  
  .expense-form-dialog .el-button {
    min-height: 46px;
    font-size: 15px;
  }
  
  .expense-form-dialog .el-segmented .el-segmented__item {
    min-height: 40px;
    font-size: 14px;
    padding: 6px 12px;
  }
}

/* Financial Summary Styles */
.financial-summary {
  margin-bottom: 32px;
}

.financial-summary h2 {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.summary-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  transition: all 0.3s ease;
}

.summary-card--expense::before {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.summary-card--income::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.summary-card--net::before {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.summary-card--total::before {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.summary-card--expense .card-icon {
  background: #fee2e2;
  color: #dc2626;
}

.summary-card--income .card-icon {
  background: #d1fae5;
  color: #059669;
}

.summary-card--net .card-icon {
  background: #dbeafe;
  color: #1d4ed8;
}

.summary-card--total .card-icon {
  background: #ede9fe;
  color: #7c3aed;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  flex: 1;
}

.card-amount {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
  line-height: 1.2;
}

.expense-amount {
  color: #dc2626;
}

.income-amount {
  color: #059669;
}

.profit-amount {
  color: #059669;
}

.loss-amount {
  color: #dc2626;
}

.total-amount {
  color: #7c3aed;
}

.card-count {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

/* Mobile Responsive for All Summary Cards */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .summary-card {
    padding: 18px;
  }
  
  .card-amount {
    font-size: 22px;
  }
  
  .card-icon {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
}

@media (max-width: 480px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .summary-card {
    padding: 16px;
  }
  
  .card-amount {
    font-size: 20px;
  }
  
  .card-header {
    gap: 10px;
    margin-bottom: 12px;
  }
  
  .card-icon {
    width: 32px;
    height: 32px;
    font-size: 14px;
  }
}

@media (max-width: 320px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .summary-card {
    padding: 12px;
  }
  
  .card-amount {
    font-size: 18px;
  }
  
  .card-title {
    font-size: 12px;
  }
  
  .card-count {
    font-size: 10px;
  }
  
  .card-header {
    gap: 8px;
    margin-bottom: 10px;
  }
  
  .card-icon {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}
</style>
