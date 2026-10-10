import React, { useMemo, useEffect, useState } from 'react';
import { BrainCircuit, Sparkles, Target, MapPinned, TrendingUp, CalendarClock, Search, ArrowRight, LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

const adventureCatalog = [
  {
    id: 1,
    title: 'Beginner Himalayan Trek',
    category: 'Trekking',
    difficulty: 'Beginner',
    location: 'Manali',
    interest: 'Scenic',
    experience: 'Low',
    weekend: true,
    duration: '2 days',
    score: 88,
  },
  {
    id: 2,
    title: 'Weekend River Rafting',
    category: 'Kayaking',
    difficulty: 'Beginner',
    location: 'Rishikesh',
    interest: 'Adventure',
    experience: 'Low',
    weekend: true,
    duration: '1 day',
    score: 82,
  },
  {
    id: 3,
    title: 'High-Altitude Trek',
    category: 'Trekking',
    difficulty: 'Advanced',
    location: 'Ladakh',
    interest: 'Challenge',
    experience: 'High',
    weekend: false,
    duration: '6 days',
    score: 91,
  },
  {
    id: 4,
    title: 'Forest Trail Run',
    category: 'Running',
    difficulty: 'Intermediate',
    location: 'Bengaluru',
    interest: 'Cardio',
    experience: 'Medium',
    weekend: true,
    duration: '2 hours',
    score: 76,
  },
  {
    id: 5,
    title: 'Rock Climbing Weekend',
    category: 'Rock Climbing',
    difficulty: 'Intermediate',
    location: 'Hampi',
    interest: 'Strength',
    experience: 'Medium',
    weekend: true,
    duration: '3 days',
    score: 80,
  },
];

const parseNaturalQuery = (text) => {
  const q = text.toLowerCase();
  const filters = { beginner: 'Beginner', trekking: 'Trekking', kayaking: 'Kayaking', weekend: true };

  return {
    difficulty: q.includes('advanced') ? 'Advanced' : q.includes('beginner') ? 'Beginner' : q.includes('intermediate') ? 'Intermediate' : 'All',
    category: q.includes('trek') ? 'Trekking' : q.includes('kayak') ? 'Kayaking' : q.includes('climb') ? 'Rock Climbing' : q.includes('run') ? 'Running' : 'All',
    weekendOnly: q.includes('weekend'),
  };
};

const getCoachAdvice = (score, user) => {
  const name = user?.name?.split(' ')[0] || 'Athlete';
  if (score >= 85) {
    return `${name}, you are in excellent shape. Keep the current volume, add one long-form endurance block, and prioritize recovery before your next expedition.`;
  }
  if (score >= 70) {
    return `${name}, your base is strong. Increase strength and mobility, and keep two cardio sessions weekly to push your readiness upward.`;
  }
  return `${name}, focus on consistency before intensity. Add 3 steady cardio sessions, mobility work, and short strength circuits to build a safer base.`;
};

const AICoach = () => {
  const { user } = useAuth();
  const [naturalQuery, setNaturalQuery] = useState('Show beginner trekking events this weekend');
  const [selectedAdventure, setSelectedAdventure] = useState(adventureCatalog[0]);
  const [experience, setExperience] = useState('Intermediate');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fitnessScore = user?.fitnessScore || 82;
  const readinessScore = Math.min(100, Math.round((fitnessScore * 0.65) + (experience === 'Advanced' ? 20 : experience === 'Intermediate' ? 12 : 8) + 8));

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await API.get('/ai/recommendations', {
          params: {
            query: naturalQuery,
            fitnessScore,
            fitnessLevel: user?.fitnessLevel || 'Intermediate',
            preferredDifficulty: experience,
            favoriteCategories: 'Trekking,Kayaking,Rock Climbing',
            location: user?.location || '',
            interests: 'Fitness,Adventure,Outdoors',
          },
        });

        const items = data.recommendations || [];
        setRecommendations(items);
        if (items.length > 0) setSelectedAdventure(items[0]);
      } catch (err) {
        setRecommendations(adventureCatalog.map((adventure) => ({
          ...adventure,
          matchScore: Math.min(99, adventure.score + (experience === 'Advanced' ? 18 : experience === 'Intermediate' ? 10 : 6)),
          readinessScore: readinessScore,
          reasons: ['Offline fallback recommendation'],
          trainingPlan: ['3 cardio blocks with tempo effort', 'Strength session focused on legs and core', 'Mobility and recovery drills'],
        })));
        setError('Using locally generated suggestions while the recommendation service is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [naturalQuery, fitnessScore, experience, user?.fitnessLevel, user?.location]);

  const parsedSearch = parseNaturalQuery(naturalQuery);

  const searchResults = useMemo(() => {
    return adventureCatalog.filter((item) => {
      const matchesDifficulty = parsedSearch.difficulty === 'All' || item.difficulty === parsedSearch.difficulty;
      const matchesCategory = parsedSearch.category === 'All' || item.category === parsedSearch.category;
      const matchesWeekend = !parsedSearch.weekendOnly || item.weekend;
      return matchesDifficulty && matchesCategory && matchesWeekend;
    });
  }, [parsedSearch]);

  const trainingPlan = useMemo(() => {
    if (!selectedAdventure) return [];
    const plan = selectedAdventure.trainingPlan || selectedAdventure.adventure?.trainingPlan || [
      '2 cardio sessions with controlled intervals',
      '1 strength day emphasizing legs and core',
      '1 terrain-specific practice session',
      'Recovery / mobility drill after training',
    ];
    return plan;
  }, [selectedAdventure]);

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', borderRadius: 999, padding: '0.35rem 0.8rem', border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.08)', color: '#059669', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              <BrainCircuit size={12} /> AI Coach
            </div>
            <h1 style={{ marginTop: '0.8rem', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900 }}>Personalized fitness & adventure intelligence</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#fff', borderRadius: 999, padding: '0.55rem 0.8rem', border: '1px solid rgba(148,163,184,0.2)' }}>
            <Sparkles size={16} color="#10b981" />
            <span style={{ fontWeight: 700 }}>Live guidance</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Fitness score', value: `${fitnessScore}/100`, accent: '#10b981' },
            { label: 'Readiness', value: `${readinessScore}%`, accent: '#06b6d4' },
            { label: 'AI picks', value: `${recommendations.length}`, accent: '#a78bfa' },
            { label: 'Plan focus', value: 'Recovery', accent: '#f59e0b' },
          ].map(({ label, value, accent }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', padding: '1rem 1.1rem', boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>{label}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '1.6rem', fontWeight: 900, color: accent }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>AI Fitness Coach</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Personalized guidance</h2>
                </div>
                <Target size={18} color="#10b981" />
              </div>
              {error && (
                <div style={{ marginBottom: '0.8rem', background: '#fff7ed', border: '1px solid rgba(245,158,11,0.25)', color: '#9a5c00', borderRadius: 10, padding: '0.75rem 0.9rem', fontSize: '0.8rem' }}>
                  {error}
                </div>
              )}
              <p style={{ color: '#334155', lineHeight: 1.7 }}>{getCoachAdvice(fitnessScore, user)}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  'Increase weekly long-run endurance by 15%',
                  'Add 2 mobility sessions before training',
                  'Prioritize sleep and hydration',
                  'Use progressive overload for strength',
                ].map((tip) => (
                  <div key={tip} style={{ background: '#f8fafc', borderRadius: 12, padding: '0.8rem', color: '#334155', fontWeight: 600, border: '1px solid rgba(148,163,184,0.14)' }}>
                    {tip}
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Adventure readiness</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Readiness score engine</h2>
                </div>
                <TrendingUp size={18} color="#06b6d4" />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, color: '#334155' }}>Current experience level</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} style={{ width: '100%' }}>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12))', borderRadius: 16, padding: '1rem', border: '1px solid rgba(16,185,129,0.12)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#059669' }}>Adventure readiness</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>{readinessScore}%</span>
                </div>
                <div style={{ width: '100%', height: 12, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div style={{ width: `${readinessScore}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #06b6d4)', borderRadius: 999 }} />
                </div>
                <p style={{ marginTop: '0.7rem', color: '#334155', lineHeight: 1.6 }}>
                  {readinessScore >= 80
                    ? 'You are ready for a challenging experience with a manageable buffer for fatigue and weather.'
                    : readinessScore >= 65
                      ? 'You are close to the target range. A few extra conditioning sessions will increase safety margin.'
                      : 'You should complete more base conditioning before attempting this level of adventure.'}
                </p>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>AI recommendations</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Adventure matches</h2>
                </div>
                <MapPinned size={18} color="#a78bfa" />
              </div>

              <div style={{ display: 'grid', gap: '0.9rem' }}>
                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#475569', padding: '1rem 0' }}>
                    <LoaderCircle size={18} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Matching adventures to your profile…
                  </div>
                ) : (
                  recommendations.map((adventure) => (
                    <button
                      key={adventure.id}
                      onClick={() => setSelectedAdventure(adventure)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        background: selectedAdventure?.id === adventure.id ? '#f0fdf4' : '#f8fafc',
                        border: selectedAdventure?.id === adventure.id ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(148,163,184,0.18)',
                        borderRadius: 14,
                        padding: '0.85rem 0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>{adventure.category}</div>
                          <div style={{ marginTop: '0.2rem', fontWeight: 800, fontSize: '1rem' }}>{adventure.title}</div>
                        </div>
                        <div style={{ fontWeight: 900, color: '#059669' }}>{Math.round(adventure.matchScore || adventure.score || 0)}%</div>
                      </div>
                      <div style={{ marginTop: '0.45rem', fontSize: '0.82rem', color: '#475569' }}>{adventure.location} · {adventure.durationDays ? `${adventure.durationDays} days` : adventure.duration}</div>
                      <div style={{ marginTop: '0.45rem', fontSize: '0.75rem', color: '#64748b' }}>{(adventure.reasons || []).slice(0, 2).join(' • ')}</div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Smart training</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>{selectedAdventure?.title}</h2>
                </div>
                <CalendarClock size={18} color="#f59e0b" />
              </div>

              <div style={{ display: 'grid', gap: '0.65rem', marginTop: '1rem' }}>
                {trainingPlan.map((step, index) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.8rem', borderRadius: 12, background: '#f8fafc', border: '1px solid rgba(148,163,184,0.15)' }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ecfdf5', color: '#059669', fontWeight: 800 }}>{index + 1}</div>
                    <span style={{ fontWeight: 600, color: '#334155' }}>{step}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section style={{ marginTop: '1.5rem', background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>AI natural-language search</div>
              <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Search by intent</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#475569' }}>
              <Search size={16} /> Example: “Show beginner trekking events this weekend”
            </div>
          </div>

          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <input
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="Ask for events, difficulty, or time"
              style={{ width: '100%', paddingLeft: '3rem' }}
            />
            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.9rem' }}>
            {searchResults.length > 0 ? (
              searchResults.map((item) => (
                <div key={item.id} style={{ background: '#f8fafc', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: '0.95rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: '0.3rem' }}>{item.title}</div>
                  <div style={{ color: '#475569', fontSize: '0.82rem', marginBottom: '0.6rem' }}>{item.category} · {item.location}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.8rem', color: '#334155', fontWeight: 600 }}>
                    <span>{item.difficulty}</span>
                    <span>{item.weekend ? 'This weekend' : 'Planned later'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 12, color: '#475569' }}>No direct matches found. Try a broader query like “beginner trekking” or “weekend adventure”.</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AICoach;
