const mysql = require('mysql2/promise');
require('dotenv').config();

// Base connection URI
const baseUri = process.env.DATABASE_URL || process.env.MYSQL_URL || process.env.MYSQL_PRIVATE_URL;

// Public TCP proxy (e.g. "trolley.proxy.rlwy.net:48102" or full "mysql://...")
const proxyHost = process.env.MYSQL_PUBLIC_URL || process.env.DATABASE_PUBLIC_URL;

let connectionUri;
if (proxyHost && proxyHost.startsWith('mysql://')) {
  connectionUri = proxyHost;
} else if (baseUri && proxyHost && proxyHost.includes('.proxy.rlwy.net')) {
  // Replace internal railway host with public proxy domain and port
  connectionUri = baseUri.replace(/@([^/:]+)(:\d+)?\//, `@${proxyHost.trim()}/`);
} else {
  connectionUri = baseUri;
}

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

    try {
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
      console.log("Database table 'schools' is verified and ready.");
    } catch (tableErr) {
      console.warn("Table auto-migration notice (create table):", tableErr.message);
    }
    connection.release();
  } catch (err) {
    console.error('Database connection error:', err.message);
  }
}

initDatabase();

module.exports = pool;
module.exports.activeUri = connectionUri;
