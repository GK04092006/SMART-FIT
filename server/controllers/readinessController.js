const mongoose = require('mongoose');
const User = require('../models/User');
const Adventure = require('../models/Adventure');
const WorkoutLog = require('../models/WorkoutLog');
const FitnessAssessment = require('../models/FitnessAssessment');
const Booking = require('../models/Booking');
const notificationService = require('../services/notificationService');

const isValidObjectId = (id) =>
  Boolean(id && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id));

const findAdventureSafe = async (advId) => {
  if (!advId) return null;
  if (isValidObjectId(advId)) {
    const adv = await Adventure.findById(advId);
    if (adv) return adv;
  }
  return await Adventure.findOne({
    $or: [{ id: advId }, { title: new RegExp('^' + String(advId).replace(/[-_]/g, ' ') + '$', 'i') }],
  });
};

/**
 * Configurable Fitness Score Formula:
 * - Fitness assessment score: 35%
 * - Workout consistency (last 30 days): 30%
 * - Average workout duration: 15%
 * - Existing profile level: 20%
 */
const calculateFitnessScore = ({ user, workouts, assessment }) => {
  const levelScores = {
    Beginner: 40,
    Intermediate: 65,
    Advanced: 85,
    Elite: 95,
  };

  const profileScore = levelScores[user.fitnessLevel] || 60;

  // Workout consistency: 0 workouts -> 0, 1 -> 35, 3 -> 55, 5 -> 70, 8 -> 85, 12+ -> 100
  const count = workouts.length;
  let workoutScore = 0;
  if (count >= 12) workoutScore = 100;
  else if (count >= 8) workoutScore = 85;
  else if (count >= 5) workoutScore = 70;
  else if (count >= 3) workoutScore = 55;
  else if (count >= 1) workoutScore = 35;

  const avgDuration = count > 0
    ? workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) / count
    : 0;
  const durationScore = Math.min(100, (avgDuration / 60) * 100);

  const assessmentScore = assessment?.assessmentScore || 0;

  const composite = Math.round(
    assessmentScore * 0.35 +
    workoutScore * 0.30 +
    durationScore * 0.15 +
    profileScore * 0.20
  );

  return Math.min(100, Math.max(0, composite));
};

/**
 * Generate adventure-specific training recommendations based on weak areas & category
 */
const getRecommendedTraining = (weakAreas, adventureCategory) => {
  const recommendations = [];

  if (weakAreas.includes('Endurance')) {
    recommendations.push('Hill Walking (45 min, 3x/week)', 'Tempo Running (5 KM)', 'Stair Climbing intervals');
  }
  if (weakAreas.includes('Strength')) {
    recommendations.push('Bodyweight Squats & Lunges (4 sets of 15)', 'Weighted Pack Carries (8-12 kg)', 'Planks & Core Stability circuits');
  }
  if (weakAreas.includes('Stamina')) {
    recommendations.push('Long Zone-2 Hiking (2-3 hours)', 'Interval Cycling (30 min)', 'Breathwork & Pacing Drills');
  }
  if (weakAreas.includes('Flexibility')) {
    recommendations.push('Dynamic Hip & Hamstring Stretches (15 min daily)', 'Yoga for Hikers & Climbers', 'Ankle Mobility Drills');
  }
  if (weakAreas.includes('Overall Fitness')) {
    recommendations.push('Pre-Expedition Conditioning Circuit', 'Active Recovery Walks', 'Hydration & Nutrition Prep');
  }

  if (recommendations.length === 0) {
    recommendations.push('Maintain current training regime', 'Trek Simulation Walk with gear', 'Rest & Acclimatization Prep');
  }

  return [...new Set(recommendations)];
};

// @desc  Calculate participant readiness for a specific adventure
// @route GET /api/readiness/:adventureId
const getAdventureReadiness = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { adventureId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const adventure = await findAdventureSafe(adventureId);
    if (!adventure) {
      return res.status(404).json({ success: false, message: 'Adventure not found' });
    }

    // Workouts in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const workouts = await WorkoutLog.find({
      user: userId,
      completedAt: { $gte: thirtyDaysAgo },
    }).sort({ completedAt: -1 });

    const assessment = user.fitnessAssessment || {
      endurance: 0,
      strength: 0,
      stamina: 0,
      flexibility: 0,
      assessmentScore: 0,
    };

    // Calculate dynamic fitness score
    const computedFitnessScore = calculateFitnessScore({ user, workouts, assessment });

    // Update user's fitness score in DB if changed
    if (user.fitnessScore !== computedFitnessScore) {
      user.fitnessScore = computedFitnessScore;
      await user.save();
    }

    // Requirements
    const requiredFitnessScore = adventure.requiredFitnessScore ?? 60;
    const requiredEndurance    = adventure.requiredEndurance ?? 50;
    const requiredStrength     = adventure.requiredStrength ?? 50;
    const requiredStamina      = adventure.requiredStamina ?? 50;
    const requiredFlexibility  = adventure.requiredFlexibility ?? 50;
    const minimumAge           = adventure.minimumAge ?? 18;

    // Checks
    const participantAge = user.age || (user.fitnessProfile?.age ?? null);
    const ageEligible = participantAge !== null ? participantAge >= minimumAge : true;
    const fitnessEligible = computedFitnessScore >= requiredFitnessScore;
    const enduranceEligible = (assessment.endurance || 0) >= requiredEndurance;
    const strengthEligible = (assessment.strength || 0) >= requiredStrength;
    const staminaEligible = (assessment.stamina || 0) >= requiredStamina;
    const flexibilityEligible = (assessment.flexibility || 0) >= requiredFlexibility;

    const isReady = ageEligible && fitnessEligible && enduranceEligible && strengthEligible && staminaEligible && flexibilityEligible;

    const weakAreas = [];
    if (!fitnessEligible) weakAreas.push('Overall Fitness');
    if (!enduranceEligible) weakAreas.push('Endurance');
    if (!strengthEligible) weakAreas.push('Strength');
    if (!staminaEligible) weakAreas.push('Stamina');
    if (!flexibilityEligible) weakAreas.push('Flexibility');
    if (!ageEligible) weakAreas.push('Age Requirement');

    const readinessScore = Math.min(100, Math.round((computedFitnessScore / Math.max(requiredFitnessScore, 1)) * 100));
    const recommendedTraining = getRecommendedTraining(weakAreas, adventure.category);

    const readinessPayload = {
      success: true,
      participant: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: participantAge,
        fitnessLevel: user.fitnessLevel,
        fitnessScore: computedFitnessScore,
      },
      adventure: {
        id: adventure._id,
        title: adventure.title,
        category: adventure.category,
        difficulty: adventure.difficulty,
        location: adventure.location,
        distance: adventure.distance || `${adventure.route?.distanceKm || 0} KM`,
        durationDays: adventure.durationDays,
        price: adventure.price,
      },
      requirements: {
        requiredFitnessScore,
        requiredEndurance,
        requiredStrength,
        requiredStamina,
        requiredFlexibility,
        minimumAge,
      },
      fitnessProfile: {
        endurance: assessment.endurance || 0,
        strength: assessment.strength || 0,
        stamina: assessment.stamina || 0,
        flexibility: assessment.flexibility || 0,
        assessmentScore: assessment.assessmentScore || 0,
        assessedAt: assessment.assessedAt || null,
        fitnessLevel: user.fitnessLevel,
      },
      workoutStatistics: {
        last30DaysCount: workouts.length,
        totalDurationMinutes: workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0),
        totalCaloriesBurned: workouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
        avgDurationMinutes: workouts.length > 0 ? Math.round(workouts.reduce((s, w) => s + (w.durationMinutes || 0), 0) / workouts.length) : 0,
      },
      fitnessScore: computedFitnessScore,
      readinessScore,
      checks: {
        overallFitness: fitnessEligible,
        endurance: enduranceEligible,
        strength: strengthEligible,
        stamina: staminaEligible,
        flexibility: flexibilityEligible,
        age: ageEligible,
      },
      status: isReady ? 'READY' : 'NOT READY',
      isReady,
      weakAreas,
      recommendedTraining,
    };

    // If notification requested (e.g. from UI "Check Fitness Readiness" button)
    if (req.query.notify === 'true') {
      if (isReady) {
        notificationService.sendReadyStatusNotification({ user, adventure })
          .catch(err => console.error('[Ready Notif Error]', err.message));
      } else {
        notificationService.sendNotReadyStatusNotification({ user, adventure, weakAreas, recommendedTraining })
          .catch(err => console.error('[NotReady Notif Error]', err.message));
      }
    }

    return res.json(readinessPayload);
  } catch (error) {
    console.error('[Readiness Error]', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate adventure readiness',
      error: error.message,
    });
  }
};

// @desc  Submit or update fitness assessment for authenticated user
// @route POST /api/readiness/assessment
const recordAssessment = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { endurance, strength, flexibility, stamina } = req.body;

    const values = [endurance, strength, flexibility, stamina].map((v) => Number(v));
    if (values.some((v) => isNaN(v) || v < 0 || v > 100)) {
      return res.status(400).json({
        success: false,
        message: 'endurance, strength, flexibility, stamina must be numbers between 0 and 100',
      });
    }

    const [eNum, sNum, fNum, stNum] = values;
    const assessmentScore = Math.round((eNum + sNum + fNum + stNum) / 4);

    let fitnessLevel = 'Beginner';
    if (assessmentScore >= 80) fitnessLevel = 'Elite';
    else if (assessmentScore >= 65) fitnessLevel = 'Advanced';
    else if (assessmentScore >= 45) fitnessLevel = 'Intermediate';

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.fitnessAssessment = {
      endurance: eNum,
      strength: sNum,
      flexibility: fNum,
      stamina: stNum,
      assessmentScore,
      assessedAt: new Date(),
    };
    user.fitnessLevel = fitnessLevel;

    // Fetch workouts to recalculate composite score
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const workouts = await WorkoutLog.find({ user: userId, completedAt: { $gte: thirtyDaysAgo } });

    user.fitnessScore = calculateFitnessScore({
      user,
      workouts,
      assessment: user.fitnessAssessment,
    });

    await user.save();

    await FitnessAssessment.create({
      userId,
      enduranceScore: eNum,
      strengthScore: sNum,
      flexibilityScore: fNum,
      cardioScore: stNum,
      overallFitnessScore: assessmentScore,
      fitnessLevel,
      assessedAt: new Date(),
    });

    // Test 2 / Event: Send fitness assessment result notification
    notificationService.createInAppNotification({
      userId,
      title: 'Fitness Assessment Completed! 📊',
      message: `Assessment score: ${assessmentScore}/100 (${fitnessLevel} Athlete). Composite fitness score: ${user.fitnessScore}/100.`,
      type: 'READINESS',
      actionUrl: '/fitness/assessment',
    }).catch(err => console.error('[Assessment Notif Error]', err.message));

    return res.status(200).json({
      success: true,
      message: 'Fitness assessment recorded and fitness score recalculated successfully',
      assessment: user.fitnessAssessment,
      fitnessScore: user.fitnessScore,
      fitnessLevel: user.fitnessLevel,
    });
  } catch (error) {
    console.error('[Record Assessment Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to record assessment', error: error.message });
  }
};

// @desc  Log a completed workout for the authenticated user
// @route POST /api/readiness/workout
const recordWorkout = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { workoutName, category, difficulty, durationMinutes, caloriesBurned } = req.body;

    if (!workoutName || !category || !durationMinutes) {
      return res.status(400).json({
        success: false,
        message: 'workoutName, category, and durationMinutes are required',
      });
    }

    const workout = await WorkoutLog.create({
      user: userId,
      workoutName,
      category,
      difficulty: difficulty || 'Intermediate',
      durationMinutes: Number(durationMinutes),
      caloriesBurned: Number(caloriesBurned) || 0,
      completedAt: new Date(),
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const workouts = await WorkoutLog.find({ user: userId, completedAt: { $gte: thirtyDaysAgo } });
      user.fitnessScore = calculateFitnessScore({
        user,
        workouts,
        assessment: user.fitnessAssessment,
      });
      await user.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Workout recorded successfully',
      workout,
      updatedFitnessScore: user ? user.fitnessScore : null,
      totalWorkouts: user ? user.totalWorkouts : 1,
    });
  } catch (error) {
    console.error('[Record Workout Error]', error);
    return res.status(500).json({ success: false, message: 'Failed to record workout', error: error.message });
  }
};

// @desc  Get current user's fitness profile and workout history stats
// @route GET /api/readiness/my
const getMyReadinessOverview = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const recentWorkouts = await WorkoutLog.find({ user: userId })
      .sort({ completedAt: -1 })
      .limit(10);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysWorkouts = await WorkoutLog.find({ user: userId, completedAt: { $gte: thirtyDaysAgo } });

    const computedFitnessScore = calculateFitnessScore({
      user,
      workouts: thirtyDaysWorkouts,
      assessment: user.fitnessAssessment,
    });

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        fitnessLevel: user.fitnessLevel,
        fitnessScore: computedFitnessScore,
      },
      assessment: user.fitnessAssessment || {
        endurance: 0,
        strength: 0,
        stamina: 0,
        flexibility: 0,
        assessmentScore: 0,
      },
      workoutSummary: {
        totalLogged: user.totalWorkouts || recentWorkouts.length,
        last30Days: thirtyDaysWorkouts.length,
        totalMinutes: thirtyDaysWorkouts.reduce((s, w) => s + (w.durationMinutes || 0), 0),
        totalCalories: thirtyDaysWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0),
      },
      recentWorkouts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to load readiness overview', error: error.message });
  }
};

// @desc  Get readiness table for all participants registered for an adventure (Organizer/Admin/Guide)
// @route GET /api/readiness/adventure/:adventureId/participants
const getAdventureParticipantsReadiness = async (req, res) => {
  try {
    const { adventureId } = req.params;
    const adventure = await findAdventureSafe(adventureId);
    if (!adventure) return res.status(404).json({ success: false, message: 'Adventure not found' });

    const readAdvObjId = mongoose.Types.ObjectId.isValid(adventureId) ? new mongoose.Types.ObjectId(adventureId) : null;
    const readRefValues = [String(adventureId)];
    if (readAdvObjId) readRefValues.push(readAdvObjId);
    const bookings = await Booking.find({
      itemType: 'Adventure',
      itemRef: { $in: readRefValues },
      status: { $in: ['Confirmed', 'Pending'] },
    }).populate('user', 'name email age fitnessLevel fitnessAssessment fitnessScore phone avatar');

    const participantsTable = [];

    for (const b of bookings) {
      if (!b.user) continue;
      const u = b.user;
      const assessment = u.fitnessAssessment || { endurance: 0, strength: 0, stamina: 0, flexibility: 0, assessmentScore: 0 };
      const participantAge = u.age || 20;

      const requiredFitnessScore = adventure.requiredFitnessScore ?? 60;
      const requiredEndurance = adventure.requiredEndurance ?? 50;
      const requiredStrength = adventure.requiredStrength ?? 50;
      const minimumAge = adventure.minimumAge ?? 18;

      const isAgeReady = participantAge >= minimumAge;
      const isFitnessReady = (u.fitnessScore || 0) >= requiredFitnessScore;
      const isEnduranceReady = (assessment.endurance || 0) >= requiredEndurance;
      const isStrengthReady = (assessment.strength || 0) >= requiredStrength;

      const isReady = isAgeReady && isFitnessReady && isEnduranceReady && isStrengthReady;

      participantsTable.push({
        bookingId: b._id,
        ticketCode: b.ticketCode,
        checkedIn: b.checkedIn || false,
        team: b.team || 'Team Unassigned',
        participant: {
          id: u._id,
          name: u.name,
          email: u.email,
          phone: u.phone,
          avatar: u.avatar,
        },
        fitnessScore: u.fitnessScore || 0,
        endurance: assessment.endurance || 0,
        strength: assessment.strength || 0,
        stamina: assessment.stamina || 0,
        flexibility: assessment.flexibility || 0,
        age: participantAge,
        status: isReady ? 'READY' : 'NOT READY',
        isReady,
      });
    }

    return res.json({
      success: true,
      adventure: {
        id: adventure._id,
        title: adventure.title,
        requirements: {
          requiredFitnessScore: adventure.requiredFitnessScore,
          requiredEndurance: adventure.requiredEndurance,
          requiredStrength: adventure.requiredStrength,
          minimumAge: adventure.minimumAge,
        },
      },
      totalRegistered: participantsTable.length,
      readyCount: participantsTable.filter((p) => p.isReady).length,
      notReadyCount: participantsTable.filter((p) => !p.isReady).length,
      participants: participantsTable,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch participant readiness', error: error.message });
  }
};

module.exports = {
  getAdventureReadiness,
  recordAssessment,
  recordWorkout,
  getMyReadinessOverview,
  getAdventureParticipantsReadiness,
};
