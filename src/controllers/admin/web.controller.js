const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../../models/user.model');
const Vendor = require('../../models/vendor.model');
const VendorKyc = require('../../models/vendor_kyc.model');
const VendorBankDetail = require('../../models/vendor_bank_detail.model');
const Booking = require('../../models/booking.model');
const Category = require('../../models/category.model');
const Service = require('../../models/service.model');
const Notification = require('../../models/notification.model');
const Policy = require('../../models/policy.model');
const Zone = require('../../models/zone.model');
const PlatformSetting = require('../../models/platform_setting.model');
const { SubscriptionPlan, VendorSubscription } = require('../../models/subscription.model');
const { sendEmailNotification } = require('../../helpers/notification.helper');
const { getSettings } = require('../../helpers/pricing.helper');
const { Op } = require('sequelize');
const sequelize = require('../../config/database');

// ─── Auth ─────────────────────────────────────────────────────────────────────

const showLogin = (req, res) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  res.render('admin/auth/login', { error: req.flash('error'), success: req.flash('success'), title: 'Admin Login' });
};

const doLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user || !user.password) { req.flash('error', 'Invalid credentials'); return res.redirect('/admin/login'); }
    const match = await bcrypt.compare(password, user.password);
    if (!match) { req.flash('error', 'Invalid credentials'); return res.redirect('/admin/login'); }
    req.session.adminId = user.id;
    req.session.adminName = user.name;
    res.redirect('/admin/dashboard');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/login'); }
};

const doLogout = (req, res) => { req.session.destroy(); res.redirect('/admin/login'); };

const showForgotPassword = (req, res) =>
  res.render('admin/auth/forgot', { error: req.flash('error'), success: req.flash('success'), title: 'Forgot Password' });

const doForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email, role: 'admin' } });
    if (!user) { req.flash('error', 'Email not found'); return res.redirect('/admin/forgot-password'); }
    const token = crypto.randomBytes(32).toString('hex');
    await user.update({ reset_token: token, reset_token_expires: new Date(Date.now() + 3600000) });
    const link = `${process.env.APP_URL || 'http://localhost:3000'}/admin/reset-password/${token}`;
    await sendEmailNotification(email, 'Mistry Admin - Reset Password',
      `<p>Reset link: <a href="${link}">${link}</a> (valid 1 hour)</p>`);
    req.flash('success', 'Reset link sent to your email');
    res.redirect('/admin/forgot-password');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/forgot-password'); }
};

const showResetPassword = async (req, res) => {
  const user = await User.findOne({ where: { reset_token: req.params.token, reset_token_expires: { [Op.gt]: new Date() } } });
  if (!user) { req.flash('error', 'Invalid or expired link'); return res.redirect('/admin/forgot-password'); }
  res.render('admin/auth/reset', { token: req.params.token, error: req.flash('error'), title: 'Reset Password' });
};

const doResetPassword = async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (password !== confirm) { req.flash('error', 'Passwords do not match'); return res.redirect(`/admin/reset-password/${req.params.token}`); }
    const user = await User.findOne({ where: { reset_token: req.params.token, reset_token_expires: { [Op.gt]: new Date() } } });
    if (!user) { req.flash('error', 'Invalid or expired link'); return res.redirect('/admin/forgot-password'); }
    await user.update({ password: await bcrypt.hash(password, 10), reset_token: null, reset_token_expires: null });
    req.flash('success', 'Password reset successfully');
    res.redirect('/admin/login');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/forgot-password'); }
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

const dashboard = async (req, res) => {
  try {
    const [totalUsers, totalVendors, totalBookings, pendingKyc, pendingBookings] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      Vendor.count(),
      Booking.count(),
      Vendor.count({ where: { kyc_status: 'under_review' } }),
      Booking.count({ where: { status: 'pending' } }),
    ]);
    const totalRevenue = await Booking.sum('commission_amount', { where: { payment_status: 'paid' } }) || 0;
    const platformRevenue = await Booking.sum('platform_charge', { where: { payment_status: 'paid' } }) || 0;
    const gstCollected = await Booking.sum('gst_amount', { where: { payment_status: 'paid' } }) || 0;
    const recentBookings = await Booking.findAll({
      limit: 5, order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name', 'mobile'] }, { model: Service, attributes: ['name'] }],
    });
    const recentVendors = await Vendor.findAll({
      limit: 5, order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name', 'mobile'] }],
    });
    res.render('admin/dashboard', {
      title: 'Dashboard', page: 'dashboard',
      totalUsers, totalVendors, totalBookings, pendingKyc, pendingBookings,
      totalRevenue, platformRevenue, gstCollected, recentBookings, recentVendors,
      adminName: req.session.adminName,
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

// ─── Users ────────────────────────────────────────────────────────────────────

const users = async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = { role: 'user', ...(search && { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { mobile: { [Op.like]: `%${search}%` } }] }) };
    const { count, rows } = await User.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
    res.render('admin/users', { title: 'Users', page: 'users', users: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), search, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const toggleBlockUser = async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (user) await user.update({ is_blocked: !user.is_blocked });
  req.flash('success', `User ${user.is_blocked ? 'blocked' : 'unblocked'}`);
  res.redirect('/admin/users');
};

// ─── Vendors ──────────────────────────────────────────────────────────────────

const createVendor = async (req, res) => {
  try {
    const { name, mobile, email, business_name, description, address, latitude, longitude } = req.body;
    if (!mobile || !business_name) { req.flash('error', 'Mobile and business name are required'); return res.redirect('/admin/vendors'); }

    const existing = await User.findOne({ where: { mobile } });
    if (existing) { req.flash('error', 'Mobile number already registered'); return res.redirect('/admin/vendors'); }

    const user = await User.create({ name: name || null, mobile, email: email || null, role: 'vendor' });
    const logo   = req.files?.logo?.[0]?.filename   || null;
    const banner = req.files?.banner?.[0]?.filename || null;
    await Vendor.create({ user_id: user.id, business_name, description: description || null, address: address || null, latitude: latitude || null, longitude: longitude || null, logo, banner });

    req.flash('success', `Vendor "${business_name}" created successfully`);
    res.redirect('/admin/vendors');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/vendors'); }
};

const updateVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, { include: [{ model: User }] });
    if (!vendor) { req.flash('error', 'Vendor not found'); return res.redirect('/admin/vendors'); }

    const { name, email, business_name, description, address, latitude, longitude, working_hours } = req.body;
    const logo   = req.files?.logo?.[0]?.filename   || null;
    const banner = req.files?.banner?.[0]?.filename || null;

    // Update user info
    await vendor.User.update({
      ...(name  !== undefined && { name:  name  || null }),
      ...(email !== undefined && { email: email || null }),
    });

    // Parse working_hours
    let parsedHours = vendor.working_hours;
    if (working_hours) {
      try { parsedHours = typeof working_hours === 'string' ? JSON.parse(working_hours) : working_hours; }
      catch { req.flash('error', 'working_hours must be valid JSON'); return res.redirect(`/admin/vendors/${req.params.id}`); }
    }

    await vendor.update({
      ...(business_name !== undefined && { business_name }),
      ...(description   !== undefined && { description: description || null }),
      ...(address       !== undefined && { address: address || null }),
      ...(latitude      !== undefined && { latitude: latitude || null }),
      ...(longitude     !== undefined && { longitude: longitude || null }),
      working_hours: parsedHours,
      ...(logo   && { logo }),
      ...(banner && { banner }),
    });

    req.flash('success', 'Vendor profile updated');
    res.redirect(`/admin/vendors/${req.params.id}`);
  } catch (e) { req.flash('error', e.message); res.redirect(`/admin/vendors/${req.params.id}`); }
};

const vendors = async (req, res) => {
  try {
    const { search = '', status = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = {};
    if (status === 'pending_kyc') where.kyc_status = 'under_review';
    if (status === 'approved') where.is_approved = true;
    if (status === 'suspended') where.is_suspended = true;
    if (status === 'featured') where.is_featured = true;
    const { count, rows } = await Vendor.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name', 'mobile', 'email'] }],
    });
    res.render('admin/vendors', { title: 'Vendors', page: 'vendors', vendors: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), search, status, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const vendorDetail = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'mobile', 'email'] },
        { model: VendorKyc },
        { model: VendorBankDetail },
      ],
    });
    if (!vendor) { req.flash('error', 'Vendor not found'); return res.redirect('/admin/vendors'); }
    const settings = await getSettings();
    const plans = await SubscriptionPlan.findAll({ where: { is_active: true } });
    const allZones = await Zone.findAll({ where: { is_active: true }, order: [['created_at', 'DESC']] });
    const activeSub = await VendorSubscription.findOne({
      where: { vendor_id: vendor.id, status: 'active' },
      include: [{ model: SubscriptionPlan }],
    });
    const subHistory = await VendorSubscription.findAll({
      where: { vendor_id: vendor.id },
      include: [{ model: SubscriptionPlan }],
      order: [['created_at', 'DESC']],
      limit: 5,
    });
    const totalEarnings = await Booking.sum('vendor_payout', { where: { vendor_id: vendor.id, payment_status: 'paid' } }) || 0;
    const totalBookings = await Booking.count({ where: { vendor_id: vendor.id } });
    res.render('admin/vendor-detail', {
      title: vendor.business_name || 'Vendor Detail', page: 'vendors',
      vendor, settings, plans, allZones, activeSub, subHistory, totalEarnings, totalBookings,
      adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const updateVendorKyc = async (req, res) => {
  const { status, rejection_reason } = req.body;
  const vendor = await Vendor.findByPk(req.params.id);
  if (vendor) await vendor.update({ kyc_status: status, kyc_rejection_reason: rejection_reason || null, ...(status === 'approved' && { is_approved: true }) });
  req.flash('success', `KYC ${status}`);
  res.redirect(`/admin/vendors/${req.params.id}`);
};

const updateVendorPricing = async (req, res) => {
  const { revenue_model, commission_percent } = req.body;
  const vendor = await Vendor.findByPk(req.params.id);
  if (vendor) await vendor.update({
    revenue_model: revenue_model || null,
    commission_percent: commission_percent !== '' ? commission_percent : null,
  });
  req.flash('success', 'Pricing updated');
  res.redirect(`/admin/vendors/${req.params.id}`);
};

const toggleSuspendVendor = async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);
  if (vendor) await vendor.update({ is_suspended: !vendor.is_suspended });
  req.flash('success', `Vendor ${vendor.is_suspended ? 'suspended' : 'unsuspended'}`);
  res.redirect(`/admin/vendors/${req.params.id}`);
};

const toggleFeaturedVendor = async (req, res) => {
  const vendor = await Vendor.findByPk(req.params.id);
  if (vendor) await vendor.update({ is_featured: !vendor.is_featured });
  req.flash('success', `Vendor ${vendor.is_featured ? 'marked featured' : 'removed from featured'}`);
  res.redirect(`/admin/vendors/${req.params.id}`);
};

// Assign subscription to vendor manually
const assignVendorSubscription = async (req, res) => {
  try {
    const { plan_id, billing_cycle, months } = req.body;
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) { req.flash('error', 'Vendor not found'); return res.redirect(`/admin/vendors/${req.params.id}`); }
    // Cancel existing active sub
    await VendorSubscription.update({ status: 'cancelled' }, { where: { vendor_id: vendor.id, status: 'active' } });
    const duration = parseInt(months) || (billing_cycle === 'yearly' ? 12 : 1);
    const starts_at = new Date();
    const expires_at = new Date();
    expires_at.setMonth(expires_at.getMonth() + duration);
    await VendorSubscription.create({ vendor_id: vendor.id, plan_id, billing_cycle, starts_at, expires_at, status: 'active' });
    req.flash('success', 'Subscription assigned successfully');
    res.redirect(`/admin/vendors/${req.params.id}`);
  } catch (e) { req.flash('error', e.message); res.redirect(`/admin/vendors/${req.params.id}`); }
};

const cancelVendorSubscription = async (req, res) => {
  await VendorSubscription.update({ status: 'cancelled' }, { where: { id: req.params.subId, vendor_id: req.params.id } });
  req.flash('success', 'Subscription cancelled');
  res.redirect(`/admin/vendors/${req.params.id}`);
};

// ─── Subscription Plans ───────────────────────────────────────────────────────

const subscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({ order: [['id', 'ASC']] });
    const activeSubs = await VendorSubscription.count({ where: { status: 'active' } });
    res.render('admin/subscriptions', { title: 'Subscription Plans', page: 'subscriptions', plans, activeSubs, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createPlan = async (req, res) => {
  try {
    await SubscriptionPlan.create(req.body);
    req.flash('success', 'Plan created');
    res.redirect('/admin/subscriptions');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/subscriptions'); }
};

const updatePlan = async (req, res) => {
  try {
    await SubscriptionPlan.update(req.body, { where: { id: req.params.id } });
    req.flash('success', 'Plan updated');
    res.redirect('/admin/subscriptions');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/subscriptions'); }
};

const togglePlan = async (req, res) => {
  const plan = await SubscriptionPlan.findByPk(req.params.id);
  if (plan) await plan.update({ is_active: !plan.is_active });
  req.flash('success', 'Plan status updated');
  res.redirect('/admin/subscriptions');
};

// ─── Categories ───────────────────────────────────────────────────────────────

const categories = async (req, res) => {
  try {
    const cats = await Category.findAll({ order: [['id', 'ASC']] });
    res.render('admin/categories', { title: 'Categories', page: 'categories', categories: cats, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createCategory = async (req, res) => {
  try {
    const image = req.file?.filename || null;
    // Fix: empty string parent_id → null
    const parent_id = req.body.parent_id && req.body.parent_id !== '' ? parseInt(req.body.parent_id) : null;
    await Category.create({ name: req.body.name, parent_id, image, is_active: 1 });
    req.flash('success', 'Category created');
    res.redirect('/admin/categories');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/categories'); }
};

const updateCategory = async (req, res) => {
  try {
    const image = req.file?.filename || null;
    const parent_id = req.body.parent_id && req.body.parent_id !== '' ? parseInt(req.body.parent_id) : null;
    await Category.update(
      { name: req.body.name, parent_id, is_active: req.body.is_active, ...(image && { image }) },
      { where: { id: req.params.id } }
    );
    req.flash('success', 'Category updated');
    res.redirect('/admin/categories');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/categories'); }
};

const deleteCategory = async (req, res) => {
  try {
    await Category.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Category deleted');
    res.redirect('/admin/categories');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/categories'); }
};

// ─── Services ─────────────────────────────────────────────────────────────────

const services = async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = search ? { name: { [Op.like]: `%${search}%` } } : {};
    const { count, rows } = await Service.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: Vendor, attributes: ['business_name'] }, { model: Category, attributes: ['name'] }],
    });
    res.render('admin/services', { title: 'Services', page: 'services', services: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), search, adminName: req.session.adminName, success: req.flash('success') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const toggleService = async (req, res) => {
  const svc = await Service.findByPk(req.params.id);
  if (svc) await svc.update({ is_active: !svc.is_active });
  req.flash('success', 'Service status updated');
  res.redirect('/admin/services');
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

const bookings = async (req, res) => {
  try {
    const { status = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = status ? { status } : {};
    const { count, rows } = await Booking.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['name', 'mobile'] },
        { model: Vendor, attributes: ['business_name'] },
        { model: Service, attributes: ['name'] },
      ],
    });
    res.render('admin/bookings', { title: 'Bookings', page: 'bookings', bookings: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), status, adminName: req.session.adminName, success: req.flash('success') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

// ─── Revenue ──────────────────────────────────────────────────────────────────

const revenue = async (req, res) => {
  try {
    const totalCommission = await Booking.sum('commission_amount', { where: { payment_status: 'paid' } }) || 0;
    const totalPlatformCharge = await Booking.sum('platform_charge', { where: { payment_status: 'paid' } }) || 0;
    const totalGst = await Booking.sum('gst_amount', { where: { payment_status: 'paid' } }) || 0;
    const totalRevenue = totalCommission + totalPlatformCharge + totalGst;
    const byModel = await Booking.findAll({
      attributes: ['revenue_model_applied', [sequelize.fn('SUM', sequelize.col('commission_amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: { payment_status: 'paid' }, group: ['revenue_model_applied'], raw: true,
    });
    const recentPaid = await Booking.findAll({
      where: { payment_status: 'paid' }, limit: 10, order: [['updated_at', 'DESC']],
      include: [{ model: User, attributes: ['name'] }, { model: Vendor, attributes: ['business_name'] }, { model: Service, attributes: ['name'] }],
    });
    const settings = await getSettings();
    res.render('admin/revenue', { title: 'Revenue', page: 'revenue', totalCommission, totalPlatformCharge, totalGst, totalRevenue, byModel, recentPaid, settings, adminName: req.session.adminName, success: req.flash('success') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

// ─── Platform Settings ────────────────────────────────────────────────────────

const platformSettings = async (req, res) => {
  const settings = await getSettings();
  res.render('admin/settings', { title: 'Platform Settings', page: 'settings', settings, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
};

const updatePlatformSettings = async (req, res) => {
  const allowed = ['platform_charge_percent', 'gst_percent', 'default_commission_percent', 'default_revenue_model'];
  const updates = {};
  allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  let s = await PlatformSetting.findOne({ order: [['id', 'ASC']] });
  if (!s) s = await PlatformSetting.create({});
  await s.update(updates);
  req.flash('success', 'Settings saved');
  res.redirect('/admin/settings');
};

// ─── Notifications ────────────────────────────────────────────────────────────

const notifications = async (req, res) => {
  try {
    const allUsers = await User.findAll({ where: { role: 'user', is_blocked: false }, attributes: ['id', 'name', 'mobile'], order: [['name', 'ASC']] });
    const allVendors = await Vendor.findAll({
      where: { is_approved: true },
      attributes: ['id', 'business_name'],
      include: [{ model: User, attributes: ['name', 'mobile'] }],
      order: [['business_name', 'ASC']],
    });
    res.render('admin/notifications', { title: 'Notifications', page: 'notifications', allUsers, allVendors, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const sendNotification = async (req, res) => {
  try {
    const { title, body, target_type, specific_ids } = req.body;
    let userIds = [];

    if (target_type === 'all') {
      const all = await User.findAll({ attributes: ['id'] });
      userIds = all.map(u => u.id);
    } else if (target_type === 'all_users') {
      const all = await User.findAll({ where: { role: 'user' }, attributes: ['id'] });
      userIds = all.map(u => u.id);
    } else if (target_type === 'all_vendors') {
      const all = await User.findAll({ where: { role: 'vendor' }, attributes: ['id'] });
      userIds = all.map(u => u.id);
    } else if (target_type === 'specific') {
      // specific_ids is comma-separated user ids
      userIds = (specific_ids || '').split(',').map(id => parseInt(id.trim())).filter(Boolean);
    }

    if (!userIds.length) { req.flash('error', 'No recipients selected'); return res.redirect('/admin/notifications'); }

    await Notification.bulkCreate(userIds.map(uid => ({ user_id: uid, title, body, type: 'promotional' })));
    req.flash('success', `Notification sent to ${userIds.length} recipient(s)`);
    res.redirect('/admin/notifications');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/notifications'); }
};

// ─── Change Password ──────────────────────────────────────────────────────────

const doChangePassword = async (req, res) => {
  try {
    const { current, password, confirm } = req.body;
    if (password !== confirm) { req.flash('error', 'Passwords do not match'); return res.redirect('/admin/settings'); }
    const user = await User.findByPk(req.session.adminId);
    const match = await bcrypt.compare(current, user.password);
    if (!match) { req.flash('error', 'Current password incorrect'); return res.redirect('/admin/settings'); }
    await user.update({ password: await bcrypt.hash(password, 10) });
    req.flash('success', 'Password changed successfully');
    res.redirect('/admin/settings');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/settings'); }
};

// ─── Policies ─────────────────────────────────────────────────────────────────

const policies = async (req, res) => {
  try {
    const allPolicies = await Policy.findAll({ order: [['created_at', 'DESC']] });
    res.render('admin/policies', { title: 'Policies', page: 'policies', policies: allPolicies, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createPolicy = async (req, res) => {
  try {
    const { title, slug, content, is_active } = req.body;
    await Policy.create({ title, slug, content, is_active: is_active === '1' });
    req.flash('success', 'Policy created');
    res.redirect('/admin/policies');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/policies'); }
};

const updatePolicy = async (req, res) => {
  try {
    const { title, slug, content, is_active } = req.body;
    await Policy.update({ title, slug, content, is_active: is_active === '1' }, { where: { id: req.params.id } });
    req.flash('success', 'Policy updated');
    res.redirect('/admin/policies');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/policies'); }
};

const deletePolicy = async (req, res) => {
  try {
    await Policy.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Policy deleted');
    res.redirect('/admin/policies');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/policies'); }
};

// ─── Zones ────────────────────────────────────────────────────────────────────

const zones = async (req, res) => {
  try {
    const allZones = await Zone.findAll({ order: [['created_at', 'DESC']] });
    res.render('admin/zones', { title: 'Zones', page: 'zones', zones: allZones, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createZone = async (req, res) => {
  try {
    const { name, center_lat, center_lng, radius_km, color, is_active } = req.body;
    await Zone.create({ name, center_lat, center_lng, radius_km, color: color || '#6c47ff', is_active: is_active === '1' });
    req.flash('success', 'Zone created');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

const updateZone = async (req, res) => {
  try {
    const { name, center_lat, center_lng, radius_km, color, is_active } = req.body;
    await Zone.update({ name, center_lat, center_lng, radius_km, color, is_active: is_active === '1' }, { where: { id: req.params.id } });
    req.flash('success', 'Zone updated');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

const deleteZone = async (req, res) => {
  try {
    await Zone.destroy({ where: { id: req.params.id } });
    req.flash('success', 'Zone deleted');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

module.exports = {
  showLogin, doLogin, doLogout,
  showForgotPassword, doForgotPassword, showResetPassword, doResetPassword,
  dashboard,
  users, toggleBlockUser,
  vendors, createVendor, updateVendorProfile,
  vendorDetail, updateVendorKyc, updateVendorPricing, toggleSuspendVendor, toggleFeaturedVendor,
  assignVendorSubscription, cancelVendorSubscription,
  subscriptionPlans, createPlan, updatePlan, togglePlan,
  categories, createCategory, updateCategory, deleteCategory,
  services, toggleService,
  bookings,
  revenue,
  platformSettings, updatePlatformSettings,
  notifications, sendNotification,
  doChangePassword,
  policies, createPolicy, updatePolicy, deletePolicy,
  zones, createZone, updateZone, deleteZone,
};
