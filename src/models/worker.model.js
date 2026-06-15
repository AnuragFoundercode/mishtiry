const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Worker = sequelize.define('Worker', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150) },
  phone: { type: DataTypes.STRING(15), allowNull: false, unique: true },
  profile_image: { type: DataTypes.STRING(500), allowNull: true },
  zone_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
  wallet: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  rating_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  admin_due: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  availability: { type: DataTypes.ENUM('online', 'offline', 'busy'), defaultValue: 'offline' },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  last_location_update: { type: DataTypes.DATE, allowNull: true },
  aadhaar_number: { type: DataTypes.STRING(12) },
  aadhaar_front: { type: DataTypes.STRING(255) },
  aadhaar_back: { type: DataTypes.STRING(255) },
  bank_name: { type: DataTypes.STRING(255), allowNull: true },
  holder_name: { type: DataTypes.STRING(255), allowNull: true },
  account_number: { type: DataTypes.STRING(30), allowNull: true },
  ifsc_code: { type: DataTypes.STRING(11), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },
  fcm_token: { type: DataTypes.STRING(255) },
}, { tableName: 'workers', timestamps: true, underscored: true });

module.exports = Worker;
