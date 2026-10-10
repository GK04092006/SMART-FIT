const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      default: '',
      minlength: 0,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'organizer', 'guide', 'trainer'],
      default: 'user',
    },
    avatar: {
      type: String,
      default: '/uploads/profile-images/default-avatar.png',
    },
    fitnessLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
      default: 'Intermediate',
    },
    bio: {
      type: String,
      default: 'Fitness and outdoor adventure enthusiast!',
    },
    phone: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // ── FITNESS PROFILE ──────────────────────────────────────────
    fitnessProfile: {
      age: { type: Number, default: null },
      weightKg: { type: Number, default: null },
      heightCm: { type: Number, default: null },
      restingHeartRate: { type: Number, default: null },
      vo2MaxEstimate: { type: Number, default: null },
      bmi: { type: Number, default: null },
    },
    age: {
      type: Number,
      min: 13,
      max: 100,
    },
    fitnessAssessment: {
      endurance: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      strength: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      flexibility: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      stamina: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      assessmentScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },
      assessedAt: {
        type: Date,
      },
    },
    // ── GOALS ───────────────────────────────────────────────────
    goals: {
      targetAdventure: { type: String, default: '' },
      weeklyWorkoutTarget: { type: Number, default: 3 },
      weightGoalKg: { type: Number, default: null },
      targetFitnessScore: { type: Number, default: 75 },
    },
    // ── EMERGENCY CONTACT ───────────────────────────────────────
    emergencyContact: {
      name: { type: String, default: '' },
      phone: { type: String, default: '' },
      relationship: { type: String, default: '' },
    },
    // ── GAMIFICATION ────────────────────────────────────────────
    fitnessScore: { type: Number, default: 0, min: 0, max: 100 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [
      {
        id: String,
        name: String,
        icon: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    totalWorkouts: { type: Number, default: 0 },
    totalAdventures: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    // ── RECENTLY ACCESSED ───────────────────────────────────────
    recentlyAccessed: [
      {
        itemType: { type: String, enum: ['Adventure', 'Workout', 'Assessment', 'Booking'] },
        itemId: String,
        title: String,
        category: String,
        imageUrl: String,
        accessedAt: { type: Date, default: Date.now },
      },
    ],
    // ── COMMUNICATION PREFERENCES ──────────────────────────────
    communicationPreferences: {
      emailNotifications:    { type: Boolean, default: true },
      smsNotifications:      { type: Boolean, default: true },
      whatsappNotifications: { type: Boolean, default: true },
      inAppNotifications:    { type: Boolean, default: true },
      adventureUpdates: {
        bookingConfirmations:  { type: Boolean, default: true },
        eventReminders:        { type: Boolean, default: true },
        scheduleChanges:       { type: Boolean, default: true },
        adventureCancellation: { type: Boolean, default: true },
      },
      fitnessUpdates: {
        readinessResult:          { type: Boolean, default: true },
        trainingRecommendations:  { type: Boolean, default: true },
        workoutReminders:         { type: Boolean, default: true },
      },
      safetyAlerts: {
        emergencySos: { type: Boolean, default: true }, // Safety critical — always enabled
      },
    },
    // ── SETTINGS & PREFERENCES ──────────────────────────────────
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {
        theme: 'emerald-light',
        language: 'en',
        communication: {
          whatsapp: {
            enabled: true,
            phone: '',
            bookingAlerts: true,
            weatherAlerts: true,
            workoutReminders: false,
          },
          email: {
            enabled: true,
            email: '',
            weeklyDigest: true,
            itineraryUpdates: true,
            achievementBadges: true,
          },
          sms: {
            enabled: true,
            phone: '',
            sosAlerts: true,
            departureChanges: true,
          },
        },
        linkedAccounts: {
          google: { connected: false },
          apple: { connected: false },
          strava: { connected: false },
          garmin: { connected: false },
          whatsapp: { connected: false },
          github: { connected: false },
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
