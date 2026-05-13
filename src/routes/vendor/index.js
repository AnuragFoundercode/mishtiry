const router = require('express').Router();
const authCtrl = require('../../controllers/user/auth.controller');
const onboardingCtrl = require('../../controllers/vendor/onboarding.controller');
const serviceCtrl = require('../../controllers/vendor/service.controller');
const bookingCtrl = require('../../controllers/vendor/booking.controller');
const sliderCtrl = require('../../controllers/admin/slider.controller');
const { authenticate, authorize, requireApprovedVendor } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// ─── Sliders ──────────────────────────────────────────────────────────────────
router.get('/sliders', authenticate, authorize('vendor'), sliderCtrl.getSliders);

// ─── Auth (Vendor-specific) ──────────────────────────────────────────────────
router.post('/auth/send-otp', authCtrl.vendorSendOtp);
router.post('/auth/verify-otp', authCtrl.vendorVerifyOtp);

// ─── Onboarding (No approval needed - this IS the onboarding) ────────────────
router.get('/onboarding/status', authenticate, authorize('vendor'), onboardingCtrl.getOnboardingStatus);

// Profile
router.get('/onboarding/profile', authenticate, authorize('vendor'), onboardingCtrl.getProfile);
router.post('/onboarding/profile', authenticate, authorize('vendor'),
  upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'banner', maxCount: 1 }]),
  onboardingCtrl.saveProfile
);

// KYC
router.get('/onboarding/kyc', authenticate, authorize('vendor'), onboardingCtrl.getKyc);
router.post('/onboarding/kyc', authenticate, authorize('vendor'),
  upload.fields([
    { name: 'aadhaar_front', maxCount: 1 },
    { name: 'aadhaar_back', maxCount: 1 },
    { name: 'pan_document', maxCount: 1 },
    { name: 'gst_document', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  onboardingCtrl.saveKyc
);

// Bank
router.get('/onboarding/bank', authenticate, authorize('vendor'), onboardingCtrl.getBankDetails);
router.post('/onboarding/bank', authenticate, authorize('vendor'),
  upload.single('passbook_image'),
  onboardingCtrl.saveBankDetails
);

// ─── Services (Only approved + KYC verified vendors) ─────────────────────────
router.get('/services', authenticate, authorize('vendor'), requireApprovedVendor, serviceCtrl.getMyServices);
router.get('/services/:id', authenticate, authorize('vendor'), requireApprovedVendor, serviceCtrl.getService);
router.post('/services', authenticate, authorize('vendor'), requireApprovedVendor, upload.array('images', 10), serviceCtrl.addService);
router.put('/services/:id', authenticate, authorize('vendor'), requireApprovedVendor, upload.array('images', 10), serviceCtrl.updateService);
router.delete('/services/:id', authenticate, authorize('vendor'), requireApprovedVendor, serviceCtrl.deleteService);

// ─── Bookings (Only approved + KYC verified vendors) ─────────────────────────
router.get('/bookings', authenticate, authorize('vendor'), requireApprovedVendor, bookingCtrl.getVendorBookings);
router.patch('/bookings/:id/status', authenticate, authorize('vendor'), requireApprovedVendor, bookingCtrl.updateBookingStatus);

module.exports = router;
