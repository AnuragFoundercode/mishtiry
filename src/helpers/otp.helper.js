const axios = require('axios');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const generateOTP = () => {
  const length = parseInt(process.env.OTP_LENGTH) || 6;
  return Math.floor(Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)).toString();
};

const sendSmsOtp = async (phone) => {
  try {
    const url = `${process.env.INDOPAY_BASE_URL}/newsend_otp.php`;
    const params = {
      merchant_key: process.env.INDOPAY_MERCHANT_KEY,
      mobile_no: phone.replace(/^\+91/, ''),
      digit: process.env.OTP_LENGTH || 6
    };
    
    const response = await axios.get(url, { params });
    
    if (response.data.status === 'success') {
      console.log('OTP sent successfully via IndoPay');
      return response.data; // Returns { status, msg, otp, remaining, mode }
    } else {
      throw new Error(response.data.msg || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('IndoPay OTP Error:', error.message);
    throw error;
  }
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