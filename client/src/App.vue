<template>
  <div id="app">
    <div v-if="!isAuthRoute" class="layout">
      <!-- Mobile toggle button -->
      <div class="mobile-toggle" @click="toggleSidebar">
        <el-icon><Menu /></el-icon>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
        <div class="sidebar-header">
          <h2 v-show="!isSidebarCollapsed">🐟 Quản lý cá cảnh</h2>
          <h2 v-show="isSidebarCollapsed">🐟</h2>
        </div>
        
        <nav class="sidebar-nav">
          <router-link to="/dashboard" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><House /></el-icon>
            <span v-show="!isSidebarCollapsed">Dashboard</span>
          </router-link>
          
          <router-link to="/tanks" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><Box /></el-icon>
            <span v-show="!isSidebarCollapsed">Quản lý hồ cá</span>
          </router-link>
          
          <router-link to="/batches" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><List /></el-icon>
            <span v-show="!isSidebarCollapsed">Theo dõi lứa cá</span>
          </router-link>
          
          <router-link to="/environment" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><Calendar /></el-icon>
            <span v-show="!isSidebarCollapsed">Nhật ký môi trường</span>
          </router-link>
          
          <router-link to="/expenses" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><Money /></el-icon>
            <span v-show="!isSidebarCollapsed">Quản lý chi phí</span>
          </router-link>

          <router-link to="/change-password" class="nav-item" @click="closeSidebarOnMobile">
            <el-icon><Lock /></el-icon>
            <span v-show="!isSidebarCollapsed">Đổi mật khẩu</span>
          </router-link>
        </nav>
        
        <div class="sidebar-footer">
          <div class="user-info" v-show="!isSidebarCollapsed">
            <span>{{ authStore.user?.fullName || authStore.user?.username }}</span>
          </div>
          <el-button @click="handleLogout" type="danger" size="small" :class="{ 'collapsed-btn': isSidebarCollapsed }">
            <el-icon><SwitchButton /></el-icon>
            <span v-show="!isSidebarCollapsed">Đăng xuất</span>
          </el-button>
        </div>
      </aside>

      <!-- Overlay for mobile -->
      <div v-if="!isSidebarCollapsed && isMobile" class="sidebar-overlay" @click="closeSidebar"></div>
      
      <!-- Main content -->
      <main class="main-content" :class="{ 'sidebar-collapsed': isSidebarCollapsed }">
        <router-view />
        <!-- Footer -->
        <footer class="app-footer">
          <span>Dev by ThanhTD &copy; {{ currentYear }}</span>
        </footer>
      </main>
    </div>
    
    <!-- Auth routes (login page) -->
    <div v-else class="auth-layout">
      <router-view />
      <!-- Footer for auth pages too -->
      <footer class="app-footer auth-footer">
        <span>Dev by ThanhTD &copy; {{ currentYear }}</span>
      </footer>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'App',
  setup() {
    const route = useRoute()
    const router = useRouter()
    const authStore = useAuthStore()
    
    const isSidebarCollapsed = ref(false)
    const isMobile = ref(false)
    
    const isAuthRoute = computed(() => {
      return route.path === '/login' || route.path === '/register'
    })
    
    const currentYear = computed(() => {
      return new Date().getFullYear()
    })
    
    const checkMobile = () => {
      isMobile.value = window.innerWidth <= 768
      if (isMobile.value) {
        isSidebarCollapsed.value = true
      }
    }
    
    const toggleSidebar = () => {
      isSidebarCollapsed.value = !isSidebarCollapsed.value
    }
    
    const closeSidebar = () => {
      if (isMobile.value) {
        isSidebarCollapsed.value = true
      }
    }
    
    const closeSidebarOnMobile = () => {
      if (isMobile.value) {
        isSidebarCollapsed.value = true
      }
    }
    
    onMounted(() => {
      checkMobile()
      window.addEventListener('resize', checkMobile)
    })
    
    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile)
    })
    
    const handleLogout = async () => {
      try {
        authStore.logout()
        ElMessage.success('Đăng xuất thành công')
        router.push('/login')
      } catch (error) {
        ElMessage.error('Lỗi đăng xuất')
      }
    }
    
    return {
      isAuthRoute,
      authStore,
      handleLogout,
      isSidebarCollapsed,
      isMobile,
      toggleSidebar,
      closeSidebar,
      closeSidebarOnMobile,
      currentYear
    }
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
  position: relative;
}

.mobile-toggle {
  display: none;
  position: fixed;
  top: 24px;
  left: 24px;
  z-index: 1000;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.mobile-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: width 0.3s ease, height 0.3s ease;
  transform: translate(-50%, -50%);
}

.mobile-toggle:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.mobile-toggle:active::before {
  width: 50px;
  height: 50px;
}

.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  color: white;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  position: relative;
}

.sidebar::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, transparent, rgba(255, 255, 255, 0.1), transparent);
}

.sidebar.collapsed {
  width: 72px;
}

.sidebar-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  background: rgba(255, 255, 255, 0.05);
  position: relative;
}

.sidebar-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4);
  border-radius: 1px;
}

.sidebar-header h2 {
  margin: 0;
  color: white;
  font-size: 20px;
  font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff, #e2e8f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.sidebar-nav {
  flex: 1;
  padding: 20px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  color: rgba(255, 255, 255, 0.75);
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  overflow: hidden;
  position: relative;
  margin: 4px 12px;
  border-radius: 12px;
  font-weight: 500;
}

.nav-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 0;
  height: 60%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border-radius: 0 6px 6px 0;
  transform: translateY(-50%);
  transition: width 0.3s ease;
}

.nav-item:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.nav-item:hover::before {
  width: 4px;
}

.nav-item.router-link-active {
  color: white;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15));
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  backdrop-filter: blur(10px);
}

.nav-item.router-link-active::before {
  width: 4px;
}

.nav-item .el-icon {
  margin-right: 12px;
  font-size: 18px;
  min-width: 24px;
  text-align: center;
  opacity: 0.9;
  transition: all 0.3s ease;
}

.nav-item:hover .el-icon,
.nav-item.router-link-active .el-icon {
  opacity: 1;
  transform: scale(1.1);
}

.sidebar.collapsed .nav-item .el-icon {
  margin-right: 0;
}

.sidebar-footer {
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  position: relative;
  margin-bottom: 60px; /* Prevent overlap with app footer */
  z-index: 1001; /* Above app footer */
}

.sidebar-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
}

.user-info {
  margin-bottom: 16px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  font-weight: 500;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.collapsed-btn {
  width: 100%;
  padding: 8px 4px;
}

.main-content {
  flex: 1;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  overflow: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  padding-bottom: 60px; /* Space for fixed footer */
}

.main-content::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%239fa6b2" fill-opacity="0.02"><circle cx="7" cy="7" r="1"/><circle cx="13" cy="13" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="25" cy="25" r="1"/><circle cx="31" cy="31" r="1"/><circle cx="37" cy="37" r="1"/><circle cx="43" cy="43" r="1"/><circle cx="49" cy="49" r="1"/><circle cx="55" cy="55" r="1"/></g></g></svg>') repeat;
  pointer-events: none;
  opacity: 0.3;
}

.app-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  width: 100%;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(99, 102, 241, 0.1);
  text-align: right;
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
  z-index: 1000;
  transition: all 0.3s ease;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.app-footer:hover {
  background: rgba(255, 255, 255, 0.98);
  color: #6366f1;
  transform: translateY(-1px);
  box-shadow: 0 -4px 12px rgba(99, 102, 241, 0.15);
}

.app-footer span {
  background: linear-gradient(135deg, #6b7280, #6366f1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s ease;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.app-footer:hover span {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.auth-layout {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6366f1 100%);
  position: relative;
  overflow: hidden;
}

.auth-layout::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 6s ease-in-out infinite;
}

.auth-layout::after {
  content: '';
  position: absolute;
  bottom: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  animation: float 8s ease-in-out infinite reverse;
}

.auth-footer {
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
}

.auth-footer:hover {
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.95);
}

.auth-footer span {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 1));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Enhanced Mobile styles */
@media (max-width: 768px) {
  .mobile-toggle {
    display: block;
    animation: slideInLeft 0.5s ease-out;
  }
  
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    width: 320px;
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 10px 0 30px rgba(0, 0, 0, 0.2);
  }
  
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding-top: 88px;
    padding-bottom: 50px; /* Adjusted space for mobile footer */
  }
  
  .sidebar.collapsed {
    width: 320px;
  }
  
  .nav-item {
    padding: 18px 24px;
    margin: 6px 16px;
    font-size: 16px;
  }
  
  .nav-item .el-icon {
    font-size: 20px;
    margin-right: 16px;
  }
  
  .sidebar-footer {
    margin-bottom: 50px; /* Match mobile footer height */
  }
  
  .app-footer {
    padding: 10px 16px;
    font-size: 11px;
  }
}

/* Enhanced Tablet styles */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar {
    width: 240px;
  }
  
  .sidebar.collapsed {
    width: 68px;
  }
  
  .sidebar-header {
    padding: 20px;
  }
  
  .sidebar-header h2 {
    font-size: 18px;
  }
  
  .nav-item {
    padding: 14px 20px;
    margin: 4px 10px;
  }
  
  .nav-item .el-icon {
    font-size: 16px;
    margin-right: 10px;
  }
  
  .sidebar-footer {
    padding: 20px;
  }
  
  .main-content {
    padding-bottom: 55px; /* Space for footer on tablet */
  }
}

/* Enhanced Hover effect for collapsed sidebar on desktop */
@media (min-width: 769px) {
  .sidebar.collapsed:hover {
    width: 280px;
    box-shadow: 8px 0 25px rgba(0, 0, 0, 0.15);
  }
  
  .sidebar.collapsed:hover .sidebar-header h2 {
    font-size: 20px;
  }
  
  .sidebar.collapsed:hover .nav-item {
    padding-left: 24px;
  }
  
  .sidebar.collapsed:hover .nav-item span {
    display: inline;
    animation: fadeInRight 0.3s ease-out;
  }
  
  .sidebar.collapsed:hover .user-info {
    display: block;
    animation: fadeInUp 0.3s ease-out;
  }
  
  .sidebar.collapsed:hover .collapsed-btn span {
    display: inline;
    animation: fadeInRight 0.3s ease-out;
  }
  
  .sidebar.collapsed .nav-item span,
  .sidebar.collapsed .user-info,
  .sidebar.collapsed .collapsed-btn span {
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .sidebar.collapsed:hover .nav-item span,
  .sidebar.collapsed:hover .user-info,
  .sidebar.collapsed:hover .collapsed-btn span {
    opacity: 1;
  }
}
</style>