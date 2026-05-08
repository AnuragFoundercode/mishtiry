const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
require('dotenv').config();

let firebaseInitialized = false;
const getFirebase = () => {
  if (!firebaseInitialized && process.env.FIREBASE_PROJECT_ID) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
      firebaseInitialized = true;
    } catch (e) {
      console.warn('Firebase init skipped:', e.message);
    }
  }
  return firebaseInitialized ? admin : null;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  const fb = getFirebase();
  if (!fcmToken || !fb) return;
  await fb.messaging().send({ token: fcmToken, notification: { title, body }, data });
};

const sendEmailNotification = async (to, subject, html) => {
  await transporter.sendMail({ from: process.env.SMTP_USER, to, subject, html });
};

const sendBookingNotification = async (fcmToken, status, bookingId) => {
  const messages = {
    accepted: 'Your booking has been accepted!',
    rejected: 'Your booking was rejected.',
    in_progress: 'Your service is now in progress.',
    completed: 'Your service has been completed.',
    cancelled: 'Your booking has been cancelled.',
  };
  await sendPushNotification(fcmToken, 'Booking Update', messages[status] || 'Booking status updated', { bookingId: String(bookingId) });
};

module.exports = { sendPushNotification, sendEmailNotification, sendBookingNotification };
