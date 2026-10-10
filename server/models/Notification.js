const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'BOOKING',
        'READINESS',
        'REMINDER',
        'EVENT_UPDATE',
        'CANCELLATION',
        'CHECKIN',
        'SOS',
        'COMPLETION',
        'SYSTEM',
        'ANNOUNCEMENT',
      ],
      default: 'SYSTEM',
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    relatedEntity: {
      type: String,
      enum: ['Adventure', 'Booking', 'SosIncident', 'Workout', 'User', 'Event', 'System', ''],
      default: '',
    },
    relatedEntityId: {
      type: String,
      default: '',
    },
    actionUrl: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Helpful index for fast unread queries per user
notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);
