<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h1>🐟 Hệ thống quản lý cá cảnh</h1>
        <p>Đăng nhập vào tài khoản của bạn</p>
      </div>
      
      <el-form 
        ref="loginFormRef" 
        :model="loginForm" 
        :rules="rules" 
        @submit.prevent="handleLogin"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="Username hoặc Email"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="Mật khẩu"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="authStore.loading"
            @click="handleLogin"
            class="login-button"
          >
            Đăng nhập
          </el-button>
        </el-form-item>
      </el-form>
      
      <div class="login-footer">
        <p>Chưa có tài khoản? 
          <el-button type="text" @click="showRegister = true">Đăng ký ngay</el-button>
        </p>
        <!--
        <div class="demo-account">
          <p><strong>Tài khoản demo:</strong></p>
          <p>Username: admin</p>
          <p>Password: admin123</p>
        </div>-->
      </div>
    </div>
    
    <!-- Register Modal -->
    <el-dialog 
      v-model="showRegister" 
      title="Đăng ký tài khoản mới"
      width="400px"
    >
      <el-form 
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="Username" prop="username">
          <el-input v-model="registerForm.username" />
        </el-form-item>
        
        <el-form-item label="Email" prop="email">
          <el-input v-model="registerForm.email" type="email" />
        </el-form-item>
        
        <el-form-item label="Họ tên" prop="fullName">
          <el-input v-model="registerForm.fullName" />
        </el-form-item>
        
        <el-form-item label="Mật khẩu" prop="password">
          <el-input v-model="registerForm.password" type="password" show-password />
        </el-form-item>
        
        <el-form-item label="Xác nhận mật khẩu" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRegister = false">Hủy</el-button>
          <el-button 
            type="primary" 
            :loading="authStore.loading"
            @click="handleRegister"
          >
            Đăng ký
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const loginFormRef = ref()
    const registerFormRef = ref()
    const showRegister = ref(false)
    
    const loginForm = reactive({
      username: '',
      password: ''
    })
    
    const registerForm = reactive({
      username: '',
      email: '',
      fullName: '',
      password: '',
      confirmPassword: ''
    })
    
    const rules = {
      username: [
        { required: true, message: 'Vui lòng nhập username', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' }
      ]
    }
    
    const validatePasswordConfirm = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error('Mật khẩu xác nhận không khớp'))
      } else {
        callback()
      }
    }
    
    const registerRules = {
      username: [
        { required: true, message: 'Vui lòng nhập username', trigger: 'blur' },
        { min: 3, message: 'Username phải có ít nhất 3 ký tự', trigger: 'blur' }
      ],
      email: [
        { required: true, message: 'Vui lòng nhập email', trigger: 'blur' },
        { type: 'email', message: 'Email không hợp lệ', trigger: 'blur' }
      ],
      password: [
        { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
        { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
        { validator: validatePasswordConfirm, trigger: 'blur' }
      ]
    }
    
    const handleLogin = async () => {
      try {
        const valid = await loginFormRef.value.validate()
        if (!valid) return
        
        const result = await authStore.login(loginForm)
        if (result.success) {
          ElMessage.success('Đăng nhập thành công!')
          router.push('/dashboard')
        } else {
          ElMessage.error(result.error || 'Đăng nhập thất bại')
        }
      } catch (error) {
        ElMessage.error('Có lỗi xảy ra khi đăng nhập')
      }
    }
    
    const handleRegister = async () => {
      try {
        const valid = await registerFormRef.value.validate()
        if (!valid) return
        
        const { confirmPassword, ...userData } = registerForm
        const result = await authStore.register(userData)
        
        if (result.success) {
          ElMessage.success('Đăng ký thành công!')
          showRegister.value = false
          router.push('/dashboard')
        } else {
          ElMessage.error(result.error || 'Đăng ký thất bại')
        }
      } catch (error) {
        ElMessage.error('Có lỗi xảy ra khi đăng ký')
      }
    }
    
    return {
      loginFormRef,
      registerFormRef,
      showRegister,
      loginForm,
      registerForm,
      rules,
      registerRules,
      authStore,
      handleLogin,
      handleRegister
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

.login-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%);
  animation: float 10s ease-in-out infinite;
  z-index: 0;
}

.login-container::after {
  content: '';
  position: absolute;
  top: 10%;
  right: 10%;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 8s ease-in-out infinite reverse;
  z-index: 0;
}

.login-box {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  padding: 48px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
  animation: slideInUp 0.8s ease-out;
}

.login-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4, #10b981);
  border-radius: 24px 24px 0 0;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  animation: slideInDown 0.6s ease-out 0.4s both;
}

.login-header h1 {
  background: linear-gradient(135deg, #1f2937, #6366f1, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 16px;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: -0.02em;
  animation: slideInDown 0.6s ease-out 0.2s both;
}

.login-header p {
  color: #6b7280;
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  opacity: 0.9;
  animation: slideInDown 0.6s ease-out 0.3s both;
}

.login-form {
  animation: fadeInUp 0.6s ease-out 0.5s both;
}

.login-form .el-form-item {
  margin-bottom: 24px;
}

.login-form .el-input {
  height: 52px;
}

.login-form .el-input__wrapper {
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.login-form .el-input__wrapper:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.login-form .el-input__wrapper.is-focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1), 0 2px 6px rgba(0, 0, 0, 0.1);
}

.login-form .el-input__inner {
  font-size: 16px;
  font-weight: 500;
  padding: 0 16px;
}

.login-button {
  width: 100%;
  height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.login-button::before {
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

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.login-button:active::before {
  width: 300px;
  height: 300px;
}

.login-footer {
  text-align: center;
  margin-top: 32px;
  animation: fadeInUp 0.6s ease-out 0.7s both;
}

.login-footer p {
  color: #6b7280;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 24px;
}

.login-footer .el-button--text {
  color: #6366f1;
  font-weight: 600;
  transition: all 0.3s ease;
}

.login-footer .el-button--text:hover {
  color: #4f46e5;
  transform: translateY(-1px);
}

.demo-account {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
  border-radius: 12px;
  margin-top: 24px;
  text-align: left;
  border: 1px solid #e5e7eb;
  position: relative;
  overflow: hidden;
}

.demo-account::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #10b981, #22c55e);
}

.demo-account p {
  margin: 8px 0;
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

.demo-account p:first-child {
  margin-top: 0;
}

.demo-account p:last-child {
  margin-bottom: 0;
}

.demo-account strong {
  color: #1f2937;
  font-weight: 700;
  background: linear-gradient(135deg, #10b981, #22c55e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-20px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

/* Enhanced Mobile Responsive */
@media (max-width: 768px) {
  .login-container {
    padding: 20px;
  }
  
  .login-box {
    padding: 32px 24px;
    border-radius: 20px;
    max-width: none;
    margin: 0 auto;
  }
  
  .login-header h1 {
    font-size: 28px;
    margin-bottom: 12px;
  }
  
  .login-header p {
    font-size: 15px;
  }
  
  .login-form .el-input {
    height: 48px;
  }
  
  .login-form .el-input__wrapper {
    border-radius: 10px;
  }
  
  .login-form .el-input__inner {
    font-size: 16px;
  }
  
  .login-button {
    height: 48px;
    border-radius: 10px;
    font-size: 15px;
  }
  
  .demo-account {
    padding: 16px;
    border-radius: 10px;
    margin-top: 20px;
  }
  
  .demo-account p {
    font-size: 13px;
    margin: 6px 0;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }
  
  .login-box {
    padding: 24px 20px;
    border-radius: 16px;
  }
  
  .login-header {
    margin-bottom: 32px;
  }
  
  .login-header h1 {
    font-size: 24px;
  }
  
  .login-header p {
    font-size: 14px;
  }
  
  .login-form .el-form-item {
    margin-bottom: 20px;
  }
  
  .login-form .el-input {
    height: 46px;
  }
  
  .login-button {
    height: 46px;
    font-size: 14px;
  }
  
  .demo-account {
    padding: 14px;
    border-radius: 8px;
  }
  
  .demo-account p {
    font-size: 12px;
    margin: 4px 0;
  }
}

/* Touch-friendly improvements */
@media (max-width: 768px) {
  .login-form .el-input__wrapper {
    min-height: 48px;
  }
  
  .login-button {
    min-height: 48px;
    touch-action: manipulation;
  }
  
  .login-footer .el-button--text {
    min-height: 44px;
    padding: 8px 16px;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .login-box {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.08);
  }
  
  .login-form .el-input__wrapper {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }
}
</style>
