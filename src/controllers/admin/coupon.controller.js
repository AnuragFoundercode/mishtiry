const Coupon = require('../../models/coupon.model');
const CouponUsage = require('../../models/coupon_usage.model');
const Category = require('../../models/category.model');
const User = require('../../models/user.model');
const { success, error } = require('../../helpers/response.helper');

/**
 * GET /api/admin/coupons
 * List all coupons with optional filters
 */
const getCoupons = async (req, res) => {
  try {
    const { is_active, category_id } = req.query;
    const where = {};
    if (is_active !== undefined) where.is_active = is_active === 'true';
    if (category_id) where.category_id = category_id;

    const coupons = await Coupon.findAll({
      where,
      include: [{ model: Category, attributes: ['id', 'name'], required: false }],
      order: [['created_at', 'DESC']],
    });

    return success(res, { coupons });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/coupons/:id
 * Get single coupon with usage stats
 */
const getCouponDetail = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ['id', 'name'], required: false },
        {
          model: CouponUsage,
          include: [{ model: User, attributes: ['id', 'name', 'mobile'] }],
          order: [['created_at', 'DESC']],
          limit: 50,
        },
      ],
    });
    if (!coupon) return error(res, 'Coupon not found', 404);

    return success(res, { coupon });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/coupons
 * Create a new coupon
 * Body: { code, title, description, discount_type, discount_value, category_id,
 *         min_order_amount, max_discount_amount, usage_limit, per_user_limit,
 *         start_date, end_date, is_active }
 */
const createCoupon = async (req, res) => {
  try {
    const {
      code, title, description, discount_type, discount_value,
      category_id, min_order_amount, max_discount_amount,
      usage_limit, per_user_limit, start_date, end_date, is_active,
    } = req.body;

    if (!code || !title || !discount_value) {
      return error(res, 'code, title, and discount_value are required', 400);
    }

    // Check duplicate code
    const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
    if (existing) return error(res, 'Coupon code already exists', 409);

    // Validate category if provided
    if (category_id) {
      const cat = await Category.findByPk(category_id);
      if (!cat) return error(res, 'Category not found', 404);
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase(),
      title,
      description: description || null,
      discount_type: discount_type || 'percentage',
      discount_value,
      category_id: category_id || null,
      min_order_amount: min_order_amount || 0,
      max_discount_amount: max_discount_amount || null,
      usage_limit: usage_limit || null,
      per_user_limit: per_user_limit ?? 1,
      start_date: start_date || null,
      end_date: end_date || null,
      is_active: is_active ?? true,
    });

    return success(res, { coupon }, 'Coupon created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/coupons/:id
 * Update coupon
 */
const updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return error(res, 'Coupon not found', 404);

    const {
      code, title, description, discount_type, discount_value,
      category_id, min_order_amount, max_discount_amount,
      usage_limit, per_user_limit, start_date, end_date, is_active,
    } = req.body;

    // If code is being changed, check for duplicates
    if (code && code.toUpperCase() !== coupon.code) {
      const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
      if (existing) return error(res, 'Coupon code already exists', 409);
    }

    // Validate category if provided
    if (category_id) {
      const cat = await Category.findByPk(category_id);
      if (!cat) return error(res, 'Category not found', 404);
    }

    await coupon.update({
      ...(code && { code: code.toUpperCase() }),
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(discount_type && { discount_type }),
      ...(discount_value !== undefined && { discount_value }),
      ...(category_id !== undefined && { category_id: category_id || null }),
      ...(min_order_amount !== undefined && { min_order_amount }),
      ...(max_discount_amount !== undefined && { max_discount_amount }),
      ...(usage_limit !== undefined && { usage_limit }),
      ...(per_user_limit !== undefined && { per_user_limit }),
      ...(start_date !== undefined && { start_date }),
      ...(end_date !== undefined && { end_date }),
      ...(is_active !== undefined && { is_active }),
    });

    return success(res, { coupon }, 'Coupon updated successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * DELETE /api/admin/coupons/:id
 */
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return error(res, 'Coupon not found', 404);
    await coupon.destroy();
    return success(res, {}, 'Coupon deleted successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/admin/coupons/:id/toggle
 * Toggle coupon active status
 */
const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByPk(req.params.id);
    if (!coupon) return error(res, 'Coupon not found', 404);
    await coupon.update({ is_active: !coupon.is_active });
    return success(res, { coupon }, `Coupon ${coupon.is_active ? 'activated' : 'deactivated'}`);
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getCoupons, getCouponDetail, createCoupon, updateCoupon, deleteCoupon, toggleCoupon,
};
