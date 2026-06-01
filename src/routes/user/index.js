const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const bookingCtrl = require('../../controllers/user/booking.controller');
const userCtrl = require('../../controllers/user/user.controller');
const addressCtrl = require('../../controllers/user/address.controller');
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
router.get('/categories', userCtrl.getCategories);
router.get('/categories/:id/services',  userCtrl.getServicesByCategory);
router.get('/services/popular',  userCtrl.getPopularServices);
router.get('/services/:id',  userCtrl.getServiceDetail);

// Sliders
router.get('/sliders',  sliderCtrl.getSliders);

// Slots
router.get('/slots', ...auth, userCtrl.getAvailableSlots);

// Addresses
router.get('/addresses', ...auth, addressCtrl.getAddresses);
router.post('/addresses', ...auth, addressCtrl.createAddress);
router.put('/addresses/:id', ...auth, addressCtrl.updateAddress);
router.delete('/addresses/:id', ...auth, addressCtrl.deleteAddress);
router.put('/addresses/:id/set-default', ...auth, addressCtrl.setDefault);

// Bookings
router.get('/bookings/charges-preview', ...auth, bookingCtrl.previewCharges);
router.post('/bookings', ...auth, bookingCtrl.createBooking);
router.get('/bookings', ...auth, bookingCtrl.getMyBookings);
router.get('/bookings/:id', ...auth, bookingCtrl.getBookingDetail);
router.get('/bookings/:id/payment-verify', ...auth, bookingCtrl.verifyPayment);
router.post('/bookings/:id/cancel', ...auth, bookingCtrl.cancelBooking);

// Coupons
router.get('/coupons', ...auth, bookingCtrl.listCoupons);
router.post('/coupons/validate', ...auth, bookingCtrl.applyCoupon);

// Policies (public - no auth needed)
router.get('/policies', userCtrl.getPolicies);
router.get('/policies/:slug', userCtrl.getPolicyBySlug);

// Support/Contact Info (public)
router.get('/support', userCtrl.getSupport);

// Testimonials (public)
router.get('/testimonials', userCtrl.getTestimonials);

module.exports = router;
