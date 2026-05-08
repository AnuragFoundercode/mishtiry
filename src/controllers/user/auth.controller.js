const jwt = require('jsonwebtoken');
const User = require('../../models/user.model');
const Vendor = require('../../models/vendor.model');
const Otp = require('../../models/otp.model');
const { generateOTP, sendSmsOtp } = require('../../helpers/otp.helper');
const { success, error } = require('../../helpers/response.helper');
require('dotenv').config();

// ─── Internal helper ──────────────────────────────────────────────────────────
const createAndSendOtp = async (mobile) => {
  const otp = generateOTP();
  const expires_at = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || 300) * 1000);
  await Otp.destroy({ where: { mobile } });
  await Otp.create({ mobile, otp, expires_at });
  await sendSmsOtp(mobile, otp);
  return otp;
};

const verifyOtpRecord = async (mobile, otp) => {
  const record = await Otp.findOne({ where: { mobile, otp, is_used: false } });
  if (!record) return { valid: false, reason: 'Invalid OTP' };
  if (new Date() > record.expires_at) return { valid: false, reason: 'OTP expired' };
  await record.update({ is_used: true });
  return { valid: true };
};

const signToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// ─── USER: Send OTP ───────────────────────────────────────────────────────────
// POST /api/user/auth/send-otp
// Body: { mobile }
// Checks: if mobile already registered as vendor → block
const userSendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return error(res, 'Mobile number required', 400);

    const existing = await User.findOne({ where: { mobile } });
    if (existing && existing.role === 'vendor') {
      return error(res, 'This number is registered as a vendor. Please use the vendor app.', 400);
    }

    await createAndSendOtp(mobile);
    return success(res, {}, 'OTP sent successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── USER: Verify OTP ─────────────────────────────────────────────────────────
// POST /api/user/auth/verify-otp
// Body: { mobile, otp }
const userVerifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return error(res, 'Mobile and OTP required', 400);

    const check = await verifyOtpRecord(mobile, otp);
    if (!check.valid) return error(res, check.reason, 400);

    let user = await User.findOne({ where: { mobile } });
    if (user && user.role === 'vendor') {
      return error(res, 'This number is registered as a vendor. Please use the vendor app.', 400);
    }

    const isNew = !user;
    if (!user) user = await User.create({ mobile, role: 'user' });
    if (user.is_blocked) return error(res, 'Your account has been blocked. Contact support.', 403);

    return success(res, {
      token: signToken(user),
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, profile_image: user.profile_image },
      isNew,
    }, isNew ? 'Registered successfully' : 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── VENDOR: Send OTP ─────────────────────────────────────────────────────────
// POST /api/vendor/auth/send-otp
// Body: { mobile }
// Checks: if mobile already registered as user → block
const vendorSendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return error(res, 'Mobile number required', 400);

    const existing = await User.findOne({ where: { mobile } });
    if (existing && existing.role === 'user') {
      return error(res, 'This number is registered as a user. Please use the user app.', 400);
    }

    await createAndSendOtp(mobile);
    return success(res, {}, 'OTP sent successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// ─── VENDOR: Verify OTP ───────────────────────────────────────────────────────
// POST /api/vendor/auth/verify-otp
// Body: { mobile, otp }
const vendorVerifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return error(res, 'Mobile and OTP required', 400);

    const check = await verifyOtpRecord(mobile, otp);
    if (!check.valid) return error(res, check.reason, 400);

    let user = await User.findOne({ where: { mobile } });
    if (user && user.role === 'user') {
      return error(res, 'This number is registered as a user. Please use the user app.', 400);
    }

    const isNew = !user;
    if (!user) user = await User.create({ mobile, role: 'vendor' });
    if (user.is_blocked) return error(res, 'Your account has been blocked. Contact support.', 403);

    const vendor = await Vendor.findOne({ where: { user_id: user.id } });

    return success(res, {
      token: signToken(user),
      user: { id: user.id, mobile: user.mobile, role: user.role },
      vendor: vendor ? {
        id: vendor.id,
        business_name: vendor.business_name,
        kyc_status: vendor.kyc_status,
        is_approved: vendor.is_approved,
        is_suspended: vendor.is_suspended,
      } : null,
      isNew,
      onboarding_complete: !!vendor?.business_name,
    }, isNew ? 'Vendor registered successfully' : 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { userSendOtp, userVerifyOtp, vendorSendOtp, vendorVerifyOtp };
