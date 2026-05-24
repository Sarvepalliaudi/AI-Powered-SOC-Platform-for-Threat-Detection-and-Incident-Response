const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MongoDB connection error: MONGODB_URI is not set in backend/.env');
    process.exit(1);
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

module.exports = connectDB;
