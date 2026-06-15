const jwt = require('jsonwebtoken');
const Worker = require('../models/worker.model');
const Booking = require('../models/booking.model');
const Service = require('../models/service.model');
const WorkerAvailabilityLog = require('../models/worker_availability_log.model');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
require('dotenv').config();

// Store connected users/workers: { id: socketId }
const connectedUsers = new Map();
const connectedWorkers = new Map();

const initSocket = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    const role = socket.user.role;

    // Track connection by role
    if (role === 'worker') {
      connectedWorkers.set(userId, socket.id);
      socket.join(`worker_${userId}`);
      console.log(`Worker ${userId} connected`);
    } else {
      connectedUsers.set(userId, socket.id);
      socket.join(`user_${userId}`);
      console.log(`User ${userId} connected`);
    }

    // ─── Worker: Go online/offline ────────────────────────────────────────
    socket.on('worker_availability', async (data) => {
      if (role !== 'worker') return;
      const { status, latitude, longitude } = data;
      if (!['online', 'offline', 'busy'].includes(status)) return;

      const updates = { availability: status };
      if (latitude) updates.latitude = latitude;
      if (longitude) updates.longitude = longitude;
      if (latitude || longitude) updates.last_location_update = new Date();

      await Worker.update(updates, { where: { id: userId } });
      await WorkerAvailabilityLog.create({
        worker_id: userId, status,
        latitude: latitude || null, longitude: longitude || null,
      });

      socket.emit('availability_updated', { status, latitude, longitude });
    });

    // ─── Worker: Update live location ─────────────────────────────────────
    socket.on('worker_location', async (data) => {
      if (role !== 'worker') return;
      const { latitude, longitude } = data;
      if (!latitude || !longitude) return;

      await Worker.update(
        { latitude, longitude, last_location_update: new Date() },
        { where: { id: userId } }
      );
    });

    // ─── Worker: Accept booking ───────────────────────────────────────────
    socket.on('accept_booking', async (data) => {
      if (role !== 'worker') return;
      const { booking_id } = data;

      const booking = await Booking.findByPk(booking_id);
      if (!booking || booking.status !== 'pending') {
        socket.emit('booking_response', { booking_id, accepted: false, message: 'Booking no longer available' });
        return;
      }

      // Assign worker and set busy
      await booking.update({ worker_id: userId, status: 'accepted' });
      await Worker.update({ availability: 'busy' }, { where: { id: userId } });

      // Log status change
      await WorkerAvailabilityLog.create({ worker_id: userId, status: 'busy' });

      // Notify worker
      socket.emit('booking_response', { booking_id, accepted: true, message: 'Booking accepted' });

      // Notify user
      io.to(`user_${booking.user_id}`).emit('booking_accepted', {
        booking_id: booking.id,
        worker_id: userId,
      });
    });

    // ─── Worker: Reject booking ───────────────────────────────────────────
    socket.on('reject_booking', async (data) => {
      if (role !== 'worker') return;
      const { booking_id } = data;
      // Worker just rejects — booking stays pending for other workers
      socket.emit('booking_response', { booking_id, accepted: false, message: 'Booking rejected' });
    });

    // ─── Chat: send message ───────────────────────────────────────────────
    socket.on('send_message', async (data) => {
      const { receiverId, message, bookingId } = data;
      const payload = {
        senderId: userId,
        senderRole: role,
        message,
        bookingId,
        timestamp: new Date(),
      };
      io.to(`user_${receiverId}`).emit('receive_message', payload);
      if (role === 'worker') io.to(`worker_${receiverId}`).emit('receive_message', payload);
      socket.emit('message_sent', payload);
    });

    // ─── Disconnect ───────────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      if (role === 'worker') {
        connectedWorkers.delete(userId);
        // Mark worker offline on disconnect
        //await Worker.update({ availability: 'offline' }, { where: { id: userId } });
        //await WorkerAvailabilityLog.create({ worker_id: userId, status: 'offline' });
        //console.log(`Worker ${userId} disconnected → offline`);
      } else {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
      }
    });
  });
};

// Send notification to specific user via socket
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

// Send notification to specific worker via socket
const emitToWorker = (io, workerId, event, data) => {
  io.to(`worker_${workerId}`).emit(event, data);
};

/**
 * Find online workers within radius (km) of a given point
 * and send them a new booking alert
 */
const alertNearbyWorkers = async (io, booking, address, radiusKm = 5) => {
  const WorkerServiceModel = require('../models/worker_service.model');

  // Find workers who provide this service
  const serviceWorkerIds = (await WorkerServiceModel.findAll({
    where: { service_id: booking.service_id },
    attributes: ['worker_id'],
  })).map(ws => ws.worker_id);

  if (!serviceWorkerIds.length) return;

  // Base conditions: approved, online, provides this service
  const baseWhere = {
    id: { [Op.in]: serviceWorkerIds },
    availability: 'online',
    status: 'approved',
    is_active: true,
    is_blocked: false,
  };

  let workers = [];

  // Strategy 1: Find workers by ZONE match (if booking has a zone)
  if (booking.zone_id) {
    const zoneWorkers = await Worker.findAll({
      where: { ...baseWhere, zone_id: booking.zone_id },
    });
    workers.push(...zoneWorkers);
  }

  // Strategy 2: Find workers by DISTANCE (within radius km)
  if (address && address.latitude && address.longitude) {
    const lat = parseFloat(address.latitude);
    const lng = parseFloat(address.longitude);

    const nearbyWorkers = await Worker.findAll({
      where: {
        ...baseWhere,
        latitude: { [Op.not]: null },
        longitude: { [Op.not]: null },
      },
      attributes: {
        include: [
          [
            sequelize.literal(`(
              6371 * acos(
                cos(radians(${lat})) * cos(radians(latitude)) *
                cos(radians(longitude) - radians(${lng})) +
                sin(radians(${lat})) * sin(radians(latitude))
              )
            )`),
            'distance',
          ],
        ],
      },
      having: sequelize.where(
        sequelize.literal(`distance`),
        '<=',
        radiusKm
      ),
      order: [[sequelize.literal('distance'), 'ASC']],
    });
    workers.push(...nearbyWorkers);
  }

  // Deduplicate workers (might appear in both zone + distance)
  const seen = new Set();
  workers = workers.filter(w => {
    if (seen.has(w.id)) return false;
    seen.add(w.id);
    return true;
  });

  if (!workers.length) return;

  // Get service details for the alert
  const service = await Service.findByPk(booking.service_id, { attributes: ['id', 'name', 'price', 'description'] });

  // For each worker, calculate their distance and send personalized alert
  const { sendIncomingBookingToPartner } = require('../helpers/notification.helper');

  for (const w of workers) {
    const workerDistance = w.getDataValue('distance');
    const distanceStr = workerDistance ? `${parseFloat(workerDistance).toFixed(1)} km` : '0 km';

    const alertPayload = {
      type: 'new_booking',
      booking_id: booking.id,
      service: service ? { id: service.id, name: service.name, price: parseFloat(service.price) } : null,
      task_description: booking.notes || (service ? service.description : '') || 'No description',
      total_amount: parseFloat(booking.total_amount),
      address: address.full_address || booking.address || '',
      pickup_address: address.full_address || booking.address || '',
      distance: distanceStr,
      booking_date: booking.booking_date,
      created_at: booking.createdAt,
    };

    // Socket alert
    io.to(`worker_${w.id}`).emit('new_booking_alert', alertPayload);

    // FCM push with overlay data
    if (w.fcm_token) {
      await sendIncomingBookingToPartner(w.fcm_token, {
        bookingId: booking.id,
        serviceName: service ? service.name : 'Service',
        servicePrice: service ? parseFloat(service.price) : 0,
        totalAmount: parseFloat(booking.total_amount),
        address: address.full_address || booking.address || '',
        taskDescription: booking.notes || (service ? service.description : '') || 'No description',
        distance: distanceStr,
      });
    }
  }

  console.log(`Booking #${booking.id} alert sent to ${workers.length} nearby workers (socket + FCM)`);
};

module.exports = { initSocket, emitToUser, emitToWorker, alertNearbyWorkers, connectedUsers, connectedWorkers };
