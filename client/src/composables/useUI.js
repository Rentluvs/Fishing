import { ref, computed, nextTick } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

// UI State Management Composable
export function useUI() {
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const uploading = ref(false)
  const progress = ref(0)

  const isLoading = computed(() => loading.value)
  const isSaving = computed(() => saving.value)
  const isDeleting = computed(() => deleting.value)
  const isUploading = computed(() => uploading.value)
  const isBusy = computed(() => loading.value || saving.value || deleting.value || uploading.value)

  const setLoading = (state) => loading.value = state
  const setSaving = (state) => saving.value = state
  const setDeleting = (state) => deleting.value = state
  const setUploading = (state) => uploading.value = state
  const setProgress = (value) => progress.value = Math.max(0, Math.min(100, value))

  const resetStates = () => {
    loading.value = false
    saving.value = false
    deleting.value = false
    uploading.value = false
    progress.value = 0
  }

  return {
    loading,
    saving,
    deleting,
    uploading,
    progress,
    isLoading,
    isSaving,
    isDeleting,
    isUploading,
    isBusy,
    setLoading,
    setSaving,
    setDeleting,
    setUploading,
    setProgress,
    resetStates
  }
}

// Notification System Composable
export function useNotifications() {
  const showSuccess = (message, title = 'Thành công', options = {}) => {
    ElNotification({
      title,
      message,
      type: 'success',
      duration: 3000,
      ...options
    })
  }

  const showError = (message, title = 'Lỗi', options = {}) => {
    ElNotification({
      title,
      message,
      type: 'error',
      duration: 5000,
      ...options
    })
  }

  const showWarning = (message, title = 'Cảnh báo', options = {}) => {
    ElNotification({
      title,
      message,
      type: 'warning',
      duration: 4000,
      ...options
    })
  }

  const showInfo = (message, title = 'Thông tin', options = {}) => {
    ElNotification({
      title,
      message,
      type: 'info',
      duration: 3000,
      ...options
    })
  }

  const toast = {
    success: (message) => ElMessage.success(message),
    error: (message) => ElMessage.error(message),
    warning: (message) => ElMessage.warning(message),
    info: (message) => ElMessage.info(message)
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toast
  }
}

// Responsive Design Composable
export function useResponsive() {
  const windowWidth = ref(window.innerWidth)
  const windowHeight = ref(window.innerHeight)

  const updateDimensions = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  window.addEventListener('resize', updateDimensions)

  const isMobile = computed(() => windowWidth.value < 768)
  const isTablet = computed(() => windowWidth.value >= 768 && windowWidth.value < 1024)
  const isDesktop = computed(() => windowWidth.value >= 1024)
  const isSmallScreen = computed(() => windowWidth.value < 1200)

  const breakpoint = computed(() => {
    if (windowWidth.value < 576) return 'xs'
    if (windowWidth.value < 768) return 'sm'
    if (windowWidth.value < 992) return 'md'
    if (windowWidth.value < 1200) return 'lg'
    return 'xl'
  })

  return {
    windowWidth,
    windowHeight,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    breakpoint
  }
}

// Modal/Dialog State Management
export function useModal() {
  const visible = ref(false)
  const data = ref(null)
  const options = ref({})

  const open = (modalData = null, modalOptions = {}) => {
    data.value = modalData
    options.value = modalOptions
    visible.value = true
  }

  const close = () => {
    visible.value = false
    nextTick(() => {
      data.value = null
      options.value = {}
    })
  }

  const toggle = () => {
    if (visible.value) {
      close()
    } else {
      open()
    }
  }

  return {
    visible,
    data,
    options,
    open,
    close,
    toggle
  }
}

// Search and Filter Composable
export function useSearch(initialItems = [], searchFields = []) {
  const searchTerm = ref('')
  const filters = ref({})
  const sortBy = ref('')
  const sortOrder = ref('asc')

  const filteredItems = computed(() => {
    let result = [...initialItems]

    // Apply search
    if (searchTerm.value) {
      const term = searchTerm.value.toLowerCase()
      result = result.filter(item => {
        if (searchFields.length === 0) {
          return JSON.stringify(item).toLowerCase().includes(term)
        }
        
        return searchFields.some(field => {
          const value = getNestedValue(item, field)
          return value && value.toString().toLowerCase().includes(term)
        })
      })
    }

    // Apply filters
    Object.entries(filters.value).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        result = result.filter(item => {
          const itemValue = getNestedValue(item, key)
          if (Array.isArray(value)) {
            return value.includes(itemValue)
          }
          return itemValue === value
        })
      }
    })

    // Apply sorting
    if (sortBy.value) {
      result.sort((a, b) => {
        const aValue = getNestedValue(a, sortBy.value)
        const bValue = getNestedValue(b, sortBy.value)
        
        if (aValue === bValue) return 0
        
        const comparison = aValue > bValue ? 1 : -1
        return sortOrder.value === 'desc' ? -comparison : comparison
      })
    }

    return result
  })

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((o, p) => o && o[p], obj)
  }

  const setFilter = (key, value) => {
    filters.value[key] = value
  }

  const clearFilter = (key) => {
    delete filters.value[key]
  }

  const clearAllFilters = () => {
    filters.value = {}
    searchTerm.value = ''
  }

  const setSort = (field, order = 'asc') => {
    sortBy.value = field
    sortOrder.value = order
  }

  const toggleSort = (field) => {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      setSort(field, 'asc')
    }
  }

  return {
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    filteredItems,
    setFilter,
    clearFilter,
    clearAllFilters,
    setSort,
    toggleSort
  }
}

// Pagination Composable
export function usePagination(totalItems = 0, pageSize = 10) {
  const currentPage = ref(1)
  const itemsPerPage = ref(pageSize)

  const totalPages = computed(() => Math.ceil(totalItems / itemsPerPage.value))
  const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
  const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, totalItems))
  const hasNext = computed(() => currentPage.value < totalPages.value)
  const hasPrev = computed(() => currentPage.value > 1)

  const setPage = (page) => {
    currentPage.value = Math.max(1, Math.min(page, totalPages.value))
  }

  const nextPage = () => {
    if (hasNext.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (hasPrev.value) {
      currentPage.value--
    }
  }

  const setPageSize = (size) => {
    itemsPerPage.value = size
    currentPage.value = 1
  }

  const reset = () => {
    currentPage.value = 1
  }

  const paginatedItems = (items) => {
    return items.slice(startIndex.value, endIndex.value)
  }

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    hasNext,
    hasPrev,
    setPage,
    nextPage,
    prevPage,
    setPageSize,
    reset,
    paginatedItems
  }
}
