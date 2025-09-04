<template>
  <div class="empty-state" :class="[`empty-state--${size}`, { 'empty-state--centered': centered }]">
    <div class="empty-state__content">
      <!-- Icon -->
      <div class="empty-state__icon">
        <el-icon v-if="icon" :size="iconSize">
          <component :is="icon" />
        </el-icon>
        <div v-else class="empty-state__default-icon">
          <el-icon :size="iconSize">
            <Box />
          </el-icon>
        </div>
      </div>

      <!-- Title -->
      <h3 v-if="title" class="empty-state__title">{{ title }}</h3>

      <!-- Description -->
      <p v-if="description" class="empty-state__description">{{ description }}</p>

      <!-- Actions -->
      <div v-if="$slots.actions || actionText" class="empty-state__actions">
        <slot name="actions">
          <el-button 
            v-if="actionText" 
            type="primary" 
            :icon="actionIcon"
            @click="$emit('action')"
          >
            {{ actionText }}
          </el-button>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { 
  Box, 
  Plus, 
  Search, 
  Document, 
  Picture, 
  User, 
  Calendar,
  Money,
  Fish
} from '@element-plus/icons-vue'

export default {
  name: 'EmptyState',
  components: {
    Box,
    Plus,
    Search,
    Document,
    Picture,
    User,
    Calendar,
    Money,
    Fish
  },
  props: {
    icon: {
      type: [String, Object],
      default: null
    },
    title: {
      type: String,
      default: 'Không có dữ liệu'
    },
    description: {
      type: String,
      default: null
    },
    actionText: {
      type: String,
      default: null
    },
    actionIcon: {
      type: [String, Object],
      default: Plus
    },
    size: {
      type: String,
      default: 'medium',
      validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    centered: {
      type: Boolean,
      default: true
    },
    type: {
      type: String,
      default: 'default',
      validator: (value) => ['default', 'search', 'error', 'create'].includes(value)
    }
  },
  emits: ['action'],
  computed: {
    iconSize() {
      const sizes = {
        small: 48,
        medium: 64,
        large: 80
      }
      return sizes[this.size]
    },
    
    defaultProps() {
      const presets = {
        search: {
          icon: Search,
          title: 'Không tìm thấy kết quả',
          description: 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc'
        },
        error: {
          icon: Document,
          title: 'Có lỗi xảy ra',
          description: 'Vui lòng thử lại sau hoặc liên hệ hỗ trợ'
        },
        create: {
          icon: Plus,
          title: 'Chưa có dữ liệu',
          description: 'Hãy tạo mục đầu tiên để bắt đầu'
        }
      }
      
      return presets[this.type] || {}
    }
  }
}
</script>

<style scoped>
.empty-state {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-state--centered {
  text-align: center;
}

.empty-state--small {
  padding: 20px;
  min-height: 120px;
}

.empty-state--large {
  padding: 60px 20px;
  min-height: 300px;
}

.empty-state__content {
  max-width: 400px;
  width: 100%;
}

.empty-state__icon {
  margin-bottom: 20px;
  color: #c0c4cc;
  display: flex;
  justify-content: center;
}

.empty-state--small .empty-state__icon {
  margin-bottom: 12px;
}

.empty-state--large .empty-state__icon {
  margin-bottom: 24px;
}

.empty-state__default-icon {
  opacity: 0.6;
}

.empty-state__title {
  font-size: 18px;
  font-weight: 500;
  color: #606266;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.empty-state--small .empty-state__title {
  font-size: 16px;
  margin-bottom: 8px;
}

.empty-state--large .empty-state__title {
  font-size: 20px;
  margin-bottom: 16px;
}

.empty-state__description {
  font-size: 14px;
  color: #909399;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.empty-state--small .empty-state__description {
  font-size: 13px;
  margin-bottom: 16px;
}

.empty-state--large .empty-state__description {
  font-size: 15px;
  margin-bottom: 32px;
}

.empty-state__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Type variations */
.empty-state--search .empty-state__icon {
  color: #909399;
}

.empty-state--error .empty-state__icon {
  color: #f56c6c;
}

.empty-state--create .empty-state__icon {
  color: #409eff;
}

/* Responsive */
@media (max-width: 768px) {
  .empty-state {
    padding: 30px 16px;
    min-height: 160px;
  }
  
  .empty-state__title {
    font-size: 16px;
  }
  
  .empty-state__description {
    font-size: 13px;
  }
  
  .empty-state__actions {
    flex-direction: column;
    align-items: center;
  }
  
  .empty-state__actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}

/* Animation */
.empty-state__content {
  animation: fadeInUp 0.3s ease-out;
}

@keyframes fadeInUp {
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
