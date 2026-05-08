const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendorKyc = sequelize.define('VendorKyc', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },

  // Aadhaar
  aadhaar_number: { type: DataTypes.STRING(12), allowNull: true },
  aadhaar_front: { type: DataTypes.STRING(255), allowNull: true },
  aadhaar_back: { type: DataTypes.STRING(255), allowNull: true },

  // PAN
  pan_number: { type: DataTypes.STRING(10), allowNull: true },
  pan_document: { type: DataTypes.STRING(255), allowNull: true },

  // GST (optional - only if registered)
  gst_number: { type: DataTypes.STRING(15), allowNull: true },
  gst_document: { type: DataTypes.STRING(255), allowNull: true },

  // Selfie / live photo for identity verification
  selfie: { type: DataTypes.STRING(255), allowNull: true },

}, { tableName: 'vendor_kyc', timestamps: true, underscored: true });

module.exports = VendorKyc;
