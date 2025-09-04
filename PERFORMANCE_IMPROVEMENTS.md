# ⚡ HIỆU SUẤT - CẢI TIẾN CẦN THIẾT

## 1. Database Connection Management
**Vấn đề**: Mở/đóng database connection ở mỗi request

**Hiện tại**:
```javascript
function getDatabase() {
  return new sqlite3.Database(config.databasePath);
}
// Sử dụng: db.close() trong mỗi route
```

**Cải tiến - Connection Pool**:
```javascript
const sqlite3 = require('sqlite3').verbose();
const { Database } = require('sqlite3');

class DatabasePool {
  constructor(dbPath, maxConnections = 5) {
    this.dbPath = dbPath;
    this.pool = [];
    this.maxConnections = maxConnections;
    this.currentConnections = 0;
  }

  async getConnection() {
    if (this.pool.length > 0) {
      return this.pool.pop();
    }
    
    if (this.currentConnections < this.maxConnections) {
      this.currentConnections++;
      return new Promise((resolve, reject) => {
        const db = new Database(this.dbPath, (err) => {
          if (err) reject(err);
          else resolve(db);
        });
      });
    }
    
    // Wait for available connection
    return new Promise((resolve) => {
      const checkPool = () => {
        if (this.pool.length > 0) {
          resolve(this.pool.pop());
        } else {
          setTimeout(checkPool, 50);
        }
      };
      checkPool();
    });
  }

  releaseConnection(db) {
    this.pool.push(db);
  }
}

const dbPool = new DatabasePool(config.databasePath);
```

## 2. Database Indexing
**Vấn đề**: Thiếu indexes cho các truy vấn thường xuyên

**Cải tiến**:
```sql
-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fish_tanks_user_id ON fish_tanks(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_batches_user_id ON fish_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_fish_batches_tank_id ON fish_batches(tank_id);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_batch_id ON batch_tracking(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_tracking_date ON batch_tracking(tracking_date DESC);
CREATE INDEX IF NOT EXISTS idx_environment_logs_tank_id ON environment_logs(tank_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_photos_tank_id ON photos(tank_id);
CREATE INDEX IF NOT EXISTS idx_photos_batch_id ON photos(batch_id);
```

## 3. Query Optimization
**Vấn đề**: N+1 queries, complex joins without optimization

**Ví dụ cải tiến**:
```javascript
// Thay vì multiple queries
const tanks = await getTanks();
for (let tank of tanks) {
  tank.batches = await getBatchesByTank(tank.id);
  tank.photos = await getPhotosByTank(tank.id);
}

// Dùng single query với JOIN
const tanksWithDetails = `
  SELECT 
    t.*,
    COUNT(DISTINCT b.id) as batch_count,
    COUNT(DISTINCT p.id) as photo_count,
    SUM(COALESCE(bt.alive_count, b.initial_count, 0)) as total_fish
  FROM fish_tanks t
  LEFT JOIN fish_batches b ON t.id = b.tank_id
  LEFT JOIN photos p ON t.id = p.tank_id
  LEFT JOIN (
    SELECT batch_id, alive_count,
           ROW_NUMBER() OVER (PARTITION BY batch_id ORDER BY tracking_date DESC) as rn
    FROM batch_tracking
  ) bt ON b.id = bt.batch_id AND bt.rn = 1
  WHERE t.user_id = ?
  GROUP BY t.id
  ORDER BY t.created_at DESC
`;
```

## 4. Frontend Performance
**Vấn đề**: Không có lazy loading, bundle size lớn

**Cải tiến**:
```javascript
// Route-based code splitting
const routes = [
  {
    path: '/tanks',
    component: () => import('@/views/tanks/TankList.vue')
  },
  {
    path: '/dashboard',
    component: () => import('@/views/dashboard/Dashboard.vue')
  }
];

// Image lazy loading
<img 
  v-lazy="imageUrl" 
  :alt="alt"
  loading="lazy"
/>
```

## 5. API Caching
**Hiện tại**: Client-side caching trong useApi.js (GOOD!)
**Cải tiến thêm**:
```javascript
// Server-side caching
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Cached middleware
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    const key = req.originalUrl;
    const cached = cache.get(key);
    
    if (cached) {
      return res.json(cached);
    }
    
    res.sendResponse = res.json;
    res.json = (body) => {
      cache.set(key, body, duration);
      res.sendResponse(body);
    };
    
    next();
  };
};

// Usage
app.get('/api/tanks', cacheMiddleware(300), getTanks);
```

## 6. File Upload Optimization
**Cải tiến**:
```javascript
// Image compression
const sharp = require('sharp');

const compressImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .png({ compressionLevel: 8 })
    .toFile(outputPath);
};

// WebP format support
const generateWebP = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .webp({ quality: 80 })
    .toFile(outputPath);
};
```

## 7. Database Migration cho Production
```javascript
// Batch operations thay vì individual inserts
const insertBatch = async (data) => {
  const placeholders = data.map(() => '(?, ?, ?, ?)').join(', ');
  const values = data.flat();
  
  return db.run(
    `INSERT INTO table_name (col1, col2, col3, col4) VALUES ${placeholders}`,
    values
  );
};
```
