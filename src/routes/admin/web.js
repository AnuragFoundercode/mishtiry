const router = require('express').Router();
const ctrl = require('../../controllers/admin/web.controller');
const upload = require('../../middlewares/upload.middleware');

const guard = (req, res, next) => {
  if (!req.session.adminId) return res.redirect('/admin/login');
  next();
};

// Auth
router.get('/login', ctrl.showLogin);
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
router.post('/users/:id/toggle-block', guard, ctrl.toggleBlockUser);

// Vendors
router.get('/vendors', guard, ctrl.vendors);
router.post('/vendors/create', guard, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), ctrl.createVendor);
router.get('/vendors/:id', guard, ctrl.vendorDetail);
router.post('/vendors/:id/update-profile', guard, upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]), ctrl.updateVendorProfile);
router.post('/vendors/:id/kyc', guard, ctrl.updateVendorKyc);
router.post('/vendors/:id/pricing', guard, ctrl.updateVendorPricing);
router.post('/vendors/:id/toggle-suspend', guard, ctrl.toggleSuspendVendor);
router.post('/vendors/:id/toggle-featured', guard, ctrl.toggleFeaturedVendor);
router.post('/vendors/:id/subscription', guard, ctrl.assignVendorSubscription);
router.post('/vendors/:id/subscription/:subId/cancel', guard, ctrl.cancelVendorSubscription);

// Subscription Plans
router.get('/subscriptions', guard, ctrl.subscriptionPlans);
router.post('/subscriptions', guard, ctrl.createPlan);
router.post('/subscriptions/:id/update', guard, ctrl.updatePlan);
router.post('/subscriptions/:id/toggle', guard, ctrl.togglePlan);

// Categories
router.get('/categories', guard, ctrl.categories);
router.post('/categories', guard, upload.single('image'), ctrl.createCategory);
router.post('/categories/:id/update', guard, upload.single('image'), ctrl.updateCategory);
router.post('/categories/:id/delete', guard, ctrl.deleteCategory);

// Services
router.get('/services', guard, ctrl.services);
router.post('/services/:id/toggle', guard, ctrl.toggleService);

// Bookings
router.get('/bookings', guard, ctrl.bookings);

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

module.exports = router;
