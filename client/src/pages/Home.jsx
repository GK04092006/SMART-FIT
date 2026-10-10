import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mountain, Zap, Target, ArrowRight, Shield,
  Activity, Users, TrendingUp, Cpu, MapPin, Dumbbell,
  Clock, Flame, Star, AlertTriangle,
} from 'lucide-react';
import API from '../services/api';
import WorkoutCard from '../components/WorkoutCard';
import AdventureCard from '../components/AdventureCard';
import Loader from '../components/Loader';
import { useWorkout } from '../hooks/useWorkout';
import { useAuth } from '../hooks/useAuth';

/* ── Animated Stat Counter ─────────────────────────────────────────────── */
const StatCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

/* ── Score Ring ────────────────────────────────────────────────────────── */
const ScoreRing = ({ score = 92, size = 100 }) => {
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          fill="none" stroke="rgba(255,255,255,0.08)" />
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
          fill="none" stroke="url(#sg)" strokeDasharray={circumference}
          strokeDashoffset={offset} strokeLinecap="round" />
        <defs>
          <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{score}%</span>
        <span style={{ fontSize: size * 0.12, color: '#10b981', fontWeight: 700 }}>Excellent</span>
      </div>
    </div>
  );
};

const Sparkline = () => (
  <svg width="100%" height="28" viewBox="0 0 120 28" preserveAspectRatio="none">
    <defs>
      <linearGradient id="spfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
      </linearGradient>
    </defs>
    <polyline points="0,22 20,16 40,20 60,10 80,14 100,6 120,10"
      fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="0,22 20,16 40,20 60,10 80,14 100,6 120,10 120,28 0,28"
      fill="url(#spfill)" opacity="0.15" />
  </svg>
);

/* ── Static Fallback Data ───────────────────────────────────────────────── */
const STATIC_ADVENTURES = [
  { _id: 'a1', title: 'Himalayan High-Altitude Trek', category: 'Trekking', location: 'Manali, Himachal Pradesh', durationDays: 7, difficulty: 'Challenging', price: 1299, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&h=300&fit=crop', description: 'Conquer the majestic Himalayan ranges.' },
  { _id: 'a2', title: 'Coastal Kayaking Expedition', category: 'Water Sports', location: 'Goa, India', durationDays: 3, difficulty: 'Moderate', price: 499, rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop', description: 'Paddle through mangroves and sea caves.' },
  { _id: 'a3', title: 'Rajasthan Desert Safari', category: 'Desert', location: 'Jaisalmer, Rajasthan', durationDays: 4, difficulty: 'Easy', price: 799, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', description: 'Dune bashing and camel safari in the Thar Desert.' },
  { _id: 'a4', title: 'Andaman Scuba Diving', category: 'Diving', location: 'Port Blair, Andaman', durationDays: 5, difficulty: 'Moderate', price: 1899, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1682687220499-d9c8c6f67e1c?w=400&h=300&fit=crop', description: 'Explore vibrant coral reefs and marine life.' },
  { _id: 'a5', title: 'Spiti Valley Motorbike Ride', category: 'Biking', location: 'Spiti Valley, HP', durationDays: 8, difficulty: 'Extreme', price: 2200, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop', description: 'Ride through one of the world\'s highest motorable passes.' },
  { _id: 'a6', title: 'Kerala Backwater Houseboat', category: 'Water', location: 'Alleppey, Kerala', durationDays: 2, difficulty: 'Easy', price: 399, rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400&h=300&fit=crop', description: 'Float through serene backwaters on a traditional houseboat.' },
  { _id: 'a7', title: 'Valley of Flowers Trek', category: 'Trekking', location: 'Uttarakhand', durationDays: 6, difficulty: 'Moderate', price: 899, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop', description: 'UNESCO heritage trek through alpine meadows.' },
  { _id: 'a8', title: 'Rishikesh White Water Rafting', category: 'Water Sports', location: 'Rishikesh, Uttarakhand', durationDays: 1, difficulty: 'Moderate', price: 199, rating: 4.6, imageUrl: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop', description: 'Thrilling rapids on the sacred Ganga river.' },
  { _id: 'a9', title: 'Patagonia Wind Circuit', category: 'Trekking', location: 'Chile', durationDays: 10, difficulty: 'Extreme', price: 3200, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop', description: 'World-class trek in Torres del Paine.' },
  { _id: 'a10', title: 'Dolomites Via Ferrata', category: 'Climbing', location: 'Italy', durationDays: 7, difficulty: 'Challenging', price: 1900, rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=400&h=300&fit=crop', description: 'Iron path climbing routes in the Italian Alps.' },
  { _id: 'a11', title: 'Sahara Desert Ultra', category: 'Running', location: 'Morocco', durationDays: 6, difficulty: 'Extreme', price: 1600, rating: 4.7, imageUrl: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=300&fit=crop', description: '250km self-supported race across the Sahara.' },
  { _id: 'a12', title: 'Iceland Aurora Hike', category: 'Trekking', location: 'Reykjavik, Iceland', durationDays: 5, difficulty: 'Moderate', price: 2800, rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&h=300&fit=crop', description: 'Hike under the Northern Lights.' },
];

const STATIC_WORKOUTS = [
  {
    _id: 'w1',
    title: 'Strength',
    category: 'Strength',
    durationMinutes: 45,
    caloriesBurned: 380,
    difficulty: 'Advanced',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop',
    instructor: { name: 'Coach Tyler' },
    exercises: ['Squats', 'Lunges', 'Push-Ups', 'Pull-Ups', 'Plank', 'Glute Bridge', 'Step-Ups', 'Calf Raises', 'Deadlift', 'Shoulder Press'],
    description: 'Build total-body power and stability.'
  },
  {
    _id: 'w2',
    title: 'Cardio & Endurance',
    category: 'Cardio',
    durationMinutes: 50,
    caloriesBurned: 420,
    difficulty: 'Intermediate',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=500&fit=crop',
    instructor: { name: 'Laura Miles' },
    exercises: ['Running', 'Jogging', 'Brisk Walking', 'Cycling', 'Jump Rope', 'Stair Climbing', 'Hill Walking', 'Trail Running', 'Interval Running', 'Long-Distance Walking'],
    description: 'Improve stamina and aerobic capacity.'
  },
  {
    _id: 'w3',
    title: 'HIIT',
    category: 'HIIT',
    durationMinutes: 30,
    caloriesBurned: 350,
    difficulty: 'Advanced',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80',
    instructor: { name: 'Coach Rina' },
    exercises: ['Burpees', 'Mountain Climbers', 'High Knees', 'Jump Squats', 'Skater Jumps', 'Jumping Jacks', 'Sprint Intervals', 'Box Jumps'],
    description: 'Short, intense bursts for power and conditioning.'
  },
  {
    _id: 'w4',
    title: 'Flexibility & Mobility',
    category: 'Yoga',
    durationMinutes: 35,
    caloriesBurned: 140,
    difficulty: 'Beginner',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop',
    instructor: { name: 'Ava Bloom' },
    exercises: ['Hamstring Stretch', 'Quad Stretch', 'Hip Flexor Stretch', 'Shoulder Stretch', 'Calf Stretch', 'Cat-Cow Stretch', 'Torso Rotation', 'Ankle Mobility'],
    description: 'Increase mobility and reduce stiffness.'
  },
  {
    _id: 'w5',
    title: 'Yoga',
    category: 'Yoga',
    durationMinutes: 40,
    caloriesBurned: 180,
    difficulty: 'Beginner',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=500&fit=crop',
    instructor: { name: 'Ananya Patel' },
    exercises: ['Sun Salutation', 'Warrior Pose', 'Tree Pose', 'Downward Dog', 'Child\'s Pose', 'Cobra Pose', 'Bridge Pose', 'Chair Pose'],
    description: 'Balance strength, breath, and recovery.'
  },
  {
    _id: 'w6',
    title: 'Core Stability Circuit',
    category: 'Strength',
    durationMinutes: 25,
    caloriesBurned: 210,
    difficulty: 'Intermediate',
    rating: 4.7,
    imageUrl: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800&h=500&fit=crop',
    instructor: { name: 'Rohan Das' },
    exercises: ['Dead Bugs', 'Bird Dogs', 'Bear Planks', 'Russian Twists', 'Medicine Ball Slams', 'Hollow Holds'],
    description: 'Build stronger abs, hips, and posture.'
  },
  {
    _id: 'w7',
    title: 'Power Cycling',
    category: 'Cardio',
    durationMinutes: 50,
    caloriesBurned: 430,
    difficulty: 'Advanced',
    rating: 4.8,
    imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=500&fit=crop',
    instructor: { name: 'Meera Nair' },
    exercises: ['Seated Sprints', 'Hill Intervals', 'Cadence Bursts', 'Standing Climbs', 'Tempo Spin', 'Recovery Ride'],
    description: 'Ride for power, endurance, and fitness.'
  },
  {
    _id: 'w8',
    title: 'Explosive HIIT Boxing',
    category: 'HIIT',
    durationMinutes: 40,
    caloriesBurned: 400,
    difficulty: 'Advanced',
    rating: 4.9,
    imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=500&fit=crop',
    instructor: { name: 'Arjun Kapoor' },
    exercises: ['Jab Cross', 'Hooks', 'Footwork', 'Shuffles', 'Shadow Boxing', 'Roundhouse Kicks'],
    description: 'Combine cardio, coordination, and power.'
  }
];

const MOUNTAIN_BG = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80';
const AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=48&h=48&fit=crop&crop=face',
];

const stats = [
  { icon: Mountain, num: 0, suffix: '+', label: 'Adventure Types' },
  { icon: Activity, num: 0, suffix: '+', label: 'Athletes Trained' },
  { icon: Shield, num: 0, suffix: '%', label: 'Safety Record' },
  { icon: MapPin, num: 0, suffix: '+', label: 'Expedition Routes' },
];

const features = [
  { icon: Cpu, label: 'AI Fitness Assessment', desc: 'Advanced AI analyzes your fitness, health, and readiness.' },
  { icon: MapPin, label: 'Smart Adventure Match', desc: 'Personalized recommendations based on your fitness & goals.' },
  { icon: Shield, label: 'Safety First', desc: 'Real-time risk assessment and expert guidance every step.' },
  { icon: TrendingUp, label: 'Track & Improve', desc: 'Monitor progress, improve performance, unlock challenges.' },
  { icon: Users, label: 'Adventure Community', desc: 'Connect with athletes, share experiences, grow together.' },
];

/* ── Section Header ─────────────────────────────────────────────────────── */
const SectionHeader = ({ tag, title, highlight, desc, light = false }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <span style={{
      display: 'inline-block', fontSize: '0.68rem', fontWeight: 700,
      letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.4rem',
      color: light ? '#10b981' : '#6b7280',
    }}>{tag}</span>
    <h2 style={{
      fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(1.4rem,3vw,2rem)',
      fontWeight: 900, color: light ? '#fff' : '#111827', marginBottom: '0.3rem', lineHeight: 1.2,
    }}>
      {title}{' '}
      {highlight && (
        <span style={{
          background: light ? 'linear-gradient(90deg,#10b981,#06b6d4)' : 'none',
          WebkitBackgroundClip: light ? 'text' : 'unset',
          WebkitTextFillColor: light ? 'transparent' : 'unset',
          backgroundClip: light ? 'text' : 'unset',
          color: light ? undefined : '#10b981',
        }}>{highlight}</span>
      )}
    </h2>
    {desc && <p style={{ color: light ? 'rgba(255,255,255,0.5)' : '#6b7280', fontSize: '0.88rem' }}>{desc}</p>}
  </div>
);

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workouts, adventures, loading, fetchWorkouts, fetchAdventures } = useWorkout();
  const fitnessScore = user?.fitnessScore || 92;
  const [sosStatus, setSosStatus] = useState('');
  const [sendingSos, setSendingSos] = useState(false);

  useEffect(() => { fetchWorkouts(); fetchAdventures(); }, [fetchWorkouts, fetchAdventures]);

  const handleSosClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSendingSos(true);
    setSosStatus('');

    if (!navigator.geolocation) {
      API.post('/guide/sos/trigger', {
        lat: null,
        lng: null,
        accuracy: null,
        address: 'Location unavailable on this device',
        triggeredByName: user.name || user.email,
      })
        .then(() => {
          setSosStatus('Emergency alert sent to the safety team.');
        })
        .catch(() => {
          setSosStatus('Unable to send SOS right now. Please try again.');
        })
        .finally(() => setSendingSos(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            address: 'Live location from home page SOS',
            triggeredByName: user.name || user.email,
          };
          await API.post('/guide/sos/trigger', payload);
          setSosStatus('Emergency alert sent to the safety team.');
        } catch (error) {
          setSosStatus('Unable to send SOS right now. Please try again.');
        } finally {
          setSendingSos(false);
        }
      },
      async () => {
        try {
          await API.post('/guide/sos/trigger', {
            lat: null,
            lng: null,
            accuracy: null,
            address: 'Location unavailable — emergency alert sent without GPS',
            triggeredByName: user.name || user.email,
          });
          setSosStatus('Emergency alert sent to the safety team.');
        } catch (error) {
          setSosStatus('Unable to send SOS right now. Please try again.');
        } finally {
          setSendingSos(false);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const displayAdventures = (adventures.length > 0 ? adventures : STATIC_ADVENTURES).slice(0, 10);
  const displayWorkouts = (workouts.length > 0 ? workouts : STATIC_WORKOUTS).slice(0, 8);

  return (
    <div style={{ background: '#fff', minHeight: '100vh', color: '#111827', position: 'relative' }}>

      {/* ═══ HERO (dark) ═══ */}
      <section style={{ position: 'relative', minHeight: '88vh', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${MOUNTAIN_BG})`, backgroundSize: 'cover', backgroundPosition: 'center 30%', zIndex: 0 }} />
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(100deg, rgba(8,15,30,0.88) 0%, rgba(8,15,30,0.55) 55%, rgba(8,15,30,0.2) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 160, zIndex: 2, background: 'linear-gradient(to bottom, transparent, #fff)' }} />

        <div style={{ position: 'relative', zIndex: 3, width: '100%', maxWidth: 1280, margin: '0 auto', padding: '5rem 2rem 4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3rem' }}>
          {/* Left */}
          <div style={{ maxWidth: 560, flex: '1 1 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(16,185,129,0.4)', borderRadius: 999, padding: '0.3rem 0.8rem', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#10b981', textTransform: 'uppercase', background: 'rgba(16,185,129,0.08)', marginBottom: '1.5rem' }}>
              <Zap size={11} /> AI-POWERED FITNESS &amp; ADVENTURE
            </div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.4rem,5vw,4.4rem)', fontWeight: 900, lineHeight: 1.04, letterSpacing: '-0.03em', marginBottom: '1.1rem' }}>
              <span style={{ color: '#fff', display: 'block' }}>FITNESS FIRST.</span>
              <span style={{ display: 'block', background: 'linear-gradient(90deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>ADVENTURE NEXT</span>
            </h1>
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <Link to={user ? '/fitness/assessment' : '/register'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 1.75rem', fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#fff', borderRadius: 9, boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
                Take Fitness Assessment <ArrowRight size={15} />
              </Link>
              <Link to="/adventure" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 1.75rem', fontWeight: 700, fontSize: '0.9rem', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.22)' }}>
                <Mountain size={15} /> Explore Adventures
              </Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ display: 'flex' }}>
                {AVATARS.map((src, i) => (
                  <img key={i} src={src} alt="member" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.3)', marginLeft: i === 0 ? 0 : -9 }} />
                ))}
              </div>
              <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
                Join <strong style={{ color: '#fff' }}>10,000+</strong> adventurers
              </span>
            </div>
          </div>

          {/* Right — AI Score Card */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ background: 'rgba(10,18,32,0.88)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '1.4rem 1.2rem', backdropFilter: 'blur(20px)', minWidth: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.55)' }}>
              <div style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '0.9rem' }}>AI FITNESS SCORE</div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <ScoreRing score={fitnessScore} size={94} />
              </div>
              <div style={{ marginBottom: '0.7rem' }}><Sparkline /></div>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.5 }}>
                You're ready for your<br /><span style={{ color: '#10b981', fontWeight: 700 }}>next adventure!</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES (white) ═══ */}
      <section style={{ padding: '3.5rem 0', background: '#fff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '1rem' }}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.55rem', transition: 'all 0.22s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#a7f3d0'; e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 40, height: 40, borderRadius: 9, background: '#f0fdf4', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Icon size={18} />
                </div>
                <h4 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>{label}</h4>
                <p style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FITNESS ACTIVITIES (white bg, 4 cols) ═══ */}
      <section style={{ padding: '3rem 0 4rem', background: '#f9fafb', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <SectionHeader tag="Fitness Training" title="Elite" highlight="Workout Programs" desc="Adventure-focused training plans built for the wild." />
            <Link to="/fitness" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#111827', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '0.5rem 1.1rem', background: '#fff', whiteSpace: 'nowrap' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? <Loader text="Loading workouts..." /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
              {displayWorkouts.map((w) => (
                <WorkoutCard key={w._id || w.id} workout={w} onSelect={(wk) => navigate('/booking', { state: { item: wk, itemType: 'Fitness' } })} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ ADVENTURES (white bg, 4 cols) ═══ */}
      <section style={{ padding: '3rem 0 4rem', background: '#fff', borderTop: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <SectionHeader tag="Wilderness Expeditions" title="Conquer Earth's" highlight="Greatest Trails" desc="Guided expeditions with eligibility screening & GPS safety." />
            <Link to="/adventure" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem', fontWeight: 700, color: '#111827', border: '1.5px solid #d1d5db', borderRadius: 8, padding: '0.5rem 1.1rem', background: '#fff', whiteSpace: 'nowrap' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? <Loader text="Loading adventures..." /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '1.25rem' }}>
              {displayAdventures.map((a) => (
                <AdventureCard key={a._id || a.id} adventure={a} onSelect={(adv) => navigate('/booking', { state: { item: adv, itemType: 'Adventure' } })} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══ CTA (dark) ═══ */}
      {!user && (
        <section style={{ padding: '4rem 0', background: '#111827' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#10b981', display: 'block', marginBottom: '0.75rem' }}>Get Started Free</span>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#fff', marginBottom: '0.75rem' }}>
              Your Adventure Awaits.{' '}
              <span style={{ background: 'linear-gradient(90deg,#10b981,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Are You Ready?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem', maxWidth: 440, margin: '0 auto 2rem', lineHeight: 1.7, fontSize: '0.92rem' }}>
              Create your profile, complete the fitness assessment, and unlock your personalised adventure path.
            </p>
            <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 700, background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#fff', borderRadius: 9, boxShadow: '0 4px 20px rgba(16,185,129,0.35)' }}>
                Create Free Account <ArrowRight size={17} />
              </Link>
              <Link to="/fitness/assessment" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.85rem 2rem', fontSize: '0.95rem', fontWeight: 700, background: 'rgba(255,255,255,0.07)', color: '#fff', borderRadius: 9, border: '1.5px solid rgba(255,255,255,0.2)' }}>
                <Target size={17} /> Take Assessment
              </Link>
            </div>
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={handleSosClick}
        disabled={sendingSos}
        style={{
          position: 'fixed',
          right: '1.25rem',
          bottom: '1.25rem',
          zIndex: 50,
          background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
          color: '#fff',
          border: 'none',
          borderRadius: '999px',
          boxShadow: '0 16px 32px rgba(239, 68, 68, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.55rem',
          padding: '0.9rem 1.25rem',
          fontWeight: 800,
          fontSize: '0.82rem',
          letterSpacing: '0.04em',
          cursor: sendingSos ? 'wait' : 'pointer',
          opacity: sendingSos ? 0.8 : 1,
        }}
      >
        <AlertTriangle size={16} />
        {sendingSos ? 'Sending...' : 'SOS'}
      </button>

      {sosStatus && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: '1.5rem',
          transform: 'translateX(-50%)',
          background: 'rgba(17,24,39,0.92)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 12px 28px rgba(15,23,42,0.22)',
          borderRadius: '0.9rem',
          padding: '0.85rem 1.2rem',
          fontSize: '0.8rem',
          zIndex: 60,
          maxWidth: '90vw',
          textAlign: 'center',
        }}>
          {sosStatus}
        </div>
      )}
    </div>
  );
};

export default Home;
