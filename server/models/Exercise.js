const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add an exercise name'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['HIIT', 'Strength', 'Yoga', 'Cardio', 'Calisthenics', 'Pilates'],
    },
    muscleGroup: {
      type: String,
      required: [true, 'Please specify a muscle group'],
      trim: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Extreme'],
    },
    equipment: {
      type: String,
      default: 'None',
      trim: true,
    },
    instructions: {
      type: String,
      required: [true, 'Please add exercise instructions'],
      trim: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    durationMinutes: {
      type: Number,
      min: 1,
      required: [true, 'Please specify the duration'],
    },
    caloriesBurned: {
      type: Number,
      min: 0,
      required: [true, 'Please specify estimated calories burned'],
    },
    tags: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Exercise || mongoose.model('Exercise', exerciseSchema);
