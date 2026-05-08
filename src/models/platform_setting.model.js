const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Single-row global config - only platform_charge & GST (same for all vendors)
// Commission & revenue_model is per-vendor (stored in vendors table)
const PlatformSetting = sequelize.define('PlatformSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Platform convenience charge % on service price (charged to user, same for all)
  platform_charge_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 5.00 },

  // GST % applied on platform_charge only (same for all, govt mandated)
  gst_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },

  // Default commission % applied to NEW vendors until admin overrides per-vendor
  default_commission_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 10.00 },

  // Default revenue model for NEW vendors until admin overrides
  default_revenue_model: {
    type: DataTypes.ENUM('subscription', 'commission', 'hybrid'),
    defaultValue: 'commission',
  },

}, { tableName: 'platform_settings', timestamps: true, underscored: true });

module.exports = PlatformSetting;
