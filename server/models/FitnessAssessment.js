const mongoose = require('mongoose');

const fitnessAssessmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.Mixed, // supports both ObjectId and mock string IDs
      required: true,
      index: true,
    },
    // ── CARDIO ─────────────────────────────────────────────────
    cardioScore: { type: Number, default: 0, min: 0, max: 100 },
    restingHR: { type: Number, default: null },
    vo2MaxEstimate: { type: Number, default: null },
    cardioTest: { type: String, default: '' }, // e.g. "3-min step test"

    // ── STRENGTH ───────────────────────────────────────────────
    strengthScore: { type: Number, default: 0, min: 0, max: 100 },
    pushUps: { type: Number, default: 0 },
    squats: { type: Number, default: 0 },
    plankSeconds: { type: Number, default: 0 },

    // ── FLEXIBILITY ────────────────────────────────────────────
    flexibilityScore: { type: Number, default: 0, min: 0, max: 100 },
    sitAndReachCm: { type: Number, default: 0 },
    shoulderFlexibility: { type: String, enum: ['Poor', 'Average', 'Good', 'Excellent'], default: 'Average' },

    // ── ENDURANCE ──────────────────────────────────────────────
    enduranceScore: { type: Number, default: 0, min: 0, max: 100 },
    runDistanceKm: { type: Number, default: 0 },  // how far they can run in 12 mins
    recoveryRate: { type: String, enum: ['Slow', 'Moderate', 'Fast', 'Elite'], default: 'Moderate' },

    // ── COMPOSITE ──────────────────────────────────────────────
    overallFitnessScore: { type: Number, default: 0, min: 0, max: 100 },
    fitnessLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
      default: 'Beginner',
    },

    // ── META ───────────────────────────────────────────────────
    notes: { type: String, default: '' },
    assessedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FitnessAssessment ||
  mongoose.model('FitnessAssessment', fitnessAssessmentSchema);
