const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  center_lat: { type: DataTypes.DECIMAL(10, 8), allowNull: false }, // Circle center latitude
  center_lng: { type: DataTypes.DECIMAL(11, 8), allowNull: false }, // Circle center longitude
  radius_km: { type: DataTypes.DECIMAL(6, 2), allowNull: false }, // Radius in kilometers
  color: { type: DataTypes.STRING(7), defaultValue: '#6c47ff' }, // Hex color for map display
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'zones',
  timestamps: true,
  underscored: true,
});

module.exports = Zone;
