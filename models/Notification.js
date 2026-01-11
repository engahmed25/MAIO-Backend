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
      enum: [
        'info',
        'warning',
        'success',
        'error',
        'appointment',
        'payment',
        'system',
        'appointment_booked',
        'appointment_created',
        'new_appointment',
        'appointment_rescheduled',
        'appointment_updated',
        'appointment_deleted',
        'appointment_cancelled',
        'new_message',
        'message',
        'document_upload',
        'file_uploaded',
        'medical_document',
        'prescription_upload',
        'prescription',
        'new_prescription'
      ],
      default: 'info',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Legacy fields (keep for backwards compatibility)
    relatedEntityType: {
      type: String,
      enum: ['appointment', 'payment', 'doctor', 'patient', 'system', 'document', 'prescription'],
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actionUrl: {
      type: String,
    },
    // New metadata field for rich notification data
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Index for efficient queries: find unread notifications for a user
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
