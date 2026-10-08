const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;
if (process.env.DATABASE_URL || process.env.MYSQL_URL) {
  const uri = process.env.DATABASE_URL || process.env.MYSQL_URL;
  // Only enforce SSL if explicitly requested or specified in connection string
  const useSSL = process.env.DB_SSL === 'true' || uri.includes('ssl=') || uri.includes('sslmode=');

  pool = mysql.createPool({
    uri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined
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

// Verify connection and auto-create table if needed
async function initDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the database.');

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS schools (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL
      );
    `;
    await connection.query(createTableQuery);
    console.log("Database table 'schools' is ready.");
    connection.release();
  } catch (err) {
    console.error('Database connection / initialization error:', err.message);
  }
}

initDatabase();

module.exports = pool;
