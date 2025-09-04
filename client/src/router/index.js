import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Views
import Login from '@/views/auth/Login.vue'
import Dashboard from '@/views/dashboard/Dashboard.vue'
import TankList from '@/views/tanks/TankList.vue'
import TankDetail from '@/views/tanks/TankDetail.vue'
import TankEdit from '@/views/tanks/TankEdit.vue'
import BatchList from '@/views/batches/BatchList.vue'
import BatchDetail from '@/views/batches/BatchDetail.vue'
import EnvironmentList from '@/views/environment/EnvironmentList.vue'
import ExpenseList from '@/views/expenses/ExpenseList.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/tanks',
    name: 'TankList',
    component: TankList,
    meta: { requiresAuth: true }
  },
  {
    path: '/tanks/:id',
    name: 'TankDetail',
    component: TankDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/tanks/:id/edit',
    name: 'TankEdit',
    component: TankEdit,
    meta: { requiresAuth: true }
  },
  {
    path: '/batches',
    name: 'BatchList',
    component: BatchList,
    meta: { requiresAuth: true }
  },
  {
    path: '/batches/:id',
    name: 'BatchDetail',
    component: BatchDetail,
    meta: { requiresAuth: true }
  },
  {
    path: '/environment',
    name: 'EnvironmentList',
    component: EnvironmentList,
    meta: { requiresAuth: true }
  },
  {
    path: '/expenses',
    name: 'ExpenseList',
    component: ExpenseList,
    meta: { requiresAuth: true }
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: ChangePassword,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Kiểm tra token có hợp lệ không
  if (authStore.isAuthenticated && !authStore.user) {
    try {
      await authStore.getCurrentUser()
    } catch (error) {
      authStore.logout()
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
