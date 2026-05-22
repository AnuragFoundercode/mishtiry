const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PlatformSetting = sequelize.define('PlatformSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  platform_charge_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 5.00 },
  gst_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 18.00 },
}, { tableName: 'platform_settings', timestamps: true, underscored: true });

module.exports = PlatformSetting;
