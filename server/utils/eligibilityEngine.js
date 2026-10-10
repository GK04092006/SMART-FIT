/**
 * Eligibility Engine
 * Pure utility — no DB calls.
 * Determines if a user's fitness profile meets an adventure's requirements.
 */

const DIFFICULTY_MIN_SCORE = {
  Easy: 20,
  Moderate: 40,
  Challenging: 60,
  Extreme: 80,
};

const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

/**
 * @param {Object} userProfile  - { fitnessScore, fitnessLevel, fitnessProfile }
 * @param {Object} adventure    - { difficulty, fitnessRequirement }
 * @returns {Object}            - { eligible, gap, message, weeksNeeded, trainingFocus[] }
 */
const checkEligibility = (userProfile, adventure) => {
  const userScore = userProfile?.fitnessScore || 0;
  const userLevel = userProfile?.fitnessLevel || 'Beginner';

  const minScore = adventure?.fitnessRequirement?.minScore
    || DIFFICULTY_MIN_SCORE[adventure?.difficulty]
    || 40;

  const minLevel = adventure?.fitnessRequirement?.minLevel
    || _difficultyToLevel(adventure?.difficulty)
    || 'Beginner';

  const scoreGap = Math.max(0, minScore - userScore);
  const levelGap = Math.max(0, LEVEL_ORDER.indexOf(minLevel) - LEVEL_ORDER.indexOf(userLevel));

  const eligible = userScore >= minScore && levelGap <= 0;

  // Estimate training weeks needed (roughly 5 score points per week with consistent training)
  const weeksNeeded = eligible ? 0 : Math.ceil(scoreGap / 5);

  // Training recommendations based on gaps
  const trainingFocus = [];
  if (!eligible) {
    if (scoreGap > 30) trainingFocus.push('Cardiovascular Endurance');
    if (scoreGap > 20) trainingFocus.push('Strength Training');
    if (levelGap > 1)  trainingFocus.push('Progressive Overload');
    trainingFocus.push('Consistency & Recovery');
  }

  let message;
  if (eligible) {
    message = `You are ready for this adventure! Your fitness score (${userScore}) meets the requirement.`;
  } else if (scoreGap <= 10) {
    message = `Almost there! You need ${scoreGap} more fitness points. ~${weeksNeeded} weeks of focused training.`;
  } else {
    message = `You need ${scoreGap} more fitness points. A ${weeksNeeded}-week training plan is recommended.`;
  }

  return { eligible, gap: scoreGap, levelGap, message, weeksNeeded, trainingFocus, userScore, minScore };
};

/**
 * Generate a structured training plan based on eligibility gap
 */
const generateTrainingPlan = (eligibilityResult, fitnessLevel = 'Beginner') => {
  const { weeksNeeded, trainingFocus, gap } = eligibilityResult;

  if (weeksNeeded === 0) {
    return { summary: 'Maintain current fitness — you are event-ready!', weeks: [] };
  }

  const weeks = [];
  const phases = Math.ceil(weeksNeeded / 2);

  for (let i = 0; i < Math.min(phases, 6); i++) {
    weeks.push({
      weekRange: `Week ${i * 2 + 1}–${i * 2 + 2}`,
      phase: i === 0 ? 'Foundation' : i < phases - 1 ? 'Build' : 'Peak',
      focus: trainingFocus[i % trainingFocus.length] || 'General Fitness',
      sessions: [
        { day: 'Mon', workout: i === 0 ? '30-min Zone 2 Cardio' : '45-min Interval Run', intensity: 'Moderate' },
        { day: 'Wed', workout: 'Strength Circuit (Push-Pull-Legs)', intensity: i < 2 ? 'Moderate' : 'High' },
        { day: 'Fri', workout: '40-min Trail Walk / Hike Simulation', intensity: 'Moderate' },
        { day: 'Sun', workout: 'Long Endurance Run + Yoga Recovery', intensity: 'Low–Moderate' },
      ],
      targetScoreIncrease: Math.round(gap / phases),
    });
  }

  return {
    summary: `${weeksNeeded}-week preparation plan to close your fitness gap`,
    weeks,
  };
};

const _difficultyToLevel = (difficulty) => {
  const map = { Easy: 'Beginner', Moderate: 'Intermediate', Challenging: 'Advanced', Extreme: 'Elite' };
  return map[difficulty] || 'Beginner';
};

module.exports = { checkEligibility, generateTrainingPlan };
