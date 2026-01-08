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

const notifyUser = async (userId, userModel, message, type = 'info', relatedEntityType = null, relatedEntityId = null, actionUrl = null) => {
  try {
    const io = getIO();
    
    // Save to database
    await Notification.create({
      userId,
      userModel,
      message,
      type,
      relatedEntityType,
      relatedEntityId,
      actionUrl,
    });
    
    // Send via socket
    return sendNotificationToUser(io, userId, message, type);
  } catch (error) {
    console.error('Error in notifyUser:', error.message);
    throw error;
  }
};

const notifyUsers = async (userIds, userModel, message, type = 'info', relatedEntityType = null, relatedEntityId = null) => {
  try {
    const io = getIO();
    
    // Save to database for each user
    await Notification.insertMany(
      userIds.map(userId => ({
        userId,
        userModel,
        message,
        type,
        relatedEntityType,
        relatedEntityId,
      }))
    );
    
    // Send via socket
    return sendNotificationToUsers(io, userIds, message, type);
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
