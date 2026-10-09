/**
 * Mongoose singleton – safe for Node.js hot-reload.
 * Usage: await connectDB();
 */
const mongoose = require('mongoose');

let cached = global._mongooseConn || null;

async function connectDB() {
  if (cached && cached.readyState === 1) return cached;

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cloud2crop';
  const conn = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });

  global._mongooseConn = conn.connection;
  cached = conn.connection;
  console.log('[DB] MongoDB connected to', conn.connection.name);
  return conn.connection;
}

module.exports = connectDB;
