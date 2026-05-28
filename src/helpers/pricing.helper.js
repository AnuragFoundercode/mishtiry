const PlatformSetting = require('../models/platform_setting.model');

const getSettings = async () => {
  let settings = await PlatformSetting.findOne({ order: [['id', 'ASC']] });
  if (!settings) settings = await PlatformSetting.create({});
  return settings;
};

/**
 * Single-vendor model: no commission, no vendor payout split
 * User pays: service_price - coupon_discount + platform_charge + GST
 * All money goes to admin/business
 *
 * @param {number} servicePrice - base service price
 * @param {number} couponDiscount - discount amount from coupon (default 0)
 */
const calculateBookingCharges = async (servicePrice, couponDiscount = 0) => {
  const settings = await getSettings();
  const price = parseFloat(servicePrice);
  const discount = parseFloat(couponDiscount) || 0;

  // Price after coupon discount
  const priceAfterDiscount = parseFloat((price - discount).toFixed(2));

  const platformChargePercent = parseFloat(settings.platform_charge_percent);
  const gstPercent = parseFloat(settings.gst_percent);

  // Platform charge is calculated on price after discount
  const platform_charge = parseFloat(((priceAfterDiscount * platformChargePercent) / 100).toFixed(2));
  const gst_amount = parseFloat(((platform_charge * gstPercent) / 100).toFixed(2));
  const total_amount = parseFloat((priceAfterDiscount + platform_charge + gst_amount).toFixed(2));

  return {
    service_price: price,
    coupon_discount: discount,
    price_after_discount: priceAfterDiscount,
    platform_charge,
    gst_amount,
    total_amount,
  };
};

module.exports = { calculateBookingCharges, getSettings };
