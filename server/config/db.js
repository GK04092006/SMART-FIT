const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');
const Adventure = require('../models/Adventure');
const Fitness = require('../models/Fitness');
const { initialAdventures, initialWorkouts } = require('../utils/helper');
const { activateInMemoryMongoose } = require('../utils/inMemoryMongoose');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

let isConnected = false;

const defaultUsers = [
  {
    name: 'Chief Administrator',
    email: 'admin@fitnessadventure.com',
    password: 'Admin@2026',
    role: 'admin',
    age: 32,
    phone: '+91 98765 00001',
    fitnessLevel: 'Advanced',
    fitnessScore: 85,
    fitnessAssessment: {
      endurance: 85,
      strength: 82,
      stamina: 80,
      flexibility: 75,
      assessmentScore: 81,
      assessedAt: new Date(),
    },
    bio: 'Platform & Operations Director for Adventure Operations.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Suresh Organizer',
    email: 'organizer@fitnessadventure.com',
    password: 'Org@2026',
    role: 'organizer',
    age: 29,
    phone: '+91 98765 00002',
    fitnessLevel: 'Advanced',
    fitnessScore: 80,
    fitnessAssessment: {
      endurance: 80,
      strength: 78,
      stamina: 82,
      flexibility: 70,
      assessmentScore: 78,
      assessedAt: new Date(),
    },
    bio: 'Lead Adventure Expedition Planner with high-altitude certifications.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Marcus Trainer',
    email: 'trainer@fitnessadventure.com',
    password: 'Trainer@2026',
    role: 'trainer',
    age: 31,
    phone: '+91 98765 00003',
    fitnessLevel: 'Elite',
    fitnessScore: 92,
    fitnessAssessment: {
      endurance: 92,
      strength: 90,
      stamina: 94,
      flexibility: 85,
      assessmentScore: 90,
      assessedAt: new Date(),
    },
    bio: 'High Performance & Adventure Conditioning Coach.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Kavitha Guide',
    email: 'guide@fitnessadventure.com',
    password: 'Guide@2026',
    role: 'guide',
    age: 28,
    phone: '+91 98765 00004',
    fitnessLevel: 'Advanced',
    fitnessScore: 86,
    fitnessAssessment: {
      endurance: 88,
      strength: 80,
      stamina: 86,
      flexibility: 80,
      assessmentScore: 84,
      assessedAt: new Date(),
    },
    bio: 'Western Ghats & Alpine Certified Wilderness Safety Guide.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Rahul Participant',
    email: 'user@fitnessadventure.com',
    password: 'User@2026',
    role: 'user',
    age: 22,
    phone: '+91 98765 00005',
    fitnessLevel: 'Intermediate',
    fitnessScore: 78,
    fitnessAssessment: {
      endurance: 76,
      strength: 68,
      stamina: 75,
      flexibility: 65,
      assessmentScore: 71,
      assessedAt: new Date(),
    },
    bio: 'Trail enthusiast preparing for upcoming high-endurance treks.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Alex Hunter',
    email: 'alex@fitnessadventure.com',
    password: 'password123',
    role: 'user',
    age: 25,
    phone: '+91 81360 87365',
    fitnessLevel: 'Advanced',
    fitnessScore: 82,
    fitnessAssessment: {
      endurance: 82,
      strength: 78,
      stamina: 80,
      flexibility: 75,
      assessmentScore: 79,
      assessedAt: new Date(),
    },
    bio: 'Avid trail runner and alpine enthusiast.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
];

const ensureDefaultUsers = async () => {
  try {
    for (const userData of defaultUsers) {
      const email = userData.email.toLowerCase();
      const existing = await User.findOne({ email });

      if (!existing) {
        const password = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          email,
          password,
          authProvider: 'local',
        });
        console.log(`[Seed] Created ${userData.role} account: ${email}`);
        continue;
      }

      const needsPasswordRefresh = !existing.password || existing.role !== userData.role;
      if (needsPasswordRefresh) {
        existing.password = await bcrypt.hash(userData.password, 10);
        existing.role = userData.role;
        existing.name = userData.name;
        existing.phone = userData.phone;
        existing.fitnessLevel = userData.fitnessLevel;
        existing.bio = userData.bio;
        existing.avatar = userData.avatar;
        await existing.save();
        console.log(`[Seed] Updated ${userData.role} account: ${email}`);
      }
    }
  } catch (error) {
    console.error('[Seed] Failed to ensure default users:', error.message);
  }
};

const ensureDefaultCatalog = async () => {
  try {
    const advCount = await Adventure.countDocuments();
    if (advCount === 0 && Array.isArray(initialAdventures)) {
      for (const adv of initialAdventures) {
        const { _id, id, ...rest } = adv;
        await Adventure.create({
          ...rest,
          status: 'Published',
          requiredFitnessScore: 60,
          minimumAge: 18,
          requiredEndurance: 50,
          requiredStrength: 50,
          requiredStamina: 50,
          requiredFlexibility: 50,
        });
      }
      console.log(`[Seed] Seeded ${initialAdventures.length} initial adventures.`);
    }

    const fitCount = await Fitness.countDocuments();
    if (fitCount === 0 && Array.isArray(initialWorkouts)) {
      for (const w of initialWorkouts) {
        const { _id, id, ...rest } = w;
        await Fitness.create(rest);
      }
      console.log(`[Seed] Seeded ${initialWorkouts.length} initial workouts.`);
    }
  } catch (error) {
    console.error('[Seed] Failed to ensure default catalog:', error.message);
  }
};

const isAtlasUri = (uri) =>
  uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

const isFallbackAllowed = () =>
  (process.env.ALLOW_DB_FALLBACK || 'true').toLowerCase() !== 'false';

const isProduction = () =>
  Boolean(process.env.RENDER) ||
  (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

const enableInMemoryMode = async () => {
  activateInMemoryMongoose();
  isConnected = true;
  await ensureDefaultUsers();
  await ensureDefaultCatalog();
};

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_adventure_db';

  if (
    mongoUri.includes('<db_password>') ||
    mongoUri.includes('<password>') ||
    mongoUri.includes('<PASSWORD>')
  ) {
    console.warn('[MongoDB] MONGO_URI contains placeholder password — activating in-memory DB engine.');
    await enableInMemoryMode();
    return;
  }

  const usingLocal = !isAtlasUri(mongoUri);
  if (usingLocal && isProduction()) {
    console.info('[MongoDB] Cloud environment detected without Atlas MONGO_URI — activating built-in In-Memory Mongoose Engine.');
    await enableInMemoryMode();
    return;
  }

  if (usingLocal) {
    console.info('[MongoDB] Attempting connection to local MongoDB at 127.0.0.1:27017…');
  } else {
    console.info('[MongoDB] Connecting to MongoDB Atlas…');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: isAtlasUri(mongoUri) ? 10_000 : 3_000,
    });

    isConnected = true;
    console.log(`[MongoDB] ✓ Connected: ${conn.connection.host}/${conn.connection.name}`);
    await ensureDefaultUsers();
    await ensureDefaultCatalog();
  } catch (error) {
    console.warn(`[MongoDB] External DB unavailable (${error.message}).`);
    if (isFallbackAllowed()) {
      console.info('[MongoDB] ✓ Activating built-in In-Memory Mongoose Engine with seeded data.');
      await enableInMemoryMode();
    } else {
      console.error('[MongoDB] ALLOW_DB_FALLBACK is false and DB is unreachable.');
      process.exit(1);
    }
  }
};

const getDBStatus = () => isConnected || mongoose.connection.readyState === 1;

module.exports = { connectDB, getDBStatus };
