const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerAvailabilityLog = sequelize.define('WorkerAvailabilityLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  worker_id: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.ENUM('online', 'offline', 'busy'), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
}, { tableName: 'worker_availability_logs', timestamps: true, underscored: true, updatedAt: false });

module.exports = WorkerAvailabilityLog;
