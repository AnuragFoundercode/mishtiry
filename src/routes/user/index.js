const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const bookingCtrl = require('../../controllers/user/booking.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

// Auth
router.post('/auth/send-otp', authCtrl.userSendOtp);
router.post('/auth/verify-otp', authCtrl.userVerifyOtp);

// Bookings (protected)
router.get('/bookings/charges-preview', authenticate, authorize('user'), bookingCtrl.previewCharges);
router.post('/bookings', authenticate, authorize('user'), bookingCtrl.createBooking);
router.get('/bookings', authenticate, authorize('user'), bookingCtrl.getMyBookings);

module.exports = router;
