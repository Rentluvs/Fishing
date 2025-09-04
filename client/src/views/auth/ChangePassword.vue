<template>
  <div class="change-password">
    <!-- Background Elements -->
    <div class="background-decoration">
      <div class="decoration-circle decoration-circle--1"></div>
      <div class="decoration-circle decoration-circle--2"></div>
      <div class="decoration-circle decoration-circle--3"></div>
    </div>
    
    <div class="password-container">
      <!-- Header Section -->
      <div class="password-header">
        <div class="security-icon">
          <el-icon size="48"><Lock /></el-icon>
        </div>
      <h1>Đổi mật khẩu</h1>
        <p>Cập nhật mật khẩu để bảo mật tài khoản của bạn</p>
      </div>
      
      <!-- Form Section -->
      <div class="password-form-wrapper">
        <el-form 
          :model="form" 
          :rules="rules" 
          ref="formRef" 
          class="password-form"
          @keydown.enter="submit"
        >
          <el-form-item prop="old_password" class="form-item">
            <label class="form-label">
              <el-icon><Key /></el-icon>
              Mật khẩu hiện tại
            </label>
            <el-input 
              v-model="form.old_password" 
              type="password" 
              show-password
              size="default"
              placeholder="Nhập mật khẩu hiện tại"
              class="password-input"
            />
        </el-form-item>
          
          <el-form-item prop="new_password" class="form-item">
            <label class="form-label">
              <el-icon><Lock /></el-icon>
              Mật khẩu mới
            </label>
            <el-input 
              v-model="form.new_password" 
              type="password" 
              show-password
              size="default"
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              class="password-input"
              @input="checkPasswordStrength"
            />
            <div v-if="form.new_password" class="password-strength">
              <div class="strength-bar">
                <div 
                  class="strength-fill" 
                  :class="`strength-${passwordStrength.level}`"
                  :style="{ width: passwordStrength.percentage + '%' }"
                ></div>
              </div>
              <span 
                class="strength-text"
                :class="`strength-${passwordStrength.level}`"
              >
                {{ passwordStrength.text }}
              </span>
            </div>
        </el-form-item>
          
          <el-form-item prop="confirm_password" class="form-item">
            <label class="form-label">
              <el-icon><CircleCheck /></el-icon>
              Xác nhận mật khẩu
            </label>
            <el-input 
              v-model="form.confirm_password" 
              type="password" 
              show-password
              size="default"
              placeholder="Nhập lại mật khẩu mới"
              class="password-input"
            />
            <div v-if="form.confirm_password" class="password-match">
              <el-icon 
                :class="passwordMatch ? 'match-success' : 'match-error'"
              >
                <CircleCheck v-if="passwordMatch" />
                <CircleClose v-else />
              </el-icon>
              <span :class="passwordMatch ? 'match-success' : 'match-error'">
                {{ passwordMatch ? 'Mật khẩu khớp' : 'Mật khẩu không khớp' }}
              </span>
            </div>
        </el-form-item>
          
          <!-- Security Tips -->
          <div class="security-tips">
            <h4>
              <el-icon><InfoFilled /></el-icon>
              Lời khuyên bảo mật
            </h4>
            <ul>
              <li>Sử dụng ít nhất 8 ký tự</li>
              <li>Không chia sẻ mật khẩu với ai khác</li>
            </ul>
          </div>
          
          <el-form-item class="submit-section">
            <el-button 
              type="primary" 
              :loading="loading" 
              @click="submit"
              size="default"
              class="submit-btn"
            >
              <el-icon v-if="!loading"><Check /></el-icon>
              {{ loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu' }}
            </el-button>
            <el-button 
              @click="resetForm"
              size="default"
              class="reset-btn"
            >
              <el-icon><Refresh /></el-icon>
              Đặt lại
            </el-button>
        </el-form-item>
      </el-form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { 
  Lock, 
  Key, 
  CircleCheck, 
  CircleClose, 
  InfoFilled, 
  Check, 
  Refresh 
} from '@element-plus/icons-vue'

export default {
  name: 'ChangePassword',
  components: {
    Lock,
    Key, 
    CircleCheck,
    CircleClose,
    InfoFilled,
    Check,
    Refresh
  },
  setup() {
    const formRef = ref()
    const form = ref({ 
      old_password: '', 
      new_password: '', 
      confirm_password: '' 
    })
    const loading = ref(false)
    const passwordStrength = ref({
      level: 'weak',
      percentage: 0,
      text: 'Yếu'
    })

    // Password strength checker
    const checkPasswordStrength = () => {
      const password = form.value.new_password
      if (!password) {
        passwordStrength.value = { level: 'weak', percentage: 0, text: 'Yếu' }
        return
      }

      let score = 0
      let feedback = []

      // Length check
      if (password.length >= 8) score += 25
      else feedback.push('Cần ít nhất 8 ký tự')

      // Contains lowercase
      if (/[a-z]/.test(password)) score += 25
      else feedback.push('Cần chữ thường')

      // Contains uppercase  
      if (/[A-Z]/.test(password)) score += 25
      else feedback.push('Cần chữ hoa')

      // Contains numbers
      if (/\d/.test(password)) score += 25
      else feedback.push('Cần số')

      // Contains special characters
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        score += 25
        feedback = feedback.filter(f => f !== 'Cần ký tự đặc biệt')
      } else {
        feedback.push('Nên có ký tự đặc biệt')
      }

      // Determine strength level
      let level, text
      if (score < 50) {
        level = 'weak'
        text = 'Yếu'
      } else if (score < 75) {
        level = 'medium'  
        text = 'Trung bình'
      } else if (score < 100) {
        level = 'strong'
        text = 'Mạnh'
      } else {
        level = 'very-strong'
        text = 'Rất mạnh'
      }

      passwordStrength.value = {
        level,
        percentage: Math.min(score, 100),
        text
      }
    }

    // Password match checker
    const passwordMatch = computed(() => {
      return form.value.new_password && 
             form.value.confirm_password && 
             form.value.new_password === form.value.confirm_password
    })

    // Validation rules
    const validateConfirm = (rule, value, callback) => {
      if (value !== form.value.new_password) {
        callback(new Error('Xác nhận mật khẩu không khớp'))
      } else callback()
    }

    const validateNewPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('Vui lòng nhập mật khẩu mới'))
      } else if (value.length < 6) {
        callback(new Error('Mật khẩu phải có ít nhất 6 ký tự'))
      } else if (value === form.value.old_password) {
        callback(new Error('Mật khẩu mới phải khác mật khẩu hiện tại'))
      } else {
        callback()
      }
    }

    const rules = {
      old_password: [
        { required: true, message: 'Vui lòng nhập mật khẩu hiện tại', trigger: 'blur' }
      ],
      new_password: [
        { validator: validateNewPassword, trigger: 'blur' }
      ],
      confirm_password: [
        { required: true, message: 'Vui lòng xác nhận mật khẩu', trigger: 'blur' },
        { validator: validateConfirm, trigger: 'blur' }
      ]
    }

    // Form actions
    const resetForm = () => {
      form.value = {
        old_password: '',
        new_password: '',
        confirm_password: ''
      }
      passwordStrength.value = { level: 'weak', percentage: 0, text: 'Yếu' }
      formRef.value?.resetFields()
    }

    const submit = async () => {
      try {
        await formRef.value.validate()
        
        if (passwordStrength.value.percentage < 50) {
          ElMessage.warning('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.')
          return
        }
        
        loading.value = true
        const res = await axios.post('/auth/change-password', {
          old_password: form.value.old_password,
          new_password: form.value.new_password
        })
        
        if (res.data?.success) {
          ElMessage.success('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.')
          setTimeout(() => {
          localStorage.removeItem('token')
          window.location.href = '/login'
          }, 2000)
        } else {
          ElMessage.error(res.data?.message || 'Đổi mật khẩu thất bại')
        }
      } catch (error) {
        console.error('Change password error:', error)
        if (error.response?.status === 400) {
          ElMessage.error('Mật khẩu hiện tại không đúng')
        } else {
          ElMessage.error('Có lỗi xảy ra. Vui lòng thử lại.')
        }
      } finally {
        loading.value = false
      }
    }

    return { 
      formRef, 
      form, 
      rules, 
      loading, 
      passwordStrength,
      passwordMatch,
      checkPasswordStrength,
      resetForm,
      submit 
    }
  }
}
</script>

<style scoped>
.change-password {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* Background Decorations */
.background-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.decoration-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
}

.decoration-circle--1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.decoration-circle--2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.decoration-circle--3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 70%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* Main Container */
.password-container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: 
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Header Section */
.password-header {
  text-align: center;
  margin-bottom: 24px;
}

.security-icon {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: white;
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.password-header h1 {
  margin: 0 0 8px 0;
  font-size: 26px;
  font-weight: 700;
  color: #1f2937;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.password-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

/* Form Wrapper */
.password-form-wrapper {
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.password-form {
  width: 100%;
}

.form-item {
  margin-bottom: 18px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 15px;
}

.form-label .el-icon {
  color: #6366f1;
}

/* Password Input Styling */
.password-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid #e5e7eb;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.password-input :deep(.el-input__wrapper:hover) {
  border-color: #d1d5db;
}

.password-input :deep(.el-input__wrapper.is-focus) {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.password-input :deep(.el-input__inner) {
  height: 48px;
  font-size: 16px;
  color: #1f2937;
}

/* Password Strength Indicator */
.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background: #f3f4f6;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: all 0.3s ease;
}

.strength-weak { background: linear-gradient(90deg, #ef4444, #dc2626); }
.strength-medium { background: linear-gradient(90deg, #f59e0b, #d97706); }
.strength-strong { background: linear-gradient(90deg, #10b981, #059669); }
.strength-very-strong { background: linear-gradient(90deg, #6366f1, #4f46e5); }

.strength-text {
  font-size: 13px;
  font-weight: 600;
  min-width: 80px;
}

/* Password Match Indicator */
.password-match {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  font-weight: 600;
}

.match-success {
  color: #10b981;
}

.match-error {
  color: #ef4444;
}

/* Security Tips */
.security-tips {
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 20px;
  margin: 24px 0;
}

.security-tips h4 {
  margin: 0 0 12px 0;
  color: #0c4a6e;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
}

.security-tips ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.security-tips li {
  position: relative;
  padding: 4px 0 4px 20px;
  color: #164e63;
  font-size: 14px;
  line-height: 1.4;
}

.security-tips li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #0891b2;
  font-weight: 700;
}

/* Submit Section */
.submit-section {
  margin-top: 32px;
  display: flex;
  gap: 16px;
}

.submit-btn {
  flex: 2;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.submit-btn:hover {
  background: linear-gradient(135deg, #5a67d8, #6b46c1);
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
}

.submit-btn .el-icon {
  margin-right: 8px;
}

.reset-btn {
  flex: 1;
  height: 48px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  color: #6b7280;
  font-weight: 600;
  font-size: 16px;
  transition: all 0.3s ease;
}

.reset-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #4b5563;
  transform: translateY(-1px);
}

.reset-btn .el-icon {
  margin-right: 8px;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .change-password {
    padding: 12px;
  }
  
  .password-container {
    padding: 20px;
    border-radius: 16px;
    max-height: 80vh;
  }
  
  /* Thu gọn security tips trên mobile */
  .security-tips {
    margin-top: 16px;
  }
  
  .security-tips h4 {
    font-size: 14px;
  }
  
  .security-tips ul {
    margin: 8px 0;
  }
  
  .security-tips li {
    font-size: 13px;
    margin-bottom: 4px;
  }
  
  .password-header h1 {
    font-size: 28px;
  }
  
  .password-header p {
    font-size: 15px;
  }
  
  .security-icon {
    width: 64px;
    height: 64px;
  }
  
  .password-form-wrapper {
    padding: 24px;
    border-radius: 12px;
  }
  
  .submit-section {
    flex-direction: column;
    gap: 12px;
  }
  
  .submit-btn,
  .reset-btn {
    width: 100%;
  }
  
  .decoration-circle--1 {
    width: 120px;
    height: 120px;
  }
  
  .decoration-circle--2 {
    width: 80px;
    height: 80px;
  }
  
  .decoration-circle--3 {
    width: 60px;
    height: 60px;
  }
}

@media (max-width: 480px) {
  .password-container {
    padding: 16px;
    max-height: 85vh;
  }
  
  .password-header {
    margin-bottom: 16px;
  }
  
  .security-icon {
    width: 50px;
    height: 50px;
    margin-bottom: 12px;
  }
  
  .password-header h1 {
    font-size: 22px;
    margin-bottom: 6px;
  }
  
  .password-header p {
    font-size: 13px;
  }
  
  .password-form-wrapper {
    padding: 16px;
    margin-bottom: 12px;
  }
  
  .form-item {
    margin-bottom: 14px;
  }
  
  .password-input :deep(.el-input__inner) {
    height: 44px;
    font-size: 15px;
  }
  
  /* Ẩn security tips để tiết kiệm không gian */
  .security-tips {
    display: none;
  }
  
  /* Thu gọn password strength indicator */
  .password-strength,
  .password-match {
    margin-top: 6px;
  }
  
  .strength-text,
  .password-match span {
    font-size: 12px;
  }
  
  .submit-btn,
  .reset-btn {
    height: 44px;
    font-size: 15px;
  }
  
  .security-tips {
    padding: 16px;
  }
}

/* Loading State */
.submit-btn.is-loading {
  pointer-events: none;
}

/* Focus States for Accessibility */
.submit-btn:focus,
.reset-btn:focus {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
</style>


