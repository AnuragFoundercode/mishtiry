const bcrypt = require('bcryptjs');
const User = require('../../models/user.model');
const Vendor = require('../../models/vendor.model');
const VendorKyc = require('../../models/vendor_kyc.model');
const VendorBankDetail = require('../../models/vendor_bank_detail.model');
const Booking = require('../../models/booking.model');
const Category = require('../../models/category.model');
const Policy = require('../../models/policy.model');
const Zone = require('../../models/zone.model');
const { SubscriptionPlan } = require('../../models/subscription.model');
const Notification = require('../../models/notification.model');
const PlatformSetting = require('../../models/platform_setting.model');
const { sendPushNotification } = require('../../helpers/notification.helper');
const { getSettings } = require('../../helpers/pricing.helper');
const { success, error } = require('../../helpers/response.helper');
const sequelize = require('../../config/database');

/**
 * POST /api/admin/vendors
 * Admin creates a vendor directly (single-vendor mode)
 * Body: { name, mobile, email, password, business_name, description, address, latitude, longitude }
 */
const createVendor = async (req, res) => {
  try {
    const { name, mobile, email, password, business_name, description, address, latitude, longitude } = req.body;
    if (!mobile || !business_name) return error(res, 'Mobile and business_name are required', 400);

    const existing = await User.findOne({ where: { mobile } });
    if (existing) return error(res, 'Mobile already registered', 409);

    const hashed = password ? await bcrypt.hash(password, 10) : null;
    const user = await User.create({ name, mobile, email, password: hashed, role: 'vendor' });

    const vendor = await Vendor.create({
      user_id: user.id,
      business_name, description, address, latitude, longitude,
      is_approved: true,
      kyc_status: 'approved',
    });

    return success(res, {
      user: { id: user.id, mobile: user.mobile, role: user.role },
      vendor: { id: vendor.id, business_name: vendor.business_name, is_approved: vendor.is_approved },
    }, 'Vendor created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalVendors, totalBookings] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      Vendor.count(),
      Booking.count(),
    ]);
    const revenue = await Booking.sum('commission_amount', { where: { payment_status: 'paid' } });
    return success(res, { totalUsers, totalVendors, totalBookings, revenue: revenue || 0 });
  } catch (err) {
    return error(res, err.message);
  }
};

const approveVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found', 404);
    await vendor.update({ is_approved: req.body.approve });
    return success(res, {}, `Vendor ${req.body.approve ? 'approved' : 'rejected'}`);
  } catch (err) {
    return error(res, err.message);
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return error(res, 'User not found', 404);
    await user.update({ is_blocked: req.body.block });
    return success(res, {}, `User ${req.body.block ? 'blocked' : 'unblocked'}`);
  } catch (err) {
    return error(res, err.message);
  }
};

const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, body, role } = req.body;
    const where = role ? { role } : {};
    const users = await User.findAll({ where, attributes: ['id', 'fcm_token'] });

    const notifications = [];
    for (const user of users) {
      notifications.push({ user_id: user.id, title, body, type: 'promotional' });
      if (user.fcm_token) await sendPushNotification(user.fcm_token, title, body);
    }
    await Notification.bulkCreate(notifications);
    return success(res, {}, `Notification sent to ${users.length} users`);
  } catch (err) {
    return error(res, err.message);
  }
};

const manageCategory = async (req, res) => {
  try {
    const { action } = req.params;
    if (action === 'create') {
      const cat = await Category.create(req.body);
      return success(res, { cat }, 'Category created', 201);
    }
    if (action === 'update') {
      await Category.update(req.body, { where: { id: req.body.id } });
      return success(res, {}, 'Category updated');
    }
    if (action === 'delete') {
      await Category.destroy({ where: { id: req.body.id } });
      return success(res, {}, 'Category deleted');
    }
    return error(res, 'Invalid action', 400);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/platform-settings
 */
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return success(res, { settings });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/platform-settings
 * Update global platform_charge_percent, gst_percent, default_commission_percent, default_revenue_model
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const allowed = ['platform_charge_percent', 'gst_percent', 'default_commission_percent', 'default_revenue_model'];
    const updates = {};
    allowed.forEach((key) => { if (req.body[key] !== undefined) updates[key] = req.body[key]; });

    let settings = await PlatformSetting.findOne({ order: [['id', 'ASC']] });
    if (!settings) settings = await PlatformSetting.create({});
    await settings.update(updates);

    return success(res, { settings }, 'Platform settings updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/vendors/:id/pricing
 * Set per-vendor revenue_model and commission_percent
 * Body: { revenue_model: 'commission'|'subscription'|'hybrid', commission_percent: 8 }
 */
const setVendorPricing = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found', 404);

    const { revenue_model, commission_percent } = req.body;
    const updates = {};
    if (revenue_model !== undefined) updates.revenue_model = revenue_model;
    if (commission_percent !== undefined) updates.commission_percent = commission_percent;

    await vendor.update(updates);
    return success(res, {
      vendor_id: vendor.id,
      revenue_model: vendor.revenue_model,
      commission_percent: vendor.commission_percent,
    }, 'Vendor pricing updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/vendors/:id/pricing
 * View a vendor's current pricing config
 */
const getVendorPricing = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      attributes: ['id', 'business_name', 'revenue_model', 'commission_percent'],
    });
    if (!vendor) return error(res, 'Vendor not found', 404);

    const settings = await getSettings();
    return success(res, {
      vendor_id: vendor.id,
      business_name: vendor.business_name,
      revenue_model: vendor.revenue_model || settings.default_revenue_model,
      commission_percent: vendor.commission_percent !== null
        ? vendor.commission_percent
        : settings.default_commission_percent,
      is_using_default: vendor.revenue_model === null,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/vendors/:id/kyc
 * View vendor KYC documents and bank details
 */
const getVendorKyc = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      attributes: ['id', 'business_name', 'kyc_status', 'kyc_rejection_reason'],
      include: [
        { model: VendorKyc },
        { model: VendorBankDetail },
      ],
    });
    if (!vendor) return error(res, 'Vendor not found', 404);
    return success(res, { vendor });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/admin/vendors/:id/kyc
 * Approve or reject vendor KYC
 * Body: { status: 'approved'|'rejected', rejection_reason: '...' }
 */
const reviewVendorKyc = async (req, res) => {
  try {
    const { status, rejection_reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) return error(res, 'Invalid status', 400);

    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return error(res, 'Vendor not found', 404);

    await vendor.update({
      kyc_status: status,
      kyc_rejection_reason: status === 'rejected' ? rejection_reason : null,
      // Auto approve vendor account when KYC approved
      ...(status === 'approved' && { is_approved: true }),
    });

    return success(res, { kyc_status: status }, `KYC ${status}`);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/policies
 */
const getPolicies = async (req, res) => {
  try {
    const policies = await Policy.findAll({ order: [['created_at', 'DESC']] });
    return success(res, { policies });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/policies
 */
const createPolicy = async (req, res) => {
  try {
    const { title, slug, content, is_active } = req.body;
    const policy = await Policy.create({ title, slug, content, is_active: is_active ?? true });
    return success(res, { policy }, 'Policy created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/policies/:id
 */
const updatePolicy = async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) return error(res, 'Policy not found', 404);
    const { title, slug, content, is_active } = req.body;
    await policy.update({ title, slug, content, is_active });
    return success(res, { policy }, 'Policy updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * DELETE /api/admin/policies/:id
 */
const deletePolicy = async (req, res) => {
  try {
    const policy = await Policy.findByPk(req.params.id);
    if (!policy) return error(res, 'Policy not found', 404);
    await policy.destroy();
    return success(res, {}, 'Policy deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/admin/zones
 */
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({ order: [['name', 'ASC']] });
    return success(res, { zones });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/admin/zones
 * Body: { name, coordinates: [{lat, lng}, ...], color, is_active }
 */
const createZone = async (req, res) => {
  try {
    const { name, coordinates, color, is_active } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 3) {
      return error(res, 'Coordinates must be array with at least 3 points', 400);
    }
    const zone = await Zone.create({ 
      name, 
      coordinates, 
      color: color || '#6c47ff', 
      is_active: is_active ?? true 
    });
    return success(res, { zone }, 'Zone created', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/admin/zones/:id
 * Body: { name, coordinates: [{lat, lng}, ...], color, is_active }
 */
const updateZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return error(res, 'Zone not found', 404);
    const { name, coordinates, color, is_active } = req.body;
    if (coordinates && (!Array.isArray(coordinates) || coordinates.length < 3)) {
      return error(res, 'Coordinates must be array with at least 3 points', 400);
    }
    await zone.update({ name, coordinates, color, is_active });
    return success(res, { zone }, 'Zone updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * DELETE /api/admin/zones/:id
 */
const deleteZone = async (req, res) => {
  try {
    const zone = await Zone.findByPk(req.params.id);
    if (!zone) return error(res, 'Zone not found', 404);
    await zone.destroy();
    return success(res, {}, 'Zone deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getDashboard, approveVendor, blockUser, sendBroadcastNotification, manageCategory,
  getPlatformSettings, updatePlatformSettings,
  setVendorPricing, getVendorPricing,
  getVendorKyc, reviewVendorKyc,
  getPolicies, createPolicy, updatePolicy, deletePolicy,
  getZones, createZone, updateZone, deleteZone,
  createVendor,
};
