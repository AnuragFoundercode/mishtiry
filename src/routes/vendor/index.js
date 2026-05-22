const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const vendorCtrl = require('../../controllers/vendor/vendor.controller');
const sliderCtrl = require('../../controllers/admin/slider.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

const auth = [authenticate, authorize('vendor')];

// ─── Auth ─────────────────────────────────────────────────────────────────────
router.post('/auth/send-otp', authCtrl.vendorSendOtp);
router.post('/auth/verify-otp', authCtrl.vendorVerifyOtp);

// ─── Sliders ──────────────────────────────────────────────────────────────────
router.get('/sliders', ...auth, sliderCtrl.getSliders);

// ─── Categories ───────────────────────────────────────────────────────────────
router.get('/categories', ...auth, vendorCtrl.getCategories);
router.post('/categories', ...auth, upload.single('image'), vendorCtrl.createCategory);
router.put('/categories/:id', ...auth, upload.single('image'), vendorCtrl.updateCategory);
router.delete('/categories/:id', ...auth, vendorCtrl.deleteCategory);

// ─── Services ─────────────────────────────────────────────────────────────────
router.get('/services', ...auth, vendorCtrl.getServices);
router.post('/services', ...auth, upload.array('images', 10), vendorCtrl.createService);
router.put('/services/:id', ...auth, upload.array('images', 10), vendorCtrl.updateService);
router.delete('/services/:id', ...auth, vendorCtrl.deleteService);

// ─── Bookings ─────────────────────────────────────────────────────────────────
router.get('/bookings', ...auth, vendorCtrl.getBookings);
router.patch('/bookings/:id/status', ...auth, vendorCtrl.updateBookingStatus);
router.patch('/bookings/:id/assign-worker', ...auth, vendorCtrl.assignWorker);

// ─── Workers ──────────────────────────────────────────────────────────────────
router.get('/workers', ...auth, vendorCtrl.getWorkers);
router.post('/workers', ...auth, upload.fields([{ name: 'aadhaar_front', maxCount: 1 }, { name: 'aadhaar_back', maxCount: 1 }]), vendorCtrl.createWorker);
router.put('/workers/:id', ...auth, upload.fields([{ name: 'aadhaar_front', maxCount: 1 }, { name: 'aadhaar_back', maxCount: 1 }]), vendorCtrl.updateWorker);
router.delete('/workers/:id', ...auth, vendorCtrl.deleteWorker);

module.exports = router;
