const Booking = require('../../models/booking.model');
const User = require('../../models/user.model');
const Service = require('../../models/service.model');
const Notification = require('../../models/notification.model');
const { sendBookingNotification } = require('../../helpers/notification.helper');
const { success, error } = require('../../helpers/response.helper');
const { emitToUser } = require('../../sockets/socket.handler');

let _io;
const setIo = (io) => { _io = io; };

const getVendorBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { vendor_id: req.user.vendorId },
      include: [{ model: User, attributes: ['id', 'name', 'mobile'] }, { model: Service }],
      order: [['created_at', 'DESC']],
    });
    return success(res, { bookings });
  } catch (err) {
    return error(res, err.message);
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const booking = await Booking.findOne({ where: { id, vendor_id: req.user.vendorId } });
    if (!booking) return error(res, 'Booking not found', 404);

    await booking.update({ status });

    // Notify user
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
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { getVendorBookings, updateBookingStatus, setIo };
