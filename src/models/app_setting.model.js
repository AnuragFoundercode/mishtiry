const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppSetting = sequelize.define('AppSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },

  // Support & Contact
  support_phone: { type: DataTypes.STRING(20), defaultValue: '+91 1234567890' },
  support_email: { type: DataTypes.STRING(255), defaultValue: 'support@Mishtry.shop' },
  help_email: { type: DataTypes.STRING(255), defaultValue: 'help@withpronto.com' },
  careers_email: { type: DataTypes.STRING(255), defaultValue: 'careers@withpronto.com' },

  // Business Info
  country: { type: DataTypes.STRING(100), defaultValue: 'India' },
  gst_number: { type: DataTypes.STRING(50), defaultValue: 'GSTIN000000' },
  business_address: { type: DataTypes.TEXT, allowNull: true },

  // Social Media Links
  facebook_url: { type: DataTypes.STRING(500), allowNull: true },
  instagram_url: { type: DataTypes.STRING(500), allowNull: true },
  twitter_url: { type: DataTypes.STRING(500), allowNull: true },
  youtube_url: { type: DataTypes.STRING(500), allowNull: true },
  linkedin_url: { type: DataTypes.STRING(500), allowNull: true },
  whatsapp_number: { type: DataTypes.STRING(20), allowNull: true },

  // App Links
  play_store_url: { type: DataTypes.STRING(500), allowNull: true },
  app_store_url: { type: DataTypes.STRING(500), allowNull: true },
  website_url: { type: DataTypes.STRING(500), allowNull: true },
}, { tableName: 'app_settings', timestamps: true, underscored: true });

module.exports = AppSetting;
