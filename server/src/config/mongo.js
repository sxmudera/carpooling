const mongoose = require('mongoose');

const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB terhubung!');
  } catch (err) {
    console.error('MongoDB gagal konek:', err.message);
  }
};

module.exports = connectMongo;
