const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Testimonial = sequelize.define('Testimonial', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  designation: { type: DataTypes.STRING(255), allowNull: true },
  image: { type: DataTypes.STRING(500), allowNull: true },
  rating: { type: DataTypes.DECIMAL(2, 1), defaultValue: 5.0 },
  message: { type: DataTypes.TEXT, allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'testimonials', timestamps: true, underscored: true });

module.exports = Testimonial;
