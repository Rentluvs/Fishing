const sqlite3 = require('sqlite3').verbose();
const config = require('../config');
const { logger } = require('./errorHandler');

class DatabaseManager {
  constructor() {
    this.pool = [];
    this.maxConnections = 5;
    this.currentConnections = 0;
    this.waitingQueue = [];
  }

  async getConnection() {
    // If there's a connection available in pool, use it
    if (this.pool.length > 0) {
      const db = this.pool.pop();
      logger.debug('Reused database connection from pool', { 
        poolSize: this.pool.length,
        activeConnections: this.currentConnections
      });
      return db;
    }

    // If we haven't reached max connections, create new one
    if (this.currentConnections < this.maxConnections) {
      try {
        const db = await this.createConnection();
        this.currentConnections++;
        logger.debug('Created new database connection', {
          poolSize: this.pool.length,
          activeConnections: this.currentConnections
        });
        return db;
      } catch (error) {
        logger.error('Failed to create database connection', { error: error.message });
        throw error;
      }
    }

    // Wait for a connection to become available
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.indexOf({ resolve, reject });
        if (index > -1) {
          this.waitingQueue.splice(index, 1);
          reject(new Error('Database connection timeout'));
        }
      }, 10000); // 10 second timeout

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  createConnection() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(config.databasePath, sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Enable foreign keys and optimize settings
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL'); // Better concurrency
        db.run('PRAGMA synchronous = NORMAL'); // Better performance
        db.run('PRAGMA cache_size = 1000'); // 1000 pages cache
        db.run('PRAGMA temp_store = MEMORY'); // Use memory for temp tables

        resolve(db);
      });
    });
  }

  releaseConnection(db) {
    // If there are waiting requests, serve them first
    if (this.waitingQueue.length > 0) {
      const { resolve, timeout } = this.waitingQueue.shift();
      clearTimeout(timeout);
      resolve(db);
      return;
    }

    // Otherwise, return to pool
    if (this.pool.length < this.maxConnections) {
      this.pool.push(db);
      logger.debug('Returned connection to pool', {
        poolSize: this.pool.length,
        activeConnections: this.currentConnections
      });
    } else {
      // Close connection if pool is full
      db.close((err) => {
        if (err) {
          logger.error('Error closing database connection', { error: err.message });
        }
      });
      this.currentConnections--;
    }
  }

  async closeAll() {
    // Close all pooled connections
    const promises = this.pool.map(db => new Promise((resolve) => {
      db.close((err) => {
        if (err) {
          logger.error('Error closing pooled connection', { error: err.message });
        }
        resolve();
      });
    }));

    await Promise.all(promises);
    this.pool = [];
    this.currentConnections = 0;
    
    logger.info('All database connections closed');
  }

  // Wrapper for safe database operations
  async safeQuery(queryFn) {
    const db = await this.getConnection();
    try {
      const result = await queryFn(db);
      this.releaseConnection(db);
      return result;
    } catch (error) {
      this.releaseConnection(db);
      throw error;
    }
  }

  // Convenience methods
  get(sql, params = []) {
    return this.safeQuery((db) => new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    }));
  }

  all(sql, params = []) {
    return this.safeQuery((db) => new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }));
  }

  run(sql, params = []) {
    return this.safeQuery((db) => new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }));
  }
}

// Singleton instance
const dbManager = new DatabaseManager();

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Closing database connections...');
  await dbManager.closeAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Closing database connections...');
  await dbManager.closeAll();
  process.exit(0);
});

module.exports = { dbManager };