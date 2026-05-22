const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const {
  User, Booking, Category, Service, Notification,
  Policy, Zone, Worker,
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
    const [totalUsers, totalWorkers, totalBookings, pendingBookings] = await Promise.all([
      User.count({ where: { role: 'user' } }),
      Worker.count(),
      Booking.count(),
      Booking.count({ where: { status: 'pending' } }),
    ]);
    const totalRevenue = await Booking.sum('total_amount', { where: { payment_status: 'paid' } }) || 0;
    const platformRevenue = await Booking.sum('platform_charge', { where: { payment_status: 'paid' } }) || 0;
    const gstCollected = await Booking.sum('gst_amount', { where: { payment_status: 'paid' } }) || 0;
    const recentBookings = await Booking.findAll({
      limit: 5, order: [['created_at', 'DESC']],
      include: [{ model: User, attributes: ['name', 'mobile'] }, { model: Service, attributes: ['name'] }],
    });
    const recentWorkers = await Worker.findAll({
      limit: 5, order: [['created_at', 'DESC']],
      attributes: ['id', 'name', 'phone', 'is_active'],
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
      totalUsers, totalWorkers, totalBookings, pendingBookings,
      totalRevenue, platformRevenue, gstCollected, recentBookings, recentWorkers,
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
      include: [{ model: Service, attributes: ['name'] }],
    });
    const reviews = await Review.findAll({
      where: { user_id: user.id },
      order: [['created_at', 'DESC']],
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
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    const { count, rows } = await Service.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [{ model: Category, attributes: ['name'] }],
    });
    const allCategories = await Category.findAll({ where: { is_active: true }, order: [['name', 'ASC']], attributes: ['id', 'name'] });
    res.render('admin/services', { title: 'Services', page: 'services', services: rows, total: count, currentPage: +page, pages: Math.ceil(count / limit), search, allCategories, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const serviceDetail = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id, {
      include: [{ model: Category, attributes: ['name'] }],
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

const createService = async (req, res) => {
  try {
    const { category_id, name, description, price, estimated_time } = req.body;
    if (!category_id || !name || !price) { req.flash('error', 'Category, name and price are required'); return res.redirect('/admin/services'); }
    const images = req.files?.map(f => f.filename) || [];
    await Service.create({ category_id, name, description: description || null, price, estimated_time: estimated_time || null, images });
    req.flash('success', `Service "${name}" created`);
    res.redirect('/admin/services');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/services'); }
};

const updateService = async (req, res) => {
  try {
    const svc = await Service.findByPk(req.params.id);
    if (!svc) { req.flash('error', 'Service not found'); return res.redirect('/admin/services'); }
    const { category_id, name, description, price, estimated_time, is_active } = req.body;
    const newImages = req.files?.map(f => f.filename);
    await svc.update({
      ...(category_id && { category_id }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(estimated_time !== undefined && { estimated_time }),
      ...(is_active !== undefined && { is_active: is_active === '1' }),
      ...(newImages?.length && { images: newImages }),
    });
    req.flash('success', 'Service updated');
    res.redirect('/admin/services');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/services'); }
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

const bookingDetail = async (req, res) => {
  try {
    const Message = require('../../models/message.model');
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, attributes: ['name', 'mobile', 'email'] },
        { model: Service, attributes: ['name', 'description', 'estimated_time'] },
        { model: Worker, attributes: ['id', 'name', 'phone'], required: false },
      ],
    });
    if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/admin/bookings'); }
    const messages = await Message.findAll({
      where: { booking_id: booking.id },
      order: [['created_at', 'ASC']],
    });
    const userIds = [...new Set(messages.map(m => m.sender_id))];
    const senders = await User.findAll({ where: { id: userIds }, attributes: ['id', 'name', 'role'] });
    const senderMap = {};
    senders.forEach(s => { senderMap[s.id] = s; });
    const availableWorkers = await Worker.findAll({ where: { is_active: true, is_blocked: false }, attributes: ['id', 'name', 'phone'], order: [['name', 'ASC']] });
    res.render('admin/booking-detail', {
      title: `Booking #${booking.id}`, page: 'bookings',
      booking, messages, senderMap, availableWorkers,
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
    if (search && /^\d+$/.test(search.trim())) where.id = search.trim();
    const userWhere = search && !/^\d+$/.test(search.trim())
      ? { [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { mobile: { [Op.like]: `%${search}%` } }] }
      : undefined;
    const { count, rows } = await Booking.findAndCountAll({
      where, limit, offset, order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['name', 'mobile'], ...(userWhere && { where: userWhere, required: true }) },
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

    const [totalPlatformCharge, totalGst] = await Promise.all([
      Booking.sum('platform_charge', { where: dateWhere }),
      Booking.sum('gst_amount',      { where: dateWhere }),
    ]);
    const totalRevenue = (totalPlatformCharge || 0) + (totalGst || 0);

    const recentPaid = await Booking.findAll({
      where: dateWhere, limit: 20, order: [['updated_at', 'DESC']],
      include: [{ model: User, attributes: ['name'] }, { model: Service, attributes: ['name'] }],
    });
    const settings = await getSettings();
    res.render('admin/revenue', { title: 'Revenue', page: 'revenue', totalPlatformCharge: totalPlatformCharge || 0, totalGst: totalGst || 0, totalRevenue, recentPaid, settings, date_from, date_to, adminName: req.session.adminName, success: req.flash('success') });
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
    res.render('admin/notifications', { title: 'Notifications', page: 'notifications', allUsers, adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error') });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const sendNotification = async (req, res) => {
  try {
    const { title, body, target_type, specific_ids } = req.body;
    let userIds = [];

    if (target_type === 'all_users' || target_type === 'all') {
      const all = await User.findAll({ where: { role: 'user' }, attributes: ['id'] });
      userIds = all.map(u => u.id);
    } else if (target_type === 'specific') {
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


// ─── Workers ─────────────────────────────────────────────────────────────────

const workers = async (req, res) => {
  try {
    const { search = '', page = 1 } = req.query;
    const limit = 15, offset = (page - 1) * limit;
    const where = {};
    if (search) {
      const { Op } = require('sequelize');
      where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { phone: { [Op.like]: `%${search}%` } }];
    }
    const { count, rows } = await Worker.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
    res.render('admin/workers', {
      title: 'Workers', page: 'workers', workers: rows, total: count,
      currentPage: +page, pages: Math.ceil(count / limit), search,
      adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const createWorker = async (req, res) => {
  try {
    const { name, email, phone, aadhaar_number } = req.body;
    if (!name || !phone) { req.flash('error', 'Name and phone are required'); return res.redirect('/admin/workers'); }
    const existing = await Worker.findOne({ where: { phone } });
    if (existing) { req.flash('error', 'Phone already registered'); return res.redirect('/admin/workers'); }
    const aadhaar_front = req.files?.aadhaar_front?.[0]?.filename || null;
    const aadhaar_back  = req.files?.aadhaar_back?.[0]?.filename  || null;
    await Worker.create({ name, email: email || null, phone, aadhaar_number: aadhaar_number || null, aadhaar_front, aadhaar_back });
    req.flash('success', `Worker "${name}" registered successfully`);
    res.redirect('/admin/workers');
  } catch (e) { req.flash('error', e.message); res.redirect('/admin/workers'); }
};

const workerDetail = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) { req.flash('error', 'Worker not found'); return res.redirect('/admin/workers'); }
    const assignedBookings = await Booking.findAll({
      where: { worker_id: worker.id },
      order: [['created_at', 'DESC']],
      include: [
        { model: User, attributes: ['name', 'mobile'] },
        { model: Service, attributes: ['name'] },
      ],
    });
    const totalCollected = assignedBookings
      .filter(b => b.payment_method === 'cod' && b.payment_status === 'paid')
      .reduce((s, b) => s + parseFloat(b.cod_collected || 0), 0);
    const totalAdminDue = assignedBookings
      .filter(b => b.payment_method === 'cod' && b.payment_status === 'paid')
      .reduce((s, b) => s + parseFloat(b.admin_due || 0), 0);
    res.render('admin/worker-detail', {
      title: worker.name, page: 'workers', worker, assignedBookings, totalCollected, totalAdminDue,
      adminName: req.session.adminName, success: req.flash('success'), error: req.flash('error'),
    });
  } catch (e) { res.render('admin/error', { message: e.message }); }
};

const toggleBlockWorker = async (req, res) => {
  const worker = await Worker.findByPk(req.params.id);
  if (worker) await worker.update({ is_blocked: !worker.is_blocked });
  req.flash('success', `Worker ${worker.is_blocked ? 'blocked' : 'unblocked'}`);
  res.redirect(`/admin/workers/${req.params.id}`);
};

// POST /admin/bookings/:id/assign-worker  Body: { worker_id }
const assignWorker = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) { req.flash('error', 'Booking not found'); return res.redirect('/admin/bookings'); }
    const worker = await Worker.findByPk(worker_id);
    if (!worker) { req.flash('error', 'Worker not found'); return res.redirect(`/admin/bookings/${req.params.id}`); }
    await booking.update({ worker_id, status: 'accepted' });
    // Notify customer
    await Notification.create({
      user_id: booking.user_id,
      title: 'Worker Assigned',
      body: `${worker.name} has been assigned to your booking #${booking.id}`,
      type: 'booking',
      data: { bookingId: booking.id },
    });
    req.flash('success', `Worker "${worker.name}" assigned to booking #${booking.id}`);
    res.redirect(`/admin/bookings/${req.params.id}`);
  } catch (e) { req.flash('error', e.message); res.redirect(`/admin/bookings/${req.params.id}`); }
};

module.exports = {
  showLogin, doLogin, doLogout,
  showForgotPassword, doForgotPassword, showResetPassword, doResetPassword,
  dashboard,
  users, toggleBlockUser, userDetail,
  categories, createCategory, updateCategory, deleteCategory,
  services, serviceDetail, toggleService, createService, updateService,
  bookings, bookingDetail, updateBookingStatus,
  revenue,
  platformSettings, updatePlatformSettings,
  notifications, sendNotification,
  doChangePassword,
  policies, createPolicy, updatePolicy, deletePolicy,
  zones, createZone, updateZone, deleteZone,
  workers, createWorker, workerDetail, toggleBlockWorker, assignWorker,
};
