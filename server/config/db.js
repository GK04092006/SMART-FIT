const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

let isConnected = false;

const defaultUsers = [
  {
    name: 'Chief Administrator',
    email: 'admin@fitnessadventure.com',
    password: 'Admin@2026',
    role: 'admin',
    phone: '+91 98765 00001',
    fitnessLevel: 'Advanced',
    bio: 'Platform & Operations Director for Adventure Operations.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Suresh Organizer',
    email: 'organizer@fitnessadventure.com',
    password: 'Org@2026',
    role: 'organizer',
    phone: '+91 98765 00002',
    fitnessLevel: 'Advanced',
    bio: 'Lead Adventure Expedition Planner with high-altitude certifications.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Marcus Trainer',
    email: 'trainer@fitnessadventure.com',
    password: 'Trainer@2026',
    role: 'trainer',
    phone: '+91 98765 00003',
    fitnessLevel: 'Elite',
    bio: 'High Performance & Adventure Conditioning Coach.',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Kavitha Guide',
    email: 'guide@fitnessadventure.com',
    password: 'Guide@2026',
    role: 'guide',
    phone: '+91 98765 00004',
    fitnessLevel: 'Advanced',
    bio: 'Western Ghats & Alpine Certified Wilderness Safety Guide.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
  {
    name: 'Rahul Participant',
    email: 'user@fitnessadventure.com',
    password: 'User@2026',
    role: 'user',
    phone: '+91 98765 00005',
    fitnessLevel: 'Intermediate',
    bio: 'Trail enthusiast preparing for upcoming high-endurance treks.',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
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

// ── Helpers ────────────────────────────────────────────────────────────────────

/** True when the URI looks like a MongoDB Atlas SRV connection string */
const isAtlasUri = (uri) =>
  uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');

/** True when we are running in a production-like environment */
const isProduction = () =>
  (process.env.NODE_ENV || 'development').toLowerCase() === 'production';

/**
 * Opt-in fallback: set ALLOW_DB_FALLBACK=false in .env to force the server
 * to exit if MongoDB is unreachable. Defaults to true so cloud deployments
 * stay online in demo/CSV mode even before MONGO_URI is configured.
 */
const isFallbackAllowed = () =>
  (process.env.ALLOW_DB_FALLBACK || 'true').toLowerCase() !== 'false';

// ── Main connect function ──────────────────────────────────────────────────────

const connectDB = async () => {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_adventure_db';

  // ── Guard: placeholder password still present ──────────────────────────────
  if (
    mongoUri.includes('<db_password>') ||
    mongoUri.includes('<password>') ||
    mongoUri.includes('<PASSWORD>')
  ) {
    const msg =
      '[MongoDB] MONGO_URI still contains a placeholder password.\n' +
      '  → Copy server/.env.example to server/.env and set your real Atlas password.\n' +
      '  → Or set MONGO_URI=mongodb://127.0.0.1:27017/fitness_adventure_db for local MongoDB.';
    console.warn(msg);
    console.warn('[MongoDB] Running in in-memory/CSV fallback mode.');
    isConnected = false;
    return;
  }

  // ── Friendly guidance when using the local fallback URI ───────────────────
  const usingLocal = !isAtlasUri(mongoUri);
  if (usingLocal) {
    console.info(
      '[MongoDB] Connecting to local MongoDB at 127.0.0.1:27017. ' +
      'To use MongoDB Atlas, set MONGO_URI to your Atlas SRV connection string.'
    );
  } else {
    console.info('[MongoDB] Connecting to MongoDB Atlas…');
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      // Atlas needs slightly more time; local is almost instant
      serverSelectionTimeoutMS: isAtlasUri(mongoUri) ? 10_000 : 4_000,
    });

    isConnected = true;
    console.log(
      `[MongoDB] ✓ Connected: ${conn.connection.host}/${conn.connection.name}`
    );
    await ensureDefaultUsers();
  } catch (error) {
    isConnected = false;
    console.error(`[MongoDB] Connection failed: ${error.message}`);

    if (isFallbackAllowed()) {
      console.warn(
        '[MongoDB] ⚠ Falling back to in-memory / CSV mode (ALLOW_DB_FALLBACK=true).\n' +
        '  Set MONGO_URI in your environment variables for persistent cloud storage.'
      );
    } else {
      console.error(
        '[MongoDB] ALLOW_DB_FALLBACK is false and the DB is unreachable.\n' +
        '  → Set ALLOW_DB_FALLBACK=true or configure a valid MONGO_URI.'
      );
      process.exit(1);
    }
  }
};

const getDBStatus = () => isConnected || mongoose.connection.readyState === 1;

module.exports = { connectDB, getDBStatus };
