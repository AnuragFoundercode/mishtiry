const admin = require('firebase-admin');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

let firebaseInitialized = false;
const getFirebase = () => {
  if (!firebaseInitialized) {
    try {
      const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        || path.join(__dirname, '../../firebase-service-account.json');

      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
        console.log('Firebase initialized from service account file');
      } else if (process.env.FIREBASE_PROJECT_ID) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          }),
        });
        firebaseInitialized = true;
        console.log('Firebase initialized from env variables');
      } else {
        console.warn('Firebase: No credentials found. Push notifications disabled.');
      }
    } catch (e) {
      console.warn('Firebase init failed:', e.message);
    }
  }
  return firebaseInitialized ? admin : null;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

/**
 * Send push notification (data-only, no notification block)
 * This ensures onMessageReceived is called in background on Android
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  console.log('--- Push Notification ---');
  console.log('Token:', fcmToken ? fcmToken.substring(0, 20) + '...' : 'NULL');
  console.log('Title:', title);
  console.log('Body:', body);

  const fb = getFirebase();
  if (!fcmToken) { console.log('SKIP: No FCM token'); return; }
  if (!fb) { console.log('SKIP: Firebase not initialized'); return; }

  try {
    // All values must be strings in FCM data
    const stringData = {};
    for (const [key, value] of Object.entries(data)) {
      stringData[key] = String(value ?? '');
    }
    // Include title & body in data so app can show local notification
    stringData['title'] = title;
    stringData['body'] = body;

    const message = {
      token: fcmToken,
      data: stringData,
      android: {
        priority: 'high',
      },
    };

    const result = await fb.messaging().send(message);
    console.log('SUCCESS: Message sent, ID:', result);
  } catch (e) {
    console.error('FAILED:', e.message);
  }
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
  await sendPushNotification(
    fcmToken,
    'Booking Update',
    messages[status] || 'Booking status updated',
    { type: 'booking', bookingId: String(bookingId), status: String(status) }
  );
};

/**
 * Send new booking alert to partner/worker
 * Triggers overlay in Flutter app
 */
const sendIncomingBookingToPartner = async (fcmToken, bookingData) => {
  const {
    bookingId, serviceName, servicePrice, totalAmount, address,
    taskDescription, distance,
  } = bookingData;

  await sendPushNotification(
    fcmToken,
    'New Booking Nearby!',
    `${serviceName} - ₹${servicePrice}`,
    {
      type: 'new_booking',
      booking_id: String(bookingId),
      service_name: String(serviceName ?? ''),
      service_price: String(servicePrice ?? '0'),
      total_amount: String(totalAmount ?? '0'),
      address: String(address ?? ''),
      pickup_address: String(address ?? ''),
      task_description: String(taskDescription ?? 'No description'),
      distance: String(distance ?? '0 km'),
      show_overlay: 'true',
    }
  );
};

module.exports = {
  sendPushNotification,
  sendEmailNotification,
  sendBookingNotification,
  sendIncomingBookingToPartner,
};
