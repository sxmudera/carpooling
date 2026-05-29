require('dotenv').config();
const { sequelize } = require('../src/config/database');

require('../src/services/User');
require('../src/services/Kendaraan');
require('../src/services/Booking');
require('../src/services/SimStnk');
require('../src/services/Pembayaran');
require('../src/services/Rating');

const migrate = async () => {
  try {
    await sequelize.authenticate();
    console.log('Koneksi MySQL OK...');
    await sequelize.sync({ alter: true });
    console.log('Semua tabel berhasil dibuat/diupdate!');
    console.log('Tabel: users, kendaraans, bookings, sim_stnks, pembayarans');
    process.exit(0);
  } catch (err) {
    console.error('Migrasi gagal:', err.message);
    process.exit(1);
  }
};

migrate();