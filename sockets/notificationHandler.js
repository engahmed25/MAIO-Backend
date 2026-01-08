// Role-aware notification handler
const connectedUsers = new Map(); // userId -> { socketId, role }

const notificationHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // If middleware attached user info, auto-register
    if (socket.user && socket.user.id) {
      connectedUsers.set(socket.user.id, { socketId: socket.id, role: socket.user.role });
      console.log(`Auto-registered user ${socket.user.id} with role ${socket.user.role}`);
      socket.emit('notification', {
        message: 'Welcome to Medicare!',
        type: 'info',
        timestamp: new Date().toISOString()
      });
    }

    // Fallback register event (keeps backwards compatibility)
    socket.on('register', (payload) => {
      const userId = payload?.userId || payload;
      const role = payload?.role || (socket.user && socket.user.role) || 'user';
      if (userId) {
        connectedUsers.set(userId, { socketId: socket.id, role });
        console.log(`User ${userId} registered with socket ${socket.id} and role ${role}`);
        socket.emit('notification', {
          message: 'Welcome to Medicare!',
          type: 'info',
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('mark_notification_read', (data) => {
      console.log('Notification marked as read:', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      for (let [userId, info] of connectedUsers.entries()) {
        if (info.socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} removed from connected users`);
          break;
        }
      }
    });
  });
};

// Send notification to all users
const broadcastNotification = (io, message, type = 'info') => {
  io.emit('notification', {
    message,
    type,
    timestamp: new Date().toISOString()
  });
};

// Send notification to specific user
const sendNotificationToUser = (io, userId, message, type = 'info') => {
  const info = connectedUsers.get(userId);
  if (info && info.socketId) {
    io.to(info.socketId).emit('notification', {
      message,
      type,
      timestamp: new Date().toISOString()
    });
    return true;
  }
  return false;
};

// Send notification to multiple users
const sendNotificationToUsers = (io, userIds, message, type = 'info') => {
  userIds.forEach(userId => {
    sendNotificationToUser(io, userId, message, type);
  });
};

// Send notification to all connected users with a specific role
const sendNotificationToRole = (io, role, message, type = 'info') => {
  for (let [userId, info] of connectedUsers.entries()) {
    if (info.role === role) {
      io.to(info.socketId).emit('notification', {
        message,
        type,
        timestamp: new Date().toISOString()
      });
    }
  }
};

// Get all connected users
const getConnectedUsers = () => {
  return Array.from(connectedUsers.entries()).map(([userId, info]) => ({ userId, role: info.role }));
};

// Check if user is online
const isUserOnline = (userId) => {
  return connectedUsers.has(userId);
};

module.exports = {
  notificationHandler,
  broadcastNotification,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  getConnectedUsers,
  isUserOnline,
  connectedUsers
};
