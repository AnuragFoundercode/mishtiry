const PlatformSetting = require('../models/platform_setting.model');
const Vendor = require('../models/vendor.model');
const { VendorSubscription } = require('../models/subscription.model');

const getSettings = async () => {
  let settings = await PlatformSetting.findOne({ order: [['id', 'ASC']] });
  if (!settings) settings = await PlatformSetting.create({});
  return settings;
};

const hasActiveSubscription = async (vendorId) => {
  const sub = await VendorSubscription.findOne({
    where: { vendor_id: vendorId, status: 'active' },
  });
  if (!sub) return false;
  return new Date() < new Date(sub.expires_at);
};

/**
 * Calculate all charges for a booking
 *
 * Priority:
 *   - platform_charge_percent & gst_percent  → always from global platform_settings
 *   - revenue_model & commission_percent      → vendor's own setting first,
 *                                               fallback to platform default if NULL
 *
 * Revenue model behaviour:
 *   commission   → commission % always applied, subscription irrelevant
 *   subscription → 0% commission always (vendor pays plan fee instead)
 *   hybrid       → subscribed vendor pays commission_percent,
 *                  unsubscribed vendor pays commission_percent (no discount in hybrid,
 *                  the incentive is already that subscribed vendors get lower % set by admin)
 */
const calculateBookingCharges = async (servicePrice, vendorId) => {
  const [settings, vendor] = await Promise.all([
    getSettings(),
    Vendor.findByPk(vendorId),
  ]);

  if (!vendor) throw new Error('Vendor not found');

  const price = parseFloat(servicePrice);

  // Global charges (same for all vendors)
  const platformChargePercent = parseFloat(settings.platform_charge_percent);
  const gstPercent = parseFloat(settings.gst_percent);

  // Per-vendor settings, fallback to platform defaults if not set
  const revenueModel = vendor.revenue_model || settings.default_revenue_model;
  const commissionPercent = vendor.commission_percent !== null
    ? parseFloat(vendor.commission_percent)
    : parseFloat(settings.default_commission_percent);

  // Platform charge + GST (charged to user on top of service price)
  const platform_charge = parseFloat(((price * platformChargePercent) / 100).toFixed(2));
  const gst_amount = parseFloat(((platform_charge * gstPercent) / 100).toFixed(2));
  const total_amount = parseFloat((price + platform_charge + gst_amount).toFixed(2));

  // Commission (deducted from vendor payout)
  let commission_percent_applied = 0;

  if (revenueModel === 'commission') {
    commission_percent_applied = commissionPercent;

  } else if (revenueModel === 'subscription') {
    commission_percent_applied = 0;

  } else if (revenueModel === 'hybrid') {
    const isSubscribed = await hasActiveSubscription(vendorId);
    // In hybrid: subscribed vendor pays their set commission_percent
    // unsubscribed vendor pays commission_percent (admin sets higher % for unsubscribed)
    // Admin controls this by setting different commission_percent per vendor
    commission_percent_applied = isSubscribed ? commissionPercent : commissionPercent;
    // Note: admin should set a higher commission_percent for unsubscribed hybrid vendors
    // or use the vendor's own commission_percent which admin can update anytime
  }

  const commission_amount = parseFloat(((price * commission_percent_applied) / 100).toFixed(2));
  const vendor_payout = parseFloat((price - commission_amount).toFixed(2));

  return {
    service_price: price,
    platform_charge,
    gst_amount,
    total_amount,
    commission_amount,
    commission_percent_applied,
    vendor_payout,
    revenue_model_applied: revenueModel,
    vendor_commission_percent: commissionPercent,
  };
};

module.exports = { calculateBookingCharges, getSettings };
