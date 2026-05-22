const PlatformSetting = require('../models/platform_setting.model');

const getSettings = async () => {
  let settings = await PlatformSetting.findOne({ order: [['id', 'ASC']] });
  if (!settings) settings = await PlatformSetting.create({});
  return settings;
};

/**
 * Single-vendor model: no commission, no vendor payout split
 * User pays: service_price + platform_charge + GST
 * All money goes to admin/business
 */
const calculateBookingCharges = async (servicePrice) => {
  const settings = await getSettings();
  const price = parseFloat(servicePrice);

  const platformChargePercent = parseFloat(settings.platform_charge_percent);
  const gstPercent = parseFloat(settings.gst_percent);

  const platform_charge = parseFloat(((price * platformChargePercent) / 100).toFixed(2));
  const gst_amount = parseFloat(((platform_charge * gstPercent) / 100).toFixed(2));
  const total_amount = parseFloat((price + platform_charge + gst_amount).toFixed(2));

  return {
    service_price: price,
    platform_charge,
    gst_amount,
    total_amount,
  };
};

module.exports = { calculateBookingCharges, getSettings };
