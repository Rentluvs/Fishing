// File utilities
export const fileUtils = {
  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  // Get file extension
  getFileExtension(filename) {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
  },

  // Check if file is image
  isImage(file) {
    return file.type.startsWith('image/')
  },

  // Validate file size
  validateFileSize(file, maxSize = 5 * 1024 * 1024) { // 5MB default
    return file.size <= maxSize
  },

  // Validate file type
  validateFileType(file, allowedTypes = ['image/jpeg', 'image/png', 'image/gif']) {
    return allowedTypes.includes(file.type)
  }
}

// Date utilities
export const dateUtils = {
  // Format date to Vietnamese locale
  formatDate(date, options = {}) {
    if (!date) return ''
    
    const defaultOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
    
    return new Date(date).toLocaleDateString('vi-VN', { ...defaultOptions, ...options })
  },

  // Format datetime
  formatDateTime(date) {
    if (!date) return ''
    return new Date(date).toLocaleString('vi-VN')
  },

  // Get relative time
  getRelativeTime(date) {
    if (!date) return ''
    
    const now = new Date()
    const target = new Date(date)
    const diff = now - target
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Vừa xong'
    if (minutes < 60) return `${minutes} phút trước`
    if (hours < 24) return `${hours} giờ trước`
    if (days < 7) return `${days} ngày trước`
    
    return this.formatDate(date)
  },

  // Check if date is today
  isToday(date) {
    if (!date) return false
    const today = new Date()
    const target = new Date(date)
    return today.toDateString() === target.toDateString()
  }
}

// Validation utilities
export const validationUtils = {
  // Validate email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  // Validate phone number
  isValidPhone(phone) {
    const phoneRegex = /^[0-9]{10,11}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  },

  // Validate password strength
  validatePassword(password) {
    const minLength = 6
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
      errors: [
        password.length < minLength && 'Mật khẩu phải có ít nhất 6 ký tự',
        !hasUpperCase && 'Mật khẩu phải có ít nhất 1 chữ hoa',
        !hasLowerCase && 'Mật khẩu phải có ít nhất 1 chữ thường',
        !hasNumbers && 'Mật khẩu phải có ít nhất 1 số'
      ].filter(Boolean)
    }
  }
}

// Storage utilities
export const storage = {
  // Local storage
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (err) {
      return false
    }
  },

  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch (err) {
      return defaultValue
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key)
      return true
    } catch (err) {
      return false
    }
  },

  clear() {
    try {
      localStorage.clear()
      return true
    } catch (err) {
      return false
    }
  }
}

// Performance utilities
export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export const throttle = (func, limit) => {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// String utilities
export const stringUtils = {
  // Capitalize first letter
  capitalize(str) {
    if (!str) return ''
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  // Truncate text
  truncate(text, length = 100, suffix = '...') {
    if (!text || text.length <= length) return text
    return text.substring(0, length) + suffix
  },

  // Generate random string
  randomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  },

  // Slugify text
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}

// Number utilities
export const numberUtils = {
  // Format number with commas
  formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  },

  // Format currency
  formatCurrency(amount, currency = 'VND') {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  },

  // Round to decimal places
  round(num, decimals = 2) {
    return Math.round((num + Number.EPSILON) * Math.pow(10, decimals)) / Math.pow(10, decimals)
  }
}

// Array utilities
export const arrayUtils = {
  // Remove duplicates
  unique(arr) {
    return [...new Set(arr)]
  },

  // Group by key
  groupBy(arr, key) {
    return arr.reduce((groups, item) => {
      const group = item[key]
      groups[group] = groups[group] || []
      groups[group].push(item)
      return groups
    }, {})
  },

  // Sort by key
  sortBy(arr, key, order = 'asc') {
    return [...arr].sort((a, b) => {
      const aVal = a[key]
      const bVal = b[key]
      
      if (order === 'desc') {
        return bVal > aVal ? 1 : -1
      }
      return aVal > bVal ? 1 : -1
    })
  }
}

// Color utilities
export const colorUtils = {
  // Generate random color
  randomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16)
  },

  // Lighten color
  lighten(color, percent) {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }
}

// Export all utilities
export default {
  fileUtils,
  dateUtils,
  validationUtils,
  storage,
  debounce,
  throttle,
  stringUtils,
  numberUtils,
  arrayUtils,
  colorUtils
}
