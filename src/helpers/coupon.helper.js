const { Op } = require('sequelize');
const Coupon = require('../models/coupon.model');
const CouponUsage = require('../models/coupon_usage.model');
const Category = require('../models/category.model');

/**
 * Validate a coupon code for a given user and service
 * Returns { valid: true, coupon, discount_amount } or { valid: false, message }
 */
const validateCoupon = async (couponCode, userId, servicePrice, categoryId = null) => {
  if (!couponCode) return { valid: false, message: 'Coupon code is required' };

  const coupon = await Coupon.findOne({
    where: { code: couponCode.toUpperCase(), is_active: true },
    include: [{ model: Category, attributes: ['id', 'name'], required: false }],
  });

  if (!coupon) return { valid: false, message: 'Invalid coupon code' };

  // Check date validity
  const now = new Date();
  if (coupon.start_date && new Date(coupon.start_date) > now) {
    return { valid: false, message: 'Coupon is not yet active' };
  }
  if (coupon.end_date && new Date(coupon.end_date) < now) {
    return { valid: false, message: 'Coupon has expired' };
  }

  // Check category restriction
  if (coupon.category_id && categoryId) {
    if (coupon.category_id !== categoryId) {
      return { valid: false, message: `This coupon is only valid for ${coupon.Category ? coupon.Category.name : 'a specific'} category` };
    }
  }

  // Check minimum order amount
  const price = parseFloat(servicePrice);
  if (coupon.min_order_amount && price < parseFloat(coupon.min_order_amount)) {
    return { valid: false, message: `Minimum order amount is ₹${coupon.min_order_amount}` };
  }

  // Check total usage limit
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  // Check per-user usage limit
  if (userId && coupon.per_user_limit) {
    const userUsageCount = await CouponUsage.count({
      where: { coupon_id: coupon.id, user_id: userId },
    });
    if (userUsageCount >= coupon.per_user_limit) {
      return { valid: false, message: 'You have already used this coupon' };
    }
  }

  // Calculate discount
  let discount_amount = 0;
  if (coupon.discount_type === 'percentage') {
    discount_amount = parseFloat(((price * parseFloat(coupon.discount_value)) / 100).toFixed(2));
  } else {
    // flat discount
    discount_amount = parseFloat(coupon.discount_value);
  }

  // Cap at max_discount_amount if set
  if (coupon.max_discount_amount !== null && discount_amount > parseFloat(coupon.max_discount_amount)) {
    discount_amount = parseFloat(coupon.max_discount_amount);
  }

  // Discount cannot exceed service price
  if (discount_amount > price) {
    discount_amount = price;
  }

  return {
    valid: true,
    coupon,
    discount_amount,
  };
};

/**
 * Record coupon usage after booking is created
 */
const recordCouponUsage = async (couponId, userId, bookingId, discountAmount) => {
  await CouponUsage.create({
    coupon_id: couponId,
    user_id: userId,
    booking_id: bookingId,
    discount_amount: discountAmount,
  });

  // Increment used_count
  await Coupon.increment('used_count', { where: { id: couponId } });
};

/**
 * Get available coupons for a user (for listing in app)
 */
const getAvailableCoupons = async (userId, categoryId = null) => {
  const now = new Date();
 // console.log('--- getAvailableCoupons DEBUG ---');
 // console.log('userId:', userId);
 // console.log('categoryId:', categoryId);
 // console.log('now:', now.toISOString());

  const conditions = [
    { is_active: true },
    {
      [Op.or]: [
        { start_date: null },
        { start_date: { [Op.lte]: now } },
      ],
    },
    {
      [Op.or]: [
        { end_date: null },
        { end_date: { [Op.gte]: now } },
      ],
    },
  ];

  // Show global coupons + category-specific coupons
  if (categoryId) {
    conditions.push({
      [Op.or]: [
        { category_id: null },
        { category_id: categoryId },
      ],
    });
  }
  // If no category specified, show all coupons (global + category-specific)

  const where = { [Op.and]: conditions };
  
  const coupons = await Coupon.findAll({
    where,
    include: [{ model: Category, attributes: ['id', 'name'], required: false }],
    order: [['discount_value', 'DESC']],
    logging: (sql) => console.log('SQL:', sql),
  });

 // console.log('coupons found from DB:', coupons.length);
  coupons.forEach(c => {
   // console.log(`  - id:${c.id} code:${c.code} is_active:${c.is_active} start:${c.start_date} end:${c.end_date} usage:${c.used_count}/${c.usage_limit} per_user:${c.per_user_limit}`);
  });

  // Filter out coupons that have reached their usage limit
  const available = [];
  for (const coupon of coupons) {
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      //console.log(`  SKIPPED ${coupon.code}: usage limit reached (${coupon.used_count}/${coupon.usage_limit})`);
      continue;
    }

    // Check per-user limit
    if (userId && coupon.per_user_limit) {
      const userUsageCount = await CouponUsage.count({
        where: { coupon_id: coupon.id, user_id: userId },
      });
      if (userUsageCount >= coupon.per_user_limit) {
      //  console.log(`  SKIPPED ${coupon.code}: per-user limit reached (${userUsageCount}/${coupon.per_user_limit})`);
        continue;
      }
    }

    available.push(coupon);
  }

  //console.log('available after filters:', available.length);
  //console.log('--- END DEBUG ---');
  return available;
};

module.exports = { validateCoupon, recordCouponUsage, getAvailableCoupons };
