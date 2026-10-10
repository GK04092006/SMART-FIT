import React, { useState } from 'react';
import {
  Apple, Flame, Droplets, Zap, ChevronRight,
  Coffee, Sun, Moon, Cookie, Plus, Check,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const PLANS = [
  {
    id: 1, name: 'High-Performance Athlete', tag: 'Elite',
    tagColor: 'badge-emerald',
    calories: 3200, protein: 180, carbs: 380, fat: 95,
    goal: 'Endurance & Muscle Gain',
    description: 'Fuels long-distance adventure athletes with high carbs, lean protein, and anti-inflammatory fats.',
    color: '#059669',
    icon: '🏔️',
    meals: [
      { time: '06:30', label: 'Pre-Workout',  items: ['Oats + Banana', 'Boiled Eggs ×2', 'Black Coffee'] },
      { time: '09:00', label: 'Breakfast',    items: ['Quinoa Bowl', 'Greek Yogurt', 'Mixed Berries'] },
      { time: '13:00', label: 'Lunch',        items: ['Grilled Chicken 200g', 'Brown Rice', 'Steamed Broccoli'] },
      { time: '16:00', label: 'Snack',        items: ['Protein Shake', 'Almonds 30g', 'Apple'] },
      { time: '20:00', label: 'Dinner',       items: ['Salmon 180g', 'Sweet Potato', 'Salad'] },
    ],
  },
  {
    id: 2, name: 'Weight Loss & Lean', tag: 'Moderate',
    tagColor: 'badge-amber',
    calories: 1800, protein: 140, carbs: 180, fat: 60,
    goal: 'Fat Loss & Lean Muscle',
    description: 'A caloric deficit plan designed to burn fat while preserving muscle mass for active adventurers.',
    color: '#d97706',
    icon: '🔥',
    meals: [
      { time: '07:00', label: 'Breakfast',    items: ['Egg White Omelette', 'Whole Grain Toast', 'Green Tea'] },
      { time: '10:30', label: 'Snack',        items: ['Cottage Cheese 100g', 'Cucumber Slices'] },
      { time: '13:00', label: 'Lunch',        items: ['Tuna Salad', 'Lentil Soup', 'Water'] },
      { time: '16:00', label: 'Snack',        items: ['Black Coffee', 'Protein Bar (low-sugar)'] },
      { time: '19:30', label: 'Dinner',       items: ['Chicken Breast 150g', 'Cauliflower Rice', 'Stir-fry Veggies'] },
    ],
  },
  {
    id: 3, name: 'Plant-Based Adventure', tag: 'Beginner',
    tagColor: 'badge-cyan',
    calories: 2200, protein: 100, carbs: 290, fat: 70,
    goal: 'Energy & Recovery',
    description: 'Fully plant-based plan with complete amino acids, iron, and B12 for sustainable trail energy.',
    color: '#0891b2',
    icon: '🌿',
    meals: [
      { time: '07:30', label: 'Breakfast',    items: ['Smoothie Bowl', 'Chia Seeds', 'Flaxseeds'] },
      { time: '11:00', label: 'Mid-Morning',  items: ['Hummus + Whole-wheat Pita', 'Mixed Nuts'] },
      { time: '13:30', label: 'Lunch',        items: ['Tofu Stir-fry', 'Brown Rice', 'Kale Salad'] },
      { time: '16:30', label: 'Snack',        items: ['Edamame 100g', 'Green Smoothie'] },
      { time: '20:00', label: 'Dinner',       items: ['Lentil Dal', 'Quinoa', 'Roasted Veggies'] },
    ],
  },
];

const MacroBar = ({ label, value, max, color, unit = 'g' }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.78rem', fontWeight: 800, color }}>{value}{unit}</span>
    </div>
    <div className="progress-bar-track" style={{ height: 7 }}>
      <div className="progress-bar-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
    </div>
  </div>
);

const DietPlans = () => {
  const [activePlan, setActivePlan] = useState(null);
  const [checkedMeals, setCheckedMeals] = useState({});

  const toggleMeal = (planId, mealLabel) => {
    const key = `${planId}_${mealLabel}`;
    setCheckedMeals(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', background: '#f8fafc' }}>
          <div style={{ marginBottom: '2rem' }}>
            <span className="section-subtitle"><Apple size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Nutrition Intelligence</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Diet Plans</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Science-backed nutrition plans matched to your fitness level and adventure goals.</p>
          </div>

          {/* Daily Nutrition Summary */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'linear-gradient(135deg, #ecfdf5, #eff6ff)', border: '1px solid #a7f3d0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem' }}>Today's Nutrition Log</h3>
              <span className="badge badge-emerald">1,840 / 2,200 kcal</span>
            </div>
            <div className="grid-4" style={{ gap: '1rem' }}>
              {[
                { icon: Flame, label: 'Calories', value: 1840, max: 2200, color: '#dc2626', unit: ' kcal' },
                { icon: Zap,   label: 'Protein',  value: 92,   max: 140,  color: '#059669', unit: 'g' },
                { icon: Cookie,label: 'Carbs',    value: 210,  max: 290,  color: '#d97706', unit: 'g' },
                { icon: Droplets, label: 'Fat',   value: 52,   max: 70,   color: '#0891b2', unit: 'g' },
              ].map(({ icon: Icon, label, value, max, color, unit }) => (
                <div key={label} style={{ background: '#ffffff', borderRadius: 'var(--radius-sm)', padding: '1rem', border: '1px solid rgba(15,23,42,0.07)', boxShadow: '0 1px 4px rgba(15,23,42,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                    <Icon size={14} color={color} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</span>
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color, marginBottom: '0.4rem' }}>{value}<span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-dim)' }}>{unit}</span></div>
                  <div className="progress-bar-track" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{max - value}{unit} remaining</div>
                </div>
              ))}
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className="glass-panel"
                style={{ overflow: 'hidden', cursor: 'pointer', border: activePlan?.id === plan.id ? `2px solid ${plan.color}` : '1px solid rgba(15,23,42,0.07)' }}
                onClick={() => setActivePlan(activePlan?.id === plan.id ? null : plan)}
              >
                {/* Top accent bar */}
                <div style={{ height: 5, background: plan.color }} />
                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '2rem' }}>{plan.icon}</div>
                    <span className={`badge ${plan.tagColor}`}>{plan.tag}</span>
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.35rem' }}>{plan.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>{plan.description}</p>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, color: plan.color, border: `1px solid ${plan.color}30` }}>
                      🔥 {plan.calories} kcal
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 'var(--radius-sm)', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', border: '1px solid rgba(15,23,42,0.08)' }}>
                      🎯 {plan.goal}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <MacroBar label="Protein" value={plan.protein} max={200} color="#059669" />
                    <MacroBar label="Carbs"   value={plan.carbs}   max={400} color="#d97706" />
                    <MacroBar label="Fat"     value={plan.fat}     max={120} color="#0891b2" />
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', fontSize: '0.85rem', background: plan.color, justifyContent: 'center' }}
                    onClick={(e) => { e.stopPropagation(); setActivePlan(plan); }}
                  >
                    View Meal Schedule <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Expanded Meal Schedule */}
          {activePlan && (
            <div className="glass-panel animate-fadeIn" style={{ padding: '1.5rem', border: `1px solid ${activePlan.color}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{activePlan.icon}</span>
                  <div>
                    <h3 style={{ fontSize: '1.1rem' }}>{activePlan.name} — Daily Meal Schedule</h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{activePlan.calories} kcal · {activePlan.goal}</p>
                  </div>
                </div>
                <button className="btn-secondary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setActivePlan(null)}>Close</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activePlan.meals.map((meal, i) => {
                  const key = `${activePlan.id}_${meal.label}`;
                  const done = checkedMeals[key];
                  const icons = [Coffee, Sun, Sun, Cookie, Moon];
                  const Icon = icons[i] || Sun;
                  return (
                    <div key={meal.label} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: done ? '#f0fdf4' : '#f8fafc', borderRadius: 'var(--radius-sm)', border: done ? '1px solid #a7f3d0' : '1px solid rgba(15,23,42,0.07)', transition: 'var(--transition-fast)' }}>
                      <div style={{ textAlign: 'center', minWidth: 50 }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontFamily: 'monospace', fontWeight: 700 }}>{meal.time}</div>
                        <Icon size={18} color={activePlan.color} style={{ marginTop: '0.2rem' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.35rem', color: done ? '#059669' : 'var(--text-main)' }}>{meal.label}</div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {meal.items.map(item => (
                            <span key={item} style={{ background: '#fff', border: '1px solid rgba(15,23,42,0.09)', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.65rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item}</span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleMeal(activePlan.id, meal.label)}
                        style={{ width: 30, height: 30, borderRadius: '50%', border: done ? '2px solid #059669' : '2px solid #e2e8f0', background: done ? '#059669' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        {done && <Check size={14} color="white" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DietPlans;
