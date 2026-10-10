const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const User = require('../models/User');
const Adventure = require('../models/Adventure');

const REAL_USERS = [
  {
    name: 'Chief Administrator',
    email: 'admin@fitnessadventure.com',
    password: 'Admin@2026',
    role: 'admin',
    age: 32,
    phone: '+91 98765 00001',
    fitnessLevel: 'Advanced',
    bio: 'Platform & Operations Director for Adventure Operations.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    fitnessAssessment: {
      endurance: 85,
      strength: 82,
      stamina: 80,
      flexibility: 75,
      assessmentScore: 81,
      assessedAt: new Date(),
    },
    fitnessScore: 85,
  },
  {
    name: 'Suresh Organizer',
    email: 'organizer@fitnessadventure.com',
    password: 'Org@2026',
    role: 'organizer',
    age: 29,
    phone: '+91 98765 00002',
    fitnessLevel: 'Advanced',
    bio: 'Lead Adventure Expedition Planner with high-altitude certifications.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    fitnessAssessment: {
      endurance: 80,
      strength: 78,
      stamina: 82,
      flexibility: 70,
      assessmentScore: 78,
      assessedAt: new Date(),
    },
    fitnessScore: 80,
  },
  {
    name: 'Marcus Trainer',
    email: 'trainer@fitnessadventure.com',
    password: 'Trainer@2026',
    role: 'trainer',
    age: 31,
    phone: '+91 98765 00003',
    fitnessLevel: 'Elite',
    bio: 'High Performance & Adventure Conditioning Coach.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
    fitnessAssessment: {
      endurance: 92,
      strength: 90,
      stamina: 94,
      flexibility: 85,
      assessmentScore: 90,
      assessedAt: new Date(),
    },
    fitnessScore: 92,
  },
  {
    name: 'Kavitha Guide',
    email: 'guide@fitnessadventure.com',
    password: 'Guide@2026',
    role: 'guide',
    age: 28,
    phone: '+91 98765 00004',
    fitnessLevel: 'Advanced',
    bio: 'Western Ghats & Alpine Certified Wilderness Safety Guide.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    fitnessAssessment: {
      endurance: 88,
      strength: 80,
      stamina: 86,
      flexibility: 80,
      assessmentScore: 84,
      assessedAt: new Date(),
    },
    fitnessScore: 86,
  },
  {
    name: 'Rahul Participant',
    email: 'user@fitnessadventure.com',
    password: 'User@2026',
    role: 'user',
    age: 22,
    phone: '+91 98765 00005',
    fitnessLevel: 'Intermediate',
    bio: 'Trail enthusiast preparing for upcoming high-endurance treks.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
    fitnessAssessment: {
      endurance: 76,
      strength: 68,
      stamina: 75,
      flexibility: 65,
      assessmentScore: 71,
      assessedAt: new Date(),
    },
    fitnessScore: 78,
  },
];

const BENCHMARK_ADVENTURE = {
  title: 'Kodaikanal 15 KM Adventure Trek',
  category: 'Trekking',
  location: 'Kodaikanal, Tamil Nadu, India',
  startLocation: 'Kodaikanal Lake',
  endLocation: 'Pine Forest Ridge',
  difficulty: 'Challenging',
  durationDays: 1,
  distance: '15 KM',
  date: '2026-10-15',
  startTime: '06:00 AM',
  endTime: '02:00 PM',
  price: 1499,
  maxParticipants: 25,
  description: 'An exhilarating 15 KM wilderness trek through Shola forests, misty valley ridges, and rocky river crossings in Kodaikanal.',
  requiredFitnessScore: 75,
  requiredEndurance: 70,
  requiredStrength: 60,
  requiredStamina: 65,
  requiredFlexibility: 55,
  minimumAge: 18,
  ageRequirement: '18+',
  status: 'Published',
  imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  includedGear: ['Trekking Pole', 'Hydration Pack', 'First Aid Pouch', 'Rain Poncho', 'Trail Map'],
  checkpoints: [
    { name: 'Kodaikanal Lake Trailhead', distanceFromStartKm: 0, hasWater: true, hasFirstAid: true },
    { name: 'Forest Ridge Viewpoint', distanceFromStartKm: 5.5, hasWater: true, hasFirstAid: false },
    { name: 'Shola River Crossing', distanceFromStartKm: 10.2, hasWater: true, hasFirstAid: true },
    { name: 'Pine Forest Ridge Summit', distanceFromStartKm: 15.0, hasWater: true, hasFirstAid: true },
  ],
  emergencyLocations: ['Base Camp Clinic', 'Kodaikanal District Hospital (8 KM)', 'Forest Ranger Post'],
  guides: [
    { name: 'Kavitha Guide', phone: '+91 98765 00004', specialization: 'Alpine & Forest Trails', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
  ],
  trainers: [
    { name: 'Marcus Trainer', phone: '+91 98765 00003', specialization: 'Endurance & Elevation Conditioning' },
  ],
  weatherCriteria: {
    minTempC: 10,
    maxTempC: 28,
    noRainPolicy: false,
    maxWindKmh: 35,
  },
  schedule: '05:30 Check-in, 06:00 Trailhead briefing, 06:30 Step-off, 14:00 Summit celebration',
};

async function init() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_adventure_db';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for system initialization...');

  // 1. Ensure 5 Real Users exist
  for (const u of REAL_USERS) {
    const existing = await User.findOne({ email: u.email.toLowerCase() });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(u.password, salt);

    if (!existing) {
      await User.create({
        ...u,
        email: u.email.toLowerCase(),
        password: hashedPassword,
      });
      console.log(`[Created] ${u.role}: ${u.email}`);
    } else {
      existing.password = hashedPassword;
      existing.role = u.role;
      existing.age = u.age;
      existing.fitnessAssessment = u.fitnessAssessment;
      existing.fitnessScore = u.fitnessScore;
      existing.fitnessLevel = u.fitnessLevel;
      await existing.save();
      console.log(`[Updated] ${u.role}: ${u.email}`);
    }
  }

  // 2. Ensure Kodaikanal 15 KM Adventure Trek exists
  const existingAdv = await Adventure.findOne({ title: BENCHMARK_ADVENTURE.title });
  if (!existingAdv) {
    await Adventure.create(BENCHMARK_ADVENTURE);
    console.log(`[Created] Adventure: ${BENCHMARK_ADVENTURE.title}`);
  } else {
    Object.assign(existingAdv, BENCHMARK_ADVENTURE);
    await existingAdv.save();
    console.log(`[Updated] Adventure: ${BENCHMARK_ADVENTURE.title}`);
  }

  // Also update any other adventures to ensure required requirements are set
  await Adventure.updateMany(
    { requiredFitnessScore: { $exists: false } },
    { $set: { requiredFitnessScore: 60, requiredEndurance: 50, requiredStrength: 50, requiredStamina: 50, requiredFlexibility: 50, minimumAge: 18 } }
  );

  console.log('Initialization completed successfully.');
  process.exit(0);
}

init().catch((err) => {
  console.error('Init error:', err);
  process.exit(1);
});
