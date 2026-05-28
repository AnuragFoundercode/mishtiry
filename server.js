require('dotenv').config();

const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');

const app = require('./src/app');
const sequelize = require('./src/config/database');
const { initSocket } = require('./src/sockets/socket.handler');

// Load all model associations
require('./src/models/index');

// Controllers
const userBookingCtrl = require('./src/controllers/user/booking.controller');
const vendorCtrl = require('./src/controllers/vendor/vendor.controller');
const workerBookingCtrl = require('./src/controllers/worker/booking.controller');

/*
|--------------------------------------------------------------------------
| CORS Middleware
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/*
|--------------------------------------------------------------------------
| Static Uploads Fix
|--------------------------------------------------------------------------
*/

app.use(
  '/uploads',
  require('express').static(path.join(__dirname, 'uploads'), {
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  })
);

/*
|--------------------------------------------------------------------------
| Create Server
|--------------------------------------------------------------------------
*/

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Socket.IO
|--------------------------------------------------------------------------
*/

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
});

initSocket(io);

/*
|--------------------------------------------------------------------------
| Inject io into controllers
|--------------------------------------------------------------------------
*/

userBookingCtrl.setIo(io);
vendorCtrl.setIo(io);
workerBookingCtrl.setIo(io);

/*
|--------------------------------------------------------------------------
| PORT
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3300;

/*
|--------------------------------------------------------------------------
| DB Connection + Start Server
|--------------------------------------------------------------------------
*/

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connected');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });