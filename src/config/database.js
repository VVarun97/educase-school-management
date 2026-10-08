const mysql = require('mysql2/promise');
require('dotenv').config();

const connectionUri =
  process.env.DATABASE_URL ||
  process.env.MYSQL_URL ||
  process.env.MYSQL_PRIVATE_URL ||
  process.env.MYSQL_PUBLIC_URL;

let pool;
if (connectionUri) {
  // Only enforce SSL if explicitly requested or specified in connection string
  const useSSL = process.env.DB_SSL === 'true' || connectionUri.includes('ssl=') || connectionUri.includes('sslmode=');

  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined
  });
} else {
  const host = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || process.env.MYSQLPORT, 10) || 3306;
  const user = process.env.DB_USER || process.env.MYSQLUSER || 'root';
  const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
  const database = process.env.DB_NAME || process.env.MYSQLDATABASE || 'school_management';

  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
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
