const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Fitness',
      default: null,
    },

    workoutName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },

    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
    },

    caloriesBurned: {
      type: Number,
      default: 0,
      min: 0,
    },

    completedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.WorkoutLog || mongoose.model('WorkoutLog', workoutLogSchema);
