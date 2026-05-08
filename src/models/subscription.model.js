const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.ENUM('basic', 'pro', 'advanced'), allowNull: false },
  price_monthly: { type: DataTypes.DECIMAL(10, 2) },
  price_yearly: { type: DataTypes.DECIMAL(10, 2) },
  service_limit: { type: DataTypes.INTEGER, defaultValue: 5 },
  gallery_limit: { type: DataTypes.INTEGER, defaultValue: 10 },
  featured_listing: { type: DataTypes.BOOLEAN, defaultValue: false },
  chat_support: { type: DataTypes.ENUM('basic', 'priority', 'premium'), defaultValue: 'basic' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'subscription_plans', timestamps: true, underscored: true });

const VendorSubscription = sequelize.define('VendorSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false },
  plan_id: { type: DataTypes.INTEGER, allowNull: false },
  billing_cycle: { type: DataTypes.ENUM('monthly', 'yearly'), defaultValue: 'monthly' },
  starts_at: { type: DataTypes.DATE },
  expires_at: { type: DataTypes.DATE },
  payment_id: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.ENUM('active', 'expired', 'cancelled'), defaultValue: 'active' },
}, { tableName: 'vendor_subscriptions', timestamps: true, underscored: true });

module.exports = { SubscriptionPlan, VendorSubscription };
