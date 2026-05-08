const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const Vendor = require('../../models/vendor.model');
const Zone = require('../../models/zone.model');
const Notification = require('../../models/notification.model');
const { sendBookingNotification } = require('../../helpers/notification.helper');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser } = require('../../sockets/socket.handler');
const { calculateBookingCharges } = require('../../helpers/pricing.helper');
const { findZoneByCoordinates } = require('../../helpers/zone.helper');

let _io;
const setIo = (io) => { _io = io; };

const createBooking = async (req, res) => {
  try {
    const { service_id, booking_date, notes, address, latitude, longitude } = req.body;
    
    // Validate required fields
    if (!latitude || !longitude) {
      return error(res, 'Location coordinates are required for booking', 400);
    }

    const service = await Service.findByPk(service_id);
    if (!service) return error(res, 'Service not found', 404);

    // Get ALL active zones (not vendor-specific)
    const allActiveZones = await Zone.findAll({ where: { is_active: true } });

    if (!allActiveZones.length) {
      return error(res, 'No service zones available currently. Please try again later.', 400);
    }

    // Check if booking location is within any active zone
    const matchedZone = findZoneByCoordinates(parseFloat(latitude), parseFloat(longitude), allActiveZones);
    
    if (!matchedZone) {
      return error(res, 'Sorry! We do not serve your location yet. Please check service zones or try a different location.', 400);
    }

    const charges = await calculateBookingCharges(service.price, service.vendor_id);

    const booking = await Booking.create({
      user_id: req.user.id,
      vendor_id: service.vendor_id,
      service_id,
      booking_date,
      notes,
      address,
      zone_id: matchedZone.id,
      amount: charges.service_price,
      platform_charge: charges.platform_charge,
      gst_amount: charges.gst_amount,
      total_amount: charges.total_amount,
      commission_amount: charges.commission_amount,
      vendor_payout: charges.vendor_payout,
      revenue_model_applied: charges.revenue_model_applied,
      commission_percent_applied: charges.commission_percent_applied,
    });

    // Notify vendor via socket
    if (_io) emitToUser(_io, service.vendor_id, 'new_booking', { bookingId: booking.id });

    // Save notification
    await Notification.create({
      user_id: service.vendor_id,
      title: 'New Booking',
      body: `You have a new booking #${booking.id}`,
      type: 'booking',
      data: { bookingId: booking.id },
    });

    return success(res, { booking, charges, zone: matchedZone }, 'Booking created successfully', 201);
  } catch (err) {
    return error(res, err.message);
  }
};

const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Service }, { model: Vendor }],
      order: [['created_at', 'DESC']],
    });
    return success(res, { bookings });
  } catch (err) {
    return error(res, err.message);
  }
};

// Preview charges before booking confirmation
const previewCharges = async (req, res) => {
  try {
    const { service_id } = req.query;
    const service = await Service.findByPk(service_id);
    if (!service) return error(res, 'Service not found', 404);
    const charges = await calculateBookingCharges(service.price, service.vendor_id);
    return success(res, { charges });
  } catch (err) {
    return error(res, err.message);
  }
};

// Get available zones for a vendor
const getVendorZones = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const zones = await Zone.findAll({
      include: [{
        model: Vendor,
        where: { id: vendor_id },
        through: { attributes: [] },
      }],
      where: { is_active: true },
    });
    return success(res, { zones });
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { createBooking, getMyBookings, previewCharges, getVendorZones, setIo };
