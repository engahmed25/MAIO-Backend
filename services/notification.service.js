const Notification = require('../models/Notification');
const { getIO } = require('../sockets');
const {
  broadcastNotification,
  sendNotificationToUser,
  sendNotificationToUsers,
  sendNotificationToRole,
  getConnectedUsers,
  isUserOnline
} = require('../sockets/notificationHandler');

const notifyAll = async (message, type = 'info') => {
  try {
    const io = getIO();
    broadcastNotification(io, message, type);
  } catch (error) {
    console.error('Error in notifyAll:', error.message);
  }
};

const notifyUser = async (userId, userModel, message, type = 'info', relatedEntityType = null, relatedEntityId = null, actionUrl = null, metadata = {}) => {
  try {
    const io = getIO();

    // Save to database
    const notification = await Notification.create({
      userId,
      userModel,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
      metadata, // Add metadata support
    });

    // Send via socket with metadata
    sendNotificationToUser(io, userId, message, type);

    return notification;
  } catch (error) {
    console.error('Error in notifyUser:', error.message);
    throw error;
  }
};

const notifyUsers = async (userIds, userModel, message, type = 'info', relatedEntityType = null, relatedEntityId = null, metadata = {}) => {
  try {
    const io = getIO();

    // Save to database for each user
    const notifications = await Notification.insertMany(
      userIds.map(userId => ({
        userId,
        userModel,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
        metadata, // Add metadata for each notification
      }))
    );

    // Send via socket
    sendNotificationToUsers(io, userIds, message, type);

    return notifications;
  } catch (error) {
    console.error('Error in notifyUsers:', error.message);
    throw error;
  }
};

const notifyRole = async (role, message, type = 'info') => {
  try {
    const io = getIO();
    return sendNotificationToRole(io, role, message, type);
  } catch (error) {
    console.error('Error in notifyRole:', error.message);
    throw error;
  }
};

module.exports = {
  notifyAll,
  notifyUser,
  notifyUsers,
  notifyRole,
  getConnectedUsers,
  isUserOnline
};
