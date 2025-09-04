<template>
  <div class="error-boundary">
    <!-- Error state -->
    <div v-if="hasError" class="error-boundary__error">
      <div class="error-boundary__content">
        <div class="error-boundary__icon">
          <el-icon :size="64">
            <WarningFilled />
          </el-icon>
        </div>
        
        <h2 class="error-boundary__title">{{ errorTitle }}</h2>
        <p class="error-boundary__message">{{ errorMessage }}</p>
        
        <!-- Error details (development only) -->
        <details v-if="showDetails && errorDetails" class="error-boundary__details">
          <summary>Chi tiết lỗi (Development)</summary>
          <pre class="error-boundary__stack">{{ errorDetails }}</pre>
        </details>
        
        <div class="error-boundary__actions">
          <el-button type="primary" @click="retry">
            <el-icon><Refresh /></el-icon>
            Thử lại
          </el-button>
          
          <el-button @click="reload">
            <el-icon><RefreshRight /></el-icon>
            Tải lại trang
          </el-button>
          
          <el-button 
            v-if="showReportButton" 
            type="info" 
            @click="reportError"
          >
            <el-icon><Warning /></el-icon>
            Báo cáo lỗi
          </el-button>
        </div>
      </div>
    </div>
    
    <!-- Normal content -->
    <div v-else class="error-boundary__content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import { ref, onErrorCaptured, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, Refresh, RefreshRight, Warning } from '@element-plus/icons-vue'

export default {
  name: 'ErrorBoundary',
  components: {
    WarningFilled,
    Refresh,
    RefreshRight,
    Warning
  },
  props: {
    // Custom error messages
    title: {
      type: String,
      default: 'Có lỗi xảy ra'
    },
    message: {
      type: String,
      default: 'Ứng dụng gặp lỗi không mong muốn. Vui lòng thử lại.'
    },
    // Show error details in development
    showDetails: {
      type: Boolean,
      default: process.env.NODE_ENV === 'development'
    },
    // Show report button
    showReportButton: {
      type: Boolean,
      default: false
    },
    // Auto retry options
    autoRetry: {
      type: Boolean,
      default: false
    },
    retryDelay: {
      type: Number,
      default: 3000
    },
    maxRetries: {
      type: Number,
      default: 3
    }
  },
  emits: ['error', 'retry'],
  setup(props, { emit }) {
    const hasError = ref(false)
    const errorInfo = ref(null)
    const retryCount = ref(0)
    
    const errorTitle = ref(props.title)
    const errorMessage = ref(props.message)
    const errorDetails = ref('')

    // Capture errors from child components
    onErrorCaptured((error, instance, info) => {
      handleError(error, info)
      
      // Prevent the error from propagating further
      return false
    })

    // Handle global errors
    onMounted(() => {
      window.addEventListener('error', (event) => {
        handleError(event.error, 'Global error')
      })
      
      window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason, 'Unhandled promise rejection')
      })
    })

    const handleError = (error, info) => {
      hasError.value = true
      errorInfo.value = { error, info }
      
      // Set error details
      errorDetails.value = error.stack || error.toString()
      
      // Customize error message based on error type
      if (error.name === 'ChunkLoadError') {
        errorTitle.value = 'Lỗi tải trang'
        errorMessage.value = 'Có phiên bản mới của ứng dụng. Vui lòng tải lại trang.'
      } else if (error.name === 'NetworkError') {
        errorTitle.value = 'Lỗi kết nối'
        errorMessage.value = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.'
      } else {
        errorTitle.value = props.title
        errorMessage.value = props.message
      }
      
      // Emit error event
      emit('error', { error, info })
      
      // Auto retry if enabled
      if (props.autoRetry && retryCount.value < props.maxRetries) {
        setTimeout(() => {
          retry()
        }, props.retryDelay)
      }
    }

    const retry = () => {
      retryCount.value++
      hasError.value = false
      errorInfo.value = null
      errorDetails.value = ''
      
      emit('retry', retryCount.value)
      
      ElMessage.info('Đang thử lại...')
    }

    const reload = () => {
      window.location.reload()
    }

    const reportError = () => {
      // In a real app, this would send error to logging service
      const errorReport = {
        error: errorInfo.value?.error?.toString(),
        stack: errorInfo.value?.error?.stack,
        info: errorInfo.value?.info,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }
      
      // Copy to clipboard for easy sharing
      navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
        .then(() => {
          ElMessage.success('Thông tin lỗi đã được sao chép vào clipboard')
        })
        .catch(() => {
          ElMessage.warning('Không thể sao chép thông tin lỗi')
        })
    }

    const reset = () => {
      hasError.value = false
      errorInfo.value = null
      errorDetails.value = ''
      retryCount.value = 0
    }

    return {
      hasError,
      errorTitle,
      errorMessage,
      errorDetails,
      retry,
      reload,
      reportError,
      reset
    }
  }
}
</script>

<style scoped>
.error-boundary {
  width: 100%;
  height: 100%;
}

.error-boundary__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px 20px;
  background: #fafafa;
  border-radius: 8px;
}

.error-boundary__content {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-boundary__icon {
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-boundary__title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px 0;
}

.error-boundary__message {
  font-size: 16px;
  color: #606266;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.error-boundary__details {
  text-align: left;
  margin: 20px 0;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.error-boundary__details summary {
  cursor: pointer;
  font-weight: 500;
  color: #606266;
  margin-bottom: 12px;
}

.error-boundary__stack {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #606266;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
}

.error-boundary__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Responsive */
@media (max-width: 768px) {
  .error-boundary__error {
    min-height: 300px;
    padding: 30px 16px;
  }
  
  .error-boundary__title {
    font-size: 20px;
  }
  
  .error-boundary__message {
    font-size: 14px;
  }
  
  .error-boundary__actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-boundary__actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}

/* Animation */
.error-boundary__error {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
