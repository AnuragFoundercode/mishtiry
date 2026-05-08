const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  business_name: { type: DataTypes.STRING(200) },
  description: { type: DataTypes.TEXT },
  logo: { type: DataTypes.STRING(255) },
  banner: { type: DataTypes.STRING(255) },
  address: { type: DataTypes.TEXT },
  latitude: { type: DataTypes.DECIMAL(10, 8) },
  longitude: { type: DataTypes.DECIMAL(11, 8) },
  working_hours: { type: DataTypes.JSON },

  // Admin controls
  is_approved: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_suspended: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },

  // KYC status - default pending, admin approves after document review
  kyc_status: {
    type: DataTypes.ENUM('pending', 'under_review', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  kyc_rejection_reason: { type: DataTypes.TEXT, allowNull: true },

  avg_rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  total_reviews: { type: DataTypes.INTEGER, defaultValue: 0 },

  // Per-vendor pricing set by admin (NULL = use platform default)
  revenue_model: {
    type: DataTypes.ENUM('subscription', 'commission', 'hybrid'),
    allowNull: true,
    defaultValue: null,
  },
  commission_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    defaultValue: null,
  },
}, { tableName: 'vendors', timestamps: true, underscored: true });

module.exports = Vendor;
