require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const schoolRoutes = require('./routes/schoolRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const path = require('path');

// Static frontend serving
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/', schoolRoutes);

const db = require('./config/database');

// Health check endpoint with database diagnostics
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      message: 'School Management API and Database are operational'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
      code: err.code
    });
  }
});

// Diagnostic check to see which environment variables are detected
app.get('/api/status', async (req, res) => {
  const envInfo = {
    has_DATABASE_URL: Boolean(process.env.DATABASE_URL),
    has_MYSQL_URL: Boolean(process.env.MYSQL_URL),
    has_MYSQL_PRIVATE_URL: Boolean(process.env.MYSQL_PRIVATE_URL),
    has_MYSQL_PUBLIC_URL: Boolean(process.env.MYSQL_PUBLIC_URL),
    has_MYSQLHOST: Boolean(process.env.MYSQLHOST),
    has_DB_HOST: Boolean(process.env.DB_HOST),
    detected_host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    detected_port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    detected_db: process.env.DB_NAME || process.env.MYSQLDATABASE || 'school_management'
  };

  try {
    const [rows] = await db.query('SELECT COUNT(*) as schoolCount FROM schools');
    res.json({
      status: 'ok',
      database: 'connected',
      env: envInfo,
      schoolCount: rows[0].schoolCount
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'error',
      env: envInfo,
      error: err.message,
      code: err.code
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
