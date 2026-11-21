// db.js — MySQL connection using environment variables
// Copy server/.env.example to server/.env and set your credentials
require('dotenv').config();

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'private_space_booking',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection on startup (non-fatal in test mode)
if (process.env.NODE_ENV !== 'test') {
  pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL connected — private_space_booking');
      conn.release();
    })
    .catch(err => {
      console.error('❌ MySQL connection warning:', err.message);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    });
}

module.exports = pool;
