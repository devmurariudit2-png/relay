// src/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI;

    if (!uri) {
      logger.error('MONGO_URI is not set! Cannot connect to database.');
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI must be set in production');
      }
      logger.warn('No MONGO_URI set. Running without database (demo mode).');
      return;
    }

    logger.info(`Attempting MongoDB connection to: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@')}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      // In production, a failed DB connection is fatal
      logger.error('Cannot start in production without a database. Exiting.');
      process.exit(1);
    }
    logger.warn('Continuing in Demo Mode without database...');
  }
}

module.exports = connectDB;