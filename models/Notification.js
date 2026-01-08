const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'userModel',
      required: true,
    },
    userModel: {
      type: String,
      enum: ['Patient', 'Doctor', 'Admin'],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['info', 'warning', 'success', 'error', 'appointment', 'payment', 'system'],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedEntityType: {
      type: String,
      enum: ['appointment', 'payment', 'doctor', 'patient', 'system'],
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// Index for efficient queries: find unread notifications for a user
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
