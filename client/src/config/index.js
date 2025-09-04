// Configuration file for environment-specific settings
const config = {
  // Base API URL - will be automatically detected
  get apiBaseUrl() {
    // In production, use relative paths
    if (process.env.NODE_ENV === 'production') {
      return ''
    }
    // In development, use localhost
    return 'http://localhost:5000'
  },

  // Helper function to build full URLs
  buildUrl(path) {
    if (!path) return ''
    if (path.startsWith('http')) return path
    
    // Ensure uploads path has /api prefix for consistency
    if (path.startsWith('/uploads/') && !path.startsWith('/api/uploads/')) {
      path = '/api' + path
    }
    
    // In development, prefix with API base (e.g., http://localhost:5000)
    if (this.isDevelopment()) {
      return this.apiBaseUrl + path
    }
    // In production, prefer current origin to ensure images load from same domain
    try {
      const origin = typeof window !== 'undefined' && window.location ? window.location.origin : ''
      return origin ? origin + path : path
    } catch (e) {
      return path
    }
  },

  // Helper function to check if running in production
  isProduction() {
    return process.env.NODE_ENV === 'production'
  },

  // Helper function to check if running in development
  isDevelopment() {
    return process.env.NODE_ENV === 'development'
  }
}

export default config
