const mongoose = require('mongoose');

const connectMongo = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MongoDB gagal konek: MONGO_URI belum diset');
    return;
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB terhubung!', `(db: ${mongoose.connection.name})`);
  } catch (err) {
    console.error('MongoDB gagal konek:', err.message);
  }
};

const getMongoStatus = () => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const readyState = mongoose.connection.readyState;
  return {
    configured: !!process.env.MONGO_URI,
    connected: readyState === 1,
    readyState,
    state: states[readyState] || 'unknown',
    database: mongoose.connection.name || null,
  };
};

module.exports = connectMongo;
module.exports.getMongoStatus = getMongoStatus;
