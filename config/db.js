const mongoose = require('mongoose');

let connectionPromise = null;

function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.error('MONGODB_URI is missing or empty in .env');
    return Promise.reject(new Error('MONGODB_URI is not defined in environment'));
  }
  if (connectionPromise) return connectionPromise;
  console.log('Connecting to MongoDB...');
  connectionPromise = mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 15000,
      bufferCommands: false,
    })
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      connectionPromise = null;
      console.error('MongoDB connection failed:', err.message);
      throw err;
    });
  return connectionPromise;
}

/** Call before handling requests; use in serverless so DB is ready on first request. */
function ensureConnected() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  return connect();
}

module.exports = { connect, ensureConnected };
