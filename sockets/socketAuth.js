const { verifyAccessToken } = require('../utils/Tokens');

// Socket auth middleware: verifies JWT from handshake and attaches user info
const socketAuth = (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      // allow anonymous connections but don't attach user info
      return next();
    }

    const payload = verifyAccessToken(token);
    if (!payload) return next(new Error('Authentication error'));

    socket.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      status: payload.status
    };

    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
};

module.exports = socketAuth;
