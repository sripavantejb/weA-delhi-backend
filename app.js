const express = require('express');
const cors = require('cors');
const routes = require('./routes');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://we-a-delhi-frontend.vercel.app',
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
