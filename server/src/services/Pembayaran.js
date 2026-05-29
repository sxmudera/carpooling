const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Booking = require('./Booking');

const Pembayaran = sequelize.define('Pembayaran', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  metode:     { type: DataTypes.ENUM('transfer', 'cash', 'dompet_digital'), defaultValue: 'cash' },
  jumlah:     { type: DataTypes.INTEGER, allowNull: false },
  status:     { type: DataTypes.ENUM('pending', 'lunas', 'gagal'), defaultValue: 'pending' },
}, { tableName: 'pembayaran', timestamps: true });

Booking.hasOne(Pembayaran, { foreignKey: 'booking_id' });
Pembayaran.belongsTo(Booking, { foreignKey: 'booking_id' });

module.exports = Pembayaran;
