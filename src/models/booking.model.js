const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  service_id: { type: DataTypes.INTEGER, allowNull: false },
  worker_id: { type: DataTypes.INTEGER, allowNull: true },
  zone_id: { type: DataTypes.INTEGER, allowNull: true },
  booking_date: { type: DataTypes.DATE, allowNull: false },
  notes: { type: DataTypes.TEXT },
  address: { type: DataTypes.TEXT },
  address_id: { type: DataTypes.INTEGER, allowNull: true },
  slot_id: { type: DataTypes.INTEGER, allowNull: true },
  coupon_id: { type: DataTypes.INTEGER, allowNull: true },
  coupon_code: { type: DataTypes.STRING(50), allowNull: true },
  coupon_discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  amount: { type: DataTypes.DECIMAL(10, 2) },
  platform_charge: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  gst_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  payment_status: { type: DataTypes.ENUM('pending', 'paid', 'refunded'), defaultValue: 'pending' },
  payment_id: { type: DataTypes.STRING(255) },
  cf_order_id: { type: DataTypes.STRING(255) },  // Cashfree order id
  payment_method: { type: DataTypes.ENUM('online', 'cod'), defaultValue: 'online' },
  cod_collected: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  admin_due: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
}, { tableName: 'bookings', timestamps: true, underscored: true });

module.exports = Booking;
