const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Slider = sequelize.define('Slider', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING(200) },
  subtitle: { type: DataTypes.STRING(300) },
  image: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('user', 'vendor', 'both'), defaultValue: 'both' },
  link: { type: DataTypes.STRING(500) },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'sliders', timestamps: true, underscored: true });

module.exports = Slider;
