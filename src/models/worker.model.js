const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Worker = sequelize.define('Worker', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  aadhaar_number: { type: DataTypes.STRING(12) },
  aadhaar_front: { type: DataTypes.STRING(255) },
  aadhaar_back: { type: DataTypes.STRING(255) },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  fcm_token: { type: DataTypes.STRING(255) },
}, { tableName: 'workers', timestamps: true, underscored: true });

module.exports = Worker;
