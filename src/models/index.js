const User = require('./user.model');
const Vendor = require('./vendor.model');
const VendorKyc = require('./vendor_kyc.model');
const VendorBankDetail = require('./vendor_bank_detail.model');
const Service = require('./service.model');
const Category = require('./category.model');
const Booking = require('./booking.model');
const Review = require('./review.model');
const Notification = require('./notification.model');
const Message = require('./message.model');
const Policy = require('./policy.model');
const Zone = require('./zone.model');
const Slider = require('./slider.model');
const { SubscriptionPlan, VendorSubscription } = require('./subscription.model');

// Category self-join (parent -> subcategories)
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

// User <-> Vendor
User.hasOne(Vendor, { foreignKey: 'user_id' });
Vendor.belongsTo(User, { foreignKey: 'user_id' });

// Vendor <-> KYC / Bank
Vendor.hasOne(VendorKyc, { foreignKey: 'vendor_id' });
VendorKyc.belongsTo(Vendor, { foreignKey: 'vendor_id' });

Vendor.hasOne(VendorBankDetail, { foreignKey: 'vendor_id' });
VendorBankDetail.belongsTo(Vendor, { foreignKey: 'vendor_id' });

// Vendor <-> Services
Vendor.hasMany(Service, { foreignKey: 'vendor_id' });
Service.belongsTo(Vendor, { foreignKey: 'vendor_id' });

// Category <-> Services
Category.hasMany(Service, { foreignKey: 'category_id' });
Service.belongsTo(Category, { foreignKey: 'category_id' });

// Booking associations
Booking.belongsTo(User, { foreignKey: 'user_id' });
Booking.belongsTo(Vendor, { foreignKey: 'vendor_id' });
Booking.belongsTo(Service, { foreignKey: 'service_id' });
Booking.belongsTo(Zone, { foreignKey: 'zone_id' });
User.hasMany(Booking, { foreignKey: 'user_id' });
Vendor.hasMany(Booking, { foreignKey: 'vendor_id' });
Service.hasMany(Booking, { foreignKey: 'service_id' });

// Review
Review.belongsTo(User, { foreignKey: 'user_id' });
Review.belongsTo(Vendor, { foreignKey: 'vendor_id' });
Review.belongsTo(Booking, { foreignKey: 'booking_id' });

// Subscription
Vendor.hasMany(VendorSubscription, { foreignKey: 'vendor_id' });
VendorSubscription.belongsTo(Vendor, { foreignKey: 'vendor_id' });
VendorSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'plan_id' });

// Notification
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

// Message
Message.belongsTo(User, { as: 'Sender', foreignKey: 'sender_id' });
Message.belongsTo(User, { as: 'Receiver', foreignKey: 'receiver_id' });

// Booking - Zone relationship
Booking.belongsTo(Zone, { foreignKey: 'zone_id' });

module.exports = {
  User, Vendor, VendorKyc, VendorBankDetail,
  Service, Category, Booking, Review,
  Notification, Message, SubscriptionPlan, VendorSubscription, Policy, Zone, Slider,
};
