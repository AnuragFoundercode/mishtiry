const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  booking_date: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  amount: { type: DataTypes.DECIMAL(10, 2) },           // base service price
  platform_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // convenience fee
  gst_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },      // GST on platform_charge
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },    // user pays this
  commission_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }, // platform deducts from vendor
  vendor_payout: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },   // vendor receives this
  revenue_model_applied: { type: DataTypes.STRING(20) },                 // snapshot at booking time
  commission_percent_applied: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  payment_status: { type: DataTypes.ENUM('pending', 'paid', 'refunded'), defaultValue: 'pending' },
  payment_id: { type: DataTypes.STRING(255) },
  address: { type: DataTypes.TEXT },
}, { tableName: 'bookings', timestamps: true, underscored: true });

module.exports = Booking;
