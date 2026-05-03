// src/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    let uri = process.env.MONGO_URI;

    // Check if local MongoDB is responsive
    const isLocalAlive = await testConnection(uri);

    if (!isLocalAlive && process.env.NODE_ENV === 'development') {
      if (process.env.DEMO_BYPASS === 'true') {
        logger.warn('Local MongoDB unavailable. DEMO_BYPASS is true. Falling back to Demo Mode.');
        return;
      }
      logger.info('Local MongoDB unavailable and no Docker detected. Starting In-Memory MongoDB...');
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();
        logger.info(`In-Memory MongoDB started at: ${uri}`);
      } catch (memErr) {
        logger.warn('Failed to start In-Memory MongoDB. Falling back to Demo Mode.');
        return;
      }
    }

    const conn = await mongoose.connect(uri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection failed. Continuing in Demo Mode...', err);
  }
}

async function testConnection(uri) {
  if (!uri) return false;
  try {
    const conn = await mongoose.createConnection(uri, { serverSelectionTimeoutMS: 1000 }).asPromise();
    await conn.close();
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = connectDB;