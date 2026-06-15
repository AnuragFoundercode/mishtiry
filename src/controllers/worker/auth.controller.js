const jwt = require('jsonwebtoken');
const Worker = require('../../models/worker.model');
const Otp = require('../../models/otp.model');
const { sendSmsOtp } = require('../../helpers/otp.helper');
const { success, error } = require('../../helpers/response.helper');

const createAndSendOtp = async (mobile) => {
  const expires_at = new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || 300) * 1000);
  await Otp.destroy({ where: { mobile } });
  const otpResponse = await sendSmsOtp(mobile);
  await Otp.create({ mobile, otp: otpResponse.otp, expires_at });
};

const verifyOtpRecord = async (mobile, otp) => {
  const record = await Otp.findOne({ where: { mobile, otp, is_used: false } });
  if (!record) return { valid: false, reason: 'Invalid OTP' };
  if (new Date() > record.expires_at) return { valid: false, reason: 'OTP expired' };
  await record.update({ is_used: true });
  return { valid: true };
};

/**
 * POST /api/worker/auth/send-otp
 * Body: { phone }
 * If worker doesn't exist, auto-creates with status 'pending'
 */
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'Phone number required', 400);

    let worker = await Worker.findOne({ where: { phone } });
    let isNew = false;

    // Auto-register if not exists
    if (!worker) {
      worker = await Worker.create({
        name: 'Worker',
        phone,
        status: 'pending',
        is_active: true,
      });
      isNew = true;
    }

    if (worker.is_blocked) return error(res, 'Your account is blocked. Contact admin.', 403);

    await createAndSendOtp(phone);
    return success(res, {
      is_new: isNew,
      status: worker.status,
      is_blocked: worker.is_blocked,
      is_active: worker.is_active,
    }, 'OTP sent successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

/**
 * POST /api/worker/auth/verify-otp
 * Body: { phone, otp, fcm_token }
 * Returns token + worker profile
 */
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp, fcm_token } = req.body;
    if (!phone || !otp) return error(res, 'Phone and OTP required', 400);

    const check = await verifyOtpRecord(phone, otp);
    if (!check.valid) return error(res, check.reason, 400);

    const worker = await Worker.findOne({ where: { phone } });
    if (!worker) return error(res, 'Worker not found', 404);
    if (worker.is_blocked) return error(res, 'Your account is blocked. Contact admin.', 403);

    // Update FCM token if provided
    if (fcm_token) await worker.update({ fcm_token });

    const token = jwt.sign(
      { id: worker.id, role: 'worker' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // is_new = true only if worker was just created (within last 5 minutes during send-otp)
    const createdAt = new Date(worker.createdAt || worker.created_at);
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const isNew = createdAt > fiveMinAgo && worker.name === 'Worker';

    return success(res, {
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        profile_image: worker.profile_image,
        status: worker.status,
        is_new: isNew,
      },
    }, 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { sendOtp, verifyOtp };
