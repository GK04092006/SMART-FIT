const mongoose = require('mongoose');

const bmiSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: 'Student',
    },
    weightKg: {
      type: Number,
      required: true,
    },
    heightCm: {
      type: Number,
      required: true,
    },
    bmi: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Underweight', 'Normal', 'Overweight', 'Obese'],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BMI', bmiSchema);
