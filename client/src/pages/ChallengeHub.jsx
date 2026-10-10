import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Flame,
  Target,
  CalendarRange,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Activity,
  Mountain,
  Clock3,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const initialChallenges = [
  {
    id: 1,
    title: '7-Day Cardio Streak',
    type: 'Fitness',
    goal: 'Complete 30 mins of cardio daily',
    progress: 5,
    target: 7,
    reward: 'Unlock a free recovery session',
    accent: '#10b981',
  },
  {
    id: 2,
    title: 'Summit Preparation',
    type: 'Adventure',
    goal: 'Finish 3 altitude training blocks',
    progress: 2,
    target: 3,
    reward: 'Priority access to Himalayan trek',
    accent: '#06b6d4',
  },
  {
    id: 3,
    title: 'Strength Reset',
    type: 'Strength',
    goal: 'Hit 4 strength sessions this week',
    progress: 3,
    target: 4,
    reward: 'Earn 200 points for the leaderboard',
    accent: '#a78bfa',
  },
];

const weekPlan = [
  { day: 'Mon', done: true, label: 'Mobility' },
  { day: 'Tue', done: true, label: 'HIIT' },
  { day: 'Wed', done: false, label: 'Recovery' },
  { day: 'Thu', done: false, label: 'Strength' },
  { day: 'Fri', done: true, label: 'Run' },
  { day: 'Sat', done: false, label: 'Hike' },
  { day: 'Sun', done: false, label: 'Stretch' },
];

const checklist = [
  'Hydration target reached',
  'Warm-up completed',
  'Recovery stretch finished',
  'Sleep target above 7 hours',
];

const ChallengeHub = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState(initialChallenges);
  const [selectedDay, setSelectedDay] = useState('Fri');

  const completedChallenges = useMemo(
    () => challenges.filter((challenge) => challenge.progress >= challenge.target).length,
    [challenges]
  );

  const totalProgress = useMemo(
    () => Math.round((challenges.reduce((sum, item) => sum + item.progress, 0) / challenges.reduce((sum, item) => sum + item.target, 0)) * 100),
    [challenges]
  );

  const handleLogProgress = (id) => {
    setChallenges((current) =>
      current.map((challenge) => {
        if (challenge.id !== id) return challenge;
        const nextProgress = Math.min(challenge.progress + 1, challenge.target);
        return { ...challenge, progress: nextProgress };
      })
    );
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(6,182,212,0.82), rgba(16,185,129,0.82))',
          padding: '3rem 1.5rem 2rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.7rem', borderRadius: 999, background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.15)', color: '#d1fae5', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                <Sparkles size={12} /> Challenge hub
              </div>
              <h1 style={{ marginTop: '1rem', fontSize: 'clamp(2.2rem,4vw,3.4rem)', fontWeight: 900, color: '#fff', lineHeight: 1.05 }}>
                {user?.name ? `${user.name.split(' ')[0]}'s` : 'Your'} momentum plan
              </h1>
            </div>
            <button
              className="btn-secondary"
              onClick={() => navigate('/fitness/assessment')}
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(12px)',
              }}
            >
              Review fitness profile <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Weekly streak', value: '12 days', icon: Flame, color: '#f59e0b' },
            { label: 'Goals complete', value: `${completedChallenges}/${challenges.length}`, icon: Trophy, color: '#10b981' },
            { label: 'Active progress', value: `${totalProgress}%`, icon: Target, color: '#06b6d4' },
            { label: 'Next session', value: '6:30 PM', icon: Clock3, color: '#a78bfa' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 16, padding: '1rem 1.1rem', boxShadow: '0 15px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
                <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${color}14`, color }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 15px 30px rgba(15,23,42,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Live goals</div>
                <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Current challenge ladder</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#10b981', fontWeight: 700 }}>
                <Activity size={16} /> {totalProgress}% complete
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {challenges.map((challenge) => {
                const ratio = (challenge.progress / challenge.target) * 100;
                const isComplete = challenge.progress >= challenge.target;

                return (
                  <div key={challenge.id} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 16, background: '#f8fafc', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'inline-flex', padding: '0.28rem 0.55rem', borderRadius: 999, background: `${challenge.accent}18`, color: challenge.accent, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                          {challenge.type}
                        </div>
                        <h3 style={{ marginTop: '0.6rem', fontSize: '1.1rem', fontWeight: 800 }}>{challenge.title}</h3>
                      </div>
                      <button
                        onClick={() => handleLogProgress(challenge.id)}
                        className="btn-primary"
                        disabled={isComplete}
                        style={{ opacity: isComplete ? 0.7 : 1, padding: '0.6rem 1rem', fontSize: '0.82rem' }}
                      >
                        {isComplete ? 'Completed' : 'Log progress'}
                      </button>
                    </div>

                    <p style={{ color: '#475569', marginBottom: '0.7rem' }}>{challenge.goal}</p>
                    <div style={{ width: '100%', background: '#e2e8f0', borderRadius: 999, height: 12, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${ratio}%`,
                          height: '100%',
                          background: `linear-gradient(90deg, ${challenge.accent}, ${challenge.accent}bb)`,
                          borderRadius: 999,
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.55rem', color: '#475569', fontSize: '0.8rem', fontWeight: 600 }}>
                      <span>{challenge.progress}/{challenge.target} steps</span>
                      <span>{challenge.reward}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 15px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Weekly rhythm</h3>
                <CalendarRange size={18} color="#10b981" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.5rem' }}>
                {weekPlan.map(({ day, done, label }) => (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    style={{
                      padding: '0.72rem 0.2rem',
                      borderRadius: 12,
                      border: selectedDay === day ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(148,163,184,0.2)',
                      background: selectedDay === day ? '#ecfdf5' : '#f8fafc',
                      color: '#0f172a',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>{day}</div>
                    <div style={{ marginTop: '0.4rem', color: done ? '#10b981' : '#475569', fontSize: '0.68rem', fontWeight: 700 }}>
                      {done ? 'Done' : label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 15px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Recovery checklist</h3>
                <CheckCircle2 size={18} color="#10b981" />
              </div>

              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {checklist.map((item) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', background: '#f8fafc', padding: '0.7rem 0.8rem', borderRadius: 12 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <CheckCircle2 size={14} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.12))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                <Mountain size={15} /> Coach note
              </div>
              <p style={{ marginTop: '0.7rem', fontSize: '0.96rem', lineHeight: 1.6, color: '#0f172a' }}>
                You are ahead of schedule for this week. Keep the intensity steady and protect your recovery before the weekend trek block.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeHub;
