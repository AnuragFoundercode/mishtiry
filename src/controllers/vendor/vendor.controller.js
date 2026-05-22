const Category = require('../../models/category.model');
const Service = require('../../models/service.model');
const Booking = require('../../models/booking.model');
const Worker = require('../../models/worker.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');
const { success, error } = require('../../helpers/response.helper');
const { sendBookingNotification } = require('../../helpers/notification.helper');
const { emitToUser } = require('../../sockets/socket.handler');

let _io;
const setIo = (io) => { _io = io; };

// ─── CATEGORIES ───────────────────────────────────────────────────────────────

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [{ model: Category, as: 'subcategories', required: false }],
      where: { parent_id: null },
      order: [['name', 'ASC']],
    });
    return success(res, { categories });
  } catch (err) { return error(res, err.message); }
};

const createCategory = async (req, res) => {
  try {
    const { name, parent_id, is_active } = req.body;
    if (!name) return error(res, 'name is required', 400);
    const image = req.file?.filename || null;
    const cat = await Category.create({ name, parent_id: parent_id || null, image, is_active: is_active ?? true });
    return success(res, { cat }, 'Category created', 201);
  } catch (err) { return error(res, err.message); }
};

const updateCategory = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return error(res, 'Category not found', 404);
    const { name, parent_id, is_active } = req.body;
    const image = req.file?.filename;
    await cat.update({
      ...(name !== undefined && { name }),
      ...(parent_id !== undefined && { parent_id }),
      ...(is_active !== undefined && { is_active }),
      ...(image && { image }),
    });
    return success(res, { cat }, 'Category updated');
  } catch (err) { return error(res, err.message); }
};

const deleteCategory = async (req, res) => {
  try {
    const deleted = await Category.destroy({ where: { id: req.params.id } });
    if (!deleted) return error(res, 'Category not found', 404);
    return success(res, {}, 'Category deleted');
  } catch (err) { return error(res, err.message); }
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────

const getServices = async (req, res) => {
  try {
    const services = await Service.findAll({
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']],
    });
    return success(res, { services });
  } catch (err) { return error(res, err.message); }
};

const createService = async (req, res) => {
  try {
    const { category_id, name, description, price, estimated_time } = req.body;
    if (!category_id || !name || !price) return error(res, 'category_id, name and price are required', 400);
    const images = req.files?.map(f => f.filename) || [];
    const service = await Service.create({ category_id, name, description, price, estimated_time, images });
    return success(res, { service }, 'Service created', 201);
  } catch (err) { return error(res, err.message); }
};

const updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);
    if (!service) return error(res, 'Service not found', 404);
    const { category_id, name, description, price, estimated_time, is_active } = req.body;
    const newImages = req.files?.map(f => f.filename);
    await service.update({
      ...(category_id && { category_id }),
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price && { price }),
      ...(estimated_time !== undefined && { estimated_time }),
      ...(is_active !== undefined && { is_active }),
      ...(newImages?.length && { images: newImages }),
    });
    return success(res, { service }, 'Service updated');
  } catch (err) { return error(res, err.message); }
};

const deleteService = async (req, res) => {
  try {
    const deleted = await Service.destroy({ where: { id: req.params.id } });
    if (!deleted) return error(res, 'Service not found', 404);
    return success(res, {}, 'Service deleted');
  } catch (err) { return error(res, err.message); }
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

const getBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'mobile'] },
        { model: Service, attributes: ['id', 'name', 'price'] },
        { model: Worker, attributes: ['id', 'name', 'phone'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    return success(res, { bookings });
  } catch (err) { return error(res, err.message); }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return error(res, 'Booking not found', 404);
    await booking.update({ status });

    const user = await User.findByPk(booking.user_id);
    if (user?.fcm_token) await sendBookingNotification(user.fcm_token, status, booking.id);
    await Notification.create({
      user_id: booking.user_id,
      title: 'Booking Update',
      body: `Your booking #${booking.id} is now ${status}`,
      type: 'booking',
      data: { bookingId: booking.id, status },
    });
    if (_io) emitToUser(_io, booking.user_id, 'booking_updated', { bookingId: booking.id, status });

    return success(res, { booking }, 'Status updated');
  } catch (err) { return error(res, err.message); }
};

const assignWorker = async (req, res) => {
  try {
    const { worker_id } = req.body;
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) return error(res, 'Booking not found', 404);

    const worker = await Worker.findOne({ where: { id: worker_id, is_active: true, is_blocked: false } });
    if (!worker) return error(res, 'Worker not found or inactive', 404);

    await booking.update({ worker_id, status: 'accepted' });

    // Notify customer
    const user = await User.findByPk(booking.user_id);
    if (user?.fcm_token) await sendBookingNotification(user.fcm_token, 'accepted', booking.id);
    await Notification.create({
      user_id: booking.user_id,
      title: 'Worker Assigned',
      body: `${worker.name} has been assigned to your booking #${booking.id}`,
      type: 'booking',
      data: { bookingId: booking.id, workerId: worker.id },
    });
    if (_io) emitToUser(_io, booking.user_id, 'booking_updated', { bookingId: booking.id, status: 'accepted', worker: { id: worker.id, name: worker.name } });

    return success(res, { booking, worker: { id: worker.id, name: worker.name } }, 'Worker assigned');
  } catch (err) { return error(res, err.message); }
};

// ─── WORKERS ──────────────────────────────────────────────────────────────────

const getWorkers = async (req, res) => {
  try {
    const workers = await Worker.findAll({
      attributes: ['id', 'name', 'email', 'phone', 'aadhaar_number', 'is_active', 'is_blocked', 'created_at'],
      order: [['name', 'ASC']],
    });
    return success(res, { workers });
  } catch (err) { return error(res, err.message); }
};

const createWorker = async (req, res) => {
  try {
    const { name, phone, email, aadhaar_number } = req.body;
    if (!name || !phone) return error(res, 'name and phone are required', 400);
    const existing = await Worker.findOne({ where: { phone } });
    if (existing) return error(res, 'Worker with this phone already exists', 409);
    const files = req.files || {};
    const worker = await Worker.create({
      name, phone, email: email || null, aadhaar_number: aadhaar_number || null,
      aadhaar_front: files.aadhaar_front?.[0]?.filename || null,
      aadhaar_back: files.aadhaar_back?.[0]?.filename || null,
    });
    return success(res, { worker }, 'Worker created', 201);
  } catch (err) { return error(res, err.message); }
};

const updateWorker = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.params.id);
    if (!worker) return error(res, 'Worker not found', 404);
    const { name, email, aadhaar_number, is_active, is_blocked } = req.body;
    const files = req.files || {};
    await worker.update({
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email }),
      ...(aadhaar_number !== undefined && { aadhaar_number }),
      ...(is_active !== undefined && { is_active }),
      ...(is_blocked !== undefined && { is_blocked }),
      ...(files.aadhaar_front?.[0] && { aadhaar_front: files.aadhaar_front[0].filename }),
      ...(files.aadhaar_back?.[0] && { aadhaar_back: files.aadhaar_back[0].filename }),
    });
    return success(res, { worker }, 'Worker updated');
  } catch (err) { return error(res, err.message); }
};

const deleteWorker = async (req, res) => {
  try {
    const deleted = await Worker.destroy({ where: { id: req.params.id } });
    if (!deleted) return error(res, 'Worker not found', 404);
    return success(res, {}, 'Worker deleted');
  } catch (err) { return error(res, err.message); }
};

module.exports = {
  setIo,
  getCategories, createCategory, updateCategory, deleteCategory,
  getServices, createService, updateService, deleteService,
  getBookings, updateBookingStatus, assignWorker,
  getWorkers, createWorker, updateWorker, deleteWorker,
};
