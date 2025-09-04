import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

// Configure axios defaults
axios.defaults.baseURL = '/api'
axios.defaults.timeout = 30000 // 30 seconds

// Request interceptor để thêm auth token
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor để handle common errors
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const authStore = useAuthStore()
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      authStore.logout()
      ElMessage.error('Phiên đăng nhập đã hết hạn')
      window.location.href = '/login'
    } else if (error.response?.status === 403) {
      ElMessage.error('Bạn không có quyền thực hiện hành động này')
    } else if (error.response?.status === 429) {
      ElMessage.error('Quá nhiều yêu cầu, vui lòng thử lại sau')
    } else if (error.response?.status >= 500) {
      ElMessage.error('Lỗi server, vui lòng thử lại sau')
    } else if (error.code === 'NETWORK_ERROR') {
      ElMessage.error('Lỗi kết nối mạng')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('Yêu cầu quá thời gian chờ')
    }
    
    return Promise.reject(error)
  }
)

// API composable với enhanced error handling và caching
export function useApi() {
  // Cache for GET requests
  const cache = new Map()
  
  const request = async (config, options = {}) => {
    const {
      cache: useCache = false,
      cacheKey = null,
      cacheTTL = 5 * 60 * 1000, // 5 minutes
      retries = 0,
      retryDelay = 1000,
      onProgress = null,
      timeout = null
    } = options

    // Cache check for GET requests
    if (useCache && config.method === 'GET') {
      const key = cacheKey || `${config.method}:${config.url}:${JSON.stringify(config.params)}`
      const cached = cache.get(key)
      
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        return cached.data
      }
    }

    // Configure request
    const requestConfig = {
      ...config,
      timeout: timeout || axios.defaults.timeout
    }

    // Add progress handler for uploads
    if (onProgress && (config.method === 'POST' || config.method === 'PUT')) {
      requestConfig.onUploadProgress = onProgress
    }

    let lastError = null
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await axios(requestConfig)
        
        // Cache successful GET responses
        if (useCache && config.method === 'GET' && response.data.success) {
          const key = cacheKey || `${config.method}:${config.url}:${JSON.stringify(config.params)}`
          cache.set(key, {
            data: response.data,
            timestamp: Date.now()
          })
        }
        
        return response.data
      } catch (error) {
        lastError = error
        
        // Don't retry on client errors (4xx) except 429
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          break
        }
        
        // Retry logic
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt) // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // REST API methods
  const get = (url, params = {}, options = {}) => {
    return request({
      method: 'GET',
      url,
      params
    }, { cache: true, ...options })
  }

  const post = (url, data = {}, options = {}) => {
    return request({
      method: 'POST',
      url,
      data
    }, options)
  }

  const put = (url, data = {}, options = {}) => {
    return request({
      method: 'PUT',
      url,
      data
    }, options)
  }

  const del = (url, options = {}) => {
    return request({
      method: 'DELETE',
      url
    }, options)
  }

  const upload = (url, formData, options = {}) => {
    return request({
      method: 'POST',
      url,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }, options)
  }

  // Utility methods
  const clearCache = (pattern = null) => {
    if (pattern) {
      for (const key of cache.keys()) {
        if (key.includes(pattern)) {
          cache.delete(key)
        }
      }
    } else {
      cache.clear()
    }
  }

  const getCacheSize = () => cache.size

  const prefetch = async (requests = []) => {
    const promises = requests.map(req => {
      if (typeof req === 'string') {
        return get(req, {}, { cache: true })
      } else {
        return request(req, { cache: true, ...req.options })
      }
    })
    
    try {
      await Promise.allSettled(promises)
    } catch (error) {
      // Silent fail for prefetch
    }
  }

  return {
    request,
    get,
    post,
    put,
    delete: del,
    upload,
    clearCache,
    getCacheSize,
    prefetch
  }
}

// Specific API composables for different domains
export function useTanksApi() {
  const api = useApi()
  
  return {
    getTanks: () => api.get('/tanks', {}, { cache: true, cacheKey: 'tanks' }),
    getTank: (id) => api.get(`/tanks/${id}`, {}, { cache: true, cacheKey: `tank:${id}` }),
    createTank: (data) => api.post('/tanks', data),
    updateTank: (id, data) => api.put(`/tanks/${id}`, data),
    deleteTank: (id) => api.delete(`/tanks/${id}`),
    getTankPhotos: (id) => api.get(`/tanks/${id}/photos`),
    uploadTankPhoto: (id, file, onProgress) => {
      const formData = new FormData()
      formData.append('photo', file)
      return api.upload(`/tanks/${id}/photos`, formData, { onProgress })
    },
    deleteTankPhoto: (photoId) => api.delete(`/tank-photos/${photoId}`),
    // Dashboard methods
    getDashboardStats: () => api.get('/tanks/dashboard/stats', {}, { cache: true, cacheKey: 'dashboard-stats' }),
    getDashboardRecent: (params) => api.get('/tanks/dashboard/recent', params, { cache: true, cacheKey: 'dashboard-recent' })
  }
}

export function useBatchesApi() {
  const api = useApi()
  
  return {
    getBatches: (tankId) => api.get('/batches', { tank_id: tankId }, { cache: true }),
    getBatch: (id) => api.get(`/batches/${id}`, {}, { cache: true }),
    createBatch: (data) => api.post('/batches', data),
    updateBatch: (id, data) => api.put(`/batches/${id}`, data),
    deleteBatch: (id) => api.delete(`/batches/${id}`),
    addTracking: (batchId, data) => api.post(`/batches/${batchId}/tracking`, data),
    getTracking: (batchId) => api.get(`/batches/${batchId}/tracking`)
  }
}

export function useExpensesApi() {
  const api = useApi()
  
  return {
    getExpenses: (params = {}) => api.get('/expenses', params, { cache: true }),
    createExpense: (data) => api.post('/expenses', data),
    updateExpense: (id, data) => api.put(`/expenses/${id}`, data),
    deleteExpense: (id) => api.delete(`/expenses/${id}`),
    getCategories: () => api.get('/expenses/categories', {}, { cache: true })
  }
}

export function useEnvironmentApi() {
  const api = useApi()
  
  return {
    getLogs: (params = {}) => api.get('/environment', params, { cache: true }),
    createLog: (data) => api.post('/environment', data),
    updateLog: (id, data) => api.put(`/environment/${id}`, data),
    deleteLog: (id) => api.delete(`/environment/${id}`),
    getReminders: () => api.get('/environment/reminders', {}, { cache: true }),
    markReminderCompleted: (id) => api.post(`/environment/reminders/${id}/complete`)
  }
}
