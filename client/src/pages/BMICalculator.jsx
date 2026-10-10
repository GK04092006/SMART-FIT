import React, { useState } from 'react';
import { Scale, TrendingUp, TrendingDown, Minus, Info, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar';

const BMI_CATEGORIES = [
  { label: 'Underweight', range: '< 18.5', color: '#0891b2', bg: '#cffafe', textColor: '#164e63' },
  { label: 'Normal',      range: '18.5–24.9', color: '#059669', bg: '#d1fae5', textColor: '#065f46' },
  { label: 'Overweight',  range: '25–29.9', color: '#d97706', bg: '#fef3c7', textColor: '#92400e' },
  { label: 'Obese',       range: '≥ 30', color: '#dc2626', bg: '#fee2e2', textColor: '#991b1b' },
];

const IDEAL_WEIGHT_TIPS = {
  Underweight: 'Focus on calorie-dense whole foods, strength training, and protein intake. Aim for 500 kcal surplus/day.',
  Normal: 'Excellent! Maintain your weight with balanced nutrition and regular cardio. You qualify for most adventure categories.',
  Overweight: 'Aim for a 500 kcal deficit per day with cardio 4–5 days/week. Small sustainable changes over time.',
  Obese: 'Consult a healthcare provider. Start with low-impact cardio (swimming, cycling) and a structured diet plan.',
};

const ADVENTURE_ELIGIBILITY = {
  Underweight: { eligible: ['Yoga Retreats', 'Easy Treks'], restricted: ['Extreme Treks', 'Skydiving'] },
  Normal: { eligible: ['All Adventures', 'Extreme Treks', 'Rock Climbing'], restricted: [] },
  Overweight: { eligible: ['Easy Treks', 'Rafting', 'Desert Safari'], restricted: ['Rock Climbing', 'Extreme Altitude'] },
  Obese: { eligible: ['Yoga Retreats', 'Nature Walks'], restricted: ['Most Adventure Sports'] },
};

const BMICalculator = () => {
  const [form, setForm] = useState({ height: '', weight: '', age: '', gender: 'male', unit: 'metric' });
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculate = () => {
    let heightM = parseFloat(form.height);
    let weightKg = parseFloat(form.weight);
    if (!heightM || !weightKg) return;

    if (form.unit === 'imperial') {
      heightM = heightM * 0.0254; // inches to m
      weightKg = weightKg * 0.4536; // lbs to kg
    } else {
      heightM = heightM / 100; // cm to m
    }

    const bmi = weightKg / (heightM * heightM);
    const cat = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
    const idealMin = Math.round(18.5 * heightM * heightM);
    const idealMax = Math.round(24.9 * heightM * heightM);
    const bmr = form.gender === 'male'
      ? Math.round(10 * weightKg + 6.25 * (heightM * 100) - 5 * parseFloat(form.age || 25) + 5)
      : Math.round(10 * weightKg + 6.25 * (heightM * 100) - 5 * parseFloat(form.age || 25) - 161);

    setResult({ bmi: Math.round(bmi * 10) / 10, category: cat, idealMin, idealMax, bmr, heightM, weightKg });
  };

  const cat = result ? BMI_CATEGORIES.find(c => c.label === result.category) : null;
  const pct = result ? Math.min(Math.max(((result.bmi - 10) / 30) * 100, 0), 100) : 0;

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', background: '#f8fafc' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span className="section-subtitle"><Scale size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Health Tools</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>BMI Calculator</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Calculate your Body Mass Index and understand its impact on adventure eligibility.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '2rem', alignItems: 'start' }}>
            {/* Input Card */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={18} color="var(--primary-emerald)" /> Enter Your Measurements
              </h3>

              {/* Unit Toggle */}
              <div className="tabs-container" style={{ marginBottom: '1.5rem' }}>
                <button className={`tab-btn ${form.unit === 'metric' ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, unit: 'metric' }))}>Metric (cm / kg)</button>
                <button className={`tab-btn ${form.unit === 'imperial' ? 'active' : ''}`} onClick={() => setForm(p => ({ ...p, unit: 'imperial' }))}>Imperial (in / lbs)</button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Height ({form.unit === 'metric' ? 'cm' : 'inches'})</label>
                  <input type="number" name="height" value={form.height} onChange={handleChange} placeholder={form.unit === 'metric' ? '175' : '69'} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight ({form.unit === 'metric' ? 'kg' : 'lbs'})</label>
                  <input type="number" name="weight" value={form.weight} onChange={handleChange} placeholder={form.unit === 'metric' ? '72' : '158'} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input type="number" name="age" value={form.age} onChange={handleChange} placeholder="25" />
                </div>
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} onClick={calculate}>
                Calculate BMI <ChevronRight size={16} />
              </button>

              {/* BMI Scale Reference */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(15,23,42,0.08)' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BMI Reference Scale</div>
                {BMI_CATEGORIES.map(c => (
                  <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.4rem 0' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.label}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{c.range}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Results Panel */}
            <div>
              {result ? (
                <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Main BMI Result */}
                  <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', background: cat.bg, border: `1px solid ${cat.color}40` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: cat.textColor, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Your BMI</div>
                    <div style={{ fontSize: '5rem', fontWeight: 900, color: cat.color, lineHeight: 1, marginBottom: '0.5rem' }}>{result.bmi}</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: cat.textColor, marginBottom: '1.5rem' }}>{result.category}</div>

                    {/* Gauge Bar */}
                    <div style={{ position: 'relative', height: 18, borderRadius: 9, overflow: 'hidden', background: 'linear-gradient(to right, #0891b2 0%, #059669 30%, #d97706 65%, #dc2626 100%)', marginBottom: '0.35rem' }}>
                      <div style={{ position: 'absolute', left: `calc(${pct}% - 8px)`, top: -1, width: 18, height: 18, borderRadius: '50%', background: '#1e293b', border: '3px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: cat.textColor, fontWeight: 700 }}>
                      <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid-3" style={{ gap: '1rem' }}>
                    {[
                      { label: 'Ideal Weight Range', value: `${result.idealMin}–${result.idealMax} kg`, icon: Scale, color: '#059669' },
                      { label: 'Basal Metabolic Rate', value: `${result.bmr} kcal/day`, icon: Flame, color: '#d97706' },
                      { label: 'Weight Status', value: result.category, icon: TrendingUp, color: cat.color },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <div key={label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                        <Icon size={20} color={color} style={{ marginBottom: '0.4rem' }} />
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.15rem' }}>{value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Health Advice */}
                  <div className="glass-panel" style={{ padding: '1.25rem', background: cat.bg, border: `1px solid ${cat.color}30` }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                      <Info size={18} color={cat.color} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', color: cat.textColor }}>Personalised Advice</div>
                        <p style={{ fontSize: '0.85rem', color: cat.textColor, lineHeight: 1.6 }}>{IDEAL_WEIGHT_TIPS[result.category]}</p>
                      </div>
                    </div>
                  </div>

                  {/* Adventure Eligibility */}
                  <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <div style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🏔️ Adventure Eligibility Based on BMI
                    </div>
                    {ADVENTURE_ELIGIBILITY[result.category].eligible.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#059669', marginBottom: '0.4rem' }}>✅ Eligible Activities</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {ADVENTURE_ELIGIBILITY[result.category].eligible.map(a => (
                            <span key={a} className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {ADVENTURE_ELIGIBILITY[result.category].restricted.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.4rem' }}>⚠️ Restricted Activities</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {ADVENTURE_ELIGIBILITY[result.category].restricted.map(a => (
                            <span key={a} className="badge badge-red" style={{ fontSize: '0.72rem' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                  <Scale size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                  <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Enter your details to calculate BMI</h3>
                  <p style={{ fontSize: '0.88rem' }}>We'll show your category, ideal weight range, BMR, and adventure eligibility.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const Flame = ({ size, color, style }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
);

export default BMICalculator;
