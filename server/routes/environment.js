const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(authenticateToken);

// Middleware để kết nối database
function getDatabase() {
  return new sqlite3.Database(config.databasePath);
}

// Helper function để kiểm tra quyền truy cập tank
function checkTankAccess(userId, tankId, callback) {
  const db = getDatabase();
  db.get('SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?', [tankId, userId], (err, tank) => {
    db.close();
    callback(err, tank);
  });
}

// @route   GET /api/environment
// @desc    Lấy danh sách nhật ký môi trường của user
// @access  Private
router.get('/', (req, res) => {
  const { tank_id, activity_type, limit = 50 } = req.query;
  const db = getDatabase();

  let query = `
    SELECT e.*, t.name as tank_name
    FROM environment_logs e
    JOIN fish_tanks t ON e.tank_id = t.id
    WHERE t.user_id = ?
  `;
  const params = [req.user.id];

  if (tank_id) {
    query += ' AND e.tank_id = ?';
    params.push(tank_id);
  }

  if (activity_type) {
    query += ' AND e.activity_type = ?';
    params.push(activity_type);
  }

  query += ' ORDER BY e.log_date DESC, e.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, logs) => {
    db.close();

    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy nhật ký môi trường'
      });
    }

    res.json({
      success: true,
      data: logs
    });
  });
});

// @route   GET /api/environment/reminders
// @desc    Lấy danh sách nhắc nhở môi trường
// @access  Private
router.get('/reminders', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT e.*, t.name as tank_name
     FROM environment_logs e
     JOIN fish_tanks t ON e.tank_id = t.id
     WHERE t.user_id = ? AND e.reminder_date IS NOT NULL AND e.completed = 0
       AND e.reminder_date <= date('now', '+7 days')
     ORDER BY e.reminder_date ASC`,
    [req.user.id],
    (err, reminders) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy danh sách nhắc nhở'
        });
      }

      // Phân loại nhắc nhở
      const overdue = reminders.filter(r => new Date(r.reminder_date) < new Date());
      const today = reminders.filter(r => {
        const reminderDate = new Date(r.reminder_date);
        const today = new Date();
        return reminderDate.toDateString() === today.toDateString();
      });
      const upcoming = reminders.filter(r => {
        const reminderDate = new Date(r.reminder_date);
        const today = new Date();
        return reminderDate > today;
      });

      res.json({
        success: true,
        data: {
          overdue,
          today,
          upcoming,
          total: reminders.length
        }
      });
    }
  );
});

// @route   POST /api/environment
// @desc    Thêm nhật ký môi trường mới
// @access  Private
router.post('/', [
  body('tank_id').isInt().withMessage('Tank ID phải là số nguyên'),
  body('log_date').isISO8601().withMessage('Ngày ghi nhật ký không hợp lệ'),
  body('activity_type').isIn(['water_change', 'cleaning', 'ph_test', 'feeding', 'medication', 'other'])
    .withMessage('Loại hoạt động không hợp lệ'),
  body('ph_level').optional().isNumeric().withMessage('Độ pH phải là số'),
  body('temperature').optional().isNumeric().withMessage('Nhiệt độ phải là số'),
  body('water_change_percentage').optional().isInt({ min: 0, max: 100 })
    .withMessage('Phần trăm thay nước phải từ 0-100')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const {
    tank_id,
    log_date,
    activity_type,
    ph_level,
    temperature,
    water_change_percentage,
    notes,
    reminder_date
  } = req.body;

  // Kiểm tra quyền truy cập tank
  checkTankAccess(req.user.id, tank_id, (err, tank) => {
    if (err || !tank) {
      return res.status(404).json({
        success: false,
        message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
      });
    }

    const db = getDatabase();
    db.run(
      `INSERT INTO environment_logs 
       (tank_id, log_date, activity_type, ph_level, temperature, water_change_percentage, notes, reminder_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tank_id, log_date, activity_type, ph_level || null, temperature || null, 
       water_change_percentage || null, notes || null, reminder_date || null],
      function(insertErr) {
        if (insertErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi thêm nhật ký môi trường'
          });
        }

        const logId = this.lastID;

        // Cập nhật thông tin môi trường hiện tại của tank nếu có
        if (ph_level || temperature) {
          const updateFields = [];
          const updateParams = [];

          if (ph_level) {
            updateFields.push('current_ph = ?');
            updateParams.push(ph_level);
          }
          if (temperature) {
            updateFields.push('current_temperature = ?');
            updateParams.push(temperature);
          }

          updateParams.push(tank_id);

          db.run(
            `UPDATE fish_tanks SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            updateParams,
            (updateErr) => {
              if (updateErr) {
                console.warn('Lỗi cập nhật thông tin tank:', updateErr);
              }
            }
          );
        }

        // Lấy thông tin nhật ký vừa tạo
        db.get('SELECT * FROM environment_logs WHERE id = ?', [logId], (getErr, log) => {
          db.close();

          if (getErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy thông tin nhật ký'
            });
          }

          res.status(201).json({
            success: true,
            message: 'Thêm nhật ký môi trường thành công',
            data: log
          });
        });
      }
    );
  });
});

// @route   PUT /api/environment/:id
// @desc    Cập nhật nhật ký môi trường
// @access  Private
router.put('/:id', [
  body('log_date').optional().isISO8601().withMessage('Ngày ghi nhật ký không hợp lệ'),
  body('activity_type').optional().isIn(['water_change', 'cleaning', 'ph_test', 'feeding', 'medication', 'other'])
    .withMessage('Loại hoạt động không hợp lệ'),
  body('ph_level').optional().isNumeric().withMessage('Độ pH phải là số'),
  body('temperature').optional().isNumeric().withMessage('Nhiệt độ phải là số'),
  body('water_change_percentage').optional().isInt({ min: 0, max: 100 })
    .withMessage('Phần trăm thay nước phải từ 0-100'),
  body('completed').optional().isBoolean().withMessage('Trạng thái hoàn thành phải là boolean')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const logId = req.params.id;
  const updateData = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    `SELECT e.* FROM environment_logs e
     JOIN fish_tanks t ON e.tank_id = t.id
     WHERE e.id = ? AND t.user_id = ?`,
    [logId, req.user.id],
    (err, log) => {
      if (err || !log) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Nhật ký môi trường không tồn tại'
        });
      }

      // Xây dựng câu query update
      const fields = [];
      const params = [];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          fields.push(`${key} = ?`);
          params.push(updateData[key]);
        }
      });

      if (fields.length === 0) {
        db.close();
        return res.status(400).json({
          success: false,
          message: 'Không có dữ liệu để cập nhật'
        });
      }

      params.push(logId);

      db.run(
        `UPDATE environment_logs SET ${fields.join(', ')} WHERE id = ?`,
        params,
        function(updateErr) {
          if (updateErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi cập nhật nhật ký môi trường'
            });
          }

          // Lấy thông tin sau khi cập nhật
          db.get('SELECT * FROM environment_logs WHERE id = ?', [logId], (getErr, updatedLog) => {
            db.close();

            if (getErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin nhật ký'
              });
            }

            res.json({
              success: true,
              message: 'Cập nhật nhật ký môi trường thành công',
              data: updatedLog
            });
          });
        }
      );
    }
  );
});

// @route   DELETE /api/environment/:id
// @desc    Xóa nhật ký môi trường
// @access  Private
router.delete('/:id', (req, res) => {
  const logId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    `SELECT e.id FROM environment_logs e
     JOIN fish_tanks t ON e.tank_id = t.id
     WHERE e.id = ? AND t.user_id = ?`,
    [logId, req.user.id],
    (err, log) => {
      if (err || !log) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Nhật ký môi trường không tồn tại'
        });
      }

      db.run('DELETE FROM environment_logs WHERE id = ?', [logId], function(deleteErr) {
        db.close();

        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi xóa nhật ký môi trường'
          });
        }

        res.json({
          success: true,
          message: 'Xóa nhật ký môi trường thành công'
        });
      });
    }
  );
});

// @route   POST /api/environment/quick-actions
// @desc    Tạo nhanh các hành động thường dùng
// @access  Private
router.post('/quick-actions', [
  body('tank_id').isInt().withMessage('Tank ID phải là số nguyên'),
  body('action').isIn(['water_change', 'feeding', 'cleaning']).withMessage('Hành động không hợp lệ')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const { tank_id, action } = req.body;
  const today = new Date().toISOString().split('T')[0];

  // Kiểm tra quyền truy cập tank
  checkTankAccess(req.user.id, tank_id, (err, tank) => {
    if (err || !tank) {
      return res.status(404).json({
        success: false,
        message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
      });
    }

    const db = getDatabase();
    let defaultData = {};

    switch (action) {
      case 'water_change':
        defaultData = {
          activity_type: 'water_change',
          water_change_percentage: 20,
          notes: 'Thay nước định kỳ',
          reminder_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 ngày sau
        };
        break;
      case 'feeding':
        defaultData = {
          activity_type: 'feeding',
          notes: 'Cho cá ăn',
          reminder_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 ngày sau
        };
        break;
      case 'cleaning':
        defaultData = {
          activity_type: 'cleaning',
          notes: 'Vệ sinh hồ cá',
          reminder_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 14 ngày sau
        };
        break;
    }

    db.run(
      `INSERT INTO environment_logs 
       (tank_id, log_date, activity_type, water_change_percentage, notes, reminder_date, completed)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tank_id, today, defaultData.activity_type, defaultData.water_change_percentage || null, 
       defaultData.notes, defaultData.reminder_date, 0],
      function(insertErr) {
        if (insertErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi tạo hành động nhanh'
          });
        }

        const logId = this.lastID;

        // Lấy thông tin nhật ký vừa tạo
        db.get('SELECT * FROM environment_logs WHERE id = ?', [logId], (getErr, log) => {
          db.close();

          if (getErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy thông tin nhật ký'
            });
          }

          res.status(201).json({
            success: true,
            message: 'Tạo hành động nhanh thành công',
            data: log
          });
        });
      }
    );
  });
});

// @route   GET /api/environment/statistics/:tank_id
// @desc    Lấy thống kê môi trường của một hồ cá
// @access  Private
router.get('/statistics/:tank_id', (req, res) => {
  const tankId = req.params.tank_id;
  const { days = 30 } = req.query;

  // Kiểm tra quyền truy cập tank
  checkTankAccess(req.user.id, tankId, (err, tank) => {
    if (err || !tank) {
      return res.status(404).json({
        success: false,
        message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
      });
    }

    const db = getDatabase();

    // Lấy thống kê trong khoảng thời gian
    db.all(
      `SELECT 
         log_date,
         activity_type,
         ph_level,
         temperature,
         water_change_percentage,
         completed
       FROM environment_logs
       WHERE tank_id = ? AND log_date >= date('now', '-${parseInt(days)} days')
       ORDER BY log_date DESC`,
      [tankId],
      (err, logs) => {
        if (err) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê môi trường'
          });
        }

        // Tính toán thống kê
        const stats = {
          total_logs: logs.length,
          water_changes: logs.filter(l => l.activity_type === 'water_change').length,
          ph_readings: logs.filter(l => l.ph_level !== null).length,
          temperature_readings: logs.filter(l => l.temperature !== null).length,
          completed_tasks: logs.filter(l => l.completed === 1).length,
          avg_ph: null,
          avg_temperature: null,
          total_water_changed: 0
        };

        const phReadings = logs.filter(l => l.ph_level !== null).map(l => l.ph_level);
        const tempReadings = logs.filter(l => l.temperature !== null).map(l => l.temperature);
        const waterChanges = logs.filter(l => l.water_change_percentage !== null);

        if (phReadings.length > 0) {
          stats.avg_ph = (phReadings.reduce((a, b) => a + b, 0) / phReadings.length).toFixed(2);
        }

        if (tempReadings.length > 0) {
          stats.avg_temperature = (tempReadings.reduce((a, b) => a + b, 0) / tempReadings.length).toFixed(1);
        }

        if (waterChanges.length > 0) {
          stats.total_water_changed = waterChanges.reduce((sum, log) => sum + log.water_change_percentage, 0);
        }

        db.close();

        res.json({
          success: true,
          data: {
            period_days: parseInt(days),
            statistics: stats,
            recent_logs: logs.slice(0, 10) // 10 nhật ký gần nhất
          }
        });
      }
    );
  });
});

module.exports = router;
