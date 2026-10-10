const Adventure = require('../models/Adventure');
const { getDBStatus } = require('../config/db');
const { initialAdventures } = require('../utils/helper');

const DIFFICULTY_RANK = {
  Easy: 1,
  Moderate: 2,
  Challenging: 3,
  Extreme: 4,
};

const LEVEL_RANK = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
  Elite: 4,
};

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

const getAdventurePool = async () => {
  if (getDBStatus()) {
    return await Adventure.find({ status: { $ne: 'Cancelled' } }).lean();
  }
  return [...initialAdventures];
};

const parseQueryFilters = (query = '') => {
  const q = normalize(query);
  const filters = {
    difficulty: null,
    category: null,
    weekendOnly: q.includes('weekend'),
    beginnerOnly: q.includes('beginner'),
  };

  if (q.includes('trek') || q.includes('hike')) filters.category = 'Trekking';
  if (q.includes('kayak') || q.includes('raft')) filters.category = 'Kayaking';
  if (q.includes('climb') || q.includes('mountain')) filters.category = 'Rock Climbing';
  if (q.includes('run') || q.includes('trail')) filters.category = 'Trail Running';
  if (q.includes('sky') || q.includes('paraglide') || q.includes('jump')) filters.category = 'Skydiving';

  if (q.includes('easy')) filters.difficulty = 'Easy';
  if (q.includes('moderate')) filters.difficulty = 'Moderate';
  if (q.includes('challenging')) filters.difficulty = 'Challenging';
  if (q.includes('extreme')) filters.difficulty = 'Extreme';
  if (q.includes('advanced')) filters.difficulty = 'Challenging';
  if (q.includes('beginner')) filters.difficulty = 'Easy';

  return filters;
};

const calculateReadiness = (userProfile = {}, adventure = {}) => {
  const userScore = Number(userProfile.fitnessScore) || 72;
  const userLevel = userProfile.fitnessLevel || 'Intermediate';
  const userRank = LEVEL_RANK[userLevel] || 2;
  const adventureDifficulty = adventure.difficulty || 'Moderate';
  const adventureRank = DIFFICULTY_RANK[adventureDifficulty] || 2;

  let readiness = userScore * 0.56;
  readiness += userRank * 10;
  readiness += Math.max(0, 12 - (adventureRank - userRank) * 8);

  if (userProfile.preferredDifficulty === adventureDifficulty) readiness += 8;
  if ((userProfile.favoriteCategories || []).includes(adventure.category)) readiness += 10;
  if ((userProfile.interests || []).some((interest) =>
    normalize(interest) === normalize(adventure.category) || normalize(interest) === normalize(adventure.location)
  )) readiness += 8;

  return Math.max(0, Math.min(100, Math.round(readiness)));
};

const isAdventureWithinUserFit = (userProfile = {}, adventure = {}) => {
  const userScore = Number(userProfile.fitnessScore) || 72;
  const minScore = Number(adventure.fitnessRequirement?.minScore) || 0;
  const userLevel = LEVEL_RANK[userProfile.fitnessLevel || 'Intermediate'];
  const minLevel = LEVEL_RANK[adventure.fitnessRequirement?.minLevel || 'Intermediate'];

  if (userScore >= minScore && userLevel >= minLevel) return true;
  return userScore >= minScore || userLevel >= minLevel;
};

const generateTrainingPlan = (adventure = {}, userProfile = {}) => {
  const difficulty = adventure.difficulty || 'Moderate';
  const userScore = Number(userProfile.fitnessScore) || 72;

  if (difficulty === 'Extreme') {
    return [
      '3 interval sessions per week at high intensity',
      '2 strength days focused on legs, core, and grip',
      '1 long endurance block with elevation gain',
      'Daily mobility and recovery work to protect joints',
    ];
  }

  if (difficulty === 'Challenging') {
    return [
      '2 tempo cardio sessions and 1 hill run weekly',
      'Hypertrophy circuit for strength and stamina',
      'Weekend hike or trail simulation',
      'Daily mobility and hydration routine',
    ];
  }

  if (difficulty === 'Easy' || userScore < 60) {
    return [
      '3 steady-state cardio workouts per week',
      'Light bodyweight strength circuit twice weekly',
      'Recovery walks and stretching after every session',
      'Build consistency before progressing to harder routes',
    ];
  }

  return [
    '2 cardio sessions with controlled intervals',
    '1 strength day emphasizing legs and core',
    '1 terrain-specific practice session',
    'Recovery / mobility drill after training',
  ];
};

const scoreAdventure = (userProfile = {}, adventure = {}, filters = {}) => {
  let score = 55;
  const userScore = Number(userProfile.fitnessScore) || 72;
  const userLevel = LEVEL_RANK[userProfile.fitnessLevel || 'Intermediate'] || 2;
  const adventureDifficultyRank = DIFFICULTY_RANK[adventure.difficulty] || 2;
  const categoryPreference = (userProfile.favoriteCategories || []).map((item) => normalize(item));
  const locationText = normalize(userProfile.location || '');
  const adventureLocation = normalize(adventure.location || '');

  score += Math.min(25, Math.max(0, userScore - 50));
  score += (userLevel - 1) * 8;
  score += (4 - Math.abs(adventureDifficultyRank - userLevel)) * 6;

  if (categoryPreference.includes(normalize(adventure.category))) score += 12;
  if (locationText && adventureLocation.includes(locationText)) score += 10;
  if (isAdventureWithinUserFit(userProfile, adventure)) score += 12;

  if (filters.category && adventure.category !== filters.category) score -= 15;
  if (filters.difficulty && adventure.difficulty !== filters.difficulty) score -= 10;
  if (filters.beginnerOnly && adventure.difficulty === 'Extreme') score -= 20;
  if (filters.weekendOnly && adventure.durationDays > 2) score -= 10;

  if (adventure.rating >= 4.8) score += 8;
  if (adventure.price && adventure.price > 50000 && userScore < 75) score -= 8;

  return Math.max(0, Math.min(100, Math.round(score)));
};

const getRecommendations = async (req, res) => {
  try {
    const query = req.query.query || '';
    const filters = parseQueryFilters(query);

    const userProfile = {
      fitnessScore: Number(req.query.fitnessScore) || 72,
      fitnessLevel: req.query.fitnessLevel || 'Intermediate',
      favoriteCategories: req.query.favoriteCategories ? req.query.favoriteCategories.split(',') : ['Trekking', 'Kayaking'],
      preferredDifficulty: req.query.preferredDifficulty || 'Moderate',
      location: req.query.location || '',
      interests: req.query.interests ? req.query.interests.split(',') : ['Fitness', 'Adventure'],
    };

    const adventures = await getAdventurePool();

    const scoredAdventures = adventures.map((adventure) => {
      const matchScore = scoreAdventure(userProfile, adventure, filters);
      const readinessScore = calculateReadiness(userProfile, adventure);
      const trainingPlan = generateTrainingPlan(adventure, userProfile);

      const reasons = [];
      if (userProfile.favoriteCategories.includes(adventure.category)) reasons.push('Matches your preferred activity style');
      if (readinessScore >= 80) reasons.push('High readiness for this route');
      if (adventure.difficulty === userProfile.preferredDifficulty) reasons.push('Aligned with your preferred difficulty');
      if (filters.weekendOnly && adventure.durationDays <= 2) reasons.push('Well suited for a weekend trip');

      return {
        id: adventure._id || adventure.id,
        title: adventure.title,
        category: adventure.category,
        difficulty: adventure.difficulty,
        location: adventure.location,
        durationDays: adventure.durationDays,
        price: adventure.price,
        imageUrl: adventure.imageUrl,
        matchScore,
        readinessScore,
        reasons: reasons.length > 0 ? reasons : ['Good fit for your current fitness level'],
        trainingPlan,
        adventure,
      };
    });

    let recommendations = scoredAdventures.filter((item) => {
      if (!query) return true;
      if (filters.category && item.category !== filters.category) return false;
      if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
      if (filters.weekendOnly && item.durationDays > 2) return false;
      return true;
    });

    if (recommendations.length === 0 && query) {
      recommendations = scoredAdventures.filter((item) => {
        if (filters.category && item.category !== filters.category) return false;
        if (filters.weekendOnly && item.durationDays > 2) return false;
        return true;
      });
    }

    if (recommendations.length === 0 && query) {
      recommendations = scoredAdventures.slice(0, 5);
    }

    recommendations = recommendations
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    res.json({
      success: true,
      query,
      filters,
      recommendations,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getRecommendations,
  parseQueryFilters,
  scoreAdventure,
  calculateReadiness,
  generateTrainingPlan,
};
