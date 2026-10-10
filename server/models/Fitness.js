const mongoose = require('mongoose');

const fitnessSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a workout title'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify category'],
      enum: ['HIIT', 'Strength', 'Yoga', 'Cardio', 'Calisthenics', 'Pilates'],
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Extreme'],
    },
    durationMinutes: {
      type: Number,
      required: true,
    },
    caloriesBurned: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    instructor: {
      name: String,
      title: String,
      avatar: String,
    },
    exercises: [
      {
        name: String,
        sets: Number,
        reps: String,
        restSeconds: Number,
      },
    ],
    rating: {
      type: Number,
      default: 4.8,
    },
    reviewCount: {
      type: Number,
      default: 24,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Fitness || mongoose.model('Fitness', fitnessSchema);
