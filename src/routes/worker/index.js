const router = require('express').Router();
const authCtrl = require('../../controllers/worker/auth.controller');
const bookingCtrl = require('../../controllers/worker/booking.controller');
const { authenticateWorker } = require('../../middlewares/worker.middleware');

// Auth
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);

// Profile
router.get('/profile', authenticateWorker, bookingCtrl.getProfile);
router.patch('/fcm-token', authenticateWorker, bookingCtrl.updateFcmToken);

// Bookings
router.get('/bookings', authenticateWorker, bookingCtrl.getMyBookings);
router.get('/bookings/:id', authenticateWorker, bookingCtrl.getBookingDetail);
router.patch('/bookings/:id/status', authenticateWorker, bookingCtrl.updateStatus);
router.post('/bookings/:id/collect-cod', authenticateWorker, bookingCtrl.collectCod);

module.exports = router;
