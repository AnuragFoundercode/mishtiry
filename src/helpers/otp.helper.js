const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

let twilioClient = null;
const getClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID?.startsWith('AC')) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const generateOTP = () => {
  const length = parseInt(process.env.OTP_LENGTH) || 6;
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
};

const sendSmsOtp = async (phone, otp) => {
  const client = getClient();
  if (!client) { console.warn('Twilio not configured, OTP:', otp); return; }
  await client.messages.create({
    body: `Your Mistry OTP is: ${otp}. Valid for ${process.env.OTP_EXPIRES_IN / 60} minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

const sendEmailOtp = async (email, otp) => {
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: 'Mistry - OTP Verification',
    html: `<p>Your OTP is: <strong>${otp}</strong>. Valid for ${process.env.OTP_EXPIRES_IN / 60} minutes.</p>`,
  });
};

module.exports = { generateOTP, sendSmsOtp, sendEmailOtp };
