const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Zone = sequelize.define('Zone', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  coordinates: { 
    type: DataTypes.JSON, 
    allowNull: false,
    comment: 'Array of {lat, lng} objects forming polygon boundary'
  },
  color: { type: DataTypes.STRING(7), defaultValue: '#6c47ff' },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'zones',
  timestamps: true,
  underscored: true,
});

module.exports = Zone;
