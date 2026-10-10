const mongoose = require('mongoose');

const adventureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add adventure title'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Trekking', 'Kayaking', 'Rock Climbing', 'Trail Running', 'Camping', 'Skydiving'],
    },
    location: { type: String, required: true },
    difficulty: {
      type: String,
      required: true,
      enum: ['Easy', 'Moderate', 'Challenging', 'Extreme'],
    },
    durationDays: { type: Number, required: true },
    price: { type: Number, required: true },
    maxParticipants: { type: Number, default: 12 },
    description: { type: String, required: true },
    includedGear: [String],
    itinerary: [
      {
        day: Number,
        title: String,
        description: String,
      },
    ],
    rating: { type: Number, default: 4.9 },
    reviewCount: { type: Number, default: 42 },
    imageUrl: { type: String, required: true },

    // ── STATUS ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Live', 'Completed', 'Cancelled'],
      default: 'Published',
    },

    // ── ROUTE ───────────────────────────────────────────────────
    route: {
      description: { type: String, default: '' },
      distanceKm: { type: Number, default: 0 },
      elevationGainM: { type: Number, default: 0 },
      waypoints: [
        {
          name: String,
          lat: Number,
          lng: Number,
          altitudeM: Number,
        },
      ],
    },

    // ── CHECKPOINTS ────────────────────────────────────────────
    checkpoints: [
      {
        name: String,
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 },
        distanceFromStartKm: { type: Number, default: 0 },
        hasFirstAid: { type: Boolean, default: false },
        hasWater: { type: Boolean, default: true },
        description: { type: String, default: '' },
      },
    ],

    // ── TEAMS ──────────────────────────────────────────────────
    teams: [
      {
        teamName: String,
        color: String,
        memberIds: [mongoose.Schema.Types.Mixed],
      },
    ],

    // ── GUIDES ─────────────────────────────────────────────────
    guides: [
      {
        name: String,
        experience: String,
        specialization: String,
        photo: String,
        phone: String,
      },
    ],

    // ── FITNESS REQUIREMENT ────────────────────────────────────
    requiredFitnessScore: { type: Number, default: 60 },
    minimumAge: { type: Number, default: 18 },
    requiredEndurance: { type: Number, default: 50 },
    requiredStrength: { type: Number, default: 50 },
    requiredStamina: { type: Number, default: 50 },
    requiredFlexibility: { type: Number, default: 50 },
    startLocation: { type: String, default: '' },
    endLocation: { type: String, default: '' },
    date: { type: String, default: '' },
    startDate: { type: Date, default: null },
    startTime: { type: String, default: '' },
    endTime: { type: String, default: '' },
    distance: { type: String, default: '' },
    trainers: [
      {
        name: String,
        phone: String,
        specialization: String,
      },
    ],
    emergencyLocations: [String],
    fitnessRequirement: {
      minScore: { type: Number, default: 0 },
      minLevel: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Elite'],
        default: 'Beginner',
      },
      description: { type: String, default: '' },
    },
    ageRequirement: { type: String, default: '18+' },

    // ── OPERATIONS ────────────────────────────────────────────
    equipment: [
      {
        item: String,
        required: { type: Boolean, default: true },
        providedByUs: { type: Boolean, default: false },
      },
    ],
    transport: {
      pickupPoints: [String],
      vehicleType: { type: String, default: 'Shared Van' },
      notes: { type: String, default: '' },
    },
    foodPlan: { type: String, default: '' },
    medicalTeam: {
      staffCount: { type: Number, default: 1 },
      nearestHospitalKm: { type: Number, default: 10 },
      emergencyContacts: [String],
    },

    // ── SAFETY ────────────────────────────────────────────────
    weatherCriteria: {
      minTempC: { type: Number, default: 5 },
      maxTempC: { type: Number, default: 35 },
      noRainPolicy: { type: Boolean, default: false },
      maxWindKmh: { type: Number, default: 40 },
    },
    geofenceBounds: {
      north: { type: Number, default: null },
      south: { type: Number, default: null },
      east: { type: Number, default: null },
      west: { type: Number, default: null },
    },
    riskLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Extreme'],
      default: 'Medium',
    },
    schedule: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Adventure || mongoose.model('Adventure', adventureSchema);
