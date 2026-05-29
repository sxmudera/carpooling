const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const Kendaraan = sequelize.define('Kendaraan', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  nama_kendaraan: { type: DataTypes.STRING(100), allowNull: false },
  plat_nomor:     { type: DataTypes.STRING(20), allowNull: false, unique: true },
  kapasitas:      { type: DataTypes.INTEGER, allowNull: false },
  titik_kumpul:   { type: DataTypes.STRING(255), allowNull: false },
  tanggal_berangkat: { type: DataTypes.DATEONLY, allowNull: true },
  jam_berangkat:  { type: DataTypes.STRING(10), allowNull: false },
  harga_per_kursi:{ type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status:         { type: DataTypes.ENUM('aktif', 'nonaktif'), defaultValue: 'aktif' },
}, { tableName: 'kendaraan', timestamps: true });

User.hasMany(Kendaraan, { foreignKey: 'user_id' });
Kendaraan.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Kendaraan;