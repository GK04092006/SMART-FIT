const express = require('express');
const router = express.Router();
const { protect, trainerOnly } = require('../middleware/authMiddleware');
const User = require('../models/User');
const FitnessAssessment = require('../models/FitnessAssessment');

// ── Training Plans (static for now, can be moved to DB later) ──
const TRAINING_PLANS = [
  {
    id: 'tp1',
    title: 'Pre-Expedition Fitness Prep',
    level: 'Intermediate',
    durationWeeks: 8,
    targetRole: 'participant',
    description: 'A structured 8-week programme to prepare participants for high-altitude treks and adventure expeditions.',
    phases: [
      { week: '1-2', focus: 'Base Cardio & Mobility', sessions: 4 },
      { week: '3-4', focus: 'Strength Foundation',    sessions: 5 },
      { week: '5-6', focus: 'Altitude Simulation',    sessions: 5 },
      { week: '7-8', focus: 'Peak Performance Taper', sessions: 3 },
    ],
  },
  {
    id: 'tp2',
    title: 'HIIT & Endurance Booster',
    level: 'Advanced',
    durationWeeks: 6,
    targetRole: 'participant',
    description: '6-week intensive programme combining high-intensity intervals with long-distance endurance runs.',
    phases: [
      { week: '1-2', focus: 'VO2 Max Intervals',       sessions: 5 },
      { week: '3-4', focus: 'Threshold Endurance',     sessions: 5 },
      { week: '5-6', focus: 'Race-Pace Consolidation', sessions: 4 },
    ],
  },
  {
    id: 'tp3',
    title: 'Beginner Foundation Plan',
    level: 'Beginner',
    durationWeeks: 4,
    targetRole: 'participant',
    description: 'Gentle 4-week introduction to structured exercise for new participants.',
    phases: [
      { week: '1',   focus: 'Body Awareness & Posture', sessions: 3 },
      { week: '2',   focus: 'Light Cardio Intro',        sessions: 3 },
      { week: '3-4', focus: 'Building Consistency',      sessions: 4 },
    ],
  },
];

// @desc  Get all training plans (trainer/admin only)
// @route GET /api/trainer/plans
router.get('/plans', protect, trainerOnly, (req, res) => {
  res.json(TRAINING_PLANS);
});

// @desc  Get a single plan (trainer/admin only)
// @route GET /api/trainer/plans/:id
router.get('/plans/:id', protect, trainerOnly, (req, res) => {
  const plan = TRAINING_PLANS.find((p) => p.id === req.params.id);
  if (!plan) return res.status(404).json({ message: 'Plan not found' });
  res.json(plan);
});

// @desc  Get all fitness assessments (trainer/admin only)
// @route GET /api/trainer/assessments
router.get('/assessments', protect, trainerOnly, async (req, res) => {
  try {
    const assessments = await FitnessAssessment.find({})
      .populate('userId', 'name email fitnessLevel avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc  Get all participants with their fitness data (trainer/admin only)
// @route GET /api/trainer/participants
router.get('/participants', protect, trainerOnly, async (req, res) => {
  try {
    const participants = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(participants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
