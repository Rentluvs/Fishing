const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const config = require('../config');

const router = express.Router();

// Middleware để kết nối database
function getDatabase() {
  return new sqlite3.Database(config.databasePath);
}

// Middleware xác thực token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token xác thực không được cung cấp'
    });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token không hợp lệ'
      });
    }
    req.user = user;
    next();
  });
}

// @route   POST /api/auth/register
// @desc    Đăng ký tài khoản mới
// @access  Public
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username phải có ít nhất 3 ký tự'),
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
  body('fullName').optional().isLength({ max: 100 }).withMessage('Tên đầy đủ không được quá 100 ký tự')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { username, email, password, fullName } = req.body;
    const db = getDatabase();

    // Kiểm tra username và email đã tồn tại chưa
    db.get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email], (err, row) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      if (row) {
        db.close();
        return res.status(400).json({
          success: false,
          message: 'Username hoặc email đã tồn tại'
        });
      }

      // Hash password
      const saltRounds = 10;
      bcrypt.hash(password, saltRounds, (hashErr, hash) => {
        if (hashErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi mã hóa mật khẩu'
          });
        }

        // Tạo user mới
        db.run(
          'INSERT INTO users (username, email, password_hash, full_name) VALUES (?, ?, ?, ?)',
          [username, email, hash, fullName || null],
          function(insertErr) {
            if (insertErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Lỗi tạo tài khoản'
              });
            }

            const userId = this.lastID;

            // Tạo JWT token
            const token = jwt.sign(
              { id: userId, username },
              config.jwtSecret,
              { expiresIn: '24h' }
            );

            db.close();
            res.status(201).json({
              success: true,
              message: 'Đăng ký thành công',
              data: {
                user: {
                  id: userId,
                  username,
                  email,
                  fullName: fullName || null
                },
                token
              }
            });
          }
        );
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Đăng nhập
// @access  Public
router.post('/login', [
  body('username').notEmpty().withMessage('Username không được để trống'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const { username, password } = req.body;
    const db = getDatabase();

    // Tìm user theo username hoặc email
    db.get(
      'SELECT id, username, email, password_hash, full_name FROM users WHERE username = ? OR email = ?',
      [username, username],
      (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi server'
          });
        }

        if (!user) {
          db.close();
          return res.status(401).json({
            success: false,
            message: 'Tài khoản không tồn tại'
          });
        }

        // Kiểm tra mật khẩu
        bcrypt.compare(password, user.password_hash, (compareErr, isMatch) => {
          if (compareErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi xác thực'
            });
          }

          if (!isMatch) {
            db.close();
            return res.status(401).json({
              success: false,
              message: 'Mật khẩu không đúng'
            });
          }

          // Tạo JWT token
          const token = jwt.sign(
            { id: user.id, username: user.username },
            config.jwtSecret,
            { expiresIn: '24h' }
          );

          db.close();
          res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                fullName: user.full_name
              },
              token
            }
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Lấy thông tin user hiện tại
// @access  Private
router.get('/me', authenticateToken, (req, res) => {
  const db = getDatabase();

  db.get(
    'SELECT id, username, email, full_name, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi server'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Người dùng không tồn tại'
        });
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            createdAt: user.created_at
          }
        }
      });
    }
  );
});

// @route   POST /api/auth/logout
// @desc    Đăng xuất (chỉ phản hồi thành công - client sẽ xóa token)
// @access  Private
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Đăng xuất thành công'
  });
});

// @route   POST /api/auth/change-password
// @desc    Đổi mật khẩu
// @access  Private
router.post('/change-password', authenticateToken, [
  body('old_password').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
  body('new_password').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: errors.array() });
  }

  const { old_password, new_password } = req.body;
  const db = getDatabase();

  db.get('SELECT id, password_hash FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) {
      db.close();
      return res.status(404).json({ success: false, message: 'Người dùng không tồn tại' });
    }

    bcrypt.compare(old_password, user.password_hash, (compareErr, isMatch) => {
      if (compareErr) {
        db.close();
        return res.status(500).json({ success: false, message: 'Lỗi xác thực' });
      }
      if (!isMatch) {
        db.close();
        return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
      }

      bcrypt.hash(new_password, 10, (hashErr, newHash) => {
        if (hashErr) {
          db.close();
          return res.status(500).json({ success: false, message: 'Lỗi mã hóa mật khẩu' });
        }

        db.run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newHash, req.user.id], function (updateErr) {
          db.close();
          if (updateErr) {
            return res.status(500).json({ success: false, message: 'Lỗi cập nhật mật khẩu' });
          }
          // Khuyến nghị client đăng xuất để làm mới token
          res.json({ success: true, message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
        });
      });
    });
  });
});

module.exports = { router, authenticateToken };
