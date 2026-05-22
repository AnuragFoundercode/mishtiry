const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
const { formatDate } = require('./helpers/view.helper');
require('dotenv').config();

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
// app.use(morgan('dev')); // Commented out to reduce logs
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(process.env.UPLOAD_PATH || './src/uploads'));
app.use('/admin/public', express.static(path.join(__dirname, 'public/admin')));

// Session + Flash (for admin panel)
app.use(session({
  secret: process.env.SESSION_SECRET || 'mistry_admin_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 8 * 60 * 60 * 1000 }, // 8 hours
}));
app.use(flash());

// EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Global view helpers
app.locals.formatDate = formatDate;

// API Routes
app.use('/api/user', require('./routes/user'));
app.use('/api/vendor', require('./routes/vendor'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/worker', require('./routes/worker'));

// Admin Web Panel
app.use('/admin', require('./routes/admin/web'));
app.get('/admin', (req, res) => res.redirect('/admin/dashboard'));

// 404
app.use((req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ status: false, message: 'Route not found' });
  res.status(404).render('admin/error', { message: 'Page not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  if (req.path.startsWith('/api')) return res.status(500).json({ status: false, message: err.message });
  res.status(500).render('admin/error', { message: err.message });
});

module.exports = app;
