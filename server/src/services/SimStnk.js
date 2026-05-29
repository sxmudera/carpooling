const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');

const SimStnk = sequelize.define('SimStnk', {
  id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:            { type: DataTypes.INTEGER, allowNull: false },
  jenis:              { type: DataTypes.ENUM('SIM', 'STNK'), allowNull: false },
  nomor:              { type: DataTypes.STRING(50), allowNull: false },
  status_verifikasi:  { type: DataTypes.ENUM('pending', 'terverifikasi', 'ditolak'), defaultValue: 'pending' },
}, { tableName: 'sim_stnk', timestamps: true });

User.hasMany(SimStnk, { foreignKey: 'user_id' });
SimStnk.belongsTo(User, { foreignKey: 'user_id' });

module.exports = SimStnk;
