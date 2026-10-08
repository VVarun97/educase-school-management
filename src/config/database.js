const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  pool = mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false }
  });
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

// Test connection
pool.getConnection()
  .then((connection) => {
    console.log('Successfully connected to the database.');
    connection.release();
  })
  .catch((err) => {
    console.error('Error connecting to the database:', err.message);
  });

module.exports = pool;
