const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { getIO } = require('../sockets');
const {
  broadcastNotification,
  sendNotificationToUser,
  sendNotificationToRole,
} = require('../sockets/notificationHandler');
const { protect, authorize } = require('../middleware/auth');

// All notification routes require authentication
router.use(protect);

// Get all notifications for logged-in user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get unread notifications count for user
router.get('/unread/count', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const count = await Notification.countDocuments({ userId, isRead: false });

    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Mark all notifications as read for user
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    res.json({
      success: true,
      updatedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete notification
router.delete('/:notificationId', async (req, res) => {
  try {
    const userId = req.user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Admin: Broadcast notification to all users
router.post('/admin/broadcast', authorize('admin'), async (req, res) => {
  try {
    const { message, type = 'info' } = req.body;
    const io = getIO();

    broadcastNotification(io, message, type);

    res.json({
      success: true,
      message: 'Notification sent to all users',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Send notification to specific user
router.post('/send', authorize('admin'), async (req, res) => {
  try {
    const { userId, userModel, message, type = 'info', relatedEntityType, relatedEntityId, actionUrl } = req.body;
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
    });

    // Send via socket
    const sent = sendNotificationToUser(io, userId, message, type);

    res.json({
      success: true,
      message: 'Notification sent',
      notification,
      socketSent: sent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Send notification to users by role (Patient or Doctor)
router.post('/send-to-role', authorize('admin'), async (req, res) => {
  try {
    const { role, message, type = 'info' } = req.body;
    const io = getIO();

    if (!['Patient', 'Doctor'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    sendNotificationToRole(io, role, message, type);

    res.json({
      success: true,
      message: `Notification sent to all ${role}s`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
