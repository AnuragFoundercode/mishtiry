const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100) },
  email: { type: DataTypes.STRING(150), unique: true },
  mobile: { type: DataTypes.STRING(15), unique: true, allowNull: false },
  profile_image: { type: DataTypes.STRING(255) },
  fcm_token: { type: DataTypes.STRING(255) },
  password: { type: DataTypes.STRING(255), allowNull: true },
  reset_token: { type: DataTypes.STRING(255), allowNull: true },
  reset_token_expires: { type: DataTypes.DATE, allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  role: { type: DataTypes.ENUM('user', 'vendor', 'admin'), defaultValue: 'user' },
}, { tableName: 'users', timestamps: true, underscored: true });

module.exports = User;
