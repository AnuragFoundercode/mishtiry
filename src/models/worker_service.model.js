const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerService = sequelize.define('WorkerService', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  worker_id: { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
}, { tableName: 'worker_services', timestamps: true, underscored: true, updatedAt: false });

module.exports = WorkerService;
