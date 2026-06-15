const Booking = require('../../models/booking.model');
const Service = require('../../models/service.model');
const Category = require('../../models/category.model');
const User = require('../../models/user.model');
const Worker = require('../../models/worker.model');
const Zone = require('../../models/zone.model');
const WorkerService = require('../../models/worker_service.model');
const WorkerAvailabilityLog = require('../../models/worker_availability_log.model');
const Notification = require('../../models/notification.model');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser } = require('../../sockets/socket.handler');

// Lazy load to avoid circular dependency — associations must be registered first
const getBookingAddonModel = () => {
  const model = require('../../models/booking_addon.model');
  return model;
};

let _io;
const setIo = (io) => { _io = io; };

// ─── PROFILE ──────────────────────────────────────────────────────────────────

/**
 * GET /api/worker/profile
 * Returns full worker profile with services and zone
 */
const getProfile = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.worker.id, {
      attributes: ['id', 'name', 'phone', 'email', 'profile_image', 'zone_id', 'status', 'wallet', 'rating', 'rating_count', 'availability', 'latitude', 'longitude', 'aadhaar_number', 'aadhaar_front', 'aadhaar_back', 'is_active', 'created_at'],
      include: [
        { model: Zone, attributes: ['id', 'name'], required: false },
        { model: Service, attributes: ['id', 'name', 'price'], through: { attributes: [] } },
      ],
    });
    return success(res, { worker });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/worker/profile
 * Update worker profile (name, email, profile_image)
 */
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const profile_image = req.file?.filename || undefined;
    const worker = await Worker.findByPk(req.worker.id);

    await worker.update({
      ...(name && { name }),
      ...(email !== undefined && { email }),
      ...(profile_image && { profile_image }),
    });

    return success(res, {
      id: worker.id, name: worker.name, email: worker.email,
      phone: worker.phone, profile_image: worker.profile_image,
    }, 'Profile updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/worker/aadhaar
 * Upload aadhaar front/back + aadhaar number
 * Body: { aadhaar_number }, Files: aadhaar_front, aadhaar_back
 */
const uploadAadhaar = async (req, res) => {
  try {
    const { aadhaar_number } = req.body;
    const worker = await Worker.findByPk(req.worker.id);

    const updates = {};
    if (aadhaar_number) updates.aadhaar_number = aadhaar_number;

    // Handle file uploads
    if (req.files) {
      if (req.files.aadhaar_front && req.files.aadhaar_front[0]) {
        updates.aadhaar_front = req.files.aadhaar_front[0].filename;
      }
      if (req.files.aadhaar_back && req.files.aadhaar_back[0]) {
        updates.aadhaar_back = req.files.aadhaar_back[0].filename;
      }
    }

    // If all docs submitted, keep status pending (admin will approve)
    if (worker.status === 'rejected' && (updates.aadhaar_front || updates.aadhaar_back)) {
      updates.status = 'pending';
    }

    await worker.update(updates);

    return success(res, {
      aadhaar_number: worker.aadhaar_number,
      aadhaar_front: worker.aadhaar_front,
      aadhaar_back: worker.aadhaar_back,
      status: worker.status,
    }, 'Aadhaar documents uploaded');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── ZONE ─────────────────────────────────────────────────────────────────────

/**
 * GET /api/worker/zones
 * List all active zones
 */
const getZones = async (req, res) => {
  try {
    const zones = await Zone.findAll({
      where: { is_active: true },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });
    return success(res, { zones });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/worker/zone
 * Update worker's zone
 * Body: { zone_id }
 */
const updateZone = async (req, res) => {
  try {
    const { zone_id } = req.body;
    if (!zone_id) return error(res, 'zone_id is required', 400);

    const zone = await Zone.findOne({ where: { id: zone_id, is_active: true } });
    if (!zone) return error(res, 'Zone not found', 404);

    await Worker.update({ zone_id }, { where: { id: req.worker.id } });

    return success(res, { zone_id: zone.id, zone_name: zone.name }, 'Zone updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── SERVICES ─────────────────────────────────────────────────────────────────

/**
 * GET /api/worker/services
 * List all available services (for worker to choose from)
 */
const getServicesList = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'price', 'estimated_time', 'images'],
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['name', 'ASC']],
    });
    return success(res, { services });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/worker/my-services
 * List services this worker provides
 */
const getMyServices = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.worker.id, {
      include: [{ model: Service, attributes: ['id', 'name', 'price', 'estimated_time', 'images'], through: { attributes: [] }, include: [{ model: Category, attributes: ['id', 'name'] }] }],
    });
    return success(res, { services: worker.Services || [] });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/worker/my-services
 * Update worker's services (replace all)
 * Body: { service_ids: [1, 2, 3] }
 */
const updateMyServices = async (req, res) => {
  try {
    const { service_ids } = req.body;
    if (!Array.isArray(service_ids)) return error(res, 'service_ids must be an array', 400);

    // Remove old services
    await WorkerService.destroy({ where: { worker_id: req.worker.id } });

    // Add new ones
    if (service_ids.length > 0) {
      const records = service_ids.map(sid => ({ worker_id: req.worker.id, service_id: sid }));
      await WorkerService.bulkCreate(records, { ignoreDuplicates: true });
    }

    // Return updated list
    const worker = await Worker.findByPk(req.worker.id, {
      include: [{ model: Service, attributes: ['id', 'name', 'price'], through: { attributes: [] } }],
    });

    return success(res, { services: worker.Services || [] }, 'Services updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

/**
 * GET /api/worker/bookings
 */
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

/**
 * GET /api/worker/bookings/:id
 */
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
    
    // Fetch addons separately to avoid association issues
    const BookingAddonModel = require('../../models/booking_addon.model');
    const addons = await BookingAddonModel.findAll({
      where: { booking_id: booking.id },
      attributes: ['id', 'name', 'price', 'status', 'created_at'],
      order: [['created_at', 'ASC']],
    });

    const result = booking.toJSON();
    result.addons = addons;

    return success(res, { booking: result });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/worker/bookings/:id/status
 * Body: { status }
 */
const updateStatus = async (req, res) => {
  try {
    const { status, otp } = req.body;
    const allowed = ['accepted', 'in_progress', 'completed'];
    if (!allowed.includes(status)) return error(res, 'Invalid status. Allowed: accepted, in_progress, completed', 400);

    const booking = await Booking.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!booking) return error(res, 'Booking not found', 404);

    // For completion, require confirmation OTP from user
    if (status === 'completed') {
      if (!otp) return error(res, 'Confirmation OTP is required to complete booking', 400);
      if (otp !== booking.confirmation_otp) return error(res, 'Invalid OTP. Ask the customer for the correct code.', 400);
    }

    await booking.update({ status });

    // Handle payment and earnings on completion
    if (status === 'completed') {
      await Worker.update({ availability: 'online' }, { where: { id: req.worker.id } });

      const totalAmount = parseFloat(booking.total_amount || 0);
      const platformCharge = parseFloat(booking.platform_charge || 0);
      const gstAmount = parseFloat(booking.gst_amount || 0);
      const workerEarning = totalAmount - platformCharge - gstAmount;

      if (booking.payment_method === 'cod') {
        // COD: Worker already has cash. They owe admin the platform fee.
        const dueAmount = parseFloat((platformCharge + gstAmount).toFixed(2));
        await booking.update({
          payment_status: 'paid',
          cod_collected: totalAmount,
          admin_due: dueAmount,
        });
        // Add to worker's total admin_due in DB
        const currentWorker = await Worker.findByPk(req.worker.id);
        await Worker.update(
          { admin_due: parseFloat((parseFloat(currentWorker.admin_due || 0) + dueAmount).toFixed(2)) },
          { where: { id: req.worker.id } }
        );
      } else {
        // Online: Admin has all money. Credit worker's wallet with their share.
        const worker = await Worker.findByPk(req.worker.id);
        const newWallet = parseFloat(worker.wallet || 0) + workerEarning;
        await Worker.update({ wallet: parseFloat(newWallet.toFixed(2)) }, { where: { id: req.worker.id } });
      }
    }

    await Notification.create({
      user_id: booking.user_id,
      title: 'Booking Update',
      body: `Your booking #${booking.id} is now ${status.replace('_', ' ')}`,
      type: 'booking',
      data: { bookingId: booking.id, status },
    });

    if (_io) emitToUser(_io, booking.user_id, 'booking_updated', { bookingId: booking.id, status });

    return success(res, { booking }, 'Status updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/worker/bookings/:id/collect-cod
 * Body: { amount_collected }
 */
const collectCod = async (req, res) => {
  try {
    const booking = await Booking.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!booking) return error(res, 'Booking not found', 404);
    if (booking.payment_method !== 'cod') return error(res, 'This booking is not COD', 400);
    if (booking.payment_status === 'paid') return error(res, 'Already marked as paid', 400);

    const amount_collected = parseFloat(req.body.amount_collected);
    if (!amount_collected || amount_collected <= 0) return error(res, 'Valid amount_collected required', 400);

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
    }, 'COD collected');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── BOOKING ADD-ONS ──────────────────────────────────────────────────────────

/**
 * POST /api/worker/bookings/:id/addons
 * Worker adds extra item/service to a booking — directly accepted, no user approval needed
 * Body: { name, price } or { items: [{ name, price }, ...] }
 */
const addBookingAddon = async (req, res) => {
  try {

    const booking = await Booking.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!booking) return error(res, 'Booking not found', 404);
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return error(res, 'Cannot add items to completed/cancelled booking', 400);
    }

    const { name, price, items } = req.body;
    let addons = [];

    if (items && Array.isArray(items)) {
      addons = items.map(item => ({
        booking_id: booking.id,
        name: item.name,
        price: parseFloat(item.price),
        added_by_worker_id: req.worker.id,
        status: 'accepted',
      }));
    } else if (name && price) {
      addons = [{
        booking_id: booking.id,
        name,
        price: parseFloat(price),
        added_by_worker_id: req.worker.id,
        status: 'accepted',
      }];
    } else {
      return error(res, 'name and price required (or items array)', 400);
    }

    const created = await getBookingAddonModel().bulkCreate(addons);

    // Update booking total with addon amount
    const allAddons = await getBookingAddonModel().findAll({
      where: { booking_id: booking.id, status: 'accepted' },
    });
    const addonTotal = allAddons.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);
    
    // Recalculate: original total (without old addons) + new addon total
    const baseTotal = parseFloat(booking.total_amount || 0) - parseFloat(booking.addon_total || 0);
    const newTotal = baseTotal + addonTotal;

    await booking.update({ addon_total: parseFloat(addonTotal.toFixed(2)), total_amount: parseFloat(newTotal.toFixed(2)) });
    await booking.reload();

    return success(res, {
      addons: created,
      addon_total: parseFloat(addonTotal.toFixed(2)),
      new_total_amount: parseFloat(booking.total_amount),
    }, 'Add-on added to booking');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/worker/bookings/:id/addons
 * List all add-ons for a booking
 */
const getBookingAddons = async (req, res) => {
  try {
    const addons = await getBookingAddonModel().findAll({
      where: { booking_id: req.params.id },
      order: [['created_at', 'ASC']],
    });
    const total = addons.reduce((sum, a) => sum + parseFloat(a.price), 0);
    return success(res, { addons, addon_total: parseFloat(total.toFixed(2)) });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── FCM ──────────────────────────────────────────────────────────────────────

const updateFcmToken = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    await Worker.update({ fcm_token }, { where: { id: req.worker.id } });
    return success(res, {}, 'FCM token updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── ONGOING BOOKING (for showing on app open) ───────────────────────────────

/**
 * GET /api/worker/ongoing-booking
 * Returns the worker's current active booking in new_booking_alert format
 * So Flutter can show the same UI as socket alert
 */
const getOngoingBooking = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const Address = require('../../models/address.model');

    const booking = await Booking.findOne({
      where: {
        worker_id: req.worker.id,
        status: { [Op.in]: ['accepted', 'in_progress'] },
      },
      include: [
        { model: Service, attributes: ['id', 'name', 'price', 'description'] },
        { model: User, attributes: ['id', 'name', 'mobile'] },
        { model: Address, attributes: ['id', 'full_address', 'latitude', 'longitude'], required: false },
      ],
      order: [['updated_at', 'DESC']],
    });

    if (!booking) {
      return success(res, { ongoing: null }, 'No ongoing booking');
    }

    // Calculate distance if worker has location
    let distanceStr = '0 km';
    const worker = req.worker;
    if (worker.latitude && worker.longitude && booking.Address && booking.Address.latitude && booking.Address.longitude) {
      const R = 6371;
      const dLat = (parseFloat(booking.Address.latitude) - parseFloat(worker.latitude)) * Math.PI / 180;
      const dLng = (parseFloat(booking.Address.longitude) - parseFloat(worker.longitude)) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(parseFloat(worker.latitude) * Math.PI / 180) * Math.cos(parseFloat(booking.Address.latitude) * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      distanceStr = `${(R * c).toFixed(1)} km`;
    }

    const response = {
      type: 'new_booking',
      booking_id: booking.id,
      service: booking.Service ? { id: booking.Service.id, name: booking.Service.name, price: parseFloat(booking.Service.price) } : null,
      task_description: booking.notes || (booking.Service ? booking.Service.description : '') || 'No description',
      total_amount: parseFloat(booking.total_amount),
      address: booking.Address ? booking.Address.full_address : (booking.address || ''),
      userLet: booking.Address.latitude,
      userLng: booking.Address.longitude,
      pickup_address: booking.Address ? booking.Address.full_address : (booking.address || ''),
      distance: distanceStr,
      booking_date: booking.booking_date,
      created_at: booking.createdAt,
      status: booking.status,
      customer: booking.User ? { id: booking.User.id, name: booking.User.name, mobile: booking.User.mobile } : null,
    };

    return success(res, { ongoing: response });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── AVAILABILITY (online/offline/busy) ───────────────────────────────────────

/**
 * PATCH /api/worker/availability
 * Body: { status: 'online'|'offline'|'busy', latitude, longitude }
 */
const updateAvailability = async (req, res) => {
  try {
    const { status, latitude, longitude } = req.body;
    if (!['online', 'offline', 'busy'].includes(status)) {
      return error(res, 'Invalid status. Allowed: online, offline, busy', 400);
    }

    const updates = { availability: status };
    if (latitude) updates.latitude = latitude;
    if (longitude) updates.longitude = longitude;
    if (latitude || longitude) updates.last_location_update = new Date();

    await Worker.update(updates, { where: { id: req.worker.id } });

    // Log the status change
    await WorkerAvailabilityLog.create({
      worker_id: req.worker.id,
      status,
      latitude: latitude || null,
      longitude: longitude || null,
    });

    return success(res, { availability: status, latitude, longitude }, `Status updated to ${status}`);
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/worker/location
 * Body: { latitude, longitude }
 * Update live location (called periodically by app)
 */
const updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return error(res, 'latitude and longitude required', 400);

    await Worker.update(
      { latitude, longitude, last_location_update: new Date() },
      { where: { id: req.worker.id } }
    );

    return success(res, { latitude, longitude }, 'Location updated');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/worker/availability
 * Get current availability status
 */
const getAvailability = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.worker.id, {
      attributes: ['id', 'availability', 'latitude', 'longitude', 'last_location_update'],
    });
    return success(res, { worker });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── DASHBOARD / STATS ────────────────────────────────────────────────────────

/**
 * GET /api/worker/dashboard/today
 */
const getTodayOverview = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCompleted = await Booking.findAll({
      where: {
        worker_id: req.worker.id,
        status: 'completed',
        payment_status: 'paid',
        updated_at: { [Op.gte]: today, [Op.lt]: tomorrow },
      },
    });

    const todayEarning = todayCompleted.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const worker = await Worker.findByPk(req.worker.id, { attributes: ['rating', 'rating_count'] });

    return success(res, {
      today: {
        earning: parseFloat(todayEarning.toFixed(2)),
        jobs_done: todayCompleted.length,
        rating: parseFloat(worker.rating || 0),
        rating_count: worker.rating_count || 0,
      },
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * GET /api/worker/dashboard/stats
 */
const getOverallStats = async (req, res) => {
  try {
    const allBookings = await Booking.findAll({
      where: { worker_id: req.worker.id },
      attributes: ['id', 'status', 'payment_method', 'payment_status', 'total_amount', 'cod_collected', 'admin_due', 'platform_charge', 'gst_amount'],
    });

    const completedPaid = allBookings.filter(b => b.status === 'completed' && b.payment_status === 'paid');
    const totalEarning = completedPaid.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
    const cashCollected = completedPaid.filter(b => b.payment_method === 'cod').reduce((sum, b) => sum + parseFloat(b.cod_collected || 0), 0);
    const onlinePaid = completedPaid.filter(b => b.payment_method === 'online').reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    // Admin due = total platform fees worker owes from COD bookings
    const totalAdminDue = completedPaid
      .filter(b => b.payment_method === 'cod')
      .reduce((sum, b) => sum + parseFloat(b.admin_due || 0), 0);

    // Worker's net earning = total - platform - gst
    const totalPlatformFees = completedPaid.reduce((sum, b) => sum + parseFloat(b.platform_charge || 0) + parseFloat(b.gst_amount || 0), 0);
    const netEarning = totalEarning - totalPlatformFees;

    const totalAssigned = allBookings.length;
    const jobsCompleted = allBookings.filter(b => b.status === 'completed').length;
    const inProgress = allBookings.filter(b => b.status === 'in_progress' || b.status === 'accepted').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;

    const accepted = allBookings.filter(b => ['accepted', 'in_progress', 'completed'].includes(b.status)).length;
    const acceptanceRate = totalAssigned > 0 ? parseFloat(((accepted / totalAssigned) * 100).toFixed(1)) : 0;

    const worker = await Worker.findByPk(req.worker.id, { attributes: ['rating', 'rating_count', 'wallet', 'admin_due'] });

    return success(res, {
      stats: {
        total_earning: parseFloat(totalEarning.toFixed(2)),
        net_earning: parseFloat(netEarning.toFixed(2)),
        cash_collected: parseFloat(cashCollected.toFixed(2)),
        online_paid: parseFloat(onlinePaid.toFixed(2)),
        admin_due: parseFloat(worker.admin_due || 0),
        platform_fees: parseFloat(totalPlatformFees.toFixed(2)),
        wallet: parseFloat(worker.wallet || 0),
        total_assigned: totalAssigned,
        jobs_completed: jobsCompleted,
        in_progress: inProgress,
        cancelled: cancelled,
        rating: parseFloat(worker.rating || 0),
        rating_count: worker.rating_count || 0,
        acceptance_rate: acceptanceRate,
      },
    });
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── BANK DETAILS ─────────────────────────────────────────────────────────────

/**
 * GET /api/worker/bank-details
 */
const getBankDetails = async (req, res) => {
  try {
    const worker = await Worker.findByPk(req.worker.id, {
      attributes: ['bank_name', 'holder_name', 'account_number', 'ifsc_code'],
    });
    return success(res, {
      bank_name: worker.bank_name || null,
      holder_name: worker.holder_name || null,
      account_number: worker.account_number || null,
      ifsc_code: worker.ifsc_code || null,
    });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PUT /api/worker/bank-details
 * Body: { bank_name, holder_name, account_number, ifsc_code }
 */
const updateBankDetails = async (req, res) => {
  try {
    const { bank_name, holder_name, account_number, ifsc_code } = req.body;
    if (!bank_name || !holder_name || !account_number || !ifsc_code) {
      return error(res, 'All fields required: bank_name, holder_name, account_number, ifsc_code', 400);
    }
    await Worker.update(
      { bank_name, holder_name, account_number, ifsc_code },
      { where: { id: req.worker.id } }
    );
    return success(res, { bank_name, holder_name, account_number, ifsc_code }, 'Bank details updated');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

/**
 * GET /api/worker/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { worker_id: req.worker.id },
      order: [['created_at', 'DESC']],
      limit: 50,
    });
    const unreadCount = await Notification.count({ where: { worker_id: req.worker.id, is_read: false } });
    return success(res, { notifications, unread_count: unreadCount });
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/worker/notifications/:id/read
 */
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!notification) return error(res, 'Notification not found', 404);
    await notification.update({ is_read: true });
    return success(res, {}, 'Marked as read');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * PATCH /api/worker/notifications/read-all
 */
const markAllNotificationsRead = async (req, res) => {
  try {
    await Notification.update({ is_read: true }, { where: { worker_id: req.worker.id, is_read: false } });
    return success(res, {}, 'All marked as read');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * DELETE /api/worker/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOne({ where: { id: req.params.id, worker_id: req.worker.id } });
    if (!notification) return error(res, 'Notification not found', 404);
    await notification.destroy();
    return success(res, {}, 'Notification deleted');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = {
  getProfile, updateProfile, uploadAadhaar,
  getZones, updateZone,
  getServicesList, getMyServices, updateMyServices,
  getMyBookings, getBookingDetail, updateStatus, collectCod,
  addBookingAddon, getBookingAddons,
  updateFcmToken, getOngoingBooking,
  updateAvailability, updateLocation, getAvailability,
  getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification,
  getBankDetails, updateBankDetails,
  getTodayOverview, getOverallStats,
  setIo,
};
