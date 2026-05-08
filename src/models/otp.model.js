const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Otp = sequelize.define('Otp', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  mobile: { type: DataTypes.STRING(15), allowNull: false },
  otp: { type: DataTypes.STRING(10), allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  is_used: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'otps', timestamps: true, underscored: true });

module.exports = Otp;
