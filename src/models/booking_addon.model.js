const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookingAddon = sequelize.define('BookingAddon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(255), allowNull: false },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'accepted', 'rejected'), defaultValue: 'pending' },
  added_by_worker_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'booking_addons', timestamps: true, underscored: true });

module.exports = BookingAddon;
