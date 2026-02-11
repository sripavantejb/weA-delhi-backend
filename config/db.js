const mongoose = require('mongoose');

function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    console.error('MONGODB_URI is missing or empty in .env');
    return Promise.reject(new Error('MONGODB_URI is not defined in environment'));
  }
  console.log('Connecting to MongoDB...');
  return mongoose
    .connect(uri, {
      serverSelectionTimeoutMS: 10000,
    })
    .then(() => {
      console.log('MongoDB connected successfully');
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      throw err;
    });
}

module.exports = { connect };
