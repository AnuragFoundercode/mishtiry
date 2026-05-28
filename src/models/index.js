const User = require('./user.model');
const Service = require('./service.model');
const Category = require('./category.model');
const Booking = require('./booking.model');
const Review = require('./review.model');
const Notification = require('./notification.model');
const Message = require('./message.model');
const Policy = require('./policy.model');
const Zone = require('./zone.model');
const Slider = require('./slider.model');
const Worker = require('./worker.model');
const Address = require('./address.model');
const Slot = require('./slot.model');
const Coupon = require('./coupon.model');
const CouponUsage = require('./coupon_usage.model');

// Category self-join
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

// Category <-> Services
Category.hasMany(Service, { foreignKey: 'category_id' });
Service.belongsTo(Category, { foreignKey: 'category_id' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'user_id' });
Booking.belongsTo(Service, { foreignKey: 'service_id' });
Booking.belongsTo(Zone, { foreignKey: 'zone_id' });
Booking.belongsTo(Worker, { foreignKey: 'worker_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });
Service.hasMany(Booking, { foreignKey: 'service_id' });
Worker.hasMany(Booking, { foreignKey: 'worker_id' });

// Review
Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Booking, { foreignKey: 'booking_id' });

// Notification
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// Message
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

// Address
User.hasMany(Address, { foreignKey: 'user_id' });
Address.belongsTo(User, { foreignKey: 'user_id' });
Booking.belongsTo(Address, { foreignKey: 'address_id' });
Address.hasMany(Booking, { foreignKey: 'address_id' });

// Slot
Slot.hasMany(Booking, { foreignKey: 'slot_id' });
Booking.belongsTo(Slot, { foreignKey: 'slot_id' });

// Coupon
Coupon.belongsTo(Category, { foreignKey: 'category_id' });
Category.hasMany(Coupon, { foreignKey: 'category_id' });
Booking.belongsTo(Coupon, { foreignKey: 'coupon_id' });
Coupon.hasMany(Booking, { foreignKey: 'coupon_id' });

// Coupon Usage
CouponUsage.belongsTo(Coupon, { foreignKey: 'coupon_id' });
CouponUsage.belongsTo(User, { foreignKey: 'user_id' });
CouponUsage.belongsTo(Booking, { foreignKey: 'booking_id' });
Coupon.hasMany(CouponUsage, { foreignKey: 'coupon_id' });
User.hasMany(CouponUsage, { foreignKey: 'user_id' });

module.exports = {
  User, Service, Category, Booking, Review,
  Notification, Message, Policy, Zone, Slider, Worker, Address, Slot,
  Coupon, CouponUsage,
};
