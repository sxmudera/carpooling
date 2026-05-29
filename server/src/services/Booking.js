const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Kendaraan = require('./Kendaraan');

const Booking = sequelize.define('Booking', {
  id:           { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:      { type: DataTypes.INTEGER, allowNull: false },
  kendaraan_id: { type: DataTypes.INTEGER, allowNull: false },
  tanggal:      { type: DataTypes.DATEONLY, allowNull: false },
  jumlah_kursi: { type: DataTypes.INTEGER, defaultValue: 1 },
  total_harga:  { type: DataTypes.INTEGER, allowNull: false },
  status:       { type: DataTypes.ENUM('pending', 'konfirmasi', 'selesai', 'batal'), defaultValue: 'pending' },
}, { tableName: 'booking', timestamps: true });

User.hasMany(Booking, { foreignKey: 'user_id' });
Booking.belongsTo(User, { foreignKey: 'user_id' });
Kendaraan.hasMany(Booking, { foreignKey: 'kendaraan_id' });
Booking.belongsTo(Kendaraan, { foreignKey: 'kendaraan_id' });

module.exports = Booking;
