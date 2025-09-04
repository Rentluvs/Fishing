import { defineStore } from 'pinia'
import axios from 'axios'

// Sử dụng proxy của Vue dev server thay vì URL trực tiếp
const API_BASE_URL = '/api'

// Configure axios base URL
if (!axios.defaults.baseURL) {
  axios.defaults.baseURL = API_BASE_URL
}

// Add request interceptor if not already added
if (!axios.defaults.headers.common['X-Auth-Configured']) {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }
  )
  
  // Mark as configured to avoid duplicate interceptors
  axios.defaults.headers.common['X-Auth-Configured'] = 'true'
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    isLoading: (state) => state.loading
  },

  actions: {
    async login(credentials) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/auth/login', credentials)
        
        if (response.data.success) {
          this.user = response.data.data.user
          this.token = response.data.data.token
          localStorage.setItem('token', this.token)
          return { success: true }
        } else {
          throw new Error(response.data.message || 'Đăng nhập thất bại')
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Lỗi đăng nhập'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async register(userData) {
      this.loading = true
      this.error = null

      try {
        const response = await axios.post('/auth/register', userData)
        
        if (response.data.success) {
          this.user = response.data.data.user
          this.token = response.data.data.token
          localStorage.setItem('token', this.token)
          return { success: true }
        } else {
          throw new Error(response.data.message || 'Đăng ký thất bại')
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Lỗi đăng ký'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async getCurrentUser() {
      if (!this.token) return

      try {
        const response = await axios.get('/auth/me')
        
        if (response.data.success) {
          this.user = response.data.data.user
        }
      } catch (error) {
        console.error('Error getting current user:', error)
        this.logout()
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.error = null
      localStorage.removeItem('token')
    },

    clearError() {
      this.error = null
    }
  }
})
