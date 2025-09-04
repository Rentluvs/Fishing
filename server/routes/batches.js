const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// @route   GET /api/batches
// @desc    Lấy danh sách tất cả lứa cá của user
// @access  Private
router.get('/', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT b.*, t.name as tank_name,
            COALESCE(bt.alive_count, b.initial_count) as current_count,
            bt.tracking_date as last_updated,
            CASE 
              WHEN julianday('now') - julianday(b.spawn_date) < 30 THEN 'Giai đoạn cá bột'
              WHEN julianday('now') - julianday(b.spawn_date) < 90 THEN 'Giai đoạn con non'
              WHEN julianday('now') - julianday(b.spawn_date) < 180 THEN 'Giai đoạn phát triển'
              ELSE 'Giai đoạn trưởng thành'
            END as current_stage
     FROM fish_batches b
     LEFT JOIN fish_tanks t ON b.tank_id = t.id
     LEFT JOIN (
       SELECT batch_id, alive_count, tracking_date,
              ROW_NUMBER() OVER (PARTITION BY batch_id ORDER BY tracking_date DESC) as rn
       FROM batch_tracking
     ) bt ON b.id = bt.batch_id AND bt.rn = 1
     WHERE b.user_id = ?
     ORDER BY b.spawn_date DESC`,
    [req.user.id],
    (err, batches) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy danh sách lứa cá'
        });
      }

      res.json({
        success: true,
        data: batches
      });
    }
  );
});

// @route   GET /api/batches/available
// @desc    Danh sách lứa cá chưa thuộc hồ nào (để gắn vào hồ)
// @access  Private
router.get('/available', (req, res) => {
  const db = getDatabase();
  db.all(
    `SELECT id, batch_name, spawn_date, initial_count, fish_species
     FROM fish_batches
     WHERE user_id = ? AND tank_id IS NULL
     ORDER BY spawn_date DESC, id DESC`,
    [req.user.id],
    (err, rows) => {
      db.close();
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách lứa cá khả dụng' });
      }
      res.json({ success: true, data: rows });
    }
  );
});

// @route   PATCH /api/batches/:id/attach
// @desc    Gắn lứa cá có sẵn vào một hồ
// @access  Private
router.patch('/:id/attach', [
  body('tank_id').isInt().withMessage('Tank ID phải là số nguyên'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors: errors.array() });
  }

  const batchId = req.params.id;
  const { tank_id } = req.body;
  const db = getDatabase();

  // Kiểm tra quyền: user sở hữu batch và tank, và batch hiện chưa thuộc hồ
  db.get('SELECT id, user_id, tank_id FROM fish_batches WHERE id = ? AND user_id = ?', [batchId, req.user.id], (err, batch) => {
    if (err || !batch) {
      db.close();
      return res.status(404).json({ success: false, message: 'Lứa cá không tồn tại' });
    }
    if (batch.tank_id) {
      db.close();
      return res.status(400).json({ success: false, message: 'Lứa cá hiện đang thuộc một hồ' });
    }

    // Kiểm tra quyền sở hữu hồ
    db.get('SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?', [tank_id, req.user.id], (tankErr, tank) => {
      if (tankErr || !tank) {
        db.close();
        return res.status(404).json({ success: false, message: 'Hồ cá không tồn tại' });
      }

      db.run('UPDATE fish_batches SET tank_id = ? WHERE id = ?', [tank_id, batchId], function(updateErr) {
        if (updateErr) {
          db.close();
          return res.status(500).json({ success: false, message: 'Lỗi gắn lứa cá vào hồ' });
        }
        db.get('SELECT * FROM fish_batches WHERE id = ?', [batchId], (getErr, updated) => {
          db.close();
          if (getErr) {
            return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin lứa cá' });
          }
          res.json({ success: true, message: 'Đã gắn lứa cá vào hồ', data: updated });
        });
      });
    });
  });
});

// @route   GET /api/batches/:id
// @desc    Lấy thông tin chi tiết một lứa cá
// @access  Private
router.get('/:id', (req, res) => {
  const batchId = req.params.id;
  const db = getDatabase();

  // Lấy batch theo id và kiểm tra quyền truy cập theo user_id
  db.get(
    `SELECT b.*, t.name as tank_name
     FROM fish_batches b
     LEFT JOIN fish_tanks t ON b.tank_id = t.id
     WHERE b.id = ?`,
    [batchId],
    (err, batch) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy thông tin lứa cá'
        });
      }

      if (!batch || batch.user_id !== req.user.id) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      // Lấy lịch sử theo dõi
      db.all(
        'SELECT * FROM batch_tracking WHERE batch_id = ? ORDER BY tracking_date DESC',
        [batchId],
        (trackErr, tracking) => {
          if (trackErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy lịch sử theo dõi'
            });
          }

          // Lấy nhật ký phát triển
          db.all(
            'SELECT * FROM development_logs WHERE batch_id = ? ORDER BY log_date DESC',
            [batchId],
            (devErr, developmentLogs) => {
              if (devErr) {
                db.close();
                return res.status(500).json({
                  success: false,
                  message: 'Lỗi lấy nhật ký phát triển'
                });
              }

              // Lấy hình ảnh
              db.all(
                'SELECT * FROM photos WHERE batch_id = ? ORDER BY photo_date DESC',
                [batchId],
                (photoErr, photos) => {
                  db.close();

                  if (photoErr) {
                    return res.status(500).json({
                      success: false,
                      message: 'Lỗi lấy hình ảnh'
                    });
                  }

                  res.json({
                    success: true,
                    data: {
                      batch,
                      tracking,
                      developmentLogs,
                      photos
                    }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// @route   POST /api/batches
// @desc    Tạo lứa cá mới
// @access  Private
router.post('/', [
  body('tank_id').optional().isInt().withMessage('Tank ID phải là số nguyên nếu được cung cấp'),
  body('batch_name').optional().isLength({ max: 100 }).withMessage('Tên lứa cá không được quá 100 ký tự'),
  body('spawn_date').isISO8601().withMessage('Ngày đẻ không hợp lệ'),
  body('initial_count').isInt({ min: 1 }).withMessage('Số lượng cá bột phải là số nguyên dương'),
  body('fish_species').optional().isLength({ max: 100 }).withMessage('Chủng loại không được quá 100 ký tự')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const { tank_id, batch_name, spawn_date, initial_count, fish_species, notes } = req.body;

  // Hàm helper để tạo batch
  const createBatch = () => {
    const db = getDatabase();
    db.run(
      `INSERT INTO fish_batches (user_id, tank_id, batch_name, spawn_date, initial_count, fish_species, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, tank_id || null, batch_name || null, spawn_date, initial_count, fish_species || null, notes || null],
      function(insertErr) {
        if (insertErr) {
          console.error('Database insert error:', insertErr);
          console.error('Insert data:', [req.user.id, tank_id || null, batch_name || null, spawn_date, initial_count, fish_species || null, notes || null]);
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi tạo lứa cá'
          });
        }

        db.close();
        res.json({
          success: true,
          message: 'Tạo lứa cá thành công',
          data: {
            id: this.lastID,
            user_id: req.user.id,
            tank_id: tank_id || null,
            batch_name: batch_name || null,
            spawn_date,
            initial_count,
            fish_species: fish_species || null,
            notes: notes || null
          }
        });
      }
    );
  };

  // Nếu có tank_id thì kiểm tra quyền truy cập
  if (tank_id) {
    console.log('Checking tank access for user:', req.user.id, 'tank:', tank_id);
    checkTankAccess(req.user.id, tank_id, (err, tank) => {
      console.log('Tank access result:', { err, tank });
      if (err || !tank) {
        console.error('Tank access denied:', { userId: req.user.id, tankId: tank_id, error: err });
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
        });
      }
      createBatch();
    });
  } else {
    // Không có tank_id, tạo batch trực tiếp (lứa cá không thuộc hồ nào)
    console.log('Creating batch without tank for user:', req.user.id);
    createBatch();
  }

});

// @route   POST /api/batches/:id/tracking
// @desc    Thêm bản ghi theo dõi lứa cá
// @access  Private
router.post('/:id/tracking', [
  body('tracking_date').isISO8601().withMessage('Ngày theo dõi không hợp lệ'),
  body('stage').optional().isLength({ max: 50 }).withMessage('Giai đoạn không được quá 50 ký tự'),
  body('alive_count').isInt({ min: 0 }).withMessage('Số lượng sống phải là số nguyên không âm'),
  body('dead_count').isInt({ min: 0 }).withMessage('Số lượng chết phải là số nguyên không âm')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const batchId = req.params.id;
  let { tracking_date, stage, alive_count, dead_count, notes } = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập dựa vào user_id của batch (không phụ thuộc tank)
  db.get(
    `SELECT * FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      // Lấy bản ghi theo dõi gần nhất để tính toán
      db.get(
        `SELECT alive_count, dead_count 
         FROM batch_tracking 
         WHERE batch_id = ? 
         ORDER BY tracking_date DESC, created_at DESC 
         LIMIT 1`,
        [batchId],
        (trackErr, lastTracking) => {
          if (trackErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy dữ liệu theo dõi trước đó'
            });
          }

          // Tính toán số lượng sống
          let calculatedAliveCount = alive_count;
          if (dead_count > 0) {
            const previousAliveCount = lastTracking ? lastTracking.alive_count : batch.initial_count;
            calculatedAliveCount = Math.max(0, previousAliveCount - dead_count);
            if (!alive_count || alive_count === 0) {
              alive_count = calculatedAliveCount;
            }
          }

          db.run(
            `INSERT INTO batch_tracking (batch_id, tracking_date, stage, alive_count, dead_count, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [batchId, tracking_date, stage || null, alive_count, dead_count, notes || null],
            function(insertErr) {
              if (insertErr) {
                db.close();
                return res.status(500).json({
                  success: false,
                  message: 'Lỗi thêm bản ghi theo dõi'
                });
              }

              const trackingId = this.lastID;

              // Lấy thông tin bản ghi vừa tạo
              db.get('SELECT * FROM batch_tracking WHERE id = ?', [trackingId], (getErr, tracking) => {
                db.close();

                if (getErr) {
                  return res.status(500).json({
                    success: false,
                    message: 'Lỗi lấy thông tin bản ghi theo dõi'
                  });
                }

                res.status(201).json({
                  success: true,
                  message: 'Thêm bản ghi theo dõi thành công',
                  data: {
                    ...tracking,
                    calculated_alive_count: calculatedAliveCount,
                    previous_alive_count: lastTracking ? lastTracking.alive_count : batch.initial_count
                  }
                });
              });
            }
          );
        }
      );
    }
  );
});

// @route   POST /api/batches/:id/development-log
// @desc    Thêm nhật ký phát triển
// @access  Private
router.post('/:id/development-log', [
  body('log_date').isISO8601().withMessage('Ngày ghi nhật ký không hợp lệ'),
  body('stage').optional().isLength({ max: 50 }).withMessage('Giai đoạn không được quá 50 ký tự'),
  body('weight').optional().isNumeric().withMessage('Cân nặng phải là số'),
  body('length').optional().isNumeric().withMessage('Chiều dài phải là số')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const batchId = req.params.id;
  const { log_date, stage, description, weight, length, notes } = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập theo user_id của batch
  db.get(
    `SELECT id FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      db.run(
        `INSERT INTO development_logs (batch_id, log_date, stage, description, weight, length, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [batchId, log_date, stage || null, description || null, weight || null, length || null, notes || null],
        function(insertErr) {
          if (insertErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi thêm nhật ký phát triển'
            });
          }

          const logId = this.lastID;

          // Lấy thông tin nhật ký vừa tạo
          db.get('SELECT * FROM development_logs WHERE id = ?', [logId], (getErr, log) => {
            db.close();

            if (getErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin nhật ký phát triển'
              });
            }

            res.status(201).json({
              success: true,
              message: 'Thêm nhật ký phát triển thành công',
              data: log
            });
          });
        }
      );
    }
  );
});

// @route   GET /api/batches/:id/summary
// @desc    Lấy tóm tắt thông tin lứa cá
// @access  Private
router.get('/:id/summary', (req, res) => {
  const batchId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập và lấy thông tin cơ bản
  db.get(
    `SELECT b.*, t.name as tank_name
     FROM fish_batches b
     LEFT JOIN fish_tanks t ON b.tank_id = t.id
     WHERE b.id = ?`,
    [batchId],
    (err, batch) => {
      if (err || !batch || batch.user_id !== req.user.id) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      // Lấy thống kê
      db.get(
        `SELECT 
           (SELECT alive_count FROM batch_tracking WHERE batch_id = ? ORDER BY tracking_date DESC LIMIT 1) as current_count,
           (SELECT COUNT(*) FROM batch_tracking WHERE batch_id = ?) as tracking_records,
           (SELECT COUNT(*) FROM development_logs WHERE batch_id = ?) as development_logs,
           (SELECT COUNT(*) FROM photos WHERE batch_id = ?) as photo_count,
           (SELECT SUM(amount) FROM expenses WHERE batch_id = ?) as total_expenses`,
        [batchId, batchId, batchId, batchId, batchId],
        (statsErr, stats) => {
          db.close();

          if (statsErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy thống kê'
            });
          }

          // Tính tuổi (ngày)
          const spawnDate = new Date(batch.spawn_date);
          const now = new Date();
          const ageInDays = Math.floor((now - spawnDate) / (1000 * 60 * 60 * 24));

          res.json({
            success: true,
            data: {
              batch: {
                ...batch,
                age_in_days: ageInDays
              },
              stats: {
                ...stats,
                survival_rate: stats.current_count ? 
                  ((stats.current_count / batch.initial_count) * 100).toFixed(2) : 0
              }
            }
          });
        }
      );
    }
  );
});

// @route   PATCH /api/batches/:id/detach
// @desc    Gỡ lứa cá khỏi hồ (tank_id = NULL)
// @access  Private
router.patch('/:id/detach', (req, res) => {
  const batchId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập theo user_id của batch
  db.get(
    `SELECT id FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      db.run('UPDATE fish_batches SET tank_id = NULL WHERE id = ?', [batchId], function(updateErr) {
        if (updateErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi gỡ lứa cá khỏi hồ'
          });
        }

        // Trả về thông tin mới
        db.get('SELECT * FROM fish_batches WHERE id = ?', [batchId], (getErr, updated) => {
          db.close();
          if (getErr) {
            return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin lứa cá' });
          }
          res.json({ success: true, message: 'Đã gỡ lứa cá khỏi hồ', data: updated });
        });
      });
    }
  );
});

// @route   DELETE /api/batches/:id
// @desc    Xóa lứa cá
// @access  Private
router.delete('/:id', (req, res) => {
  const batchId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập theo user_id của batch
  db.get(
    `SELECT id FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      db.run('DELETE FROM fish_batches WHERE id = ?', [batchId], function(deleteErr) {
        db.close();

        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi xóa lứa cá'
          });
        }

        res.json({
          success: true,
          message: 'Xóa lứa cá thành công'
        });
      });
    }
  );
});

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/photos');
    // Tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `batch-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});

// Filter chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file ảnh!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// @route   POST /api/batches/:id/photos
// @desc    Upload ảnh cho lứa cá
// @access  Private
router.post('/:id/photos', upload.single('photo'), [
  body('caption').optional().isLength({ max: 255 }).withMessage('Mô tả không được quá 255 ký tự'),
  body('photo_date').optional().isISO8601().withMessage('Ngày chụp không hợp lệ')
], (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng chọn file ảnh để upload'
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Xóa file đã upload nếu validation thất bại
    fs.unlinkSync(req.file.path);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const batchId = req.params.id;
  const { caption, photo_date } = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập batch theo user
  db.get(
    `SELECT id FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        // Xóa file nếu không có quyền truy cập
        fs.unlinkSync(req.file.path);
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      // Lưu thông tin ảnh vào database
      const photoPath = `/uploads/photos/${path.basename(req.file.path)}`;
      const photoDate = photo_date || new Date().toISOString().split('T')[0];

      db.run(
        `INSERT INTO photos (batch_id, photo_path, caption, photo_date, file_size)
         VALUES (?, ?, ?, ?, ?)`,
        [batchId, photoPath, caption || null, photoDate, req.file.size],
        function(insertErr) {
          if (insertErr) {
            // Xóa file nếu lưu database thất bại
            fs.unlinkSync(req.file.path);
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi lưu ảnh vào database'
            });
          }

          const photoId = this.lastID;

          // Lấy thông tin ảnh vừa tạo
          db.get('SELECT * FROM photos WHERE id = ?', [photoId], (getErr, photo) => {
            db.close();

            if (getErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin ảnh'
              });
            }

            res.status(201).json({
              success: true,
              message: 'Upload ảnh thành công',
              data: photo
            });
          });
        }
      );
    }
  );
});

// @route   GET /api/batches/:id/photos
// @desc    Lấy danh sách ảnh của lứa cá
// @access  Private
router.get('/:id/photos', (req, res) => {
  const batchId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    `SELECT id FROM fish_batches WHERE id = ? AND user_id = ?`,
    [batchId, req.user.id],
    (err, batch) => {
      if (err || !batch) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Lứa cá không tồn tại'
        });
      }

      // Lấy danh sách ảnh
      db.all(
        'SELECT * FROM photos WHERE batch_id = ? ORDER BY photo_date DESC, created_at DESC',
        [batchId],
        (photosErr, photos) => {
          db.close();

          if (photosErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy danh sách ảnh'
            });
          }

          res.json({
            success: true,
            data: photos
          });
        }
      );
    }
  );
});

// @route   DELETE /api/photos/:id
// @desc    Xóa ảnh
// @access  Private
router.delete('/photos/:id', (req, res) => {
  const photoId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    `SELECT p.*, b.id as batch_id FROM photos p
     JOIN fish_batches b ON p.batch_id = b.id
     WHERE p.id = ? AND b.user_id = ?`,
    [photoId, req.user.id],
    (err, photo) => {
      if (err || !photo) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Ảnh không tồn tại'
        });
      }

      // Xóa file khỏi server
      const filePath = path.join(__dirname, '..', photo.photo_path);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (deleteErr) {
          console.warn('Không thể xóa file:', deleteErr);
        }
      }

      // Xóa record khỏi database
      db.run('DELETE FROM photos WHERE id = ?', [photoId], function(deleteErr) {
        db.close();

        if (deleteErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi xóa ảnh khỏi database'
          });
        }

        res.json({
          success: true,
          message: 'Xóa ảnh thành công'
        });
      });
    }
  );
});

module.exports = router;
