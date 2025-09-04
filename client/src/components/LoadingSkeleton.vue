<template>
  <div class="loading-skeleton" :class="{ 'loading-skeleton--animated': animated }">
    <!-- Card skeleton -->
    <div v-if="type === 'card'" class="skeleton-card">
      <div class="skeleton-avatar" v-if="showAvatar"></div>
      <div class="skeleton-content">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle" v-if="showSubtitle"></div>
        <div class="skeleton-text" v-for="n in textLines" :key="n"></div>
      </div>
    </div>

    <!-- List skeleton -->
    <div v-else-if="type === 'list'" class="skeleton-list">
      <div v-for="n in count" :key="n" class="skeleton-list-item">
        <div class="skeleton-avatar" v-if="showAvatar"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
        </div>
        <div class="skeleton-action" v-if="showAction"></div>
      </div>
    </div>

    <!-- Table skeleton -->
    <div v-else-if="type === 'table'" class="skeleton-table">
      <div class="skeleton-table-header">
        <div v-for="n in columns" :key="n" class="skeleton-table-cell"></div>
      </div>
      <div v-for="n in rows" :key="n" class="skeleton-table-row">
        <div v-for="m in columns" :key="m" class="skeleton-table-cell"></div>
      </div>
    </div>

    <!-- Form skeleton -->
    <div v-else-if="type === 'form'" class="skeleton-form">
      <div v-for="n in count" :key="n" class="skeleton-form-item">
        <div class="skeleton-label"></div>
        <div class="skeleton-input"></div>
      </div>
    </div>

    <!-- Custom skeleton -->
    <div v-else class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoadingSkeleton',
  props: {
    type: {
      type: String,
      default: 'card',
      validator: (value) => ['card', 'list', 'table', 'form', 'custom'].includes(value)
    },
    count: {
      type: Number,
      default: 3
    },
    animated: {
      type: Boolean,
      default: true
    },
    showAvatar: {
      type: Boolean,
      default: true
    },
    showSubtitle: {
      type: Boolean,
      default: true
    },
    showAction: {
      type: Boolean,
      default: true
    },
    textLines: {
      type: Number,
      default: 2
    },
    columns: {
      type: Number,
      default: 4
    },
    rows: {
      type: Number,
      default: 5
    }
  }
}
</script>

<style scoped>
.loading-skeleton {
  --skeleton-color: #f2f2f2;
  --skeleton-highlight: #ffffff;
}

.skeleton-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 16px;
}

.skeleton-avatar {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: var(--skeleton-color);
  flex-shrink: 0;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-title {
  height: 20px;
  background: var(--skeleton-color);
  border-radius: 4px;
  width: 70%;
}

.skeleton-subtitle {
  height: 16px;
  background: var(--skeleton-color);
  border-radius: 4px;
  width: 50%;
}

.skeleton-text {
  height: 14px;
  background: var(--skeleton-color);
  border-radius: 4px;
  width: 90%;
}

.skeleton-text:last-child {
  width: 60%;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-list-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.skeleton-list-item .skeleton-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.skeleton-action {
  width: 80px;
  height: 32px;
  background: var(--skeleton-color);
  border-radius: 4px;
  margin-left: auto;
}

.skeleton-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-table-header {
  display: flex;
  background: #f5f5f5;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.skeleton-table-row {
  display: flex;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.skeleton-table-cell {
  flex: 1;
  height: 16px;
  background: var(--skeleton-color);
  border-radius: 4px;
  margin-right: 16px;
}

.skeleton-table-cell:last-child {
  margin-right: 0;
}

.skeleton-form {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skeleton-form-item {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-label {
  width: 120px;
  height: 16px;
  background: var(--skeleton-color);
  border-radius: 4px;
}

.skeleton-input {
  height: 40px;
  background: var(--skeleton-color);
  border-radius: 4px;
}

/* Animation */
.loading-skeleton--animated .skeleton-avatar,
.loading-skeleton--animated .skeleton-title,
.loading-skeleton--animated .skeleton-subtitle,
.loading-skeleton--animated .skeleton-text,
.loading-skeleton--animated .skeleton-action,
.loading-skeleton--animated .skeleton-table-cell,
.loading-skeleton--animated .skeleton-label,
.loading-skeleton--animated .skeleton-input {
  background: linear-gradient(
    90deg,
    var(--skeleton-color) 25%,
    var(--skeleton-highlight) 50%,
    var(--skeleton-color) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .skeleton-card {
    padding: 16px;
    flex-direction: column;
  }
  
  .skeleton-table {
    overflow-x: auto;
  }
  
  .skeleton-table-header,
  .skeleton-table-row {
    min-width: 600px;
  }
}
</style>
