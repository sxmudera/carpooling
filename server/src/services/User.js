const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id:       { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nama:     { type: DataTypes.STRING(100), allowNull: false },
  email:    { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role:     { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
  no_hp:    { type: DataTypes.STRING(20), allowNull: true },
  rating:   { type: DataTypes.FLOAT, defaultValue: 0 },
  sim_verified: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  }, // Baru: status verifikasi SIM
}, { tableName: 'user', timestamps: true });

module.exports = User;