import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dumbbell, Users, ClipboardList, Activity,
  TrendingUp, Star, ArrowUpRight, CheckCircle2,
  BarChart2, Target, Zap,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

// ── Static training plans (mirrors server data) ──────────────────────────────
const PLANS = [
  {
    id: 'tp1',
    title: 'Pre-Expedition Fitness Prep',
    level: 'Intermediate',
    durationWeeks: 8,
    description: '8-week programme to prepare participants for high-altitude treks.',
    phases: [
      { week: '1-2', focus: 'Base Cardio & Mobility',    sessions: 4 },
      { week: '3-4', focus: 'Strength Foundation',        sessions: 5 },
      { week: '5-6', focus: 'Altitude Simulation',        sessions: 5 },
      { week: '7-8', focus: 'Peak Performance Taper',     sessions: 3 },
    ],
    color: '#8b5cf6',
  },
  {
    id: 'tp2',
    title: 'HIIT & Endurance Booster',
    level: 'Advanced',
    durationWeeks: 6,
    description: '6-week intensive programme combining HIIT with long-distance endurance.',
    phases: [
      { week: '1-2', focus: 'VO2 Max Intervals',          sessions: 5 },
      { week: '3-4', focus: 'Threshold Endurance',        sessions: 5 },
      { week: '5-6', focus: 'Race-Pace Consolidation',    sessions: 4 },
    ],
    color: '#ef4444',
  },
  {
    id: 'tp3',
    title: 'Beginner Foundation Plan',
    level: 'Beginner',
    durationWeeks: 4,
    description: 'Gentle 4-week introduction to structured exercise for new participants.',
    phases: [
      { week: '1',   focus: 'Body Awareness & Posture',   sessions: 3 },
      { week: '2',   focus: 'Light Cardio Intro',          sessions: 3 },
      { week: '3-4', focus: 'Building Consistency',        sessions: 4 },
    ],
    color: '#10b981',
  },
];

const levelColors = {
  Beginner:     { bg: 'rgba(16,185,129,0.12)',  text: '#10b981' },
  Intermediate: { bg: 'rgba(245,158,11,0.12)',  text: '#f59e0b' },
  Advanced:     { bg: 'rgba(239,68,68,0.12)',   text: '#ef4444' },
  Elite:        { bg: 'rgba(139,92,246,0.12)',  text: '#8b5cf6' },
};

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [participants, setParticipants] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [pRes, aRes] = await Promise.allSettled([
          API.get('/trainer/participants'),
          API.get('/trainer/assessments'),
        ]);
        if (pRes.status === 'fulfilled') setParticipants(pRes.value.data || []);
        if (aRes.status === 'fulfilled') setAssessments(aRes.value.data || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />

        <main style={{ padding: '2rem 2rem 4rem 1rem' }}>
          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                <Dumbbell size={14} /> TRAINER WORKSPACE
              </div>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                Welcome, <span className="text-gradient">{user?.name || 'Trainer'}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                Manage training plans, track assessments and monitor participant progress
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/fitness/assessment" className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <ClipboardList size={16} /> Run Assessment
              </Link>
              <Link to="/fitness" className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <Dumbbell size={16} /> Workouts
              </Link>
            </div>
          </div>

          {/* ── KPI Cards ── */}
          <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(139,92,246,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#8b5cf6' }}>
                <Users size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Participants</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>
                  {loading ? '—' : participants.length}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(16,185,129,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#10b981' }}>
                <Activity size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Assessments Logged</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>
                  {loading ? '—' : assessments.length}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(245,158,11,0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#f59e0b' }}>
                <ClipboardList size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Training Plans</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>{PLANS.length}</h3>
              </div>
            </div>
          </div>

          {/* ── Training Plans ── */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Target size={20} color="#8b5cf6" /> Training Plans
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {PLANS.map((plan) => {
                const lc = levelColors[plan.level] || levelColors.Intermediate;
                const isOpen = activePlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    style={{
                      background: isOpen ? `${plan.color}08` : 'rgba(15,23,42,0.03)',
                      border: `1.5px solid ${isOpen ? plan.color + '35' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div
                      onClick={() => setActivePlan(isOpen ? null : plan.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.1rem 1.25rem', cursor: 'pointer' }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-sm)', background: `${plan.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Dumbbell size={20} style={{ color: plan.color }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.15rem' }}>{plan.title}</h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{plan.description}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{ background: lc.bg, color: lc.text, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                          {plan.level}
                        </span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>{plan.durationWeeks}w</span>
                        <div style={{ color: 'var(--text-dim)', transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          <ArrowUpRight size={16} />
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div style={{ padding: '0 1.25rem 1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.6rem' }}>
                          {plan.phases.map((phase, i) => (
                            <div
                              key={i}
                              style={{
                                padding: '0.75rem',
                                background: `${plan.color}0d`,
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${plan.color}20`,
                              }}
                            >
                              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: plan.color, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                                Week {phase.week}
                              </div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.15rem' }}>
                                {phase.focus}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <Zap size={10} style={{ display: 'inline', marginRight: 3 }} />
                                {phase.sessions} sessions/week
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Participants List ── */}
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Users size={20} color="#8b5cf6" /> Participants
              </h3>
              <Link to="/fitness/assessment" style={{ color: '#8b5cf6', fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                Add Assessment <ArrowUpRight size={14} />
              </Link>
            </div>

            {loading ? (
              <Loader text="Loading participants..." />
            ) : participants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={42} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
                <p>No participants yet. Users will appear here after they register.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {participants.slice(0, 8).map((p) => {
                  const lc = levelColors[p.fitnessLevel] || levelColors.Intermediate;
                  const score = p.fitnessAssessment?.assessmentScore ?? p.fitnessScore ?? 0;
                  return (
                    <div
                      key={p._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem 1.1rem',
                        background: 'rgba(15,23,42,0.03)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)',
                        flexWrap: 'wrap',
                      }}
                    >
                      <img
                        src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                        alt={p.name}
                        style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-subtle)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.email}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap' }}>
                        <span style={{ background: lc.bg, color: lc.text, fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px' }}>
                          {p.fitnessLevel}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <BarChart2 size={14} color="var(--text-dim)" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444' }}>
                            {score}/100
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Star size={13} color="#f59e0b" />
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Lv.{p.level || 1}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {participants.length > 8 && (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: '0.5rem' }}>
                    + {participants.length - 8} more participants
                  </p>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrainerDashboard;
