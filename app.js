const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const { ensureConnected } = require('./config/db');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://we-a-delhi-frontend.vercel.app',
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure DB is connected before handling API requests (required for Vercel serverless)
app.use(async (req, res, next) => {
  try {
    await ensureConnected();
    next();
  } catch (err) {
    console.error('DB connection failed:', err.message);
    res.status(503).json({ success: false, error: 'Database unavailable. Please try again.' });
  }
});

app.use(routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

module.exports = app;
