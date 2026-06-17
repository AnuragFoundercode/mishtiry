const router = require('express').Router();
const authCtrl = require('../../controllers/worker/auth.controller');
const workerCtrl = require('../../controllers/worker/booking.controller');
const { authenticateWorker } = require('../../middlewares/worker.middleware');
const upload = require('../../middlewares/upload.middleware');

// Auth (no auth needed)
router.post('/auth/send-otp', authCtrl.sendOtp);
router.post('/auth/verify-otp', authCtrl.verifyOtp);

// Profile
router.get('/profile', authenticateWorker, workerCtrl.getProfile);
router.put('/profile', authenticateWorker, upload.single('profile_image'), workerCtrl.updateProfile);
router.post('/aadhaar', authenticateWorker, upload.fields([
  { name: 'aadhaar_front', maxCount: 1 },
  { name: 'aadhaar_back', maxCount: 1 },
]), workerCtrl.uploadAadhaar);
router.patch('/fcm-token', authenticateWorker, workerCtrl.updateFcmToken);

// Availability
router.get('/availability', authenticateWorker, workerCtrl.getAvailability);
router.patch('/availability', authenticateWorker, workerCtrl.updateAvailability);
router.patch('/location', authenticateWorker, workerCtrl.updateLocation);

// Bank Details
router.get('/bank-details', authenticateWorker, workerCtrl.getBankDetails);
router.put('/bank-details', authenticateWorker, workerCtrl.updateBankDetails);

// Dashboard / Stats
router.get('/dashboard/today', authenticateWorker, workerCtrl.getTodayOverview);
router.get('/dashboard/stats', authenticateWorker, workerCtrl.getOverallStats);

// Onboarding Stepper
router.get('/onboarding-status', authenticateWorker, workerCtrl.getOnboardingStatus);

// Zones
router.get('/zones', authenticateWorker, workerCtrl.getZones);
router.put('/zone', authenticateWorker, workerCtrl.updateZone);

// Services
router.get('/services', authenticateWorker, workerCtrl.getServicesList);
router.get('/my-services', authenticateWorker, workerCtrl.getMyServices);
router.put('/my-services', authenticateWorker, workerCtrl.updateMyServices);

// Bookings
router.get('/ongoing-booking', authenticateWorker, workerCtrl.getOngoingBooking);
router.get('/bookings', authenticateWorker, workerCtrl.getMyBookings);
router.get('/bookings/:id', authenticateWorker, workerCtrl.getBookingDetail);
router.patch('/bookings/:id/status', authenticateWorker, workerCtrl.updateStatus);
router.post('/bookings/:id/collect-cod', authenticateWorker, workerCtrl.collectCod);
router.post('/bookings/:id/addons', authenticateWorker, workerCtrl.addBookingAddon);
router.get('/bookings/:id/addons', authenticateWorker, workerCtrl.getBookingAddons);

// Notifications
router.get('/notifications', authenticateWorker, workerCtrl.getNotifications);
router.patch('/notifications/:id/read', authenticateWorker, workerCtrl.markNotificationRead);
router.patch('/notifications/read-all', authenticateWorker, workerCtrl.markAllNotificationsRead);
router.delete('/notifications/:id', authenticateWorker, workerCtrl.deleteNotification);

module.exports = router;
