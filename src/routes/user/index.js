const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const bookingCtrl = require('../../controllers/user/booking.controller');
const userCtrl = require('../../controllers/user/user.controller');
const sliderCtrl = require('../../controllers/admin/slider.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const auth = [authenticate, authorize('user')];

// Auth
router.post('/auth/send-otp', authCtrl.userSendOtp);
router.post('/auth/verify-otp', authCtrl.userVerifyOtp);

// Profile
router.get('/profile', ...auth, userCtrl.getProfile);
router.put('/profile', ...auth, upload.single('profile_image'), userCtrl.updateProfile);

// Categories & Services
router.get('/categories', ...auth, userCtrl.getCategories);
router.get('/categories/:id/services', ...auth, userCtrl.getServicesByCategory);

// Sliders
router.get('/sliders', ...auth, sliderCtrl.getSliders);

// Bookings
router.get('/bookings/charges-preview', ...auth, bookingCtrl.previewCharges);
router.post('/bookings', ...auth, bookingCtrl.createBooking);
router.get('/bookings', ...auth, bookingCtrl.getMyBookings);
router.get('/bookings/:id', ...auth, bookingCtrl.getBookingDetail);
router.get('/bookings/:id/payment-verify', ...auth, bookingCtrl.verifyPayment);
router.post('/bookings/:id/cancel', ...auth, bookingCtrl.cancelBooking);

module.exports = router;
