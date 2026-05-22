const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Service = sequelize.define('Service', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  category_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estimated_time: { type: DataTypes.STRING(50) },
  images: { type: DataTypes.JSON },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'services', timestamps: true, underscored: true });
// vendor_id removed — single vendor platform

module.exports = Service;
