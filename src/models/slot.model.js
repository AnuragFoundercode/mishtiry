const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Slot = sequelize.define('Slot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  start_time: { type: DataTypes.TIME, allowNull: false },
  end_time: { type: DataTypes.TIME, allowNull: false },
  max_bookings: { type: DataTypes.INTEGER, defaultValue: 10 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'slots', timestamps: true, underscored: true });

module.exports = Slot;
