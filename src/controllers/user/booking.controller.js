const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const Zone = require('../../models/zone.model');
const Worker = require('../../models/worker.model');
const User = require('../../models/user.model');
const Address = require('../../models/address.model');
const Slot = require('../../models/slot.model');
const Coupon = require('../../models/coupon.model');
const Notification = require('../../models/notification.model');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser, alertNearbyWorkers } = require('../../sockets/socket.handler');
const { calculateBookingCharges } = require('../../helpers/pricing.helper');
const { validateCoupon, recordCouponUsage, getAvailableCoupons } = require('../../helpers/coupon.helper');
const { findZoneByCoordinates } = require('../../helpers/zone.helper');
const { createCashfreeOrder, verifyCashfreePayment } = require('../../helpers/cashfree.helper');

let _io;
const setIo = (io) => { _io = io; };

// ─── GET /api/user/bookings/charges-preview?service_id=X&coupon_code=Y ────────
const previewCharges = async (req, res) => {
  try {
    const { service_id, coupon_code } = req.query;
    if (!service_id) return error(res, 'service_id is required', 400);

    const service = await Service.findByPk(service_id, {
      attributes: ['id', 'name', 'description', 'price', 'discount_percent', 'final_price', 'estimated_time', 'images', 'rating', 'rating_count'],
      include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);

    // Use final_price (after discount) if available, otherwise base price
    const effectivePrice = parseFloat(service.final_price || service.price);

    // Validate coupon if provided
    let couponData = null;
    let couponDiscount = 0;
    if (coupon_code) {
      const categoryId = service.Category ? service.Category.id : null;
      const result = await validateCoupon(coupon_code, req.user.id, effectivePrice, categoryId);
      if (!result.valid) {
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
          pricing: null,
          coupon: { valid: false, message: result.message },
        });
      }
      couponData = result.coupon;
      couponDiscount = result.discount_amount;
    }

    const charges = await calculateBookingCharges(effectivePrice, couponDiscount);

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
        coupon_discount: charges.coupon_discount,
        price_after_coupon: charges.price_after_discount,
        platform_charge: charges.platform_charge,
        gst_amount: charges.gst_amount,
        total_amount: charges.total_amount,
      },
      coupon: couponData ? {
        valid: true,
        code: couponData.code,
        title: couponData.title,
        discount_type: couponData.discount_type,
        discount_value: parseFloat(couponData.discount_value),
        discount_amount: couponDiscount,
      } : null,
    });
  } catch (err) { return error(res, err.message); }
};

// ─── POST /api/user/bookings ──────────────────────────────────────────────────
// COD  → booking created, payment_status: pending, no payment session
// Online → booking created, Cashfree order created, payment_session_id returned
const createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes, address_id, payment_method, slot_id, coupon_code } = req.body;

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

    const service = await Service.findOne({
      where: { id: service_id, is_active: true },
      include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);

    const allActiveZones = await Zone.findAll({ where: { is_active: true } });
    // Zone check — skip if no zones configured yet
    let matchedZone = null;
    // if (allActiveZones.length) {
    //   matchedZone = findZoneByCoordinates(parseFloat(address.latitude), parseFloat(address.longitude), allActiveZones);
    //   if (!matchedZone) return error(res, 'Sorry! We do not serve your location yet.', 400);
    // }

    // Validate and apply coupon if provided
    let couponDiscount = 0;
    let appliedCoupon = null;
    const effectivePrice = parseFloat(service.final_price || service.price);

    if (coupon_code) {
      const categoryId = service.Category ? service.Category.id : null;
      const couponResult = await validateCoupon(coupon_code, req.user.id, effectivePrice, categoryId);
      if (!couponResult.valid) {
        return error(res, couponResult.message, 400);
      }
      couponDiscount = couponResult.discount_amount;
      appliedCoupon = couponResult.coupon;
    }

    const charges = await calculateBookingCharges(effectivePrice, couponDiscount);
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
      coupon_id: appliedCoupon ? appliedCoupon.id : null,
      coupon_code: appliedCoupon ? appliedCoupon.code : null,
      coupon_discount: couponDiscount,
      amount: charges.service_price,
      platform_charge: charges.platform_charge,
      gst_amount: charges.gst_amount,
      total_amount: charges.total_amount,
      payment_method: isCod ? 'cod' : 'online',
      payment_status: 'pending',
    });

    // Record coupon usage
    if (appliedCoupon) {
      await recordCouponUsage(appliedCoupon.id, req.user.id, booking.id, couponDiscount);
    }

    // COD — return booking directly
    if (isCod) {
      // Alert nearby online workers
      if (_io) alertNearbyWorkers(_io, booking, address);
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

    // Save our custom order_id (used for verification with Cashfree API)
    await booking.update({ cf_order_id: cfOrderId });

    return success(res, {
      booking,
      charges,
      payment: {
        cf_order_id: cfOrderId,
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

      if (_io) {
        emitToUser(_io, booking.user_id, 'payment_confirmed', { bookingId: booking.id });
        // Alert nearby online workers after payment confirmed
        const bookingAddress = await Address.findByPk(booking.address_id);
        alertNearbyWorkers(_io, booking, bookingAddress);
      }
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
        { model: Coupon, attributes: ['id', 'code', 'title', 'discount_type', 'discount_value'], required: false },
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
        { model: Coupon, attributes: ['id', 'code', 'title', 'discount_type', 'discount_value'], required: false },
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

// ─── POST /api/user/coupons/validate ─────────────────────────────────────────
// Validate a coupon code without creating a booking
const applyCoupon = async (req, res) => {
  try {
    const { coupon_code, service_id } = req.body;
    if (!coupon_code || !service_id) return error(res, 'coupon_code and service_id are required', 400);

    const service = await Service.findByPk(service_id, {
      include: [{ model: require('../../models/category.model'), attributes: ['id', 'name'] }],
    });
    if (!service) return error(res, 'Service not found', 404);

    const effectivePrice = parseFloat(service.final_price || service.price);
    const categoryId = service.Category ? service.Category.id : null;

    const result = await validateCoupon(coupon_code, req.user.id, effectivePrice, categoryId);
    if (!result.valid) {
      return error(res, result.message, 400);
    }

    // Return full charge breakdown with coupon applied
    const charges = await calculateBookingCharges(effectivePrice, result.discount_amount);

    return success(res, {
      coupon: {
        valid: true,
        code: result.coupon.code,
        title: result.coupon.title,
        discount_type: result.coupon.discount_type,
        discount_value: parseFloat(result.coupon.discount_value),
        discount_amount: result.discount_amount,
      },
      pricing: {
        base_price: parseFloat(service.price),
        discounted_price: effectivePrice,
        coupon_discount: charges.coupon_discount,
        price_after_coupon: charges.price_after_discount,
        platform_charge: charges.platform_charge,
        gst_amount: charges.gst_amount,
        total_amount: charges.total_amount,
      },
    }, 'Coupon applied successfully');
  } catch (err) { return error(res, err.message); }
};

// ─── GET /api/user/coupons?service_id=X ──────────────────────────────────────
// List available coupons for the user (optionally filtered by service category)
const listCoupons = async (req, res) => {
  try {
    const { service_id } = req.query;
    let categoryId = null;

    if (service_id) {
      const service = await Service.findByPk(service_id, {
        include: [{ model: require('../../models/category.model'), attributes: ['id'] }],
      });
      if (service && service.Category) categoryId = service.Category.id;
    }

    const coupons = await getAvailableCoupons(req.user.id, categoryId);

    return success(res, {
      coupons: coupons.map(c => ({
        id: c.id,
        code: c.code,
        title: c.title,
        description: c.description,
        discount_type: c.discount_type,
        discount_value: parseFloat(c.discount_value),
        min_order_amount: parseFloat(c.min_order_amount || 0),
        max_discount_amount: c.max_discount_amount ? parseFloat(c.max_discount_amount) : null,
        category: c.Category ? { id: c.Category.id, name: c.Category.name } : null,
        is_global: !c.category_id,
        end_date: c.end_date,
      })),
    });
  } catch (err) { return error(res, err.message); }
};

module.exports = { createBooking, getMyBookings, getBookingDetail, previewCharges, verifyPayment, cancelBooking, applyCoupon, listCoupons, setIo };
