const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  worker_id: { type: DataTypes.INTEGER, allowNull: true },
  title: { type: DataTypes.STRING(200) },
  body: { type: DataTypes.TEXT },
  type: { type: DataTypes.ENUM('booking', 'payment', 'promotional', 'system'), defaultValue: 'system' },
  is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
  data: { type: DataTypes.JSON },
}, { tableName: 'notifications', timestamps: true, underscored: true });

module.exports = Notification;
