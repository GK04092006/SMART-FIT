import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy, Star, Zap, Medal, Target, Users, Award,
  Download, Lock, CheckCircle2, TrendingUp, Crown, Flame,
  Sparkles, ArrowRight, Check, X, Printer, ShieldCheck
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';

/* ── Gamification Progression Tiers ────────────────────────────────── */
const LEVEL_TIERS = [
  { level: 1, minXp: 0,    maxXp: 300,   title: 'Novice Trailblazer' },
  { level: 2, minXp: 300,  maxXp: 750,   title: 'Active Explorer'    },
  { level: 3, minXp: 750,  maxXp: 1400,  title: 'Pathfinder'         },
  { level: 4, minXp: 1400, maxXp: 2200,  title: 'Adventurer Elite'   },
  { level: 5, minXp: 2200, maxXp: 3200,  title: 'Wilderness Master'  },
  { level: 6, minXp: 3200, maxXp: 4500,  title: 'Summit Champion'    },
  { level: 7, minXp: 4500, maxXp: 6000,  title: 'Expedition Legend'  },
  { level: 8, minXp: 6000, maxXp: 10000, title: 'Apex Adventurer'    },
];

const calculateLevelInfo = (xp = 0) => {
  const currentXp = Math.max(0, Number(xp) || 0);
  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    const tier = LEVEL_TIERS[i];
    if (currentXp < tier.maxXp || i === LEVEL_TIERS.length - 1) {
      const nextTier = LEVEL_TIERS[i + 1] || { ...tier, level: tier.level + 1, title: 'Apex Legend' };
      const xpInCurrentLevel = currentXp - tier.minXp;
      const xpForCurrentLevel = Math.max(1, tier.maxXp - tier.minXp);
      const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpForCurrentLevel) * 100)));
      const xpNeeded = Math.max(0, tier.maxXp - currentXp);
      return {
        level: tier.level,
        title: tier.title,
        currentXp,
        minXp: tier.minXp,
        maxXp: tier.maxXp,
        xpInCurrentLevel,
        xpForCurrentLevel,
        progressPercent,
        xpNeeded,
        nextLevel: nextTier.level,
        nextTitle: nextTier.title,
      };
    }
  }
  return {
    level: 1,
    title: 'Novice Trailblazer',
    currentXp: 0,
    minXp: 0,
    maxXp: 300,
    xpInCurrentLevel: 0,
    xpForCurrentLevel: 300,
    progressPercent: 0,
    xpNeeded: 300,
    nextLevel: 2,
    nextTitle: 'Active Explorer',
  };
};

/* ── Badges Configuration ────────────────────────────────────────── */
const BADGES_CONFIG = [
  {
    id: 'first_workout',
    name: 'First Step',
    icon: '🏃',
    desc: 'Complete your first workout session',
    xpReward: 50,
    category: 'Workouts',
    isEarned: (user, workouts) => workouts >= 1,
  },
  {
    id: 'assessment',
    name: 'Self-Aware',
    icon: '🎯',
    desc: 'Complete full fitness readiness assessment',
    xpReward: 150,
    category: 'Assessment',
    isEarned: (user, workouts, streak, adv, score) => score > 0 || Boolean(user?.fitnessAssessment?.assessedAt),
  },
  {
    id: 'streak_7',
    name: '7-Day Warrior',
    icon: '🔥',
    desc: 'Maintain a 7-day active workout streak',
    xpReward: 200,
    category: 'Streaks',
    isEarned: (user, workouts, streak) => streak >= 7,
  },
  {
    id: 'first_adventure',
    name: 'Trailblazer',
    icon: '🏔️',
    desc: 'Complete your first outdoor expedition',
    xpReward: 300,
    category: 'Adventures',
    isEarned: (user, workouts, streak, adv) => adv >= 1,
  },
  {
    id: 'score_60',
    name: 'Intermediate+',
    icon: '⚡',
    desc: 'Achieve a fitness score of 60 or higher',
    xpReward: 200,
    category: 'Readiness',
    isEarned: (user, workouts, streak, adv, score) => score >= 60,
  },
  {
    id: 'score_80',
    name: 'Elite Status',
    icon: '🏅',
    desc: 'Achieve an elite fitness score of 80 or higher',
    xpReward: 500,
    category: 'Readiness',
    isEarned: (user, workouts, streak, adv, score) => score >= 80,
  },
  {
    id: 'streak_30',
    name: '30-Day Legend',
    icon: '💪',
    desc: 'Sustain a legendary 30-day streak',
    xpReward: 500,
    category: 'Streaks',
    isEarned: (user, workouts, streak) => streak >= 30,
  },
  {
    id: 'team_player',
    name: 'Team Spirit',
    icon: '🤝',
    desc: 'Join an expedition team with fellow adventurers',
    xpReward: 100,
    category: 'Community',
    isEarned: (user) => Boolean(user?.bookings?.some(b => b.team) || user?.badges?.some(b => (b.id || b) === 'team_player')),
  },
  {
    id: 'workouts_10',
    name: 'Iron Will',
    icon: '🏋️',
    desc: 'Complete 10 total workout sessions',
    xpReward: 250,
    category: 'Workouts',
    isEarned: (user, workouts) => workouts >= 10,
  },
  {
    id: 'summit',
    name: 'Summit King',
    icon: '👑',
    desc: 'Complete an Extreme or Challenging expedition',
    xpReward: 750,
    category: 'Adventures',
    isEarned: (user) => Boolean(user?.badges?.some(b => (b.id || b) === 'summit')),
  },
  {
    id: 'sos_hero',
    name: 'Safety Guardian',
    icon: '🛡️',
    desc: 'Follow all readiness & expedition safety rules',
    xpReward: 400,
    category: 'Safety',
    isEarned: (user) => Boolean(user?.badges?.some(b => (b.id || b) === 'sos_hero')),
  },
  {
    id: 'cert_1',
    name: 'Certified Trekker',
    icon: '📜',
    desc: 'Earn your first official verified credential',
    xpReward: 300,
    category: 'Certificates',
    isEarned: (user, workouts, streak, adv, score) => score > 0 || adv >= 1 || Boolean(user?.badges?.some(b => (b.id || b) === 'cert_1')),
  },
];

/* ── Global Leaderboard Seed ─────────────────────────────────────── */
const BASE_LEADERBOARD = [
  { rank: 1,  name: 'Arjun Mehta',    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=60', xp: 8420, level: 8, badge: '👑' },
  { rank: 2,  name: 'Priya Sharma',   avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60', xp: 7650, level: 8, badge: '🏅' },
  { rank: 3,  name: 'Rohan Kapoor',   avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=60', xp: 6920, level: 7, badge: '🥉' },
  { rank: 4,  name: 'Ananya Singh',   avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=60', xp: 5840, level: 6, badge: '⭐' },
  { rank: 5,  name: 'Dev Patel',      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=60', xp: 4920, level: 6, badge: '⭐' },
  { rank: 6,  name: 'Kavya Nair',     avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=60', xp: 4350, level: 5, badge: '⭐' },
  { rank: 7,  name: 'Vikram Reddy',   avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=80&q=60', xp: 3780, level: 5, badge: '⭐' },
  { rank: 8,  name: 'Nisha Menon',    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=80&q=60', xp: 3120, level: 4, badge: '⭐' },
  { rank: 9,  name: 'Alex Hunter',    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=60', xp: 2650, level: 4, badge: '⭐' },
  { rank: 10, name: 'Meera Iyer',     avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=80&q=60', xp: 2140, level: 3, badge: '⭐' },
];

const Engagement = () => {
  const { user, refreshCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [badgeFilter, setBadgeFilter] = useState('all');
  const [selectedCert, setSelectedCert] = useState(null);
  const [xpDisplay, setXpDisplay] = useState(0);

  // Sync profile on mount to guarantee fresh metrics
  useEffect(() => {
    if (refreshCurrentUser) {
      refreshCurrentUser();
    }
  }, [refreshCurrentUser]);

  // Extract user stats safely (defaults to 0 for a brand new user)
  const userStreak = user?.streakDays ?? 0;
  const userWorkouts = user?.totalWorkouts ?? (user?.recentWorkouts?.length ?? 0);
  const userAdventures = user?.totalAdventures ?? (user?.completedAdventures?.length ?? 0);
  const userFitnessScore = user?.fitnessScore ?? (user?.fitnessAssessment?.assessmentScore ?? 0);
  const rawXp = user?.xp ?? 0;

  // Calculate dynamic level information
  const levelInfo = useMemo(() => calculateLevelInfo(rawXp), [rawXp]);

  // Animate XP counter on mount or change
  useEffect(() => {
    if (levelInfo.currentXp === 0) {
      setXpDisplay(0);
      return;
    }
    let start = 0;
    const step = Math.max(1, Math.ceil(levelInfo.currentXp / 40));
    const t = setInterval(() => {
      start += step;
      if (start >= levelInfo.currentXp) {
        setXpDisplay(levelInfo.currentXp);
        clearInterval(t);
      } else {
        setXpDisplay(start);
      }
    }, 16);
    return () => clearInterval(t);
  }, [levelInfo.currentXp]);

  // Evaluate which badges are earned based on actual user data
  const badgesList = useMemo(() => {
    const userBadgeIds = new Set((user?.badges || []).map(b => (typeof b === 'string' ? b : b.id)));
    return BADGES_CONFIG.map(badge => {
      const earned = userBadgeIds.has(badge.id) || (badge.isEarned && badge.isEarned(user, userWorkouts, userStreak, userAdventures, userFitnessScore));
      return { ...badge, earned };
    });
  }, [user, userWorkouts, userStreak, userAdventures, userFitnessScore]);

  const earnedBadges = useMemo(() => badgesList.filter(b => b.earned), [badgesList]);
  const isNewUser = earnedBadges.length === 0 && userWorkouts === 0 && userStreak === 0 && userAdventures === 0;

  // Challenges list based on real user progression
  const challenges = useMemo(() => [
    {
      id: 1,
      title: 'Morning Hustle',
      desc: 'Complete 5 workouts to build expedition stamina',
      progress: Math.min(userWorkouts, 5),
      target: 5,
      xp: 250,
      deadline: 'Weekly',
      type: 'weekly',
      actionLink: '/fitness',
      actionLabel: 'Go to Workouts',
    },
    {
      id: 2,
      title: 'Score Booster',
      desc: 'Reach or improve fitness score to 60+',
      progress: Math.min(userFitnessScore, 60),
      target: 60,
      xp: 300,
      deadline: 'Monthly',
      type: 'monthly',
      actionLink: '/fitness/assessment',
      actionLabel: 'Take Assessment',
    },
    {
      id: 3,
      title: 'Explorer Pack',
      desc: 'Book your first outdoor adventure expedition',
      progress: Math.min(userAdventures, 1),
      target: 1,
      xp: 400,
      deadline: 'Monthly',
      type: 'monthly',
      actionLink: '/adventure',
      actionLabel: 'Browse Trips',
    },
    {
      id: 4,
      title: 'Endurance Builder',
      desc: 'Complete 3 training sessions in a row',
      progress: Math.min(userWorkouts, 3),
      target: 3,
      xp: 150,
      deadline: 'Weekly',
      type: 'weekly',
      actionLink: '/fitness',
      actionLabel: 'Start Workout',
    },
    {
      id: 5,
      title: 'Streak Builder',
      desc: 'Maintain an active 3-day workout streak',
      progress: Math.min(userStreak, 3),
      target: 3,
      xp: 200,
      deadline: 'Weekly',
      type: 'weekly',
      actionLink: '/fitness',
      actionLabel: 'Keep Streak',
    },
  ], [userWorkouts, userFitnessScore, userAdventures, userStreak]);

  // Certificates list
  const certificates = useMemo(() => [
    {
      id: 'cert_fitness',
      title: 'Fitness Foundation Certificate',
      subtitle: 'Verified Completion of Comprehensive Readiness Assessment',
      date: user?.fitnessAssessment?.assessedAt
        ? new Date(user.fitnessAssessment.assessedAt).toISOString().split('T')[0]
        : (userFitnessScore > 0 ? new Date().toISOString().split('T')[0] : '—'),
      issued: Boolean(userFitnessScore > 0 || user?.fitnessAssessment?.assessedAt),
      actionLink: '/fitness/assessment',
      actionLabel: 'Take Assessment to Unlock',
      code: 'SFT-FIT-2026',
    },
    {
      id: 'cert_adventure',
      title: 'Wilderness Trekker Certificate',
      subtitle: 'Official Expedition Completion Credential',
      date: user?.completedAdventures?.[0]?.bookingDate
        ? new Date(user.completedAdventures[0].bookingDate).toISOString().split('T')[0]
        : '—',
      issued: Boolean(userAdventures >= 1),
      actionLink: '/adventure',
      actionLabel: 'Complete Expedition to Unlock',
      code: 'SFT-ADV-2026',
    },
    {
      id: 'cert_streak',
      title: 'Consistency Champion Certificate',
      subtitle: 'Awarded for Sustaining a 7+ Day Active Workout Streak',
      date: userStreak >= 7 ? new Date().toISOString().split('T')[0] : '—',
      issued: Boolean(userStreak >= 7),
      actionLink: '/fitness',
      actionLabel: 'Build 7-Day Streak to Unlock',
      code: 'SFT-STR-2026',
    },
  ], [user, userFitnessScore, userAdventures, userStreak]);

  // Calculate user's standing on leaderboard
  const userRankInfo = useMemo(() => {
    const currentXp = levelInfo.currentXp;
    let rank = 11;
    for (let i = 0; i < BASE_LEADERBOARD.length; i++) {
      if (currentXp >= BASE_LEADERBOARD[i].xp) {
        rank = i + 1;
        break;
      }
    }
    return {
      rank,
      isTop10: rank <= 10,
      xp: currentXp,
      level: levelInfo.level,
      title: levelInfo.title,
    };
  }, [levelInfo]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'earned') return badgesList.filter(b => b.earned);
    if (badgeFilter === 'locked') return badgesList.filter(b => !b.earned);
    return badgesList;
  }, [badgesList, badgeFilter]);

  const TABS = [
    { id: 'overview',     label: 'Overview',     icon: TrendingUp },
    { id: 'badges',       label: 'Badges',       icon: Medal      },
    { id: 'challenges',   label: 'Challenges',   icon: Target     },
    { id: 'leaderboard',  label: 'Leaderboard',  icon: Crown      },
    { id: 'certificates', label: 'Certificates', icon: Award      },
  ];

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
              🏆 Engagement <span className="text-gradient">Hub</span>
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              XP, badges, challenges, leaderboards & certificates
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-container" style={{ marginBottom: '2rem' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`tab-btn ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW                                                */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="animate-fadeIn">
              {/* XP & Level Card */}
              <div
                className="glass-panel"
                style={{
                  padding: '2rem',
                  marginBottom: '1.5rem',
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))',
                  border: '1px solid rgba(16,185,129,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.85rem',
                        fontWeight: 900,
                        color: 'white',
                        margin: '0 auto 0.5rem',
                        boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      }}
                    >
                      {levelInfo.level}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary-emerald)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      LEVEL {levelInfo.level}
                    </div>
                  </div>

                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', marginRight: '0.5rem' }}>
                          {user?.name?.split(' ')[0] || 'Athlete'}
                        </span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                          {levelInfo.title}
                        </span>
                      </div>
                      <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '0.95rem' }}>
                        {xpDisplay.toLocaleString()} / {levelInfo.maxXp.toLocaleString()} XP
                      </span>
                    </div>

                    <div className="progress-bar-track" style={{ height: 10, marginBottom: '0.55rem' }}>
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${levelInfo.progressPercent}%`,
                          transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span>
                        {levelInfo.xpNeeded > 0 ? (
                          <>
                            <strong>{levelInfo.xpNeeded.toLocaleString()} XP</strong> to Level {levelInfo.nextLevel} —{' '}
                            <span style={{ color: 'var(--primary-emerald)', fontWeight: 600 }}>{levelInfo.nextTitle}</span>
                          </>
                        ) : (
                          <span style={{ color: 'var(--primary-emerald)', fontWeight: 600 }}>Maximum Level Reached!</span>
                        )}
                      </span>
                      <span>{levelInfo.progressPercent}% Completed</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats Grid */}
              <div className="grid-4" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                {[
                  { icon: '🏅', label: 'Badges Earned',  value: earnedBadges.length },
                  { icon: '🔥', label: 'Day Streak',     value: userStreak },
                  { icon: '💪', label: 'Total Workouts', value: userWorkouts },
                  { icon: '🏔️', label: 'Adventures Done', value: userAdventures },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>{icon}</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{value}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Badges or New User Welcome Banner */}
              {isNewUser ? (
                <div
                  className="glass-panel"
                  style={{
                    padding: '2rem 1.75rem',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.04), rgba(6,182,212,0.03))',
                    border: '1px dashed rgba(16,185,129,0.3)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      margin: '0 auto 0.75rem',
                    }}
                  >
                    🌱
                  </div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: 800 }}>
                    Welcome to Your Adventure Journey, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Athlete'}</span>!
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '540px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                    You are starting at <strong>Level 1 ({levelInfo.title})</strong> with <strong>0 XP</strong>.
                    Follow these 3 quick milestone steps to unlock your first achievement badges and climb the leaderboard!
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', textAlign: 'left', marginBottom: '1.25rem' }}>
                    {/* Step 1 */}
                    <div style={{ padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🎯</span>
                        <strong style={{ fontSize: '0.88rem' }}>1. Take Assessment</strong>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        Check your baseline fitness readiness and earn the <em>Self-Aware</em> badge.
                      </p>
                      <Link to="/fitness/assessment" className="btn-primary" style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Start Assessment <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>+150 XP</span>
                      </Link>
                    </div>

                    {/* Step 2 */}
                    <div style={{ padding: '1rem', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🏃</span>
                        <strong style={{ fontSize: '0.88rem' }}>2. Complete 1st Workout</strong>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        Finish any cardio, strength or HIIT workout to unlock the <em>First Step</em> badge.
                      </p>
                      <Link to="/fitness" className="btn-secondary" style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        Explore Workouts <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>+50 XP</span>
                      </Link>
                    </div>

                    {/* Step 3 */}
                    <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.05)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>🏔️</span>
                        <strong style={{ fontSize: '0.88rem' }}>3. Book Expedition</strong>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                        Reserve your spot on a guided adventure to unlock the <em>Trailblazer</em> badge.
                      </p>
                      <Link to="/adventure" className="btn-secondary" style={{ padding: '0.38rem 0.85rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        View Expeditions <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>+300 XP</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>Recent Badges</span>
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        ({earnedBadges.length} unlocked)
                      </span>
                    </div>
                    <button
                      className="btn-secondary"
                      style={{ padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}
                      onClick={() => setActiveTab('badges')}
                    >
                      View All
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {earnedBadges.map(badge => (
                      <div
                        key={badge.id}
                        title={badge.desc}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.3rem',
                          padding: '0.85rem 1rem',
                          background: 'rgba(16,185,129,0.08)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid rgba(16,185,129,0.25)',
                          cursor: 'default',
                          minWidth: '90px',
                          textAlign: 'center',
                        }}
                      >
                        <div style={{ fontSize: '2rem' }}>{badge.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{badge.name}</div>
                        <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                          +{badge.xpReward} XP
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: BADGES                                                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'badges' && (
            <div className="animate-fadeIn">
              {/* Badges Progress Summary Banner */}
              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.2rem' }}>
                    Your Badge Collection: {earnedBadges.length} of {badgesList.length} Unlocked
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Complete training, assessments, and expeditions to earn all 12 achievement badges!
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[
                    { id: 'all',    label: `All (${badgesList.length})` },
                    { id: 'earned', label: `Unlocked (${earnedBadges.length})` },
                    { id: 'locked', label: `Locked (${badgesList.length - earnedBadges.length})` },
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      className={badgeFilter === id ? 'btn-primary' : 'btn-secondary'}
                      style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                      onClick={() => setBadgeFilter(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid-4" style={{ gap: '1rem' }}>
                {filteredBadges.map(badge => (
                  <div
                    key={badge.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      textAlign: 'center',
                      opacity: badge.earned ? 1 : 0.65,
                      position: 'relative',
                      border: badge.earned
                        ? '1px solid rgba(16,185,129,0.35)'
                        : '1px solid var(--border-subtle)',
                      background: badge.earned
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))'
                        : 'var(--bg-card)',
                      transition: 'var(--transition-normal)',
                    }}
                  >
                    {!badge.earned ? (
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                        <Lock size={14} color="var(--text-dim)" />
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                        <CheckCircle2 size={16} color="var(--primary-emerald)" />
                      </div>
                    )}

                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{badge.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: '0.25rem' }}>
                      {badge.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4, minHeight: '2.4em' }}>
                      {badge.desc}
                    </div>

                    <div>
                      {badge.earned ? (
                        <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                          ✓ Earned (+{badge.xpReward} XP)
                        </span>
                      ) : (
                        <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>
                          +{badge.xpReward} XP Reward
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CHALLENGES                                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'challenges' && (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-panel" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>Active Season Challenges</h3>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Complete tasks to earn bonus XP and power-level your profile
                  </p>
                </div>
                <span className="badge badge-cyan" style={{ fontSize: '0.75rem' }}>Season 2026</span>
              </div>

              {challenges.map(ch => {
                const isCompleted = ch.progress >= ch.target;
                const percent = Math.min(100, Math.round((ch.progress / ch.target) * 100));
                return (
                  <div
                    key={ch.id}
                    className="glass-panel"
                    style={{
                      padding: '1.25rem',
                      border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-subtle)',
                      background: isCompleted ? 'rgba(16,185,129,0.03)' : undefined,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800 }}>{ch.title}</h4>
                          <span className={`badge ${ch.type === 'weekly' ? 'badge-cyan' : 'badge-purple'}`} style={{ fontSize: '0.62rem' }}>
                            {ch.type}
                          </span>
                          {isCompleted && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                              ✓ Completed
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{ch.desc}</p>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 900, color: 'var(--accent-amber)', fontSize: '1.15rem' }}>
                          +{ch.xp} XP
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{ch.deadline}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="progress-bar-track" style={{ height: 8, flex: 1 }}>
                        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isCompleted ? 'var(--primary-emerald)' : 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {ch.progress} / {ch.target}
                      </span>
                      {!isCompleted && ch.actionLink && (
                        <Link
                          to={ch.actionLink}
                          className="btn-secondary"
                          style={{ padding: '0.28rem 0.65rem', fontSize: '0.72rem', whiteSpace: 'nowrap' }}
                        >
                          {ch.actionLabel} →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: LEADERBOARD                                             */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'leaderboard' && (
            <div className="animate-fadeIn">
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  <Crown size={20} color="var(--accent-amber)" />
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Global Athlete Leaderboard</h3>
                  <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                    Live rankings • Updated daily
                  </span>
                </div>

                {/* Logged-in user's personalized standing card */}
                <div
                  style={{
                    padding: '1.1rem 1.35rem',
                    marginBottom: '1.75rem',
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.08))',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--primary-gradient)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        color: 'white',
                        fontSize: '1rem',
                      }}
                    >
                      #{userRankInfo.rank}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                          {user?.name || 'You'} (Your Position)
                        </span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>YOU</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Level {userRankInfo.level} • {userRankInfo.title}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--accent-amber)', fontSize: '1.1rem' }}>
                      {userRankInfo.xp.toLocaleString()} XP
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {userRankInfo.xp === 0
                        ? 'Complete workouts & assessments to rise!'
                        : `${userRankInfo.xp.toLocaleString()} Total XP Accumulated`}
                    </div>
                  </div>
                </div>

                {/* Top 3 Podium */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '1rem', marginBottom: '2rem' }}>
                  {[BASE_LEADERBOARD[1], BASE_LEADERBOARD[0], BASE_LEADERBOARD[2]].map((p, i) => {
                    const heights = [100, 130, 80];
                    const colors = ['#94a3b8', '#f59e0b', '#cd7c34'];
                    return (
                      <div key={p.rank} style={{ textAlign: 'center', flex: 1, maxWidth: '120px' }}>
                        <img
                          src={p.avatar}
                          alt={p.name}
                          style={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: `3px solid ${colors[i]}`,
                            marginBottom: '0.5rem',
                          }}
                        />
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name.split(' ')[0]}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                          {p.xp.toLocaleString()} XP
                        </div>
                        <div
                          style={{
                            height: heights[i],
                            background: `${colors[i]}25`,
                            border: `1px solid ${colors[i]}40`,
                            borderRadius: '8px 8px 0 0',
                            marginTop: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}
                        >
                          {i === 1 ? '👑' : i === 0 ? '🥈' : '🥉'}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Full List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {BASE_LEADERBOARD.map(p => (
                    <div key={p.rank} className="leaderboard-row">
                      <div className={`leaderboard-rank ${p.rank <= 3 ? `rank-${p.rank}` : ''}`}>
                        {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : p.rank}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img src={p.avatar} alt={p.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Level {p.level}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{p.xp.toLocaleString()}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>XP</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 5: CERTIFICATES                                            */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'certificates' && (
            <div className="animate-fadeIn">
              <div className="grid-2" style={{ gap: '1.5rem' }}>
                {certificates.map(cert => (
                  <div
                    key={cert.id}
                    className="glass-panel"
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      background: cert.issued
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(6,182,212,0.04))'
                        : 'var(--bg-card)',
                      border: cert.issued
                        ? '1px solid rgba(16,185,129,0.3)'
                        : '1px solid var(--border-subtle)',
                      opacity: cert.issued ? 1 : 0.65,
                      position: 'relative',
                    }}
                  >
                    {!cert.issued ? (
                      <Lock size={20} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--text-dim)' }} />
                    ) : (
                      <ShieldCheck size={22} style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', color: 'var(--primary-emerald)' }} />
                    )}

                    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📜</div>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.35rem', fontWeight: 800 }}>{cert.title}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                      {cert.subtitle}
                    </p>

                    {cert.issued ? (
                      <>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>
                          Issued: <strong>{cert.date}</strong> • ID: <code>{cert.code}</code>
                        </div>
                        <button
                          className="btn-primary"
                          style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          onClick={() => setSelectedCert(cert)}
                        >
                          <Download size={14} /> View & Download Certificate
                        </button>
                      </>
                    ) : (
                      <div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                          Status: <strong>Locked (Requirement Pending)</strong>
                        </div>
                        <Link
                          to={cert.actionLink}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {cert.actionLabel} →
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CERTIFICATE MODAL PREVIEW & PRINT                              */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {selectedCert && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(5, 12, 22, 0.85)',
                backdropFilter: 'blur(6px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
              onClick={() => setSelectedCert(null)}
            >
              <div
                style={{
                  background: '#0f172a',
                  color: '#fff',
                  border: '2px solid rgba(16,185,129,0.5)',
                  borderRadius: '16px',
                  maxWidth: '640px',
                  width: '100%',
                  padding: '2.5rem',
                  textAlign: 'center',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setSelectedCert(null)}
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={20} />
                </button>

                <div style={{ border: '2px dashed rgba(16,185,129,0.3)', padding: '2rem 1.5rem', borderRadius: '12px', background: 'rgba(15,23,42,0.6)' }}>
                  <div style={{ fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--primary-emerald)', fontWeight: 800, marginBottom: '0.5rem' }}>
                    SMARTFIT ADVENTURE PLATFORM
                  </div>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.25rem', color: '#fff' }}>
                    CERTIFICATE OF ACHIEVEMENT
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                    This credential is proudly awarded to
                  </p>
                  <h3 style={{ fontSize: '1.6rem', color: '#38bdf8', fontWeight: 900, marginBottom: '1rem' }}>
                    {user?.name || 'Athlete Member'}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#e2e8f0', maxWidth: '420px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                    For successful completion of <strong>{selectedCert.title}</strong> demonstrating commitment to endurance, safety, and outdoor excellence.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.25rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <div>
                      <div>Date Issued</div>
                      <strong style={{ color: '#fff' }}>{selectedCert.date}</strong>
                    </div>
                    <div style={{ width: 50, height: 50, borderRadius: '50%', border: '2px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      🏅
                    </div>
                    <div>
                      <div>Credential Code</div>
                      <strong style={{ color: '#fff' }}>{selectedCert.code}-{user?._id?.slice(-5) || 'VER'}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => window.print()}
                  >
                    <Printer size={15} /> Print / Save as PDF
                  </button>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}
                    onClick={() => setSelectedCert(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Engagement;
