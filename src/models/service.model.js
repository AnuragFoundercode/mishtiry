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
  faqs: { type: DataTypes.JSON },
  includes: { type: DataTypes.JSON },
  how_its_done: { type: DataTypes.JSON },
  does_not_include: { type: DataTypes.JSON },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  discount_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  final_price: { type: DataTypes.DECIMAL(10, 2) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'services', timestamps: true, underscored: true });
// vendor_id removed — single vendor platform

module.exports = Service;
