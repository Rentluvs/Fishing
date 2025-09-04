import { defineStore } from 'pinia'
import config from '@/config'
import { useTanksApi } from '@/composables/useApi'

export const useTanksStore = defineStore('tanks', {
  state: () => ({
    tanks: [],
    currentTank: null,
    loading: false,
    error: null
  }),

  getters: {
    getTankById: (state) => (id) => {
      return state.tanks.find(tank => tank.id === parseInt(id))
    }
  },

  actions: {
    async fetchTanks() {
      this.loading = true
      this.error = null

      try {
        const api = useTanksApi()
        const response = await api.getTanks()
        if (response.success) {
          this.tanks = response.data
          
          // Load latest photo for each tank
          for (const tank of this.tanks) {
            try {
              const photoResponse = await api.getTankPhotos(tank.id)
              if (photoResponse.success && photoResponse.data.length > 0) {
                // Add full URL path for image display
                const photoPath = photoResponse.data[0].photo_path
                tank.latest_photo = config.buildUrl(photoPath)
              }
            } catch (photoError) {
              // Ignore photo loading errors
              console.warn(`Không thể tải ảnh cho hồ ${tank.id}:`, photoError)
            }
          }
        }
      } catch (error) {
        this.error = error.response?.data?.message || error.message || 'Lỗi tải danh sách hồ cá'
        console.error('Error fetching tanks:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchTankById(id) {
      this.loading = true
      this.error = null

      try {
        const api = useTanksApi()
        const response = await api.getTank(id)
        if (response.success) {
          this.currentTank = response.data
          return response.data
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Lỗi tải thông tin hồ cá'
        console.error('Error fetching tank:', error)
      } finally {
        this.loading = false
      }
    },

    async createTank(tankData) {
      this.loading = true
      this.error = null

      try {
        const api = useTanksApi()
        const response = await api.createTank(tankData)
        if (response.success) {
          this.tanks.unshift(response.data)
          return { success: true, data: response.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Lỗi tạo hồ cá mới'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateTank(id, tankData) {
      this.loading = true
      this.error = null

      try {
        const api = useTanksApi()
        const response = await api.updateTank(id, tankData)
        if (response.success) {
          const index = this.tanks.findIndex(tank => tank.id === parseInt(id))
          if (index !== -1) {
            this.tanks[index] = response.data
          }
          if (this.currentTank && this.currentTank.id === parseInt(id)) {
            this.currentTank = response.data
          }
          return { success: true, data: response.data }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Lỗi cập nhật hồ cá'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteTank(id) {
      this.loading = true
      this.error = null

      try {
        const api = useTanksApi()
        const response = await api.deleteTank(id)
        if (response.success) {
          this.tanks = this.tanks.filter(tank => tank.id !== parseInt(id))
          if (this.currentTank && this.currentTank.id === parseInt(id)) {
            this.currentTank = null
          }
          return { success: true }
        }
      } catch (error) {
        this.error = error.response?.data?.message || 'Lỗi xóa hồ cá'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    clearError() {
      this.error = null
    }
  }
})
