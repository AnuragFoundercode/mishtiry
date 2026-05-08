const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VendorBankDetail = sequelize.define('VendorBankDetail', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },

  account_holder_name: { type: DataTypes.STRING(200), allowNull: false },
  account_number: { type: DataTypes.STRING(20), allowNull: false },
  ifsc_code: { type: DataTypes.STRING(11), allowNull: false },
  bank_name: { type: DataTypes.STRING(100) },
  branch_name: { type: DataTypes.STRING(100) },

  // UPI optional
  upi_id: { type: DataTypes.STRING(100), allowNull: true },

  // Cancelled cheque / passbook image for verification
  passbook_image: { type: DataTypes.STRING(255), allowNull: true },

}, { tableName: 'vendor_bank_details', timestamps: true, underscored: true });

module.exports = VendorBankDetail;
