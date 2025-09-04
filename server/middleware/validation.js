const { body, validationResult } = require('express-validator');

// Common validation rules
const commonRules = {
  id: () => body('id').isInt({ min: 1 }).withMessage('ID phải là số nguyên dương'),
  tankId: () => body('tank_id').isInt({ min: 1 }).withMessage('Tank ID phải là số nguyên dương'),
  batchId: () => body('batch_id').isInt({ min: 1 }).withMessage('Batch ID phải là số nguyên dương'),
  date: (field) => body(field).isISO8601().withMessage(`${field} không hợp lệ`),
  email: () => body('email').isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  username: () => body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username phải từ 3-50 ký tự, chỉ chứa chữ, số và dấu gạch dưới'),
  password: () => body('password')
    .isLength({ min: 6 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ hoa, chữ thường và số'),
  name: (maxLength = 100) => body('name')
    .trim()
    .isLength({ min: 1, max: maxLength })
    .withMessage(`Tên không được để trống và không quá ${maxLength} ký tự`),
  amount: () => body('amount')
    .isNumeric({ min: 0 })
    .withMessage('Số tiền phải là số dương'),
  count: (field = 'count') => body(field)
    .isInt({ min: 0 })
    .withMessage(`${field} phải là số nguyên không âm`),
  percentage: (field) => body(field)
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage(`${field} phải từ 0-100%`),
  text: (field, maxLength = 1000) => body(field)
    .optional()
    .isLength({ max: maxLength })
    .withMessage(`${field} không được quá ${maxLength} ký tự`),
  numeric: (field) => body(field)
    .optional()
    .isNumeric()
    .withMessage(`${field} phải là số`)
};

// Tank validation rules
const tankValidation = [
  commonRules.name(),
  body('fish_type').optional().isLength({ max: 100 }).withMessage('Loại cá không được quá 100 ký tự'),
  commonRules.numeric('capacity'),
  commonRules.numeric('current_ph'),
  commonRules.numeric('current_temperature'),
  commonRules.text('notes'),
  body('release_date').optional().isISO8601().withMessage('Ngày thả không hợp lệ'),
  body('spawn_date').optional().isISO8601().withMessage('Ngày đẻ không hợp lệ')
];

// Batch validation rules
const batchValidation = [
  commonRules.tankId(),
  body('batch_name').optional().isLength({ max: 100 }).withMessage('Tên lứa cá không được quá 100 ký tự'),
  commonRules.date('spawn_date'),
  commonRules.count('initial_count'),
  body('fish_species').optional().isLength({ max: 100 }).withMessage('Chủng loại không được quá 100 ký tự'),
  commonRules.text('notes')
];

// Batch tracking validation rules
const batchTrackingValidation = [
  commonRules.date('tracking_date'),
  commonRules.count('dead_count'),
  body('stage').optional().isIn(['fry', 'juvenile', 'adult']).withMessage('Giai đoạn không hợp lệ'),
  commonRules.text('notes')
];

// Environment log validation rules
const environmentValidation = [
  commonRules.tankId(),
  commonRules.date('log_date'),
  body('activity_type').isIn(['water_change', 'cleaning', 'ph_test', 'feeding', 'medication', 'other'])
    .withMessage('Loại hoạt động không hợp lệ'),
  commonRules.numeric('ph_level'),
  commonRules.numeric('temperature'),
  commonRules.percentage('water_change_percentage'),
  commonRules.text('notes'),
  body('reminder_date').optional().isISO8601().withMessage('Ngày nhắc nhở không hợp lệ')
];

// Expense validation rules
const expenseValidation = [
  commonRules.date('expense_date'),
  body('category').notEmpty().withMessage('Danh mục không được để trống'),
  commonRules.amount(),
  body('tank_id').optional().isInt().withMessage('Tank ID phải là số nguyên'),
  body('batch_id').optional().isInt().withMessage('Batch ID phải là số nguyên'),
  body('currency').optional().isIn(['VND', 'USD', 'EUR']).withMessage('Loại tiền tệ không hợp lệ'),
  commonRules.text('description'),
  commonRules.text('notes')
];

// Auth validation rules
const registerValidation = [
  commonRules.username(),
  commonRules.email(),
  commonRules.password(),
  body('full_name').optional().isLength({ max: 100 }).withMessage('Tên đầy đủ không được quá 100 ký tự')
];

const loginValidation = [
  body('username').notEmpty().withMessage('Username không được để trống'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
];

// Validation middleware
function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
}

// Custom validation middleware creator
function createValidation(rules) {
  return [...rules, validateRequest];
}

module.exports = {
  commonRules,
  tankValidation: createValidation(tankValidation),
  batchValidation: createValidation(batchValidation),
  batchTrackingValidation: createValidation(batchTrackingValidation),
  environmentValidation: createValidation(environmentValidation),
  expenseValidation: createValidation(expenseValidation),
  registerValidation: createValidation(registerValidation),
  loginValidation: createValidation(loginValidation),
  validateRequest,
  createValidation
};
