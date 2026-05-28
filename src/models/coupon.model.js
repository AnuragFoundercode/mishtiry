const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Coupon = sequelize.define('Coupon', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT },
  discount_type: { type: DataTypes.ENUM('percentage', 'flat'), defaultValue: 'percentage' },
  discount_value: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  category_id: { type: DataTypes.INTEGER, allowNull: true },
  min_order_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  max_discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  usage_limit: { type: DataTypes.INTEGER, allowNull: true },
  per_user_limit: { type: DataTypes.INTEGER, defaultValue: 1 },
  used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  start_date: { type: DataTypes.DATE, allowNull: true },
  end_date: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'coupons', timestamps: true, underscored: true });

module.exports = Coupon;
