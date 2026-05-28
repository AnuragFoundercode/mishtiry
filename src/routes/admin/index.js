const router = require('express').Router();
const adminCtrl = require('../../controllers/admin/admin.controller');
const slotCtrl = require('../../controllers/admin/slot.controller');
const couponCtrl = require('../../controllers/admin/coupon.controller');
const { authenticate, authorize } = require('../../middlewares/auth.middleware');

router.use(authenticate, authorize('admin'));

router.get('/dashboard', adminCtrl.getDashboard);
router.post('/vendors', adminCtrl.createVendor);
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

// Zones (Polygon-based)
router.get('/zones', adminCtrl.getZones);
router.post('/zones', adminCtrl.createZone);
router.put('/zones/:id', adminCtrl.updateZone);
router.delete('/zones/:id', adminCtrl.deleteZone);

// Slots
router.get('/slots', slotCtrl.getSlots);
router.post('/slots', slotCtrl.createSlot);
router.put('/slots/:id', slotCtrl.updateSlot);
router.delete('/slots/:id', slotCtrl.deleteSlot);

// Coupons
router.get('/coupons', couponCtrl.getCoupons);
router.get('/coupons/:id', couponCtrl.getCouponDetail);
router.post('/coupons', couponCtrl.createCoupon);
router.put('/coupons/:id', couponCtrl.updateCoupon);
router.delete('/coupons/:id', couponCtrl.deleteCoupon);
router.patch('/coupons/:id/toggle', couponCtrl.toggleCoupon);

module.exports = router;
