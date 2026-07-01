const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WorkerPayoutRequest = sequelize.define('WorkerPayoutRequest', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  worker_id: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paid'),
    defaultValue: 'pending',
  },
  note: { type: DataTypes.TEXT, allowNull: true },
  admin_note: { type: DataTypes.TEXT, allowNull: true },
  processed_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'worker_payout_requests', timestamps: true, underscored: true });

// Association
const Worker = require('./worker.model');
WorkerPayoutRequest.belongsTo(Worker, { foreignKey: 'worker_id' });

module.exports = WorkerPayoutRequest;
