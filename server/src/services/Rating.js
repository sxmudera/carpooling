const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./User');
const Booking = require('./Booking');

const Rating = sequelize.define('Rating', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  dari_user_id: { type: DataTypes.INTEGER, allowNull: false }, // penumpang yang beri rating
  untuk_user_id: { type: DataTypes.INTEGER, allowNull: false }, // driver yang dinilai
  nilai:      { type: DataTypes.INTEGER, allowNull: false }, // 1-5
  komentar:   { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'rating', timestamps: true });

Booking.hasMany(Rating, { foreignKey: 'booking_id' });
Rating.belongsTo(Booking, { foreignKey: 'booking_id' });
User.hasMany(Rating, { foreignKey: 'dari_user_id', as: 'RatingDiberi' });
User.hasMany(Rating, { foreignKey: 'untuk_user_id', as: 'RatingDiterima' });
Rating.belongsTo(User, { foreignKey: 'dari_user_id', as: 'Penilai' });
Rating.belongsTo(User, { foreignKey: 'untuk_user_id', as: 'Dinilai' });

module.exports = Rating;