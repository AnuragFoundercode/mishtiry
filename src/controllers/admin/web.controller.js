const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  User, Vendor, VendorKyc, VendorBankDetail,
  Booking, Category, Service, Notification,
  Policy, Zone,
  SubscriptionPlan, VendorSubscription,
} = require('../../models/index');
const PlatformSetting = require('../../models/platform_setting.model');
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

    // Chart 1: last 6 months booking trend
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);
    const monthlyRaw = await Booking.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue'],
      ],
      where: { created_at: { [Op.gte]: sixMonthsAgo } },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('created_at'), '%Y-%m'), 'ASC']],
      raw: true,
    });
    // Fill missing months
    const monthLabels = [];
    const monthCounts = [];
    const monthRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
      const found = monthlyRaw.find(r => r.month === key);
      monthLabels.push(label);
      monthCounts.push(found ? parseInt(found.count) : 0);
      monthRevenue.push(found ? parseFloat(found.revenue || 0).toFixed(0) : 0);
    }

    // Chart 2: booking status breakdown
    const statusRaw = await Booking.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status'], raw: true,
    });
    const statusLabels = statusRaw.map(s => s.status);
    const statusCounts = statusRaw.map(s => parseInt(s.count));

    res.render('admin/dashboard', {
      title: 'Dashboard', page: 'dashboard',
      totalUsers, totalVendors, totalBookings, pendingKyc, pendingBookings,
      totalRevenue, platformRevenue, gstCollected, recentBookings, recentVendors,
      monthLabels, monthCounts, monthRevenue,
      statusLabels, statusCounts,
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

const userDetail = async (req, res) => {
  try {
    const Review = require('../../models/review.model');
    const user = await User.findOne({ where: { id: req.params.id, role: 'user' } });
    if (!user) { req.flash('error', 'User not found'); return res.redirect('/admin/users'); }
    const bookings = await Booking.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: Vendor, attributes: ['business_name'] },
        { model: Service, attributes: ['name'] },
      ],
    });
    const reviews = await Review.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
      include: [{ model: Vendor, attributes: ['business_name'] }],
    });
    const totalSpend = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
    res.render('admin/user-detail', {
      title: user.name || 'User Detail', page: 'users',
      user, bookings, reviews, totalSpend,
      adminName: req.session.adminName,
      success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
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

    // Stats per plan: total subscriptions, active count
    const planStats = await VendorSubscription.findAll({
      attributes: [
        'plan_id',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['plan_id', 'status'],
      raw: true,
    });

    // Active vendor subscriptions with vendor + plan details
    const now = new Date();
    const activeSubscriptions = await VendorSubscription.findAll({
      where: { status: 'active' },
      order: [['expires_at', 'ASC']],
      include: [
        { model: Vendor, attributes: ['id', 'business_name'], include: [{ model: User, attributes: ['name', 'mobile'] }] },
        { model: SubscriptionPlan, attributes: ['name', 'price_monthly', 'price_yearly'] },
      ],
    });

    // Expiring soon (within 7 days, but not already expired)
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringSoon = activeSubscriptions.filter(s => {
      const exp = new Date(s.expires_at);
      return exp > now && exp <= soon;
    });

    // Overall stats
    const totalRevenue = await VendorSubscription.findAll({
      attributes: [[sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      raw: true,
    });
    const activeSubs  = await VendorSubscription.count({ where: { status: 'active' } });
    const expiredSubs = await VendorSubscription.count({ where: { status: 'expired' } });
    const cancelledSubs = await VendorSubscription.count({ where: { status: 'cancelled' } });

    res.render('admin/subscriptions', {
      title: 'Subscription Plans', page: 'subscriptions',
      plans, planStats, activeSubscriptions, expiringSoon,
      activeSubs, expiredSubs, cancelledSubs,
      adminName: req.session.adminName,
      success: req.flash('success'), error: req.flash('error'),
    });
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
    const { search = '', vendor_id = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    if (vendor_id) where.vendor_id = vendor_id;
    const { count, rows } = await Service.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: Vendor, attributes: ['id', 'business_name'] }, { model: Category, attributes: ['name'] }],
    });
    const allVendors = await Vendor.findAll({ attributes: ['id', 'business_name'], order: [['business_name', 'ASC']] });
    res.render('admin/services', { title: 'Services', page: 'services', services: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), search, vendor_id, allVendors, adminName: req.session.adminName, success: req.flash('success') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const serviceDetail = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [
        { model: Vendor, attributes: ['id', 'business_name', 'address', 'avg_rating'] },
        { model: Category, attributes: ['name'] },
      ],
    });
    if (!service) { req.flash('error', 'Service not found'); return res.redirect('/admin/services'); }

    const bookings = await Booking.findAll({
      where: { service_id: service.id },
      order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['id', 'name', 'mobile'] }],
    });

    const totalBookings = bookings.length;
    const totalRevenue  = bookings.filter(b => b.payment_status === 'paid').reduce((s, b) => s + parseFloat(b.total_amount || 0), 0);
    const completedCount = bookings.filter(b => b.status === 'completed').length;

    res.render('admin/service-detail', {
      title: service.name, page: 'services',
      service, bookings, totalBookings, totalRevenue, completedCount,
      adminName: req.session.adminName,
      success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const toggleService = async (req, res) => {
  const svc = await Service.findByPk(req.params.id);
  if (svc) await svc.update({ is_active: !svc.is_active });
  req.flash('success', 'Service status updated');
  const ref = req.headers.referer || '/admin/services';
  res.redirect(ref);
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

const bookingDetail = async (req, res) => {
  try {
    const Message = require('../../models/message.model');
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'mobile', 'email'] },
        { model: Vendor, attributes: ['business_name', 'address'] },
        { model: Service, attributes: ['name', 'description', 'estimated_time'] },
      ],
    });
    if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/admin/bookings'); }
    const messages = await Message.findAll({
      where: { booking_id: booking.id },
      order: [['created_at', 'ASC']],
    });
    // Attach sender names
    const userIds = [...new Set(messages.map(m => m.sender_id))];
    const senders = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'role'] });
    const senderMap = {};
    senders.forEach(s => { senderMap[s.id] = s; });
    res.render('admin/booking-detail', {
      title: `Booking #${booking.id}`, page: 'bookings',
      booking, messages, senderMap,
      adminName: req.session.adminName,
      success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) { req.flash('error', 'Invalid status'); return res.redirect(`/admin/bookings/${req.params.id}`); }
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/admin/bookings'); }
    await booking.update({ status });
    req.flash('success', `Booking status updated to "${status}"`);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (e) { req.flash('error', e.message); res.redirect(`/admin/bookings/${req.params.id}`); }
};

const bookings = async (req, res) => {
  try {
    const { status = '', search = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = status ? { status } : {};
    if (search && /^\d+$/.test(search.trim())) {
      where.id = search.trim();
    }
    const userWhere = search && !/^\d+$/.test(search.trim())
      ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { mobile: { [Op.like]: `%${search}%` } }] }
      : undefined;
    const { count, rows } = await Booking.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['name', 'mobile'], ...(userWhere && { where: userWhere, required: true }) },
        { model: Vendor, attributes: ['business_name'] },
        { model: Service, attributes: ['name'] },
      ],
    });
    res.render('admin/bookings', { title: 'Bookings', page: 'bookings', bookings: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), status, search, adminName: req.session.adminName, success: req.flash('success') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

// ─── Revenue ──────────────────────────────────────────────────────────────────

const revenue = async (req, res) => {
  try {
    const { date_from = '', date_to = '' } = req.query;
    const dateWhere = { payment_status: 'paid' };
    if (date_from) dateWhere.created_at = { ...dateWhere.created_at, [Op.gte]: new Date(date_from) };
    if (date_to)   dateWhere.created_at = { ...dateWhere.created_at, [Op.lte]: new Date(date_to + ' 23:59:59') };

    const [totalCommission, totalPlatformCharge, totalGst] = await Promise.all([
      Booking.sum('commission_amount', { where: dateWhere }),
      Booking.sum('platform_charge',   { where: dateWhere }),
      Booking.sum('gst_amount',        { where: dateWhere }),
    ]);
    const totalRevenue = (totalCommission || 0) + (totalPlatformCharge || 0) + (totalGst || 0);

    const byModel = await Booking.findAll({
      attributes: ['revenue_model_applied', [sequelize.fn('SUM', sequelize.col('commission_amount')), 'total'], [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      where: dateWhere, group: ['revenue_model_applied'], raw: true,
    });
    const recentPaid = await Booking.findAll({
      where: dateWhere, limit: 20, order: [['updated_at', 'DESC']],
      include: [{ model: User, attributes: ['name'] }, { model: Vendor, attributes: ['business_name'] }, { model: Service, attributes: ['name'] }],
    });
    const settings = await getSettings();
    res.render('admin/revenue', { title: 'Revenue', page: 'revenue', totalCommission: totalCommission || 0, totalPlatformCharge: totalPlatformCharge || 0, totalGst: totalGst || 0, totalRevenue, byModel, recentPaid, settings, date_from, date_to, adminName: req.session.adminName, success: req.flash('success') });
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
    const { name, coordinates, color, is_active } = req.body;
    let coords = coordinates;
    if (typeof coordinates === 'string') {
      coords = JSON.parse(coordinates);
    }
    if (!Array.isArray(coords) || coords.length < 3) {
      req.flash('error', 'Zone must have at least 3 coordinates');
      return res.redirect('/admin/zones');
    }
    await Zone.create({ name, coordinates: coords, color: color || '#6c47ff', is_active: is_active === '1' });
    req.flash('success', 'Zone created');
    res.redirect('/admin/zones');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/zones'); }
};

const updateZone = async (req, res) => {
  try {
    const { name, coordinates, color, is_active } = req.body;
    let coords = coordinates;
    if (typeof coordinates === 'string') {
      coords = JSON.parse(coordinates);
    }
    if (!Array.isArray(coords) || coords.length < 3) {
      req.flash('error', 'Zone must have at least 3 coordinates');
      return res.redirect('/admin/zones');
    }
    await Zone.update({ name, coordinates: coords, color, is_active: is_active === '1' }, { where: { id: req.params.id } });
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

// ─── Subscription Renewal Notification ──────────────────────────────────────

const sendRenewalNotification = async (req, res) => {
  try {
    const { vendor_id, type } = req.body; // type: 'single' | 'expiring' | 'expired'
    const { sendPushNotification } = require('../../helpers/notification.helper');
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let subscriptions = [];

    if (type === 'single' && vendor_id) {
      // Single vendor notification
      subscriptions = await VendorSubscription.findAll({
        where: { vendor_id, status: 'active' },
        include: [
          { model: Vendor, attributes: ['id', 'business_name'], include: [{ model: User, attributes: ['id', 'name', 'fcm_token'] }] },
          { model: SubscriptionPlan, attributes: ['name'] },
        ],
      });
    } else if (type === 'expiring') {
      // All expiring within 7 days
      subscriptions = await VendorSubscription.findAll({
        where: { status: 'active', expires_at: { [Op.gt]: now, [Op.lte]: soon } },
        include: [
          { model: Vendor, attributes: ['id', 'business_name'], include: [{ model: User, attributes: ['id', 'name', 'fcm_token'] }] },
          { model: SubscriptionPlan, attributes: ['name'] },
        ],
      });
    } else if (type === 'expired') {
      // All expired but still marked active (stale)
      subscriptions = await VendorSubscription.findAll({
        where: { status: 'active', expires_at: { [Op.lt]: now } },
        include: [
          { model: Vendor, attributes: ['id', 'business_name'], include: [{ model: User, attributes: ['id', 'name', 'fcm_token'] }] },
          { model: SubscriptionPlan, attributes: ['name'] },
        ],
      });
    }

    if (!subscriptions.length) {
      req.flash('error', 'No vendors found for this action');
      return res.redirect('/admin/subscriptions');
    }

    let sent = 0;
    for (const sub of subscriptions) {
      const vendor = sub.Vendor;
      const user   = vendor?.User;
      const plan   = sub.SubscriptionPlan?.name || 'your';
      const expiry = new Date(sub.expires_at).toLocaleDateString('en-IN');
      const daysLeft = Math.ceil((new Date(sub.expires_at) - now) / (1000 * 60 * 60 * 24));

      let title, body;
      if (type === 'expired') {
        title = 'Subscription Expired';
        body  = `Your ${plan} plan has expired. Renew now to continue listing your services.`;
      } else if (daysLeft <= 2) {
        title = '⚠️ Subscription Expiring Today/Tomorrow!';
        body  = `Your ${plan} plan expires on ${expiry}. Renew immediately to avoid service disruption.`;
      } else {
        title = '🔔 Subscription Renewal Reminder';
        body  = `Your ${plan} plan expires on ${expiry} (${daysLeft} days left). Renew now to stay active.`;
      }

      // Save in-app notification
      await Notification.create({
        user_id: user.id,
        title,
        body,
        type: 'system',
      });

      // Push notification if FCM token available
      if (user.fcm_token) {
        await sendPushNotification(user.fcm_token, title, body).catch(() => {});
      }

      sent++;
    }

    req.flash('success', `Renewal notification sent to ${sent} vendor(s)`);
    res.redirect('/admin/subscriptions');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/subscriptions'); }
};

module.exports = {
  showLogin, doLogin, doLogout,
  showForgotPassword, doForgotPassword, showResetPassword, doResetPassword,
  dashboard,
  users, toggleBlockUser, userDetail,
  vendors, createVendor, updateVendorProfile,
  vendorDetail, updateVendorKyc, updateVendorPricing, toggleSuspendVendor, toggleFeaturedVendor,
  assignVendorSubscription, cancelVendorSubscription,
  subscriptionPlans, createPlan, updatePlan, togglePlan,
  categories, createCategory, updateCategory, deleteCategory,
  services, serviceDetail, toggleService,
  bookings, bookingDetail, updateBookingStatus,
  revenue,
  platformSettings, updatePlatformSettings,
  notifications, sendNotification,
  doChangePassword,
  policies, createPolicy, updatePolicy, deletePolicy,
  zones, createZone, updateZone, deleteZone,
  sendRenewalNotification,
};
