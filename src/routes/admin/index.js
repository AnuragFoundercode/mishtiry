const router = require('express').Router();
const adminCtrl = require('../../controllers/admin/admin.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminCtrl.getDashboard);
router.patch('/vendors/:id/approve', adminCtrl.approveVendor);
router.patch('/users/:id/block', adminCtrl.blockUser);
router.post('/notifications/broadcast', adminCtrl.sendBroadcastNotification);
router.post('/categories/:action', adminCtrl.manageCategory);

// Global platform charges (platform_charge_percent, gst_percent, defaults)
router.get('/platform-settings', adminCtrl.getPlatformSettings);
router.put('/platform-settings', adminCtrl.updatePlatformSettings);

// Per-vendor pricing
router.get('/vendors/:id/pricing', adminCtrl.getVendorPricing);
router.put('/vendors/:id/pricing', adminCtrl.setVendorPricing);

// KYC review
router.get('/vendors/:id/kyc', adminCtrl.getVendorKyc);
router.patch('/vendors/:id/kyc', adminCtrl.reviewVendorKyc);

// Policies
router.get('/policies', adminCtrl.getPolicies);
router.post('/policies', adminCtrl.createPolicy);
router.put('/policies/:id', adminCtrl.updatePolicy);
router.delete('/policies/:id', adminCtrl.deletePolicy);

module.exports = router;
