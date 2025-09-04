import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Composable để quản lý async operations với loading, error handling
export function useAsyncState(initialData = null) {
  const data = ref(initialData)
  const loading = ref(false)
  const error = ref(null)

  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)
  const hasData = computed(() => data.value !== null && data.value !== undefined)

  const execute = async (asyncFunction, options = {}) => {
    const {
      loadingMessage = null,
      successMessage = null,
      errorMessage = null,
      showLoading = true,
      showSuccess = true,
      showError = true,
      resetError = true
    } = options

    try {
      if (resetError) {
        error.value = null
      }
      
      if (showLoading) {
        loading.value = true
      }
      
      if (loadingMessage) {
        ElMessage.info(loadingMessage)
      }

      const result = await asyncFunction()
      data.value = result

      if (successMessage && showSuccess) {
        ElMessage.success(successMessage)
      }

      return result
    } catch (err) {
      console.error('AsyncState Error:', err)
      error.value = err

      if (showError) {
        const message = errorMessage || err.response?.data?.message || err.message || 'Có lỗi xảy ra'
        ElMessage.error(message)
      }

      throw err
    } finally {
      if (showLoading) {
        loading.value = false
      }
    }
  }

  const reset = () => {
    data.value = initialData
    loading.value = false
    error.value = null
  }

  const setData = (newData) => {
    data.value = newData
    error.value = null
  }

  return {
    data,
    loading,
    error,
    isLoading,
    hasError,
    hasData,
    execute,
    reset,
    setData
  }
}

// Composable cho confirmation dialogs
export function useConfirmDialog() {
  const confirm = async (message, title = 'Xác nhận', options = {}) => {
    const {
      confirmButtonText = 'Xác nhận',
      cancelButtonText = 'Hủy',
      type = 'warning',
      ...otherOptions
    } = options

    try {
      await ElMessageBox.confirm(message, title, {
        confirmButtonText,
        cancelButtonText,
        type,
        ...otherOptions
      })
      return true
    } catch (error) {
      return false
    }
  }

  const confirmDelete = async (itemName = 'mục này') => {
    return await confirm(
      `Bạn có chắc chắn muốn xóa ${itemName}? Hành động này không thể hoàn tác.`,
      'Xác nhận xóa',
      {
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        type: 'error'
      }
    )
  }

  return {
    confirm,
    confirmDelete
  }
}

// Composable cho form handling
export function useFormState(initialForm = {}) {
  const form = ref({ ...initialForm })
  const loading = ref(false)
  const errors = ref({})

  const isLoading = computed(() => loading.value)
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  const resetForm = () => {
    form.value = { ...initialForm }
    errors.value = {}
  }

  const setForm = (newForm) => {
    form.value = { ...newForm }
    errors.value = {}
  }

  const setErrors = (newErrors) => {
    errors.value = { ...newErrors }
  }

  const clearErrors = () => {
    errors.value = {}
  }

  const setFieldError = (field, message) => {
    errors.value[field] = message
  }

  const clearFieldError = (field) => {
    delete errors.value[field]
  }

  const validateField = (field, rules = []) => {
    clearFieldError(field)
    
    for (const rule of rules) {
      if (typeof rule === 'function') {
        const result = rule(form.value[field])
        if (result !== true) {
          setFieldError(field, result)
          return false
        }
      }
    }
    
    return true
  }

  const validate = (validationRules = {}) => {
    clearErrors()
    let isValid = true

    for (const [field, rules] of Object.entries(validationRules)) {
      if (!validateField(field, rules)) {
        isValid = false
      }
    }

    return isValid
  }

  return {
    form,
    loading,
    errors,
    isLoading,
    hasErrors,
    resetForm,
    setForm,
    setErrors,
    clearErrors,
    setFieldError,
    clearFieldError,
    validateField,
    validate
  }
}
