const FitnessAssessment = require('../models/FitnessAssessment');
const User = require('../models/User');
const { getDBStatus } = require('../config/db');
// Note: WorkoutLog and Adventure imports removed — readiness logic lives in readinessController.js

// In-memory fallback store
let memoryAssessments = [];

// ── Score computation helper ──────────────────────────────────────────────────
const computeOverallScore = (cardio, strength, flexibility, endurance) => {
  return Math.round(cardio * 0.3 + strength * 0.3 + flexibility * 0.2 + endurance * 0.2);
};

const scoresToLevel = (score) => {
  if (score >= 80) return 'Elite';
  if (score >= 60) return 'Advanced';
  if (score >= 40) return 'Intermediate';
  return 'Beginner';
};

// @desc  Submit a fitness assessment
// @route POST /api/assessment
const submitAssessment = async (req, res) => {
  try {
    const {
      cardioScore, restingHR, vo2MaxEstimate,
      strengthScore, pushUps, squats, plankSeconds,
      flexibilityScore, sitAndReachCm, shoulderFlexibility,
      enduranceScore, runDistanceKm, recoveryRate,
      notes,
    } = req.body;

    const userId = req.user?._id || req.user?.id || 'demo';
    const overall = computeOverallScore(
      Number(cardioScore) || 0,
      Number(strengthScore) || 0,
      Number(flexibilityScore) || 0,
      Number(enduranceScore) || 0
    );
    const level = scoresToLevel(overall);

    const assessmentData = {
      userId,
      cardioScore: Number(cardioScore) || 0,
      restingHR: Number(restingHR) || null,
      vo2MaxEstimate: Number(vo2MaxEstimate) || null,
      strengthScore: Number(strengthScore) || 0,
      pushUps: Number(pushUps) || 0,
      squats: Number(squats) || 0,
      plankSeconds: Number(plankSeconds) || 0,
      flexibilityScore: Number(flexibilityScore) || 0,
      sitAndReachCm: Number(sitAndReachCm) || 0,
      shoulderFlexibility: shoulderFlexibility || 'Average',
      enduranceScore: Number(enduranceScore) || 0,
      runDistanceKm: Number(runDistanceKm) || 0,
      recoveryRate: recoveryRate || 'Moderate',
      overallFitnessScore: overall,
      fitnessLevel: level,
      notes: notes || '',
      assessedAt: new Date(),
    };

    if (getDBStatus()) {
      const assessment = await FitnessAssessment.create(assessmentData);
      // Update user's fitnessScore, level, XP and badges
      const userToUpdate = await User.findById(userId);
      if (userToUpdate) {
        userToUpdate.fitnessScore = overall;
        userToUpdate.fitnessLevel = level;
        userToUpdate.xp = (userToUpdate.xp || 0) + 150;
        userToUpdate.level = Math.max(1, Math.floor(userToUpdate.xp / 300) + 1);
        if (!userToUpdate.badges) userToUpdate.badges = [];
        if (!userToUpdate.badges.some(b => (b.id || b) === 'assessment')) {
          userToUpdate.badges.push({ id: 'assessment', name: 'Self-Aware', icon: '🎯', earnedAt: new Date() });
        }
        await userToUpdate.save();
      }
      return res.status(201).json(assessment);
    } else {
      const id = `asmt_${Date.now()}`;
      const assessment = { _id: id, id, ...assessmentData, createdAt: new Date() };
      // Remove previous assessments for this user and add new
      memoryAssessments = memoryAssessments.filter((a) => String(a.userId) !== String(userId));
      memoryAssessments.push(assessment);
      return res.status(201).json(assessment);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get my latest assessment
// @route GET /api/assessment/my
const getMyAssessment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || 'demo';

    if (getDBStatus()) {
      const assessment = await FitnessAssessment.findOne({ userId }).sort({ createdAt: -1 });
      return res.json(assessment || null);
    } else {
      const assessment = memoryAssessments
        .filter((a) => String(a.userId) === String(userId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
      return res.json(assessment);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all assessments (admin)
// @route GET /api/assessment/all
const getAllAssessments = async (req, res) => {
  try {
    if (getDBStatus()) {
      const assessments = await FitnessAssessment.find().sort({ createdAt: -1 }).limit(100);
      return res.json(assessments);
    } else {
      return res.json(memoryAssessments.slice(-100).reverse());
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOTE: calculateReadiness has been removed from this controller.
// The canonical readiness check lives in readinessController.js and is served
// at GET /api/readiness/:adventureId  (checks stamina, flexibility, saves fitnessScore,
// and returns training recommendations in addition to the basic checks).
// Routes in assessmentRoutes.js redirect the legacy path to that endpoint.

const addWorkoutLog = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const {
      workout,
      workoutName,
      category,
      difficulty,
      durationMinutes,
      caloriesBurned,
      completedAt,
    } = req.body;

    if (!workoutName || !category || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'workoutName, category and durationMinutes are required',
      });
    }

    const log = await WorkoutLog.create({
      user: userId,
      workout: workout || null,
      workoutName,
      category,
      difficulty,
      durationMinutes,
      caloriesBurned: caloriesBurned || 0,
      completedAt: completedAt || new Date(),
    });

    const user = await User.findById(userId);
    if (user) {
      user.totalWorkouts = (user.totalWorkouts || 0) + 1;
      user.xp = (user.xp || 0) + 50;
      user.level = Math.max(1, Math.floor(user.xp / 300) + 1);
      if (!user.badges) user.badges = [];
      if (!user.badges.some(b => (b.id || b) === 'first_workout')) {
        user.badges.push({ id: 'first_workout', name: 'First Step', icon: '🏃', earnedAt: new Date() });
      }
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Workout recorded successfully',
      data: log,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record workout',
      error: error.message,
    });
  }
};

const updateFitnessAssessment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { endurance, strength, flexibility, stamina } = req.body;

    const values = [endurance, strength, flexibility, stamina];

    if (values.some((value) => typeof value !== 'number' || value < 0 || value > 100)) {
      return res.status(400).json({
        success: false,
        message: 'All assessment values must be numbers between 0 and 100',
      });
    }

    const assessmentScore = Math.round((endurance + strength + flexibility + stamina) / 4);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          fitnessAssessment: {
            endurance,
            strength,
            flexibility,
            stamina,
            assessmentScore,
            assessedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    ).select('name fitnessLevel fitnessAssessment');

    return res.json({
      success: true,
      message: 'Fitness assessment saved',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save fitness assessment',
      error: error.message,
    });
  }
};

module.exports = {
  submitAssessment,
  getMyAssessment,
  getAllAssessments,
  addWorkoutLog,
  updateFitnessAssessment,
  // calculateReadiness intentionally removed — use readinessController.getAdventureReadiness
};
