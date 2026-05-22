const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const User = require('../../models/user.model');
const Worker = require('../../models/worker.model');
const Notification = require('../../models/notification.model');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser } = require('../../sockets/socket.handler');

let _io;
const setIo = (io) => { _io = io; };

// GET /api/worker/bookings
// Returns all bookings assigned to this worker
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { worker_id: req.worker.id };
    if (status) where.status = status;

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'name', 'mobile'] },
        { model: Service, attributes: ['id', 'name', 'description', 'estimated_time', 'price'] },
      ],
      order: [['booking_date', 'ASC']],
    });
    return success(res, { bookings });
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/worker/bookings/:id
const getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, worker_id: req.worker.id },
      include: [
        { model: User, attributes: ['id', 'name', 'mobile'] },
        { model: Service, attributes: ['id', 'name', 'description', 'estimated_time', 'price'] },
      ],
    });
    if (!booking) return error(res, 'Booking not found', 404);
    return success(res, { booking });
  } catch (err) {
    return error(res, err.message);
  }
};

// PATCH /api/worker/bookings/:id/status
// Body: { status }
// Allowed transitions: accepted → in_progress → completed
const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['accepted', 'in_progress', 'completed'];
    if (!allowed.includes(status)) return error(res, 'Invalid status. Allowed: accepted, in_progress, completed', 400);

    const booking = await Booking.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!booking) return error(res, 'Booking not found', 404);

    await booking.update({ status });

    // Notify customer
    await Notification.create({
      user_id: booking.user_id,
      title: 'Booking Update',
      body: `Your booking #${booking.id} is now ${status}`,
      type: 'booking',
      data: { bookingId: booking.id, status },
    });

    if (_io) emitToUser(_io, booking.user_id, 'booking_updated', { bookingId: booking.id, status });

    return success(res, { booking }, 'Status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/worker/bookings/:id/collect-cod
// Worker marks that they collected cash from customer
// Body: { amount_collected }
// admin_due = amount_collected - worker's share (vendor_payout goes to admin since single vendor = admin)
const collectCod = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!booking) return error(res, 'Booking not found', 404);
    if (booking.payment_method !== 'cod') return error(res, 'This booking is not COD', 400);
    if (booking.payment_status === 'paid') return error(res, 'Already marked as paid', 400);

    const amount_collected = parseFloat(req.body.amount_collected);
    if (!amount_collected || amount_collected <= 0) return error(res, 'Valid amount_collected required', 400);

    // admin_due = full total_amount (worker collected cash, must hand over to admin)
    const admin_due = parseFloat(booking.total_amount);

    await booking.update({
      cod_collected: amount_collected,
      admin_due,
      payment_status: 'paid',
    });

    return success(res, {
      booking_id: booking.id,
      cod_collected: amount_collected,
      admin_due,
      message: `You collected ₹${amount_collected}. Please hand over ₹${admin_due} to admin.`,
    }, 'COD collected');
  } catch (err) {
    return error(res, err.message);
  }
};

// GET /api/worker/profile
const getProfile = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.worker.id, {
      attributes: ['id', 'name', 'email', 'phone', 'aadhaar_number', 'is_active', 'created_at'],
    });
    return success(res, { worker });
  } catch (err) {
    return error(res, err.message);
  }
};

// PATCH /api/worker/fcm-token  Body: { fcm_token }
const updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    await Worker.update({ fcm_token }, { where: { id: req.worker.id } });
    return success(res, {}, 'FCM token updated');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getMyBookings, getBookingDetail, updateStatus, collectCod, getProfile, updateFcmToken, setIo };
