const router = require('express').Router();
const ctrl = require('../../controllers/admin/web.controller');
const sliderCtrl = require('../../controllers/admin/slider.controller');
const upload = require('../../middlewares/upload.middleware');

const guard = (req, res, next) => {
  if (!req.session.adminId) return res.redirect('/admin/login');
  next();
};

// Auth
router.get('/login', (req, res, next) => {
  if (req.session.adminId) return res.redirect('/admin/dashboard');
  next();
}, ctrl.showLogin);
router.post('/login', ctrl.doLogin);
router.get('/logout', ctrl.doLogout);
router.get('/forgot-password', ctrl.showForgotPassword);
router.post('/forgot-password', ctrl.doForgotPassword);
router.get('/reset-password/:token', ctrl.showResetPassword);
router.post('/reset-password/:token', ctrl.doResetPassword);

// Dashboard
router.get('/dashboard', guard, ctrl.dashboard);

// Users
router.get('/users', guard, ctrl.users);
router.get('/users/:id', guard, ctrl.userDetail);
router.post('/users/:id/toggle-block', guard, ctrl.toggleBlockUser);

// Categories
router.get('/categories', guard, ctrl.categories);
router.post('/categories', guard, upload.single('image'), ctrl.createCategory);
router.post('/categories/:id/update', guard, upload.single('image'), ctrl.updateCategory);
router.post('/categories/:id/delete', guard, ctrl.deleteCategory);

// Services
router.get('/services', guard, ctrl.services);
router.get('/services/:id', guard, ctrl.serviceDetail);
router.post('/services', guard, upload.array('images', 10), ctrl.createService);
router.post('/services/:id/update', guard, upload.array('images', 10), ctrl.updateService);
router.post('/services/:id/toggle', guard, ctrl.toggleService);

// Bookings
router.get('/bookings', guard, ctrl.bookings);
router.get('/bookings/:id', guard, ctrl.bookingDetail);
router.post('/bookings/:id/update-status', guard, ctrl.updateBookingStatus);
router.post('/bookings/:id/assign-worker', guard, ctrl.assignWorker);

// Workers
router.get('/workers', guard, ctrl.workers);
router.post('/workers', guard, upload.fields([{ name: 'aadhaar_front', maxCount: 1 }, { name: 'aadhaar_back', maxCount: 1 }]), ctrl.createWorker);
router.get('/workers/:id', guard, ctrl.workerDetail);
router.post('/workers/:id/toggle-block', guard, ctrl.toggleBlockWorker);

// Revenue
router.get('/revenue', guard, ctrl.revenue);

// Settings + change password
router.get('/settings', guard, ctrl.platformSettings);
router.post('/settings', guard, ctrl.updatePlatformSettings);
router.post('/change-password', guard, ctrl.doChangePassword);

// Notifications
router.get('/notifications', guard, ctrl.notifications);
router.post('/notifications', guard, ctrl.sendNotification);

// Policies
router.get('/policies', guard, ctrl.policies);
router.post('/policies', guard, ctrl.createPolicy);
router.post('/policies/:id/update', guard, ctrl.updatePolicy);
router.post('/policies/:id/delete', guard, ctrl.deletePolicy);

// Zones
router.get('/zones', guard, ctrl.zones);
router.post('/zones', guard, ctrl.createZone);
router.post('/zones/:id/update', guard, ctrl.updateZone);
router.post('/zones/:id/delete', guard, ctrl.deleteZone);

// Sliders
router.get('/sliders', guard, sliderCtrl.sliders);
router.post('/sliders', guard, upload.single('image'), sliderCtrl.createSlider);
router.post('/sliders/:id/update', guard, upload.single('image'), sliderCtrl.updateSlider);
router.post('/sliders/:id/delete', guard, sliderCtrl.deleteSlider);

// Slots
router.get('/slots', guard, ctrl.slots);
router.post('/slots', guard, ctrl.createSlotWeb);
router.post('/slots/:id/update', guard, ctrl.updateSlotWeb);
router.post('/slots/:id/delete', guard, ctrl.deleteSlotWeb);

module.exports = router;
