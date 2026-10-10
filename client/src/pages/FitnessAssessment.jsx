import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity, ArrowLeft, ArrowRight, Bell, Check, ChevronDown,
  ChevronRight, Compass, Dumbbell, HeartPulse, Info, Mountain,
  RefreshCw, Search, ShieldCheck, Trophy, Wind, Zap,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

/* ─────────────────────────── CONSTANTS ──────────────────────────────── */
const STEPS = [
  {
    id: 1, label: 'Pulse',  subtitle: 'Cardio capacity',
    icon: HeartPulse, color: '#ef6a5b', bg: 'rgba(239,106,91,0.12)',
    description: 'Start with the signal your body gives at rest. This helps us understand your cardiovascular fitness and how well you can handle adventure activities like trekking, hiking and high-altitude expeditions.',
  },
  {
    id: 2, label: 'Power',  subtitle: 'Strength output',
    icon: Dumbbell,   color: '#d99a3d', bg: 'rgba(217,154,61,0.12)',
    description: 'Measure the force you can create on demand. Push-ups, squats, and plank times tell us how your muscles perform under load during adventure activities.',
  },
  {
    id: 3, label: 'Range',  subtitle: 'Movement quality',
    icon: Wind,       color: '#4f9d9d', bg: 'rgba(79,157,157,0.12)',
    description: 'See how freely and comfortably you move. Flexibility affects your ability to navigate uneven terrain, scramble over rocks, and avoid injury on the trail.',
  },
  {
    id: 4, label: 'Engine', subtitle: 'Endurance reserve',
    icon: Activity,   color: '#6d7fc4', bg: 'rgba(109,127,196,0.12)',
    description: 'Finish with your ability to sustain effort over long distances. Endurance is your engine — the core driver of multi-day adventure performance.',
  },
];

const NAV_SECTIONS = [
  {
    label: 'MY SPACE',
    items: [
      { to: '/dashboard', label: 'Dashboard', emoji: '🏠' },
      { to: '/profile',   label: 'Profile',   emoji: '👤' },
    ],
  },
  {
    label: 'ADVENTURE MANAGEMENT',
    items: [
      { to: '/adventure',          label: 'Adventures',       emoji: '🧭' },
      { to: '/fitness/assessment', label: 'Fitness Readiness',emoji: '✅', accent: true },
      { to: '/booking',            label: 'My Bookings',      emoji: '🎟️' },
      { to: '/event-schedule',     label: 'Event Schedule',   emoji: '📅' },
      { to: '/equipment-rental',   label: 'Equipment Rental', emoji: '🎒' },
    ],
  },
  {
    label: 'PREPARATION',
    items: [
      { to: '/fitness',          label: 'Workout Plans',    emoji: '🏋️' },
      { to: '/fitness/goals',    label: 'Fitness Goals',    emoji: '🎯' },
      { to: '/fitness/progress', label: 'Progress Tracking',emoji: '📈' },
      { to: '/diet-plans',       label: 'Diet Plans',       emoji: '🥗' },
      { to: '/bmi-calculator',   label: 'BMI Calculator',   emoji: '⚖️' },
    ],
  },
  {
    label: 'ENGAGEMENT',
    items: [
      { to: '/engagement', label: 'XP & Rewards', emoji: '🏆' },
    ],
  },
];

const ROLE_BADGES = {
  admin:     { label: 'Admin',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
  organizer: { label: 'Organizer',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)'  },
  trainer:   { label: 'Trainer',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)'  },
  guide:     { label: 'Guide',       color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'   },
  user:      { label: 'Participant', color: '#10b981', bg: 'rgba(16,185,129,0.12)'  },
};

const initialForm = {
  cardioScore: 0, restingHR: '', vo2MaxEstimate: '',
  strengthScore: 0, pushUps: '', squats: '', plankSeconds: '',
  flexibilityScore: 0, sitAndReachCm: '', shoulderFlexibility: 'Average',
  enduranceScore: 0, runDistanceKm: '', recoveryRate: 'Moderate', notes: '',
};

const getLevel = s => s >= 80 ? 'Elite' : s >= 60 ? 'Advanced' : s >= 40 ? 'Intermediate' : 'Beginner';

/* ─────────────────────────── SCORE RING ─────────────────────────────── */
const ScoreRing = ({ score }) => {
  const r = 32, circ = 2 * Math.PI * r;
  return (
    <div className="fa2-ring">
      <svg viewBox="0 0 80 80" width="80" height="80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="6" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#10b981" strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          transform="rotate(-90 40 40)"
          strokeLinecap="round"
        />
      </svg>
      <div className="fa2-ring-text">
        <strong>{score}%</strong>
        <span>Completed</span>
      </div>
    </div>
  );
};

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
const FitnessAssessment = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user }  = useAuth();

  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState(initialForm);
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState('');
  const [prevResult, setPrevResult] = useState(null);
  const [searchVal, setSearchVal]   = useState('');

  const role  = user?.role || 'user';
  const badge = ROLE_BADGES[role] || ROLE_BADGES.user;

  useEffect(() => {
    API.get('/assessment/my').then(r => { if (r.data) setPrevResult(r.data); }).catch(() => {});
  }, []);

  const update = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const setNum = (name, val) => setForm(f => ({ ...f, [name]: String(val) }));

  const computeCardio    = () => { const v = Number(form.restingHR); if (v > 0) setNum('cardioScore', v <= 50 ? 95 : v <= 60 ? 80 : v <= 70 ? 65 : v <= 80 ? 50 : 35); };
  const computeStrength  = () => { const p = Number(form.pushUps), s = Number(form.squats); if (p > 0 || s > 0) setNum('strengthScore', Math.min(100, Math.round(p * 1.5 + s * 0.8))); };
  const computeFlex      = () => { const v = Number(form.sitAndReachCm); if (v > 0) setNum('flexibilityScore', v >= 30 ? 95 : v >= 20 ? 80 : v >= 10 ? 65 : 50); };
  const computeEndurance = () => { const v = Number(form.runDistanceKm); if (v > 0) setNum('enduranceScore', v >= 3 ? 95 : v >= 2.5 ? 85 : v >= 2 ? 70 : v >= 1.5 ? 55 : 35); };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const nums = ['cardioScore','strengthScore','flexibilityScore','enduranceScore','pushUps','squats','plankSeconds','sitAndReachCm','runDistanceKm'];
      const payload = { ...form };
      nums.forEach(k => { payload[k] = Number(form[k]) || 0; });
      payload.restingHR = Number(form.restingHR) || null;
      const { data } = await API.post('/assessment', payload);
      await API.patch('/assessment/my', {
        endurance: payload.enduranceScore, strength: payload.strengthScore,
        flexibility: payload.flexibilityScore, stamina: payload.enduranceScore,
      }).catch(() => {});
      setResult(data); setStep(5);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your assessment. Please try again.');
    } finally { setLoading(false); }
  };

  const areaStatus  = i => { if (step === 5) return 'Complete'; if (i + 1 < step) return 'Complete'; if (i + 1 === step) return 'In Progress'; return 'Not Started'; };
  const statusColor = s => s === 'Complete' ? '#10b981' : s === 'In Progress' ? '#ef6a5b' : '#94a3b8';
  const statusBg    = s => s === 'Complete' ? 'rgba(16,185,129,0.1)' : s === 'In Progress' ? 'rgba(239,106,91,0.1)' : 'rgba(148,163,184,0.08)';

  const current = STEPS[step - 1];
  const isActive = p => location.pathname === p || location.pathname.startsWith(p + '/');

  /* ── Reusable input field ── */
  const Field = ({ name, label, tooltip, unit, ...rest }) => (
    <div className="fa2-field-wrap">
      <div className="fa2-field-label">
        {label}
        {tooltip && <Info size={12} color="#94a3b8" style={{ marginLeft: 4, verticalAlign: 'middle', cursor: 'help' }} title={tooltip} />}
      </div>
      <div className="fa2-input-row">
        <input className="fa2-input" name={name} value={form[name]} onChange={update} {...rest} />
        {unit && <span className="fa2-unit">{unit}</span>}
      </div>
    </div>
  );

  /* ── Self-rating slider ── */
  const RatingSlider = ({ name, label }) => (
    <div className="fa2-slider-block">
      <div className="fa2-slider-top">
        <div>
          <div className="fa2-slider-label">{label}</div>
          <div className="fa2-slider-sub">How would you rate your current fitness level?</div>
        </div>
        <div className="fa2-slider-val">{form[name] || 0} <span>/ 100</span></div>
      </div>
      <input type="range" name={name} min="0" max="100" value={form[name] || 0} onChange={update} className="fa2-slider" />
      <div className="fa2-slider-marks">
        <span>Very Low<br /><small>(Beginner)</small></span>
        <span>Low</span>
        <span>Moderate</span>
        <span>Good</span>
        <span>Excellent<br /><small>(Athlete)</small></span>
      </div>
    </div>
  );

  return (
    <div className="fa2-shell">

      {/* ═══════════════ LEFT SIDEBAR ═══════════════ */}
      <aside className="fa2-sidebar">
        <Link to="/" className="fa2-logo">
          <div className="fa2-logo-mark"><Mountain size={17} color="#fff" /></div>
          <div>
            <div className="fa2-logo-name">Adventure</div>
            <div className="fa2-logo-sub">FITNESS</div>
          </div>
        </Link>

        <div className="fa2-role-badge" style={{ color: badge.color, background: badge.bg }}>
          {badge.label.toUpperCase()}
        </div>

        <nav className="fa2-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="fa2-nav-section">
              <div className="fa2-nav-label">{section.label}</div>
              {section.items.map(item => (
                <Link key={item.to} to={item.to}
                  className={`fa2-nav-item${isActive(item.to) ? ' fa2-nav-item--active' : ''}`}>
                  <span className="fa2-nav-emoji">{item.emoji}</span>
                  <span>{item.label}</span>
                  {isActive(item.to) && <ChevronRight size={13} className="fa2-nav-chevron" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="fa2-sidebar-art">
          <svg viewBox="0 0 220 90" preserveAspectRatio="none" width="100%" height="90">
            <defs>
              <linearGradient id="sfArtGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.7"/>
                <stop offset="100%" stopColor="#0f172a" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polygon points="0,90 45,18 85,55 130,5 170,38 220,90" fill="url(#sfArtGrad)" />
            <polygon points="0,90 45,28 85,65 130,15 170,48 220,90" fill="rgba(5,150,105,0.2)" />
          </svg>
        </div>
      </aside>

      {/* ═══════════════ MAIN AREA ═══════════════ */}
      <div className="fa2-main">

        {/* ── Topbar ── */}
        <header className="fa2-topbar">
          <div className="fa2-search-box">
            <Search size={14} className="fa2-search-icon" />
            <input className="fa2-search" placeholder="Search adventures, locations, or activities..."
              value={searchVal} onChange={e => setSearchVal(e.target.value)} />
          </div>
          <div className="fa2-topbar-right">
            <div className="fa2-bell">
              <Bell size={17} />
              <span className="fa2-bell-dot" />
            </div>
            <div className="fa2-user-chip">
              <img
                className="fa2-avatar"
                src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=80'}
                alt={user?.name || 'User'}
              />
              <div>
                <div className="fa2-user-name">{user?.name?.split(' ')[0] || user?.name || 'Athlete'}</div>
                <div className="fa2-user-role">{badge.label} <ChevronDown size={10} /></div>
              </div>
            </div>
          </div>
        </header>

        {/* ── Page scroll area ── */}
        <div className="fa2-page-body">

          {/* Hero banner */}
          <div className="fa2-hero">
            <div className="fa2-hero-inner">
              <h1 className="fa2-hero-title">
                Fitness <span className="fa2-hero-accent">Assessment</span>
              </h1>
              <p className="fa2-hero-sub">A four-minute check-in that turns how you feel today into a smarter training path.</p>

              {/* Step stepper */}
              <div className="fa2-stepper">
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const done   = step > s.id;
                  const active = step === s.id && step < 5;
                  return (
                    <React.Fragment key={s.id}>
                      <button
                        onClick={() => step < 5 && setStep(s.id)}
                        className={`fa2-step${active ? ' fa2-step--active' : ''}${done ? ' fa2-step--done' : ''}`}
                        style={active ? { borderColor: s.color, background: 'rgba(255,255,255,0.97)' } : {}}
                      >
                        <div className="fa2-step-icon-wrap"
                          style={{ background: active ? s.color : done ? '#10b981' : 'rgba(255,255,255,0.18)' }}>
                          {done ? <Check size={13} color="#fff" /> : <Icon size={13} color="#fff" />}
                        </div>
                        <div className="fa2-step-body">
                          <strong style={active ? { color: s.color } : {}}>{s.label}</strong>
                          <small>{s.subtitle}</small>
                        </div>
                        <div className="fa2-step-num">{s.id}</div>
                      </button>
                      {i < STEPS.length - 1 && (
                        <div className={`fa2-connector${done ? ' fa2-connector--done' : ''}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="fa2-hero-tagline">
              <em>Fitter You</em>
              <span>Brighter Adventures</span>
            </div>
          </div>

          {/* Content columns */}
          <div className="fa2-content-cols">

            {/* ── Form card ── */}
            <div className="fa2-card">
              {step < 5 && current && (
                <>
                  <div className="fa2-card-head">
                    <div className="fa2-card-head-left">
                      <div className="fa2-passport-tag">PASSPORT PAGE 0{step} / 04</div>
                      <div className="fa2-card-title-row">
                        <div className="fa2-card-icon" style={{ background: current.bg }}>
                          {React.createElement(current.icon, { size: 22, color: current.color })}
                        </div>
                        <h2 className="fa2-card-h2">
                          {step === 1 ? 'Cardio Capacity' : step === 2 ? 'Strength Output' : step === 3 ? 'Movement Quality' : 'Endurance Reserve'}
                        </h2>
                      </div>
                      <p className="fa2-card-desc">{current.description}</p>
                    </div>
                    <ScoreRing score={Math.round((step / 4) * 100)} />
                  </div>

                  <div className="fa2-form-body">
                    {step === 1 && (
                      <>
                        <div className="fa2-two-cols">
                          <Field name="restingHR" label="RESTING HEART RATE"
                            tooltip="Take this reading before getting out of bed."
                            unit="BPM" type="number" placeholder="65" min={30} max={120} onBlur={computeCardio} />
                          <Field name="vo2MaxEstimate" label="VO2 MAX ESTIMATE (OPTIONAL)"
                            tooltip="Leave empty if you're unsure. We'll estimate based on your other inputs."
                            unit="ml/kg/min" type="number" placeholder="45" />
                        </div>
                        <RatingSlider name="cardioScore" label="CARDIO SELF-RATING" />
                        <div className="fa2-hint">
                          <Zap size={13} color="#d97706" />
                          Take this reading before getting out of bed. Under 60 BPM is a strong starting signal.
                        </div>
                      </>
                    )}
                    {step === 2 && (
                      <>
                        <div className="fa2-two-cols">
                          <Field name="pushUps" label="PUSH-UPS · MAX REPS" type="number" placeholder="30" min={0} onBlur={computeStrength} />
                          <Field name="squats"  label="BODYWEIGHT SQUATS · MAX REPS" type="number" placeholder="50" min={0} onBlur={computeStrength} />
                        </div>
                        <Field name="plankSeconds" label="PLANK HOLD · SECONDS" unit="sec" type="number" placeholder="120" min={0} />
                        <RatingSlider name="strengthScore" label="STRENGTH SELF-RATING" />
                      </>
                    )}
                    {step === 3 && (
                      <>
                        <div className="fa2-two-cols">
                          <Field name="sitAndReachCm" label="SIT & REACH · CENTIMETRES" unit="cm" type="number" placeholder="15" onBlur={computeFlex} />
                          <div className="fa2-field-wrap">
                            <div className="fa2-field-label">SHOULDER MOBILITY</div>
                            <select className="fa2-input" name="shoulderFlexibility" value={form.shoulderFlexibility} onChange={update}>
                              {['Poor','Average','Good','Excellent'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="fa2-hint">
                          <Info size={13} color="#0891b2" />
                          Measure the distance past your toes. A negative value means you are still short of them.
                        </div>
                        <RatingSlider name="flexibilityScore" label="MOVEMENT SELF-RATING" />
                      </>
                    )}
                    {step === 4 && (
                      <>
                        <div className="fa2-two-cols">
                          <Field name="runDistanceKm" label="12-MINUTE RUN · KILOMETRES" unit="km" type="number" placeholder="2.4" step="0.1" min={0} onBlur={computeEndurance} />
                          <div className="fa2-field-wrap">
                            <div className="fa2-field-label">RECOVERY AFTER EFFORT</div>
                            <select className="fa2-input" name="recoveryRate" value={form.recoveryRate} onChange={update}>
                              {['Slow','Moderate','Fast','Elite'].map(v => <option key={v}>{v}</option>)}
                            </select>
                          </div>
                        </div>
                        <RatingSlider name="enduranceScore" label="ENDURANCE SELF-RATING" />
                        <div className="fa2-field-wrap">
                          <div className="fa2-field-label">NOTES FOR YOUR COACH · OPTIONAL</div>
                          <textarea className="fa2-input fa2-textarea" name="notes" value={form.notes} onChange={update}
                            placeholder="Injuries, conditions, or context worth knowing..." rows={3} />
                        </div>
                      </>
                    )}
                  </div>

                  {error && <p className="fa2-error">{error}</p>}

                  <div className="fa2-actions">
                    <button className="fa2-btn-back" onClick={() => setStep(v => Math.max(1, v - 1))} disabled={step === 1}>
                      <ArrowLeft size={14} /> Previous page
                    </button>
                    <div className="fa2-progress-saved">
                      <span className="fa2-saved-dot" /> Progress saved
                    </div>
                    <button className="fa2-btn-next" onClick={step === 4 ? submit : () => setStep(v => v + 1)} disabled={loading}>
                      {loading ? 'Reading your data...' : step === 4
                        ? <><Trophy size={14} /> Stamp my passport</>
                        : <>Next page <ArrowRight size={14} /></>}
                    </button>
                  </div>
                </>
              )}

              {/* Results */}
              {step === 5 && result && (
                <div className="fa2-results">
                  <div className="fa2-passport-tag">PASSPORT STAMPED / COMPLETE</div>
                  <h2>Here is your starting line.</h2>
                  <p className="fa2-card-desc">Your score is not a verdict. It is a useful place to begin building from.</p>
                  <div className="fa2-result-hero">
                    <div className="fa2-result-ring-wrap">
                      <svg viewBox="0 0 160 160" width="140" height="140">
                        <circle cx="80" cy="80" r="65" fill="none" stroke="rgba(16,185,129,0.12)" strokeWidth="10"/>
                        <circle cx="80" cy="80" r="65" fill="none" stroke="#10b981" strokeWidth="10"
                          strokeDasharray={2 * Math.PI * 65}
                          strokeDashoffset={2 * Math.PI * 65 * (1 - result.overallFitnessScore / 100)}
                          transform="rotate(-90 80 80)" strokeLinecap="round"/>
                      </svg>
                      <div className="fa2-result-ring-inner">
                        <strong>{result.overallFitnessScore}</strong><small>/ 100</small>
                      </div>
                    </div>
                    <div>
                      <div className="fa2-passport-tag">TODAY'S PROFILE</div>
                      <h3 style={{ fontSize: '1.5rem', margin: '0.25rem 0' }}>{getLevel(result.overallFitnessScore)} Athlete</h3>
                      <p className="fa2-card-desc">Now choose a challenge that feels ambitious and right for you.</p>
                      <button className="fa2-btn-next" style={{ marginTop: '1rem' }} onClick={() => navigate('/adventure')}>
                        Find my next adventure <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="fa2-breakdown">
                    {[
                      { label: 'Pulse',  score: result.cardioScore,      color: '#ef6a5b' },
                      { label: 'Power',  score: result.strengthScore,    color: '#d99a3d' },
                      { label: 'Range',  score: result.flexibilityScore, color: '#4f9d9d' },
                      { label: 'Engine', score: result.enduranceScore,   color: '#6d7fc4' },
                    ].map(item => (
                      <div key={item.label} className="fa2-bd-row">
                        <div className="fa2-bd-info">
                          <span>{item.label}</span>
                          <strong style={{ color: item.color }}>{item.score}</strong>
                        </div>
                        <div className="fa2-bd-track">
                          <div className="fa2-bd-fill" style={{ width: `${item.score}%`, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="fa2-btn-restart" onClick={() => { setStep(1); setResult(null); setForm(initialForm); }}>
                    <RefreshCw size={13} /> Take another snapshot
                  </button>
                </div>
              )}
            </div>

            {/* ── Right panel ── */}
            <aside className="fa2-right-panel">
              <div className="fa2-rp-card fa2-readiness-card">
                <div className="fa2-readiness-head">
                  <div className="fa2-readiness-icon-wrap"><ShieldCheck size={16} color="#10b981" /></div>
                  <div>
                    <div className="fa2-readiness-title">Adventure Readiness</div>
                    <div className="fa2-readiness-why">Why this matters?</div>
                  </div>
                </div>
                <p className="fa2-readiness-desc">
                  Your fitness assessment helps us determine whether you are <strong>READY</strong> or <strong>NOT READY</strong> for a
                  specific adventure. It checks your cardiovascular fitness, strength, movement quality and endurance
                  against the requirements of the selected expedition.
                </p>
                <div className="fa2-amber-box">
                  <div className="fa2-amber-dot" />
                  <div>
                    <strong>Assessment in progress</strong>
                    <p>Complete all 4 sections to see your adventure readiness result.</p>
                  </div>
                </div>
              </div>

              <div className="fa2-rp-card">
                <div className="fa2-rp-section-title">Assessment Areas</div>
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const stat = areaStatus(i);
                  return (
                    <div key={s.id} className="fa2-area-row">
                      <div className="fa2-area-icon" style={{ background: s.bg }}>
                        <Icon size={13} color={s.color} />
                      </div>
                      <div className="fa2-area-info">
                        <strong>{s.label}</strong>
                        <span>{s.subtitle}</span>
                      </div>
                      <div className="fa2-area-badge" style={{ background: statusBg(stat), color: statusColor(stat) }}>
                        {stat}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="fa2-cta-card">
                <div className="fa2-cta-overlay" />
                <div className="fa2-cta-text">
                  <em>Assess Today</em>
                  <span>Explore Tomorrow</span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FitnessAssessment;
