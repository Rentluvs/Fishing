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

// @route   GET /api/tanks
// @desc    Lấy danh sách tất cả hồ cá của user
// @access  Private
router.get('/', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT t.*, 
            COUNT(DISTINCT b.id) as batch_count,
            SUM(CASE WHEN bt.alive_count > 0 THEN bt.alive_count ELSE b.initial_count END) as total_fish
     FROM fish_tanks t
     LEFT JOIN fish_batches b ON t.id = b.tank_id
     LEFT JOIN (
       SELECT batch_id, alive_count,
              ROW_NUMBER() OVER (PARTITION BY batch_id ORDER BY tracking_date DESC) as rn
       FROM batch_tracking
     ) bt ON b.id = bt.batch_id AND bt.rn = 1
     WHERE t.user_id = ?
     GROUP BY t.id
     ORDER BY t.created_at DESC`,
    [req.user.id],
    (err, tanks) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy danh sách hồ cá'
        });
      }

      res.json({
        success: true,
        data: tanks
      });
    }
  );
});

// @route   GET /api/tanks/:id
// @desc    Lấy thông tin chi tiết một hồ cá
// @access  Private
router.get('/:id', (req, res) => {
  const db = getDatabase();
  const tankId = req.params.id;

  db.get(
    'SELECT * FROM fish_tanks WHERE id = ? AND user_id = ?',
    [tankId, req.user.id],
    (err, tank) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy thông tin hồ cá'
        });
      }

      if (!tank) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại'
        });
      }

      // Lấy thông tin lứa cá trong hồ
      db.all(
        `SELECT b.*, 
                COALESCE(bt.alive_count, b.initial_count) as current_count,
                bt.tracking_date as last_updated
         FROM fish_batches b
         LEFT JOIN (
           SELECT batch_id, alive_count, tracking_date,
                  ROW_NUMBER() OVER (PARTITION BY batch_id ORDER BY tracking_date DESC) as rn
           FROM batch_tracking
         ) bt ON b.id = bt.batch_id AND bt.rn = 1
         WHERE b.tank_id = ?
         ORDER BY b.spawn_date DESC`,
        [tankId],
        (batchErr, batches) => {
          db.close();

          if (batchErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy thông tin lứa cá'
            });
          }

          res.json({
            success: true,
            data: {
              tank,
              batches
            }
          });
        }
      );
    }
  );
});

// @route   POST /api/tanks
// @desc    Tạo hồ cá mới
// @access  Private
router.post('/', [
  body('name').notEmpty().withMessage('Tên hồ cá không được để trống'),
  body('fish_type').optional().isLength({ max: 100 }).withMessage('Loại cá không được quá 100 ký tự'),
  body('tank_type').optional().isLength({ max: 100 }).withMessage('Loại hồ không được quá 100 ký tự'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Ghi chú không được quá 1000 ký tự')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const { name, fish_type, release_date, spawn_date, notes, tank_type, current_temperature } = req.body;
  const db = getDatabase();

  db.run(
    `INSERT INTO fish_tanks (user_id, name, fish_type, release_date, spawn_date, notes, tank_type, current_temperature)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, name, fish_type || null, release_date || null, spawn_date || null, notes || null, 
     tank_type || null, current_temperature || null],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi tạo hồ cá mới'
        });
      }

      const tankId = this.lastID;

      // Lấy thông tin hồ cá vừa tạo
      db.get('SELECT * FROM fish_tanks WHERE id = ?', [tankId], (getErr, tank) => {
        db.close();

        if (getErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin hồ cá'
          });
        }

        res.status(201).json({
          success: true,
          message: 'Tạo hồ cá thành công',
          data: tank
        });
      });
    }
  );
});

// @route   PUT /api/tanks/:id
// @desc    Cập nhật thông tin hồ cá
// @access  Private
router.put('/:id', [
  body('name').notEmpty().withMessage('Tên hồ cá không được để trống'),
  body('fish_type').optional().isLength({ max: 100 }).withMessage('Loại cá không được quá 100 ký tự'),
  body('tank_type').optional().isLength({ max: 100 }).withMessage('Loại hồ không được quá 100 ký tự'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Ghi chú không được quá 1000 ký tự')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const tankId = req.params.id;
  const { name, fish_type, release_date, spawn_date, notes, tank_type, current_temperature } = req.body;
  const db = getDatabase();

  db.run(
    `UPDATE fish_tanks 
     SET name = ?, fish_type = ?, release_date = ?, spawn_date = ?, notes = ?, 
         tank_type = ?, current_temperature = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [name, fish_type || null, release_date || null, spawn_date || null, notes || null,
     tank_type || null, current_temperature || null, tankId, req.user.id],
    function(err) {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi cập nhật hồ cá'
        });
      }

      if (this.changes === 0) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại'
        });
      }

      // Lấy thông tin hồ cá sau khi cập nhật
      db.get('SELECT * FROM fish_tanks WHERE id = ?', [tankId], (getErr, tank) => {
        db.close();

        if (getErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi lấy thông tin hồ cá'
          });
        }

        res.json({
          success: true,
          message: 'Cập nhật hồ cá thành công',
          data: tank
        });
      });
    }
  );
});

// @route   DELETE /api/tanks/:id
// @desc    Xóa hồ cá
// @access  Private
router.delete('/:id', (req, res) => {
  const tankId = req.params.id;
  const db = getDatabase();

  db.run(
    'DELETE FROM fish_tanks WHERE id = ? AND user_id = ?',
    [tankId, req.user.id],
    function(err) {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi xóa hồ cá'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại'
        });
      }

      res.json({
        success: true,
        message: 'Xóa hồ cá thành công'
      });
    }
  );
});

// @route   GET /api/tanks/:id/stats
// @desc    Lấy thống kê chi tiết hồ cá
// @access  Private
router.get('/:id/stats', (req, res) => {
  const tankId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập hồ cá
  db.get('SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?', [tankId, req.user.id], (err, tank) => {
    if (err || !tank) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Hồ cá không tồn tại'
      });
    }

    // Lấy thống kê
    db.all(
      `SELECT 
         (SELECT COUNT(*) FROM fish_batches WHERE tank_id = ?) as total_batches,
         (SELECT SUM(initial_count) FROM fish_batches WHERE tank_id = ?) as total_initial_fish,
         (SELECT COUNT(*) FROM environment_logs WHERE tank_id = ?) as total_env_logs,
         (SELECT SUM(amount) FROM expenses WHERE tank_id = ?) as total_expenses`,
      [tankId, tankId, tankId, tankId],
      (statsErr, stats) => {
        if (statsErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê'
          });
        }

        // Lấy lịch sử thay nước gần nhất
        db.all(
          `SELECT * FROM environment_logs 
           WHERE tank_id = ? AND activity_type = 'water_change' 
           ORDER BY log_date DESC LIMIT 5`,
          [tankId],
          (envErr, recentLogs) => {
            db.close();

            if (envErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy lịch sử môi trường'
              });
            }

            res.json({
              success: true,
              data: {
                stats: stats[0],
                recentEnvironmentLogs: recentLogs
              }
            });
          }
        );
      }
    );
  });
});

// Cấu hình multer để upload ảnh hồ cá
// Ưu tiên lưu vào client/public/upload/tanks; nếu không ghi được, fallback sang server/uploads/tanks
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const clientPublicUploadDir = path.join(__dirname, '..', '..', 'client', 'public', 'upload', 'tanks');
    const serverUploadDir = path.join(__dirname, '..', 'uploads', 'tanks');

    const ensureDir = (dirPath) => {
      try {
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.accessSync(dirPath, fs.constants.W_OK);
        return true;
      } catch (e) {
        return false;
      }
    };

    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction) {
      // Trong production (client đã build), lưu ở server/uploads để chắc chắn có quyền và đường dẫn tồn tại
      if (ensureDir(serverUploadDir)) {
        cb(null, serverUploadDir);
      } else {
        cb(new Error('Không thể tạo thư mục server/uploads/tanks'), null);
      }
      return;
    }

    // Development: ưu tiên client/public/upload, fallback server/uploads
    if (ensureDir(clientPublicUploadDir)) {
      cb(null, clientPublicUploadDir);
    } else if (ensureDir(serverUploadDir)) {
      console.warn('[upload] Fallback lưu ảnh vào server/uploads/tanks do không ghi được vào client/public/upload/tanks');
      cb(null, serverUploadDir);
    } else {
      cb(new Error('Không thể tạo thư mục lưu ảnh (thiếu quyền ghi)'), null);
    }
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `tank-${req.params.id}-${uniqueSuffix}${ext}`);
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

// @route   POST /api/tanks/:id/photos
// @desc    Upload ảnh cho hồ cá
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

  const tankId = req.params.id;
  const { caption, photo_date } = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập hồ cá
  db.get(
    'SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?',
    [tankId, req.user.id],
    (err, tank) => {
      if (err || !tank) {
        // Xóa file nếu không có quyền truy cập
        fs.unlinkSync(req.file.path);
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại'
        });
      }

      // Lưu thông tin ảnh vào database (đường dẫn public để client hiển thị)
      let photoPath;
      try {
        const dest = req.file.destination || '';
        const isProduction = process.env.NODE_ENV === 'production';
        if (!isProduction && dest.includes(path.join('client', 'public', 'upload', 'tanks'))) {
          photoPath = `/upload/tanks/${path.basename(req.file.path)}`;
        } else {
          // Production hoặc fallback: dùng /api/uploads để an toàn qua proxy hosting
          photoPath = `/api/uploads/tanks/${path.basename(req.file.path)}`;
        }
      } catch (_) {
        photoPath = `/api/uploads/tanks/${path.basename(req.file.path)}`;
      }
      const photoDate = photo_date || new Date().toISOString().split('T')[0];

      db.run(
        `INSERT INTO photos (tank_id, photo_path, caption, photo_date, file_size)
         VALUES (?, ?, ?, ?, ?)`,
        [tankId, photoPath, caption || null, photoDate, req.file.size],
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

// @route   GET /api/tanks/:id/photos
// @desc    Lấy danh sách ảnh của hồ cá
// @access  Private
router.get('/:id/photos', (req, res) => {
  const tankId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    'SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?',
    [tankId, req.user.id],
    (err, tank) => {
      if (err || !tank) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại'
        });
      }

      // Lấy danh sách ảnh
      db.all(
        'SELECT * FROM photos WHERE tank_id = ? ORDER BY photo_date DESC, created_at DESC',
        [tankId],
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

// @route   DELETE /api/tank-photos/:id
// @desc    Xóa ảnh hồ cá
// @access  Private
router.delete('/tank-photos/:id', (req, res) => {
  const photoId = req.params.id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập
  db.get(
    `SELECT p.*, t.user_id FROM photos p
     JOIN fish_tanks t ON p.tank_id = t.id
     WHERE p.id = ? AND t.user_id = ?`,
    [photoId, req.user.id],
    (err, photo) => {
      if (err || !photo) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Ảnh không tồn tại'
        });
      }

      // Xóa file khỏi đĩa. Hỗ trợ cả đường dẫn cũ (/uploads) và mới (/upload)
      let filePath;
      if (photo.photo_path && photo.photo_path.startsWith('/upload/')) {
        // File lưu trong client/public/upload
        const relativePath = photo.photo_path.replace(/^\/?upload\//, 'upload/');
        filePath = path.join(__dirname, '..', '..', 'client', 'public', relativePath);
      } else {
        // Fallback: đường dẫn cũ trong server/uploads
        filePath = path.join(__dirname, '..', photo.photo_path || '');
      }
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
