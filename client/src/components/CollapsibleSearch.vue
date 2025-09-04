<template>
  <div class="collapsible-search" :class="{ 'expanded': isExpanded }">
    <!-- Enhanced Toggle Section -->
    <div class="search-toggle-container">
      <div class="search-toggle" @click="toggleSearch">
        <div class="toggle-left">
          <div class="toggle-icon-wrapper">
            <el-icon class="toggle-icon" :class="{ 'rotated': isExpanded }">
              <Search v-if="!isExpanded" />
              <ArrowUp v-else />
            </el-icon>
          </div>
          <div class="toggle-content">
            <span class="toggle-title">{{ isExpanded ? 'Thu gọn tìm kiếm' : 'Tìm kiếm nâng cao' }}</span>
            <span class="toggle-subtitle">{{ isExpanded ? 'Ẩn bộ lọc tìm kiếm' : 'Mở rộng tùy chọn lọc' }}</span>
          </div>
        </div>
        <div class="toggle-right">
          <el-icon class="expand-arrow" :class="{ 'rotated': isExpanded }">
            <ArrowDown />
          </el-icon>
        </div>
      </div>
      
      <!-- Quick status indicator -->
      <div v-if="!isExpanded && hasActiveFilters" class="active-filters-indicator">
        <el-icon><Filter /></el-icon>
        <span>Đang lọc</span>
      </div>
    </div>

    <!-- Enhanced Search Content -->
    <div class="search-content" :class="{ 'collapsed': !isExpanded }">
      <div class="search-header">
        <div class="search-header-left">
          <el-icon class="search-header-icon"><Filter /></el-icon>
          <span class="search-header-title">Bộ lọc tìm kiếm</span>
        </div>
        <el-button 
          v-if="isExpanded && isMobile"
          type="text" 
          @click="toggleSearch"
          class="mobile-close-btn"
        >
          <el-icon><Close /></el-icon>
        </el-button>
      </div>
      
      <div class="search-filters">
        <slot name="filters">
          <!-- Default enhanced search input -->
          <div class="default-search-wrapper">
            <el-input 
              v-model="searchQuery" 
              :placeholder="placeholder"
              prefix-icon="Search"
              clearable
              @input="handleSearch"
              class="search-input"
              size="large"
            />
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Search, ArrowUp, ArrowDown, Filter, Close } from '@element-plus/icons-vue'

export default {
  name: 'CollapsibleSearch',
  components: {
    Search,
    ArrowUp, 
    ArrowDown,
    Filter,
    Close
  },
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    placeholder: {
      type: String,
      default: 'Tìm kiếm...'
    },
    autoCollapse: {
      type: Boolean,
      default: true
    },
    hasFilters: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'search'],
  setup(props, { emit }) {
    const isExpanded = ref(false)
    const isMobile = ref(false)
    
    const searchQuery = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })
    
    const hasActiveFilters = computed(() => {
      return props.hasFilters || (searchQuery.value && searchQuery.value.length > 0)
    })
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
      // Mặc định thu gọn trên tất cả thiết bị nếu autoCollapse = true
      if (props.autoCollapse) {
        isExpanded.value = false
      }
    }
    
    const toggleSearch = () => {
      isExpanded.value = !isExpanded.value
    }
    
    const handleSearch = (value) => {
      emit('search', value)
    }
    
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })
    
    return {
      isExpanded,
      isMobile,
      searchQuery,
      hasActiveFilters,
      toggleSearch,
      handleSearch
    }
  }
}
</script>

<style scoped>
.collapsible-search {
  position: relative;
  margin-bottom: 24px;
}

/* Enhanced Toggle Container */
.search-toggle-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

/* Professional Toggle Design */
.search-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.search-toggle:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
  background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
}

.toggle-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
}

.toggle-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.search-toggle:hover .toggle-icon-wrapper {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.toggle-icon {
  color: white;
  font-size: 20px;
  transition: transform 0.3s ease;
}

.toggle-icon.rotated {
  transform: rotate(180deg);
}

.toggle-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toggle-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.toggle-subtitle {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.toggle-right {
  flex-shrink: 0;
}

.expand-arrow {
  color: #94a3b8;
  font-size: 18px;
  transition: all 0.3s ease;
}

.expand-arrow.rotated {
  transform: rotate(180deg);
  color: #6366f1;
}

/* Active Filters Indicator */
.active-filters-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

/* Search Content - collapsed by default */
.search-content.collapsed {
  display: none;
}

/* Enhanced Search Content */
.search-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: slideDown 0.4s ease-out;
}

.search-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
}

.search-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-header-icon {
  font-size: 18px;
  color: white;
}

.search-header-title {
  font-size: 15px;
  font-weight: 700;
}

.mobile-close-btn {
  color: rgba(255, 255, 255, 0.9);
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.mobile-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

/* Enhanced Search Filters */
.search-filters {
  padding: 24px 20px;
  display: grid;
  grid-template-columns: 2fr repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  align-items: end;
  background: white;
}

.default-search-wrapper {
  min-width: 0;
}

/* Filter Select Styling */
.search-filters :deep(.filter-select) {
  width: 100%;
}

.search-filters :deep(.filter-select .el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-filters :deep(.filter-select .el-input__wrapper:hover) {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-filters :deep(.filter-select .el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

/* Limit Control Styling */
.search-filters :deep(.limit-control) {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.search-filters :deep(.limit-control .el-input-number) {
  width: 120px;
}

.search-filters :deep(.limit-control .el-input-number .el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-filters :deep(.limit-label) {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

/* Export Button Styling */
.search-filters :deep(.export-btn) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.search-filters :deep(.export-btn:hover) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}

/* Enhanced Search Input */
.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
}

.search-input :deep(.el-input__inner) {
  font-size: 15px;
  font-weight: 500;
  color: #1e293b;
  padding: 0 16px;
}

.search-input :deep(.el-input__prefix) {
  color: #64748b;
}

/* Tablet Responsive Styles */
@media (max-width: 1024px) {
  .search-filters {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  
  .default-search-wrapper {
    grid-column: 1 / -1;
  }
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .search-toggle-container {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .search-toggle {
    padding: 14px 16px;
    border-radius: 12px;
  }
  
  .toggle-left {
    gap: 12px;
  }
  
  .toggle-icon-wrapper {
    width: 42px;
    height: 42px;
    border-radius: 10px;
  }
  
  .toggle-icon {
    font-size: 18px;
  }
  
  .toggle-title {
    font-size: 15px;
  }
  
  .toggle-subtitle {
    font-size: 12px;
  }
  
  .search-content {
    border-radius: 12px;
  }
  
  .search-header {
    padding: 14px 16px;
  }
  
  .search-filters {
    padding: 20px 16px;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .default-search-wrapper {
    min-width: auto;
  }
  
  .search-input :deep(.el-input__inner) {
    font-size: 16px;
    padding: 0 14px;
  }
}

@media (max-width: 480px) {
  .search-toggle {
    padding: 12px 14px;
    border-radius: 10px;
  }
  
  .toggle-icon-wrapper {
    width: 38px;
    height: 38px;
    border-radius: 8px;
  }
  
  .toggle-icon {
    font-size: 16px;
  }
  
  .toggle-title {
    font-size: 14px;
  }
  
  .toggle-subtitle {
    font-size: 11px;
  }
  
  .search-header {
    padding: 12px 14px;
  }
  
  .search-header-title {
    font-size: 14px;
  }
  
  .search-filters {
    padding: 16px 14px;
    gap: 10px;
  }
  
  .active-filters-indicator {
    padding: 6px 10px;
    font-size: 11px;
  }
}

/* Enhanced Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-15px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
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

/* Professional Focus States */
.search-toggle:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.search-toggle:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .search-toggle {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-color: #475569;
    color: #f1f5f9;
  }
  
  .toggle-title {
    color: #f1f5f9;
  }
  
  .toggle-subtitle {
    color: #94a3b8;
  }
  
  .search-content {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    border-color: #475569;
  }
  
  .search-filters {
    background: #1e293b;
  }
}
</style>