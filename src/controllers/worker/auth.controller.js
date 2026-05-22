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

// POST /api/worker/auth/send-otp  Body: { phone }
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return error(res, 'Phone number required', 400);
    const worker = await Worker.findOne({ where: { phone } });
    if (!worker) return error(res, 'Worker not registered. Contact admin.', 404);
    if (worker.is_blocked) return error(res, 'Your account is blocked. Contact admin.', 403);
    await createAndSendOtp(phone);
    return success(res, {}, 'OTP sent successfully');
  } catch (err) {
    return error(res, err.message);
  }
};

// POST /api/worker/auth/verify-otp  Body: { phone, otp }
const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return error(res, 'Phone and OTP required', 400);
    const check = await verifyOtpRecord(phone, otp);
    if (!check.valid) return error(res, check.reason, 400);
    const worker = await Worker.findOne({ where: { phone } });
    if (!worker || worker.is_blocked) return error(res, 'Account blocked or not found', 403);
    const token = jwt.sign({ id: worker.id, role: 'worker' }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    return success(res, { token, worker: { id: worker.id, name: worker.name, phone: worker.phone, email: worker.email } }, 'Login successful');
  } catch (err) {
    return error(res, err.message);
  }
};

module.exports = { sendOtp, verifyOtp };
