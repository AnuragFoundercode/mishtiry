const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Address = sequelize.define('Address', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  label: { type: DataTypes.STRING(50), defaultValue: 'Home' },
  full_address: { type: DataTypes.TEXT, allowNull: false },
  landmark: { type: DataTypes.STRING(255) },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  city: { type: DataTypes.STRING(100) },
  state: { type: DataTypes.STRING(100) },
  pincode: { type: DataTypes.STRING(10) },
  is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'addresses', timestamps: true, underscored: true });

module.exports = Address;
