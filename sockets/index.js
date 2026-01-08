const { Server } = require('socket.io');
const socketAuth = require('./socketAuth');
const { notificationHandler } = require('./notificationHandler');

let io;

/**
 * Initialize Socket.IO or bind an existing instance so it can be reused across the app.
 * If an http server is provided, a new Socket.IO server is created with sane defaults.
 * If an existing Socket.IO instance is provided, only the notification handler is attached
 * and the instance is stored for getIO().
 */
const initializeSocket = (serverOrIO, options = {}) => {
  const usingExistingInstance = serverOrIO instanceof Server;

  if (usingExistingInstance) {
    io = serverOrIO;
  } else {
    io = new Server(serverOrIO, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      },
      ...options
    });

    // Attach lightweight auth when we create the instance ourselves
    io.use((socket, next) => socketAuth(socket, next));
  }

  // Avoid registering handlers multiple times if initializeSocket is called again
  if (!io._notificationHandlerAttached) {
    notificationHandler(io);
    io._notificationHandlerAttached = true;
  }

  console.log('Socket.IO initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
