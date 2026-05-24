const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let memoryServer;

const connectDB = async () => {
  let uri = process.env.MONGODB_URI;

  if (!uri) {
    if (process.env.NODE_ENV === 'production') {
      console.error('MongoDB connection error: MONGODB_URI is not set in backend/.env');
      process.exit(1);
    }

    console.warn('MONGODB_URI not set: starting an in-memory MongoDB instance for development.');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4, // Prefer IPv4 — fixes some Atlas ENOTFOUND DNS issues on Windows
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    if (error.message.includes('ENOTFOUND')) {
      console.error('\nAtlas DNS troubleshooting:');
      console.error('  1. Check internet connection and disable VPN if active');
      console.error('  2. Verify MONGODB_URI hostname matches Atlas cluster');
      console.error('  3. Ensure Network Access in Atlas allows your IP (0.0.0.0/0 for dev)');
      console.error('  4. URI must include database name: ...mongodb.net/ai_soc_platform?...');
    }
    process.exit(1);
  }
};

const stopMemoryServer = async () => {
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
};

process.on('SIGINT', async () => {
  await stopMemoryServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopMemoryServer();
  process.exit(0);
});

module.exports = connectDB;
