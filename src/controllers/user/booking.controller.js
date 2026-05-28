const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const Zone = require('../../models/zone.model');
const Worker = require('../../models/worker.model');
const User = require('../../models/user.model');
const Address = require('../../models/address.model');
const Slot = require('../../models/slot.model');
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
    if (!service_id) return error(res, 'service_id is required', 400);

    const service = await Service.findByPk(service_id, {
      attributes: ['id', 'name', 'description', 'price', 'discount_percent', 'final_price', 'estimated_time', 'images', 'rating', 'rating_count'],
      include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);

    // Use final_price (after discount) if available, otherwise base price
    const effectivePrice = parseFloat(service.final_price || service.price);
    const charges = await calculateBookingCharges(effectivePrice);

    return success(res, {
      service: {
        id: service.id,
        name: service.name,
        description: service.description,
        image: service.images && service.images.length ? service.images[0] : null,
        estimated_time: service.estimated_time,
        rating: service.rating,
        rating_count: service.rating_count,
        category: service.Category ? { id: service.Category.id, name: service.Category.name } : null,
      },
      pricing: {
        base_price: parseFloat(service.price),
        discount_percent: parseFloat(service.discount_percent || 0),
        discounted_price: effectivePrice,
        platform_charge: charges.platform_charge,
        gst_amount: charges.gst_amount,
        total_amount: charges.total_amount,
      },
    });
  } catch (err) { return error(res, err.message); }
};

// ─── POST /api/user/bookings ──────────────────────────────────────────────────
// COD  → booking created, payment_status: pending, no payment session
// Online → booking created, Cashfree order created, payment_session_id returned
const createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes, address_id, payment_method, slot_id } = req.body;

    if (!service_id || !booking_date) return error(res, 'service_id and booking_date are required', 400);
    if (!address_id) return error(res, 'address_id is required', 400);

    // Validate slot if provided
    let slot = null;
    if (slot_id) {
      slot = await Slot.findByPk(slot_id);
      if (!slot) return error(res, 'Slot not found', 404);
      if (!slot.is_active) return error(res, 'This slot is not available', 400);
      // Check capacity
      const currentCount = await Booking.count({ where: { slot_id } });
      if (currentCount >= slot.max_bookings) return error(res, 'This slot is fully booked', 400);
    }

    // Fetch the saved address
    const address = await Address.findOne({ where: { id: address_id, user_id: req.user.id } });
    if (!address) return error(res, 'Address not found', 404);

    if (!address.latitude || !address.longitude) return error(res, 'Address does not have location coordinates', 400);

    const service = await Service.findOne({ where: { id: service_id, is_active: true } });
    if (!service) return error(res, 'Service not found', 404);

    const allActiveZones = await Zone.findAll({ where: { is_active: true } });
    // Zone check — skip if no zones configured yet
    let matchedZone = null;
    if (allActiveZones.length) {
      matchedZone = findZoneByCoordinates(parseFloat(address.latitude), parseFloat(address.longitude), allActiveZones);
      if (!matchedZone) return error(res, 'Sorry! We do not serve your location yet.', 400);
    }

    const charges = await calculateBookingCharges(service.price);
    const isCod = payment_method === 'cod';

    const booking = await Booking.create({
      user_id: req.user.id,
      service_id,
      booking_date,
      notes: notes || null,
      address_id: address.id,
      address: address.full_address,
      zone_id: matchedZone ? matchedZone.id : null,
      slot_id: slot_id || null,
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

  } catch (err) { return error(res, err.message); }
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
        { model: Address, attributes: ['id', 'label', 'full_address', 'landmark', 'latitude', 'longitude', 'city', 'pincode'], required: false },
        { model: Slot, attributes: ['id', 'date', 'start_time', 'end_time'], required: false },
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
        { model: Address, attributes: ['id', 'label', 'full_address', 'landmark', 'latitude', 'longitude', 'city', 'pincode'], required: false },
        { model: Slot, attributes: ['id', 'date', 'start_time', 'end_time'], required: false },
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
