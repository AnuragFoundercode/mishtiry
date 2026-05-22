require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const sequelize = require('./src/config/database');
const { initSocket } = require('./src/sockets/socket.handler');

// Load all model associations
require('./src/models/index');

// Inject io into controllers
const userBookingCtrl = require('./src/controllers/user/booking.controller');
const vendorCtrl = require('./src/controllers/vendor/vendor.controller');
const workerBookingCtrl = require('./src/controllers/worker/booking.controller');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

initSocket(io);
userBookingCtrl.setIo(io);
vendorCtrl.setIo(io);
workerBookingCtrl.setIo(io);

const PORT = process.env.PORT || 3300;

sequelize.authenticate()
  .then(() => {
//     console.log('Database connected');
//     return sequelize.sync({ alter: false }); // use migrations in production
//   })
//   .then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err.message);
    process.exit(1);
  });
