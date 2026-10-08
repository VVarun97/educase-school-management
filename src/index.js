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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'School Management API is running...' });
});

// Fallback for root if public files are absent
app.get('/api', (req, res) => {
  res.send('School Management API is running...');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
