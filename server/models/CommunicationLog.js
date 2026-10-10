const mongoose = require('mongoose');

const communicationLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'SMS', 'WHATSAPP', 'IN_APP'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      default: '',
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
      index: true,
    },
    providerMessageId: {
      type: String,
      default: '',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    relatedAdventure: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Adventure',
      default: null,
    },
    relatedBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null,
    },
    relatedIncident: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    errorMessage: {
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

communicationLogSchema.index({ createdAt: -1, status: 1, channel: 1 });

module.exports =
  mongoose.models.CommunicationLog ||
  mongoose.model('CommunicationLog', communicationLogSchema);
