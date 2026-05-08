const jwt = require('jsonwebtoken');
require('dotenv').config();

// Store connected users: { userId: socketId }
const connectedUsers = new Map();

const initSocket = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} connected`);

    // Join personal room
    socket.join(`user_${userId}`);

    // Chat: send message
    socket.on('send_message', async (data) => {
      const { receiverId, message, bookingId } = data;
      const payload = {
        senderId: userId,
        senderRole: socket.user.role,
        message,
        bookingId,
        timestamp: new Date(),
      };
      // Emit to receiver
      io.to(`user_${receiverId}`).emit('receive_message', payload);
      // Emit back to sender
      socket.emit('message_sent', payload);
    });

    // Booking status update (vendor/admin emits, user receives)
    socket.on('booking_status_update', (data) => {
      const { userId: targetUserId, status, bookingId } = data;
      io.to(`user_${targetUserId}`).emit('booking_updated', { status, bookingId });
    });

    socket.on('disconnect', () => {
      connectedUsers.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });
};

// Send notification to specific user via socket
const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser, connectedUsers };
