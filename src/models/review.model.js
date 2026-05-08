const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false },
  booking_id: { type: DataTypes.INTEGER, allowNull: false },
  rating: { type: DataTypes.TINYINT, allowNull: false },
  review: { type: DataTypes.TEXT },
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'reviews', timestamps: true, underscored: true });

module.exports = Review;
