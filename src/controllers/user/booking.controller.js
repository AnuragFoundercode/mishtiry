const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const Zone = require('../../models/zone.model');
const Worker = require('../../models/worker.model');
const User = require('../../models/user.model');
const Notification = require('../../models/notification.model');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser } = require('../../sockets/socket.handler');
const { calculateBookingCharges } = require('../../helpers/pricing.helper');
const { findZoneByCoordinates } = require('../../helpers/zone.helper');
const { createCashfreeOrder, verifyCashfreePayment } = require('../../helpers/cashfree.helper');

let _io;
const setIo = (io) => { _io = io; };

// ─── GET /api/user/bookings/charges-preview?service_id=X ─────────────────────
const previewCharges = async (req, res) => {
  try {
    const { service_id } = req.query;
    const service = await Service.findByPk(service_id);
    if (!service) return error(res, 'Service not found', 404);
    const charges = await calculateBookingCharges(service.price);
    return success(res, { charges });
  } catch (err) { return error(res, err.message); }
};

// ─── POST /api/user/bookings ──────────────────────────────────────────────────
// COD  → booking created, payment_status: pending, no payment session
// Online → booking created, Cashfree order created, payment_session_id returned
const createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes, address, latitude, longitude, payment_method } = req.body;

    if (!service_id || !booking_date) return error(res, 'service_id and booking_date are required', 400);
    if (!latitude || !longitude) return error(res, 'Location coordinates are required', 400);

    const service = await Service.findOne({ where: { id: service_id, is_active: true } });
    if (!service) return error(res, 'Service not found', 404);

    const allActiveZones = await Zone.findAll({ where: { is_active: true } });
    if (!allActiveZones.length) return error(res, 'No service zones available currently', 400);

    //const matchedZone = findZoneByCoordinates(parseFloat(latitude), parseFloat(longitude), allActiveZones);
   // if (!matchedZone) return error(res, 'Sorry! We do not serve your location yet.', 400);

    const charges = await calculateBookingCharges(service.price);
    const isCod = payment_method === 'cod';

    const booking = await Booking.create({
      user_id: req.user.id,
      service_id,
      booking_date,
      notes: notes || null,
      address: address || null,
     // zone_id: matchedZone.id,
      amount: charges.service_price,
      platform_charge: charges.platform_charge,
      gst_amount: charges.gst_amount,
      total_amount: charges.total_amount,
      payment_method: isCod ? 'cod' : 'online',
      payment_status: 'pending',
    });

    // COD — return booking directly
    if (isCod) {
      return success(res, { booking, charges }, 'Booking created. Pay on delivery.', 201);
    }

    // Online — create Cashfree order
    const user = await User.findByPk(req.user.id, { attributes: ['name', 'mobile', 'email'] });
    const cfOrderId = `booking_${booking.id}_${Date.now()}`;
    const returnUrl = `${process.env.APP_URL}/api/user/bookings/${booking.id}/payment-verify?cf_order_id=${cfOrderId}`;

    const cfOrder = await createCashfreeOrder({
      orderId: cfOrderId,
      amount: charges.total_amount,
      customerName: user.name,
      customerPhone: user.mobile,
      customerEmail: user.email,
      returnUrl,
    });

    // Save cf_order_id on booking
    await booking.update({ cf_order_id: cfOrder.cf_order_id });

    return success(res, {
      booking,
      charges,
      payment: {
        cf_order_id: cfOrder.cf_order_id,
        payment_session_id: cfOrder.payment_session_id,
        order_status: cfOrder.order_status,
      },
    }, 'Booking created. Complete payment.', 201);

  } catch (err)
  { 
      console.log("err",err);
      return error(res, err.message); }
};

// ─── GET /api/user/bookings/:id/payment-verify ───────────────────────────────
// Called after Cashfree redirects back (return_url)
// Also can be called manually by app to check payment status
const verifyPayment = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!booking) return error(res, 'Booking not found', 404);

    if (booking.payment_status === 'paid') {
      return success(res, { booking, payment_status: 'paid' }, 'Payment already verified');
    }

    if (!booking.cf_order_id) return error(res, 'No payment initiated for this booking', 400);

    const cfOrder = await verifyCashfreePayment(booking.cf_order_id);
    const isPaid = cfOrder.order_status === 'PAID';

    if (isPaid) {
      // Get payment_id from payments list
      const paymentId = cfOrder.cf_order_id;

      await booking.update({
        payment_status: 'paid',
        payment_id: paymentId,
        status: 'pending', // vendor will accept after payment confirmed
      });

      // Notify user
      await Notification.create({
        user_id: booking.user_id,
        title: 'Payment Successful',
        body: `Payment of ₹${booking.total_amount} received for booking #${booking.id}`,
        type: 'payment',
        data: { bookingId: booking.id },
      });

      if (_io) emitToUser(_io, booking.user_id, 'payment_confirmed', { bookingId: booking.id });
    }

    return success(res, {
      booking_id: booking.id,
      payment_status: isPaid ? 'paid' : cfOrder.order_status,
      order_status: cfOrder.order_status,
    }, isPaid ? 'Payment verified successfully' : 'Payment pending');

  } catch (err) { return error(res, err.message); }
};

// ─── GET /api/user/bookings ───────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const bookings = await Booking.findAll({
      where,
      include: [
        { model: Service, include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }] },
        { model: Worker, attributes: ['id', 'name', 'phone'], required: false },
      ],
      order: [['created_at', 'DESC']],
    });
    return success(res, { bookings });
  } catch (err) { return error(res, err.message); }
};

// ─── GET /api/user/bookings/:id ───────────────────────────────────────────────
const getBookingDetail = async (req, res) => {
  try {
    const booking = await Booking.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: Service, include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }] },
        { model: Worker, attributes: ['id', 'name', 'phone'], required: false },
      ],
    });
    if (!booking) return error(res, 'Booking not found', 404);
    return success(res, { booking });
  } catch (err) { return error(res, err.message); }
};

// ─── POST /api/user/bookings/:id/cancel ──────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!booking) return error(res, 'Booking not found', 404);
    if (!['pending'].includes(booking.status)) {
      return error(res, 'Only pending bookings can be cancelled', 400);
    }
    await booking.update({ status: 'cancelled' });
    return success(res, { booking }, 'Booking cancelled');
  } catch (err) { return error(res, err.message); }
};

module.exports = { createBooking, getMyBookings, getBookingDetail, previewCharges, verifyPayment, cancelBooking, setIo };
