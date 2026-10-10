const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    itemType: {
      type: String,
      enum: ['Fitness', 'Adventure'],
      required: true,
    },
    itemRef: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      refPath: 'itemType',
    },
    itemDetails: {
      title: String,
      category: String,
      imageUrl: String,
      location: String,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    participants: {
      type: Number,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'],
      default: 'Confirmed',
    },
    notes: {
      type: String,
      default: '',
    },
    ticketCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    qrData: {
      type: String,
      default: '',
    },
    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    team: {
      type: String,
      default: 'Team Unassigned',
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.pre('save', async function (next) {
  if (!this.ticketCode) {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.ticketCode = `TKT-${randomHex}`;
    this.qrData = JSON.stringify({
      ticketCode: this.ticketCode,
      bookingId: this._id,
      item: this.itemDetails?.title || 'Adventure',
      user: this.user,
    });
  }
  next();
});

module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
