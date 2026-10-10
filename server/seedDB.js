/**
 * =============================================================
 * Fitness & Adventure DB Seed Script — 5-Role Edition
 * =============================================================
 * Run with:  node server/seedDB.js  (from project root)
 *        OR  node seedDB.js          (from /server)
 * =============================================================
 */

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const path     = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User      = require('./models/User');
const Fitness   = require('./models/Fitness');
const Adventure = require('./models/Adventure');
const Booking   = require('./models/Booking');

// ── 1. USERS — one per role ──────────────────────────────────
const usersData = [
  {
    name:         'Alex Hunter',
    email:        'admin@fitnessadventure.com',
    password:     'Admin@2026',
    role:         'admin',
    phone:        '+1 (555) 019-2834',
    fitnessLevel: 'Advanced',
    bio:          'System administrator and senior alpine guide. 10+ years in outdoor sports management.',
    avatar:       'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    preferences:  { favoriteCategories: ['Trekking', 'HIIT'], preferredDifficulty: 'Advanced' },
  },
  {
    name:         'Raj Organizer',
    email:        'organizer@fitnessadventure.com',
    password:     'Org@2026',
    role:         'organizer',
    phone:        '+91 98765 11111',
    fitnessLevel: 'Advanced',
    bio:          'Adventure expedition organizer with 7 years of experience planning high-altitude treks and water sports events.',
    avatar:       'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    preferences:  { favoriteCategories: ['Trekking', 'Kayaking', 'Rock Climbing'], preferredDifficulty: 'Challenging' },
  },
  {
    name:         'Sam Trainer',
    email:        'trainer@fitnessadventure.com',
    password:     'Trainer@2026',
    role:         'trainer',
    phone:        '+44 7700 900123',
    fitnessLevel: 'Elite',
    bio:          'Certified personal trainer & sports physiologist. Specialises in HIIT, strength conditioning, and pre-expedition fitness preparation.',
    avatar:       'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
    preferences:  { favoriteCategories: ['HIIT', 'Strength', 'Cardio'], preferredDifficulty: 'Advanced' },
  },
  {
    name:         'Gita Guide',
    email:        'guide@fitnessadventure.com',
    password:     'Guide@2026',
    role:         'guide',
    phone:        '+91 88888 55555',
    fitnessLevel: 'Advanced',
    bio:          'Live adventure guide with expertise in real-time participant monitoring, safety protocols, and emergency first response.',
    avatar:       'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
    preferences:  { favoriteCategories: ['Rock Climbing', 'Trekking'], preferredDifficulty: 'Challenging' },
  },
  {
    name:         'Priya Participant',
    email:        'user@fitnessadventure.com',
    password:     'User@2026',
    role:         'user',
    phone:        '+91 98765 43210',
    fitnessLevel: 'Intermediate',
    bio:          'Yoga instructor and marathon runner from Mumbai. Loves outdoor adventures and pushing fitness limits.',
    avatar:       'https://images.unsplash.com/photo-1546961342-ea5f62d95fe3?auto=format&fit=crop&w=300&q=80',
    preferences:  { favoriteCategories: ['Yoga', 'Cardio', 'Kayaking'], preferredDifficulty: 'Intermediate' },
  },
];

// ── 2. FITNESS WORKOUTS ─────────────────────────────────────
const fitnessData = [
  {
    title:          'Morning HIIT Blast',
    category:       'HIIT',
    difficulty:     'Intermediate',
    durationMinutes: 30,
    caloriesBurned: 420,
    description:    'High-intensity interval training that torches fat and builds endurance in just 30 minutes.',
    instructor:     { name: 'Coach Maya', title: 'Certified HIIT Trainer', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
    exercises: [
      { name: 'Burpees',           sets: 3, reps: '15',    restSeconds: 30 },
      { name: 'Jump Squats',       sets: 3, reps: '20',    restSeconds: 30 },
      { name: 'Mountain Climbers', sets: 3, reps: '45s',   restSeconds: 20 },
      { name: 'Box Jumps',         sets: 3, reps: '12',    restSeconds: 45 },
    ],
    rating:      4.9,
    reviewCount: 312,
    imageUrl:    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    tags:        ['fat-burning', 'cardio', 'no-equipment'],
  },
  {
    title:          'Power Strength Training',
    category:       'Strength',
    difficulty:     'Advanced',
    durationMinutes: 60,
    caloriesBurned: 550,
    description:    'Build raw strength and muscle mass with compound lifts and progressive overload.',
    instructor:     { name: 'Coach Jake', title: 'Strength & Conditioning Specialist', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
    exercises: [
      { name: 'Deadlift',       sets: 4, reps: '5',  restSeconds: 120 },
      { name: 'Bench Press',    sets: 4, reps: '6',  restSeconds: 90  },
      { name: 'Back Squat',     sets: 4, reps: '5',  restSeconds: 120 },
      { name: 'Overhead Press', sets: 3, reps: '8',  restSeconds: 90  },
    ],
    rating:      4.8,
    reviewCount: 198,
    imageUrl:    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
    tags:        ['strength', 'muscle', 'barbell'],
  },
  {
    title:          'Sunrise Yoga Flow',
    category:       'Yoga',
    difficulty:     'Beginner',
    durationMinutes: 45,
    caloriesBurned: 180,
    description:    'A gentle flowing yoga session to improve flexibility, balance, and mental clarity.',
    instructor:     { name: 'Coach Aria', title: 'RYT-500 Yoga Instructor', avatar: 'https://randomuser.me/api/portraits/women/28.jpg' },
    exercises: [
      { name: 'Sun Salutation', sets: 3, reps: '5 rounds', restSeconds: 0 },
      { name: 'Warrior Flow',   sets: 2, reps: '3 rounds', restSeconds: 0 },
      { name: 'Balance Poses',  sets: 1, reps: '10 min',   restSeconds: 0 },
    ],
    rating:      4.7,
    reviewCount: 245,
    imageUrl:    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=800&q=80',
    tags:        ['flexibility', 'mindfulness', 'beginner-friendly'],
  },
  {
    title:          'Cardio Endurance Run',
    category:       'Cardio',
    difficulty:     'Intermediate',
    durationMinutes: 50,
    caloriesBurned: 480,
    description:    'Build your aerobic base with structured interval running designed for the treadmill or track.',
    instructor:     { name: 'Coach Leo', title: 'Running Coach & Physiotherapist', avatar: 'https://randomuser.me/api/portraits/men/55.jpg' },
    exercises: [
      { name: 'Warm-up Jog',    sets: 1, reps: '5 min', restSeconds: 0  },
      { name: 'Tempo Intervals', sets: 6, reps: '4 min', restSeconds: 90 },
      { name: 'Cool-down Walk', sets: 1, reps: '5 min', restSeconds: 0  },
    ],
    rating:      4.6,
    reviewCount: 176,
    imageUrl:    'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&q=80',
    tags:        ['running', 'endurance', 'cardio'],
  },
  {
    title:          'Core Stability Circuit',
    category:       'Strength',
    difficulty:     'Beginner',
    durationMinutes: 25,
    caloriesBurned: 220,
    description:    'Build a stronger, more stable core with controlled movements designed for balance and everyday performance.',
    instructor:     { name: 'Coach Nina', title: 'Functional Training Coach', avatar: 'https://randomuser.me/api/portraits/women/65.jpg' },
    exercises: [
      { name: 'Dead Bug',          sets: 3, reps: '10 per side', restSeconds: 30 },
      { name: 'Plank Shoulder Taps', sets: 3, reps: '12 per side', restSeconds: 30 },
      { name: 'Bird Dog',          sets: 3, reps: '10 per side', restSeconds: 30 },
      { name: 'Glute Bridge',      sets: 3, reps: '15',          restSeconds: 45 },
    ],
    rating:      4.8,
    reviewCount: 124,
    imageUrl:    'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
    tags:        ['core', 'stability', 'beginner-friendly'],
  },
];

// ── 3. ADVENTURES ───────────────────────────────────────────
const adventureData = [
  {
    title:           'Himalayan High-Altitude Trek',
    category:        'Trekking',
    location:        'Manali, Himachal Pradesh, India',
    difficulty:      'Challenging',
    durationDays:    7,
    price:           1299,
    maxParticipants: 10,
    description:     'Conquer the majestic Himalayan ranges on this 7-day guided trek through stunning glacial valleys and high mountain passes.',
    includedGear:    ['Trekking poles', 'Crampons', 'Sleeping bag', 'First aid kit', 'Satellite communicator'],
    itinerary: [
      { day: 1, title: 'Arrival & Acclimatization',  description: 'Settle in Manali and acclimatize to altitude.' },
      { day: 2, title: 'Trek to Beas Kund',          description: 'Beautiful trail through alpine meadows.' },
      { day: 3, title: 'Glacier Camp',                description: 'Camp on the glacier moraine at 4000m.' },
      { day: 4, title: 'Summit Push',                 description: 'Attempt the 4900m high point.' },
      { day: 5, title: 'Descent to Base Camp',        description: 'Steady descent with valley views.' },
      { day: 6, title: 'Lower Valley Exploration',    description: 'Explore local villages and waterfalls.' },
      { day: 7, title: 'Return & Debrief',            description: 'Return to Manali and celebrate.' },
    ],
    rating:      4.9,
    reviewCount: 87,
    imageUrl:    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
  },
  {
    title:           'Coastal Kayaking Expedition',
    category:        'Kayaking',
    location:        'Goa, India',
    difficulty:      'Moderate',
    durationDays:    3,
    price:           499,
    maxParticipants: 12,
    description:     'Paddle through mangroves, sea caves, and pristine beaches on this 3-day guided kayaking adventure along the Goan coast.',
    includedGear:    ['Kayak & paddle', 'Life jacket', 'Waterproof dry bag', 'Snorkeling kit'],
    itinerary: [
      { day: 1, title: 'Orientation & Flat Water', description: 'Learn kayaking basics on calm backwaters.' },
      { day: 2, title: 'Sea Cave Exploration',     description: 'Navigate exciting coastal sea caves.' },
      { day: 3, title: 'Island Picnic & Return',   description: 'Paddle to a private island for a farewell lunch.' },
    ],
    rating:      4.8,
    reviewCount: 134,
    imageUrl:    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
  },
  {
    title:           'Rock Climbing Weekend',
    category:        'Rock Climbing',
    location:        'Hampi, Karnataka, India',
    difficulty:      'Challenging',
    durationDays:    2,
    price:           349,
    maxParticipants: 8,
    description:     'Scale the ancient granite boulders of Hampi World Heritage site on this expert-guided rock climbing weekend.',
    includedGear:    ['Harness & helmet', 'Climbing shoes (rental)', 'Belay device', 'Rope & quickdraws'],
    itinerary: [
      { day: 1, title: 'Bouldering & Top-Rope',    description: 'Warm up on bouldering circuits and top-rope routes.' },
      { day: 2, title: 'Multi-pitch Lead Climbing', description: 'Lead multi-pitch routes with panoramic views.' },
    ],
    rating:      4.7,
    reviewCount: 62,
    imageUrl:    'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
  },
];

// ── SEED FUNCTION ───────────────────────────────────────────
async function seedDatabase() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitness_adventure_db';
  const dbName = process.env.MONGO_DB_NAME || 'fitness_adventure_admin';

  if (mongoUri.includes('<db_password>') || mongoUri.includes('<password>')) {
    throw new Error('MONGO_URI still contains a password placeholder in server/.env');
  }

  console.log('\n  Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { dbName });
  console.log('  Connected to: ' + mongoUri + '/' + dbName + '\n');

  // Clear existing data
  console.log('  Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Fitness.deleteMany({}),
    Adventure.deleteMany({}),
    Booking.deleteMany({}),
  ]);
  console.log('  Users, Fitness, Adventures & Bookings cleared.\n');

  // ── Seed Users ──
  console.log('  Seeding 5 role-based users...');
  const createdUsers = [];
  for (const u of usersData) {
    const salt   = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(u.password, salt);
    const user   = await User.create({ ...u, password: hashed });
    createdUsers.push(user);
    console.log(`    ✓ [${user.role.toUpperCase().padEnd(9)}] ${user.name} <${user.email}>`);
  }

  // ── Seed Fitness ──
  console.log('\n  Seeding fitness workouts...');
  const createdFitness = [];
  for (const f of fitnessData) {
    const workout = await Fitness.create(f);
    createdFitness.push(workout);
    console.log('    ✓ ' + workout.title + ' (' + workout.category + ')');
  }

  // ── Seed Adventures ──
  console.log('\n  Seeding adventures...');
  const createdAdventures = [];
  for (const a of adventureData) {
    const adv = await Adventure.create(a);
    createdAdventures.push(adv);
    console.log('    ✓ ' + adv.title + ' - ' + adv.location);
  }

  // ── Seed Bookings ──
  console.log('\n  Seeding sample bookings...');
  const bookingsData = [
    {
      user:        createdUsers[4]._id,  // Priya (user role)
      itemType:    'Fitness',
      itemRef:     createdFitness[0]._id,
      itemDetails: { title: createdFitness[0].title, category: createdFitness[0].category, imageUrl: createdFitness[0].imageUrl },
      bookingDate: new Date('2026-09-10'),
      participants: 1,
      totalPrice:   49,
      status:       'Confirmed',
      notes:        'Please assign Coach Maya.',
    },
    {
      user:        createdUsers[4]._id,  // Priya (user role)
      itemType:    'Adventure',
      itemRef:     createdAdventures[1]._id,
      itemDetails: { title: createdAdventures[1].title, category: createdAdventures[1].category, imageUrl: createdAdventures[1].imageUrl, location: createdAdventures[1].location },
      bookingDate: new Date('2026-10-05'),
      participants: 2,
      totalPrice:   998,
      status:       'Pending',
      notes:        'First-time kayaking, need beginner guidance.',
    },
    {
      user:        createdUsers[0]._id,  // Alex (admin role)
      itemType:    'Adventure',
      itemRef:     createdAdventures[0]._id,
      itemDetails: { title: createdAdventures[0].title, category: createdAdventures[0].category, imageUrl: createdAdventures[0].imageUrl, location: createdAdventures[0].location },
      bookingDate: new Date('2026-11-20'),
      participants: 1,
      totalPrice:   1299,
      status:       'Confirmed',
    },
  ];

  for (const b of bookingsData) {
    await Booking.create(b);
    console.log('    ✓ Booking: ' + b.itemDetails.title + ' -> ' + b.status);
  }

  // ── Summary ──
  console.log('\n============================================================');
  console.log('  ✅  Database seeded successfully!');
  console.log('============================================================');
  console.log('  Users     : ' + createdUsers.length);
  console.log('  Workouts  : ' + createdFitness.length);
  console.log('  Adventures: ' + createdAdventures.length);
  console.log('  Bookings  : ' + bookingsData.length);
  console.log('============================================================');
  console.log('');
  console.log('  LOGIN CREDENTIALS');
  console.log('  ─────────────────────────────────────────────────────────');
  for (const u of usersData) {
    console.log(`  ${u.role.toUpperCase().padEnd(10)} │ ${u.email.padEnd(38)} │ ${u.password}`);
  }
  console.log('  ─────────────────────────────────────────────────────────');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seedDatabase().catch(function(err) {
  console.error('Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
