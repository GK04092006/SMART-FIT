import React, { useMemo, useState } from 'react';
import { Compass, Mountain, Route, MapPinned, Trophy, Star, Sparkles, TimerReset, Wind } from 'lucide-react';

const TERRAIN_WEIGHTS = {
  flat: 12,
  mixed: 18,
  rocky: 24,
  mountain: 32,
};

const WEATHER_PENALTIES = {
  clear: 0,
  cloudy: 5,
  windy: 10,
  rainy: 18,
  stormy: 28,
};

const calculateDifficulty = ({ distanceKm, elevationM, terrain, durationHours, weather }) => {
  const distanceScore = Number(distanceKm || 0) * 3.2;
  const elevationScore = Number(elevationM || 0) * 0.035;
  const terrainScore = TERRAIN_WEIGHTS[terrain] || 18;
  const durationScore = Number(durationHours || 0) * 7;
  const weatherScore = WEATHER_PENALTIES[weather] || 0;

  const score = Math.min(100, Math.round(distanceScore + elevationScore + terrainScore + durationScore + weatherScore));

  if (score >= 85) return { score, label: 'Advanced', accent: '#f43f5e' };
  if (score >= 65) return { score, label: 'Intermediate', accent: '#10b981' };
  if (score >= 45) return { score, label: 'Beginner', accent: '#06b6d4' };
  return { score, label: 'Easy', accent: '#a78bfa' };
};

const buildItinerary = (routeName, terrain, durationHours) => {
  const base = [
    'Pre-start briefing and gear check',
    'Warm-up and mobility drills',
    'Main route ascent / trail movement',
    'Hydration and checkpoint review',
    'Return descent and recovery walk',
  ];

  if (terrain === 'mountain') {
    base.splice(2, 0, 'Steady ridge walk with pace management');
  }

  if (durationHours >= 6) {
    base.splice(3, 0, 'Long-form checkpoint break and snack stop');
  }

  return base.map((step, index) => ({
    time: `${String((index + 1) * 1.5).padStart(2, '0')}:00 hrs`,
    title: step,
    note: `${routeName} • ${terrain.charAt(0).toUpperCase() + terrain.slice(1)} terrain`,
  }));
};

const samplePassport = [
  { title: 'Kodaikanal Ridge Hike', location: 'Tamil Nadu', date: '2025-02-10', tier: 'Beginner' },
  { title: 'Rishikesh River Circuit', location: 'Uttarakhand', date: '2025-04-18', tier: 'Intermediate' },
  { title: 'Ladakh Glacier Trek', location: 'Ladakh', date: '2026-01-12', tier: 'Advanced' },
];

const AdventurePlanner = () => {
  const [form, setForm] = useState({
    routeName: 'Kashmir Meadow Loop',
    distanceKm: 14,
    elevationM: 900,
    terrain: 'mountain',
    durationHours: 5,
    weather: 'windy',
  });

  const [routeSegments, setRouteSegments] = useState([
    { name: 'Base Camp', distance: 3, elevation: 180 },
    { name: 'River Bend', distance: 5, elevation: 240 },
    { name: 'Ridge Point', distance: 4, elevation: 340 },
  ]);

  const totalDistance = routeSegments.reduce((sum, seg) => sum + Number(seg.distance || 0), 0);
  const totalElevation = routeSegments.reduce((sum, seg) => sum + Number(seg.elevation || 0), 0);
  const difficulty = useMemo(() => calculateDifficulty({
    distanceKm: form.distanceKm || totalDistance,
    elevationM: form.elevationM || totalElevation,
    terrain: form.terrain,
    durationHours: form.durationHours,
    weather: form.weather,
  }), [form, totalDistance, totalElevation]);

  const itinerary = useMemo(() => buildItinerary(form.routeName, form.terrain, Number(form.durationHours || 1)), [form]);

  const progression = useMemo(() => {
    const completedCount = samplePassport.length;
    if (completedCount >= 3) return { level: 'Advanced', hint: 'You can unlock high-altitude and multi-day expedition routes.' };
    if (completedCount >= 2) return { level: 'Intermediate', hint: 'Your performance supports moderate climbs and longer trail loops.' };
    return { level: 'Beginner', hint: 'Start with shorter routes and steady conditioning blocks.' };
  }, []);

  const addSegment = () => {
    setRouteSegments((prev) => [...prev, { name: `Checkpoint ${prev.length + 1}`, distance: 2, elevation: 120 }]);
  };

  const updateSegment = (index, field, value) => {
    setRouteSegments((prev) => prev.map((segment, i) => (
      i === index ? { ...segment, [field]: value } : segment
    )));
  };

  return (
    <div style={{ background: '#f8fafc', minHeight: '100vh', color: '#0f172a', padding: '2rem 1.5rem 4rem' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.8rem', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', color: '#059669', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', fontSize: '0.68rem' }}>
            <Compass size={12} /> Adventure tools
          </div>
          <h1 style={{ marginTop: '0.8rem', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 900 }}>Adventure planning suite</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Difficulty score', value: `${difficulty.score}/100`, color: '#f43f5e' },
            { label: 'Distance', value: `${form.distanceKm || totalDistance} km`, color: '#06b6d4' },
            { label: 'Elevation', value: `${form.elevationM || totalElevation} m`, color: '#8b5cf6' },
            { label: 'Progression', value: progression.level, color: '#10b981' },
          ].map((item) => (
            <div key={item.label} style={{ background: '#fff', borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', padding: '1rem 1.1rem', boxShadow: '0 12px 28px rgba(15,23,42,0.04)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#64748b' }}>{item.label}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '1.5rem', fontWeight: 900, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Difficulty Calculator</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Score the route</h2>
                </div>
                <Mountain size={18} color="#f43f5e" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '1rem' }}>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Route name
                  <input value={form.routeName} onChange={(e) => setForm({ ...form, routeName: e.target.value })} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Distance (km)
                  <input type="number" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Elevation (m)
                  <input type="number" value={form.elevationM} onChange={(e) => setForm({ ...form, elevationM: e.target.value })} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Duration (hrs)
                  <input type="number" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} style={{ width: '100%' }} />
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Terrain
                  <select value={form.terrain} onChange={(e) => setForm({ ...form, terrain: e.target.value })} style={{ width: '100%' }}>
                    <option value="flat">Flat</option>
                    <option value="mixed">Mixed</option>
                    <option value="rocky">Rocky</option>
                    <option value="mountain">Mountain</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 600, color: '#334155' }}>
                  Weather
                  <select value={form.weather} onChange={(e) => setForm({ ...form, weather: e.target.value })} style={{ width: '100%' }}>
                    <option value="clear">Clear</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="windy">Windy</option>
                    <option value="rainy">Rainy</option>
                    <option value="stormy">Stormy</option>
                  </select>
                </label>
              </div>

              <div style={{ marginTop: '1.2rem', background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(16,185,129,0.08))', borderRadius: 16, border: '1px solid rgba(244,63,94,0.12)', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#475569' }}>Difficulty rating</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 900, color: difficulty.accent }}>{difficulty.label}</span>
                </div>
                <div style={{ height: 12, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: `${difficulty.score}%`, height: '100%', background: `linear-gradient(90deg, ${difficulty.accent}, #38bdf8)`, borderRadius: 999 }} />
                </div>
                <div style={{ marginTop: '0.8rem', fontWeight: 600, color: '#334155' }}>
                  {difficulty.score >= 85 ? 'High risk and strong endurance build required.' : difficulty.score >= 65 ? 'Balanced challenge with moderate conditioning needs.' : difficulty.score >= 45 ? 'Good beginner-friendly route with manageable effort.' : 'Very approachable route for new participants.'}
                </div>
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Route Builder</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Custom route layout</h2>
                </div>
                <Route size={18} color="#8b5cf6" />
              </div>

              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {routeSegments.map((segment, index) => (
                  <div key={`${segment.name}-${index}`} style={{ background: '#f8fafc', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 14, padding: '0.85rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.8fr 0.8fr', gap: '0.7rem' }}>
                      <input value={segment.name} onChange={(e) => updateSegment(index, 'name', e.target.value)} />
                      <input type="number" value={segment.distance} onChange={(e) => updateSegment(index, 'distance', e.target.value)} placeholder="km" />
                      <input type="number" value={segment.elevation} onChange={(e) => updateSegment(index, 'elevation', e.target.value)} placeholder="m" />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" className="btn-secondary" onClick={addSegment} style={{ marginTop: '1rem' }}>
                Add route segment
              </button>

              <div style={{ marginTop: '1rem', background: '#f8fafc', borderRadius: 12, padding: '0.9rem', border: '1px solid rgba(148,163,184,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Total distance</span>
                  <strong style={{ fontSize: '1.15rem' }}>{totalDistance} km</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>Total climb</span>
                  <strong>{totalElevation} m</strong>
                </div>
              </div>
            </section>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem' }}>
            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Itinerary Generator</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Event timeline</h2>
                </div>
                <TimerReset size={18} color="#06b6d4" />
              </div>

              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {itinerary.map((item) => (
                  <div key={item.title} style={{ background: '#f8fafc', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 12, padding: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                      <strong>{item.title}</strong>
                      <span style={{ color: '#64748b', fontWeight: 700 }}>{item.time}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.8rem' }}>{item.note}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Adventure Passport</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Your progress</h2>
                </div>
                <MapPinned size={18} color="#10b981" />
              </div>

              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {samplePassport.map((trip) => (
                  <div key={trip.title} style={{ background: '#f8fafc', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 12, padding: '0.8rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{trip.title}</strong>
                      <span style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: 999, background: 'rgba(16,185,129,0.12)', color: '#059669', fontWeight: 800 }}>{trip.tier}</span>
                    </div>
                    <div style={{ color: '#475569', fontSize: '0.8rem', marginTop: '0.35rem' }}>{trip.location} • {trip.date}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ background: '#fff', borderRadius: 20, border: '1px solid rgba(148,163,184,0.18)', padding: '1.25rem', boxShadow: '0 14px 30px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#64748b' }}>Progression System</div>
                  <h2 style={{ marginTop: '0.3rem', fontSize: '1.5rem', fontWeight: 800 }}>Level unlocks</h2>
                </div>
                <Trophy size={18} color="#f59e0b" />
              </div>

              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {[
                  { label: 'Beginner', value: 'Under 2 completed adventures', active: progression.level === 'Beginner' },
                  { label: 'Intermediate', value: '2+ completed adventures', active: progression.level === 'Intermediate' },
                  { label: 'Advanced', value: '3+ completed adventures', active: progression.level === 'Advanced' },
                ].map((level) => (
                  <div key={level.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', background: level.active ? 'rgba(16,185,129,0.08)' : '#f8fafc', border: `1px solid ${level.active ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.15)'}`, borderRadius: 12, padding: '0.8rem 0.9rem' }}>
                    <div>
                      <div style={{ fontWeight: 800 }}>{level.label}</div>
                      <div style={{ color: '#475569', fontSize: '0.8rem' }}>{level.value}</div>
                    </div>
                    {level.active && <Star size={18} color="#f59e0b" />}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '0.9rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.18)', borderRadius: 12, padding: '0.8rem', color: '#065f46', fontWeight: 600 }}>
                {progression.hint}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdventurePlanner;
