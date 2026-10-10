import React, { useState } from 'react';
import {
  Target, Plus, CheckCircle2, Circle, Flame, Activity,
  Mountain, Trophy, Clock, Edit3, Trash2, X,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';

const GOAL_TEMPLATES = [
  { icon: '🏃', label: 'Run 5KM',           category: 'Cardio',    target: 5,   unit: 'km',        xp: 100 },
  { icon: '💪', label: 'Do 50 Push-ups',     category: 'Strength',  target: 50,  unit: 'reps',      xp: 75  },
  { icon: '⚖️', label: 'Lose 5 KG',          category: 'Weight',    target: 5,   unit: 'kg',        xp: 200 },
  { icon: '🏔️', label: 'Complete a Trek',   category: 'Adventure', target: 1,   unit: 'event',     xp: 350 },
  { icon: '🧘', label: '30-day Yoga Streak', category: 'Wellness',  target: 30,  unit: 'days',      xp: 250 },
  { icon: '🎯', label: 'Score 70+ Fitness',  category: 'Score',     target: 70,  unit: 'points',    xp: 300 },
  { icon: '🔥', label: '10,000 kcal Burned', category: 'Cardio',    target: 10000,unit: 'kcal',     xp: 400 },
  { icon: '🏋️', label: 'Deadlift 100kg',   category: 'Strength',  target: 100, unit: 'kg',        xp: 450 },
];

const CATEGORY_COLORS = {
  Cardio: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  Strength: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  Weight: { bg: '#cffafe', text: '#164e63', border: '#a5f3fc' },
  Adventure: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
  Wellness: { bg: '#ede9fe', text: '#5b21b6', border: '#ddd6fe' },
  Score: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' },
};

const FitnessGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ label: '', category: 'Cardio', target: '', unit: '', deadline: '', icon: '🎯', xp: 100 });
  const [editId, setEditId] = useState(null);
  const [editProgress, setEditProgress] = useState('');

  const activeGoals = goals.filter(g => !g.done);
  const doneGoals   = goals.filter(g =>  g.done);
  const totalXP     = doneGoals.reduce((s, g) => s + g.xp, 0);

  const addGoal = () => {
    if (!newGoal.label || !newGoal.target) return;
    const g = { id: Date.now(), ...newGoal, target: Number(newGoal.target), progress: 0, done: false };
    setGoals(prev => [g, ...prev]);
    setNewGoal({ label: '', category: 'Cardio', target: '', unit: '', deadline: '', icon: '🎯', xp: 100 });
    setShowAdd(false);
  };

  const saveProgress = (id) => {
    setGoals(prev => prev.map(g => {
      if (g.id !== id) return g;
      const p = Math.min(Number(editProgress), g.target);
      return { ...g, progress: p, done: p >= g.target };
    }));
    setEditId(null);
    setEditProgress('');
  };

  const deleteGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  const GoalCard = ({ goal }) => {
    const pct = Math.round((goal.progress / goal.target) * 100);
    const clr = CATEGORY_COLORS[goal.category] || CATEGORY_COLORS.Cardio;
    const daysLeft = goal.deadline ? Math.max(0, Math.ceil((new Date(goal.deadline) - new Date()) / 86400000)) : null;

    return (
      <div className="glass-panel" style={{ padding: '1.25rem', border: goal.done ? '1px solid #a7f3d0' : '1px solid rgba(15,23,42,0.07)', background: goal.done ? '#f0fdf4' : '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ fontSize: '1.5rem' }}>{goal.icon}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', textDecoration: goal.done ? 'line-through' : 'none', color: goal.done ? '#059669' : 'var(--text-main)' }}>{goal.label}</div>
              <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, background: clr.bg, color: clr.text, border: `1px solid ${clr.border}`, padding: '0.1rem 0.5rem', borderRadius: 'var(--radius-full)' }}>{goal.category}</span>
                {!goal.done && daysLeft !== null && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: daysLeft < 7 ? '#dc2626' : 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <Clock size={9} /> {daysLeft} days
                  </span>
                )}
                {goal.done && <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700 }}>✅ Completed</span>}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {!goal.done && (
              <button onClick={() => { setEditId(goal.id); setEditProgress(String(goal.progress)); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-emerald)', padding: '0.2rem' }} title="Update Progress">
                <Edit3 size={14} />
              </button>
            )}
            <button onClick={() => deleteGoal(goal.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '0.2rem' }} title="Delete">
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Progress */}
        {editId === goal.id ? (
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <input
              type="number"
              value={editProgress}
              onChange={e => setEditProgress(e.target.value)}
              style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
              placeholder={`Progress (0–${goal.target})`}
              autoFocus
            />
            <button className="btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }} onClick={() => saveProgress(goal.id)}>Save</button>
            <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setEditId(null)}><X size={14} /></button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', minWidth: 90 }}>
              {goal.progress} / {goal.target} {goal.unit}
            </span>
            <div className="progress-bar-track" style={{ flex: 1, height: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${pct}%`, background: goal.done ? '#059669' : 'var(--primary-gradient)' }} />
            </div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: goal.done ? '#059669' : 'var(--primary-emerald)', minWidth: 32, textAlign: 'right' }}>{pct}%</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: '0.68rem', color: '#d97706', fontWeight: 700 }}>+{goal.xp} XP on completion</span>
        </div>
      </div>
    );
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', background: '#f8fafc' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-subtitle"><Target size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Goal Tracker</span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Fitness Goals</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Set, track and crush your personal fitness milestones.</p>
            </div>
            <button className="btn-primary" onClick={() => setShowAdd(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Plus size={16} /> Add Goal
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {[
              { icon: '🎯', label: 'Active Goals',    value: activeGoals.length, color: 'var(--primary-emerald)' },
              { icon: '✅', label: 'Completed',        value: doneGoals.length,   color: '#059669' },
              { icon: '⚡', label: 'XP Earned',        value: `+${totalXP}`,      color: '#d97706' },
              { icon: '📅', label: 'Due This Month',   value: activeGoals.filter(g => { const d = new Date(g.deadline); const n = new Date(); return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear(); }).length, color: '#0891b2' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Goal Templates */}
          <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '1rem' }}>📋 Quick-Add Goal Templates</div>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {GOAL_TEMPLATES.map(t => (
                <button key={t.label} onClick={() => {
                  setGoals(prev => [{ id: Date.now(), ...t, progress: 0, done: false, deadline: '' }, ...prev]);
                }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#f8fafc', border: '1px solid rgba(15,23,42,0.09)', borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition-fast)', color: 'var(--text-muted)', fontFamily: 'inherit' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-emerald)'; e.currentTarget.style.color = 'var(--primary-emerald)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.09)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Goals */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={16} color="var(--primary-emerald)" /> Active Goals ({activeGoals.length})
            </h3>
            {activeGoals.length === 0 ? (
              <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                <Target size={36} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                <p>No active goals. Add a goal above to get started!</p>
              </div>
            ) : (
              <div className="grid-2" style={{ gap: '1rem' }}>
                {activeGoals.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            )}
          </div>

          {/* Completed Goals */}
          {doneGoals.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 size={16} color="#059669" /> Completed Goals ({doneGoals.length})
              </h3>
              <div className="grid-2" style={{ gap: '1rem' }}>
                {doneGoals.map(g => <GoalCard key={g.id} goal={g} />)}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Goal Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Add New Goal</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="form-group">
              <label className="form-label">Goal Name</label>
              <input value={newGoal.label} onChange={e => setNewGoal(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Complete 10km trail run" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select value={newGoal.category} onChange={e => setNewGoal(p => ({ ...p, category: e.target.value }))}>
                  {['Cardio', 'Strength', 'Weight', 'Adventure', 'Wellness', 'Score'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Icon (emoji)</label>
                <input value={newGoal.icon} onChange={e => setNewGoal(p => ({ ...p, icon: e.target.value }))} placeholder="🎯" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Target Value</label>
                <input type="number" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))} placeholder="e.g. 10" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <input value={newGoal.unit} onChange={e => setNewGoal(p => ({ ...p, unit: e.target.value }))} placeholder="km / reps / days" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input type="date" value={newGoal.deadline} onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">XP Reward</label>
                <input type="number" value={newGoal.xp} onChange={e => setNewGoal(p => ({ ...p, xp: Number(e.target.value) }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={addGoal}>
                <Plus size={16} /> Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FitnessGoals;
