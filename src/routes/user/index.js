const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const bookingCtrl = require('../../controllers/user/booking.controller');
const userCtrl = require('../../controllers/user/user.controller');
const sliderCtrl = require('../../controllers/admin/slider.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// Auth
router.post('/auth/send-otp', authCtrl.userSendOtp);
router.post('/auth/verify-otp', authCtrl.userVerifyOtp);

// Profile
router.get('/profile', authenticate, authorize('user'), userCtrl.getProfile);
router.put('/profile', authenticate, authorize('user'), upload.single('profile_image'), userCtrl.updateProfile);

// Categories
router.get('/categories', authenticate, authorize('user'), userCtrl.getCategories);
router.get('/categories/:id/services', authenticate, authorize('user'), userCtrl.getServicesByCategory);

// Sliders
router.get('/sliders', authenticate, authorize('user'), sliderCtrl.getSliders);

// Bookings (protected)
router.get('/bookings/charges-preview', authenticate, authorize('user'), bookingCtrl.previewCharges);
router.post('/bookings', authenticate, authorize('user'), bookingCtrl.createBooking);
router.get('/bookings', authenticate, authorize('user'), bookingCtrl.getMyBookings);

module.exports = router;
