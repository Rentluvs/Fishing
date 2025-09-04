const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const config = require('../config');
const { authenticateToken } = require('./auth');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Middleware xác thực cho tất cả routes
router.use(authenticateToken);

// Middleware để kết nối database
function getDatabase() {
  return new sqlite3.Database(config.databasePath);
}

// Multer config for receipts
const receiptsDir = path.join(__dirname, '../uploads/receipts');
if (!fs.existsSync(receiptsDir)) {
  fs.mkdirSync(receiptsDir, { recursive: true });
}
const receiptStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, receiptsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `expense-${req.params.id}-${uniqueSuffix}${ext}`);
  }
});
const receiptFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Chỉ được upload ảnh'));
};
const uploadReceipt = multer({ storage: receiptStorage, fileFilter: receiptFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// @route   GET /api/expenses
// @desc    Lấy danh sách chi phí của user
// @access  Private
router.get('/', (req, res) => {
  const { tank_id, batch_id, category, year, month, limit = 100 } = req.query;
  const db = getDatabase();

  let query = `
    SELECT e.*,
           t.name as tank_name,
           b.batch_name
    FROM expenses e
    LEFT JOIN fish_tanks t ON e.tank_id = t.id
    LEFT JOIN fish_batches b ON e.batch_id = b.id
    WHERE e.user_id = ?
  `;
  const params = [req.user.id];

  if (tank_id) {
    query += ' AND e.tank_id = ?';
    params.push(tank_id);
  }

  if (batch_id) {
    query += ' AND e.batch_id = ?';
    params.push(batch_id);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (year) {
    query += ' AND strftime("%Y", e.expense_date) = ?';
    params.push(year);
  }

  if (month) {
    query += ' AND strftime("%m", e.expense_date) = ?';
    params.push(month.toString().padStart(2, '0'));
  }

  query += ' ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  db.all(query, params, (err, expenses) => {
    db.close();

    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy danh sách chi phí'
      });
    }

    res.json({
      success: true,
      data: expenses
    });
  });
});

// @route   GET /api/expenses/summary
// @desc    Lấy tóm tắt chi phí
// @access  Private
router.get('/summary', (req, res) => {
  const { period = 'month', tank_id, batch_id } = req.query;
  const db = getDatabase();

  let dateFormat, groupBy;
  switch (period) {
    case 'year':
      dateFormat = '%Y';
      groupBy = 'year';
      break;
    case 'month':
    default:
      dateFormat = '%Y-%m';
      groupBy = 'month';
      break;
  }

  let query = `
    SELECT
      strftime('${dateFormat}', expense_date) as period,
      category,
      COUNT(*) as transaction_count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM expenses
    WHERE user_id = ?
  `;
  const params = [req.user.id];

  if (tank_id) {
    query += ' AND tank_id = ?';
    params.push(tank_id);
  }

  if (batch_id) {
    query += ' AND batch_id = ?';
    params.push(batch_id);
  }

  query += `
    GROUP BY strftime('${dateFormat}', expense_date), category
    ORDER BY period DESC, category
  `;

  db.all(query, params, (err, summary) => {
    if (err) {
      db.close();
      return res.status(500).json({
        success: false,
        message: 'Lỗi lấy tóm tắt chi phí'
      });
    }

    // Lấy tổng chi phí theo từng kỳ
    let totalQuery = `
      SELECT
        strftime('${dateFormat}', expense_date) as period,
        COUNT(*) as total_transactions,
        SUM(amount) as total_amount
      FROM expenses
      WHERE user_id = ?
    `;
    const totalParams = [req.user.id];

    if (tank_id) {
      totalQuery += ' AND tank_id = ?';
      totalParams.push(tank_id);
    }

    if (batch_id) {
      totalQuery += ' AND batch_id = ?';
      totalParams.push(batch_id);
    }

    totalQuery += ` GROUP BY strftime('${dateFormat}', expense_date) ORDER BY period DESC`;

    db.all(totalQuery, totalParams, (totalErr, totals) => {
      db.close();

      if (totalErr) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy tổng chi phí'
        });
      }

      res.json({
        success: true,
        data: {
          period: groupBy,
          summary_by_category: summary,
          totals_by_period: totals
        }
      });
    });
  });
});

// @route   GET /api/expenses/categories
// @desc    Lấy danh sách các danh mục chi phí
// @access  Private
router.get('/categories', (req, res) => {
  const db = getDatabase();

  db.all(
    `SELECT
       category,
       COUNT(*) as count,
       SUM(amount) as total_amount,
       AVG(amount) as avg_amount
     FROM expenses
     WHERE user_id = ?
     GROUP BY category
     ORDER BY total_amount DESC`,
    [req.user.id],
    (err, categories) => {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy danh mục chi phí'
        });
      }

      const defaultCategories = [
        'Thức ăn cá',
        'Thuốc điều trị',
        'Thiết bị',
        'Điện nước',
        'Vật liệu',
        'Cá giống',
        'Bảo trì',
        'Khác'
      ];

      res.json({
        success: true,
        data: {
          used_categories: categories,
          default_categories: defaultCategories
        }
      });
    }
  );
});

// @route   POST /api/expenses
// @desc    Thêm chi phí mới
// @access  Private
router.post('/', [
  body('expense_date').isISO8601().withMessage('Ngày chi phí không hợp lệ'),
  body('category').notEmpty().withMessage('Danh mục không được để trống'),
  body('amount').isNumeric().withMessage('Số tiền phải là số'),
  body('tank_id').optional({ nullable: true }).isInt().withMessage('Tank ID phải là số nguyên'),
  body('batch_id').optional({ nullable: true }).isInt().withMessage('Batch ID phải là số nguyên'),
  body('expense_type').optional().isIn(['purchase','sale']).withMessage('Loại chi phí không hợp lệ')
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
    batch_id,
    expense_date,
    category,
    description,
    amount,
    currency = 'VND',
    notes,
    expense_type = 'purchase'
  } = req.body;

  const db = getDatabase();

  // Kiểm tra quyền truy cập tank nếu có
  if (tank_id) {
    db.get('SELECT id FROM fish_tanks WHERE id = ? AND user_id = ?', [tank_id, req.user.id], (err, tank) => {
      if (err || !tank) {
        db.close();
        return res.status(404).json({
          success: false,
          message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
        });
      }
      insertExpense();
    });
  } else {
    insertExpense();
  }

  function insertExpense() {
    db.run(
      `INSERT INTO expenses
       (user_id, tank_id, batch_id, expense_date, category, description, amount, currency, notes, expense_type, receipt_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
      [req.user.id, tank_id || null, batch_id || null, expense_date, category,
       description || null, amount, currency, notes || null, expense_type],
      function(insertErr) {
        if (insertErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi thêm chi phí mới'
          });
        }

        const expenseId = this.lastID;

        // Lấy thông tin chi phí vừa tạo
        db.get(
          `SELECT e.*, t.name as tank_name, b.batch_name
           FROM expenses e
           LEFT JOIN fish_tanks t ON e.tank_id = t.id
           LEFT JOIN fish_batches b ON e.batch_id = b.id
           WHERE e.id = ?`,
          [expenseId],
          (getErr, expense) => {
            db.close();

            if (getErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin chi phí'
              });
            }

            res.status(201).json({
              success: true,
              message: 'Thêm chi phí thành công',
              data: expense
            });
          }
        );
      }
    );
  }
});

// @route   PUT /api/expenses/:id
// @desc    Cập nhật chi phí
// @access  Private
router.put('/:id', [
  body('expense_date').optional().isISO8601().withMessage('Ngày chi phí không hợp lệ'),
  body('category').optional().notEmpty().withMessage('Danh mục không được để trống'),
  body('amount').optional().isNumeric().withMessage('Số tiền phải là số'),
  body('tank_id').optional({ nullable: true }).isInt().withMessage('Tank ID phải là số nguyên'),
  body('batch_id').optional({ nullable: true }).isInt().withMessage('Batch ID phải là số nguyên'),
  body('expense_type').optional().isIn(['purchase','sale']).withMessage('Loại chi phí không hợp lệ')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: errors.array()
    });
  }

  const expenseId = req.params.id;
  const updateData = req.body;
  const db = getDatabase();

  // Kiểm tra quyền truy cập chi phí
  db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, req.user.id], (err, expense) => {
    if (err || !expense) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Chi phí không tồn tại'
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

    params.push(expenseId);

    db.run(
      `UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`,
      params,
      function(updateErr) {
        if (updateErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi cập nhật chi phí'
          });
        }

        // Lấy thông tin sau khi cập nhật
        db.get(
          `SELECT e.*, t.name as tank_name, b.batch_name
           FROM expenses e
           LEFT JOIN fish_tanks t ON e.tank_id = t.id
           LEFT JOIN fish_batches b ON e.batch_id = b.id
           WHERE e.id = ?`,
          [expenseId],
          (getErr, updatedExpense) => {
            db.close();

            if (getErr) {
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy thông tin chi phí'
              });
            }

            res.json({
              success: true,
              message: 'Cập nhật chi phí thành công',
              data: updatedExpense
            });
          }
        );
      }
    );
  });
});

// @route   POST /api/expenses/:id/receipt
// @desc    Upload/replace receipt image for an expense
// @access  Private
router.post('/:id/receipt', uploadReceipt.single('receipt'), (req, res) => {
  const expenseId = req.params.id;
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
  }
  const db = getDatabase();
  // Ensure expense belongs to user
  db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [expenseId, req.user.id], (err, expense) => {
    if (err || !expense) {
      // cleanup
      fs.unlinkSync(req.file.path);
      db.close();
      return res.status(404).json({ success: false, message: 'Chi phí không tồn tại' });
    }

    const relPath = `/uploads/receipts/${path.basename(req.file.path)}`;
    db.run('UPDATE expenses SET receipt_path = ? WHERE id = ?', [relPath, expenseId], function (updateErr) {
      if (updateErr) {
        fs.unlinkSync(req.file.path);
        db.close();
        return res.status(500).json({ success: false, message: 'Lỗi lưu ảnh' });
      }
      db.get('SELECT * FROM expenses WHERE id = ?', [expenseId], (getErr, updated) => {
        db.close();
        if (getErr) {
          return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin chi phí' });
        }
        res.json({ success: true, message: 'Upload ảnh thành công', data: updated });
      });
    });
  });
});

// @route   DELETE /api/expenses/:id
// @desc    Xóa chi phí
// @access  Private
router.delete('/:id', (req, res) => {
  const expenseId = req.params.id;
  const db = getDatabase();

  db.run(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [expenseId, req.user.id],
    function(err) {
      db.close();

      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Lỗi xóa chi phí'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          message: 'Chi phí không tồn tại'
        });
      }

      res.json({
        success: true,
        message: 'Xóa chi phí thành công'
      });
    }
  );
});

// @route   GET /api/expenses/statistics
// @desc    Lấy thống kê chi phí tổng quan
// @access  Private
router.get('/statistics', (req, res) => {
  const { year, tank_id } = req.query;
  const currentYear = year || new Date().getFullYear();
  const db = getDatabase();

  let whereClause = 'WHERE user_id = ? AND strftime("%Y", expense_date) = ?';
  const params = [req.user.id, currentYear.toString()];

  if (tank_id) {
    whereClause += ' AND tank_id = ?';
    params.push(tank_id);
  }

  // Thống kê theo tháng
  db.all(
    `SELECT
       strftime('%m', expense_date) as month,
       COUNT(*) as transaction_count,
       SUM(amount) as total_amount
     FROM expenses
     ${whereClause}
     GROUP BY strftime('%m', expense_date)
     ORDER BY month`,
    params,
    (err, monthlyStats) => {
      if (err) {
        db.close();
        return res.status(500).json({
          success: false,
          message: 'Lỗi lấy thống kê tháng'
        });
      }

      // Thống kê theo danh mục
      db.all(
        `SELECT
           category,
           COUNT(*) as transaction_count,
           SUM(amount) as total_amount,
           ROUND(100.0 * SUM(amount) / (SELECT SUM(amount) FROM expenses ${whereClause}), 2) as percentage
         FROM expenses
         ${whereClause}
         GROUP BY category
         ORDER BY total_amount DESC`,
        params,
        (catErr, categoryStats) => {
          if (catErr) {
            db.close();
            return res.status(500).json({
              success: false,
              message: 'Lỗi lấy thống kê danh mục'
            });
          }

          // Thống kê tổng quan
          db.get(
            `SELECT
               COUNT(*) as total_transactions,
               SUM(amount) as total_amount,
               AVG(amount) as avg_amount,
               MIN(amount) as min_amount,
               MAX(amount) as max_amount
             FROM expenses
             ${whereClause}`,
            params,
            (totalErr, totalStats) => {
              if (totalErr) {
                db.close();
                return res.status(500).json({
                  success: false,
                  message: 'Lỗi lấy thống kê tổng quan'
                });
              }

              // Thống kê so với năm trước
              const lastYear = (parseInt(currentYear) - 1).toString();
              let lastYearParams = [req.user.id, lastYear];
              if (tank_id) {
                lastYearParams.push(tank_id);
              }

              db.get(
                `SELECT SUM(amount) as last_year_total
                 FROM expenses
                 WHERE user_id = ? AND strftime("%Y", expense_date) = ?${tank_id ? ' AND tank_id = ?' : ''}`,
                lastYearParams,
                (lastYearErr, lastYearStats) => {
                  db.close();

                  if (lastYearErr) {
                    return res.status(500).json({
                      success: false,
                      message: 'Lỗi lấy thống kê năm trước'
                    });
                  }

                  const lastYearTotal = lastYearStats.last_year_total || 0;
                  const currentTotal = totalStats.total_amount || 0;
                  const yearOverYearChange = lastYearTotal > 0 ?
                    ((currentTotal - lastYearTotal) / lastYearTotal * 100).toFixed(2) : null;

                  res.json({
                    success: true,
                    data: {
                      year: currentYear,
                      total_statistics: {
                        ...totalStats,
                        last_year_total: lastYearTotal,
                        year_over_year_change: yearOverYearChange
                      },
                      monthly_statistics: monthlyStats,
                      category_statistics: categoryStats
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

// @route   GET /api/expenses/tank/:tank_id/summary
// @desc    Lấy tóm tắt chi phí theo hồ cá
// @access  Private
router.get('/tank/:tank_id/summary', (req, res) => {
  const tankId = req.params.tank_id;
  const db = getDatabase();

  // Kiểm tra quyền truy cập tank
  db.get('SELECT id, name FROM fish_tanks WHERE id = ? AND user_id = ?', [tankId, req.user.id], (err, tank) => {
    if (err || !tank) {
      db.close();
      return res.status(404).json({
        success: false,
        message: 'Hồ cá không tồn tại hoặc bạn không có quyền truy cập'
      });
    }

    // Lấy thống kê chi phí cho hồ cá này
    db.get(
      `SELECT
         COUNT(*) as total_transactions,
         SUM(amount) as total_amount,
         AVG(amount) as avg_amount,
         MIN(expense_date) as first_expense,
         MAX(expense_date) as last_expense
       FROM expenses
       WHERE tank_id = ?`,
      [tankId],
      (statsErr, stats) => {
        if (statsErr) {
          db.close();
          return res.status(500).json({
            success: false,
            message: 'Lỗi lấy thống kê chi phí'
          });
        }

        // Lấy chi phí theo danh mục
        db.all(
          `SELECT category, SUM(amount) as total_amount, COUNT(*) as count
           FROM expenses
           WHERE tank_id = ?
           GROUP BY category
           ORDER BY total_amount DESC`,
          [tankId],
          (catErr, categories) => {
            if (catErr) {
              db.close();
              return res.status(500).json({
                success: false,
                message: 'Lỗi lấy chi phí theo danh mục'
              });
            }

            // Lấy chi phí gần nhất
            db.all(
              `SELECT * FROM expenses
               WHERE tank_id = ?
               ORDER BY expense_date DESC, created_at DESC
               LIMIT 10`,
              [tankId],
              (recentErr, recentExpenses) => {
                db.close();

                if (recentErr) {
                  return res.status(500).json({
                    success: false,
                    message: 'Lỗi lấy chi phí gần nhất'
                  });
                }

                res.json({
                  success: true,
                  data: {
                    tank: tank,
                    statistics: stats,
                    categories: categories,
                    recent_expenses: recentExpenses
                  }
                });
              }
            );
          }
        );
      }
    );
  });
});

module.exports = router;
