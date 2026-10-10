import React, { useState, useEffect } from 'react';
import {
  BarChart2, Activity, Mountain, Shield, Users,
  TrendingUp, TrendingDown, Calendar, RefreshCw, ArrowUpRight,
  AlertCircle, Loader2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

// ── Small presentational helpers ───────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="glass-panel" style={{ padding: '1.25rem' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
      <div style={{ width: 38, height: 38, borderRadius: '10px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        <Icon size={18} />
      </div>
      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
    </div>
    <div style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.2rem' }}>{value ?? '—'}</div>
    {sub && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{sub}</div>}
    {trend !== undefined && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.78rem', color: trend >= 0 ? 'var(--primary-emerald)' : 'var(--accent-red)', fontWeight: 700 }}>
        {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        {trend >= 0 ? '+' : ''}{trend}% vs last month
      </div>
    )}
  </div>
);

const EmptyState = ({ label }) => (
  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
    No {label} data recorded yet.
  </div>
);

// ── Component ──────────────────────────────────────────────────────────────────
const Analytics = () => {
  const [activeTab, setActiveTab] = useState('fitness');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    API.get('/admin/analytics')
      .then(res => { if (!cancelled) { setData(res.data); setLoading(false); } })
      .catch(err => {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load analytics data.');
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [refreshKey]);

  const TABS = [
    { id: 'fitness',   label: 'Fitness Reports',    icon: Activity  },
    { id: 'adventure', label: 'Adventure Reports',  icon: Mountain  },
    { id: 'bookings',  label: 'Booking Reports',    icon: BarChart2 },
    { id: 'users',     label: 'User Breakdown',     icon: Users     },
  ];

  const maxWorkouts = data?.fitness?.monthlyVolume?.length
    ? Math.max(...data.fitness.monthlyVolume.map(m => m.workouts), 1)
    : 1;

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                📊 Analytics <span className="text-gradient">Dashboard</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                {data?.generatedAt
                  ? `Live data · Generated ${new Date(data.generatedAt).toLocaleString()}`
                  : 'Platform-wide reports and insights from MongoDB'}
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
              onClick={() => setRefreshKey(k => k + 1)}
              disabled={loading}
            >
              <RefreshCw size={14} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '1rem 1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <AlertCircle size={18} />
              <div>
                <div style={{ fontWeight: 700 }}>Could not load analytics</div>
                <div style={{ fontSize: '0.82rem', marginTop: '0.2rem' }}>{error}</div>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && !error && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', color: 'var(--text-muted)', gap: '0.75rem' }}>
              <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite' }} />
              <span>Loading analytics from database…</span>
            </div>
          )}

          {/* Tabs */}
          {!loading && data && (
            <>
              <div className="tabs-container" style={{ marginBottom: '2rem' }}>
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button key={id} className={`tab-btn ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>

              {/* ── FITNESS REPORTS ── */}
              {activeTab === 'fitness' && (
                <div className="animate-fadeIn">
                  <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <StatCard icon={Users}      label="Total Athletes"      value={data.users.total.toLocaleString()}          color="var(--primary-emerald)" trend={data.users.trendPct} />
                    <StatCard icon={Activity}   label="Active This Month"   value={data.users.activeThisMonth.toLocaleString()} color="var(--primary-cyan)" />
                    <StatCard icon={TrendingUp} label="Avg Fitness Score"   value={data.users.avgFitnessScore || '—'}           color="var(--accent-amber)" />
                    <StatCard icon={BarChart2}  label="Assessments Done"    value={data.fitness.assessmentsTotal.toLocaleString()} color="var(--accent-magenta)" />
                  </div>

                  {/* Monthly Workout Volume */}
                  <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem' }}>Monthly Workout Volume (Last 6 Months)</h3>
                      <span className="badge badge-emerald">Live DB data</span>
                    </div>
                    {data.fitness.monthlyVolume.every(m => m.workouts === 0)
                      ? <EmptyState label="workout" />
                      : (
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', height: '160px' }}>
                          {data.fitness.monthlyVolume.map(m => (
                            <div key={m.month} className="chart-bar">
                              <div className="chart-bar-fill" style={{ height: `${(m.workouts / maxWorkouts) * 140}px` }} />
                              <div className="chart-bar-label">{m.workouts}</div>
                              <div className="chart-bar-label" style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{m.month}</div>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </div>

                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Workouts Logged This Month</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--primary-emerald)' }}>
                      {data.fitness.workoutsThisMonth.toLocaleString()}
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                      Across all users · updated in real time
                    </p>
                  </div>
                </div>
              )}

              {/* ── ADVENTURE REPORTS ── */}
              {activeTab === 'adventure' && (
                <div className="animate-fadeIn">
                  <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <StatCard icon={Mountain}   label="Total Adventures"   value={data.adventures.total}                            color="var(--primary-emerald)" />
                    <StatCard icon={Users}       label="Total Bookings"     value={data.bookings.total.toLocaleString()}              color="var(--primary-cyan)"    trend={data.bookings.trendPct} />
                    <StatCard icon={TrendingUp}  label="Revenue Total"      value={`₹${(data.revenue.total/100000).toFixed(1)}L`}    color="var(--accent-amber)" />
                    <StatCard icon={Activity}    label="New This Month"     value={data.bookings.thisMonth}                          color="var(--accent-magenta)" />
                  </div>

                  <div className="grid-2" style={{ gap: '1.5rem' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Bookings by Category</h3>
                      {data.bookings.byCategory.length === 0
                        ? <EmptyState label="booking" />
                        : data.bookings.byCategory.map(({ _id, count }) => {
                            const max = data.bookings.byCategory[0].count;
                            return (
                              <div key={_id} style={{ marginBottom: '0.85rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{_id || 'Uncategorised'}</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{count} bookings</span>
                                </div>
                                <div className="progress-bar-track" style={{ height: 8 }}>
                                  <div className="progress-bar-fill" style={{ width: `${(count / max) * 100}%` }} />
                                </div>
                              </div>
                            );
                          })
                      }
                    </div>

                    <div className="glass-panel" style={{ padding: '1.5rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Top Rated Adventures</h3>
                      {data.adventures.topRated.length === 0
                        ? <EmptyState label="adventure" />
                        : data.adventures.topRated.slice(0, 5).map((adv, i) => (
                            <div key={adv._id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0', borderBottom: i < 4 ? '1px solid var(--border-subtle)' : 'none' }}>
                              <span style={{ width: 22, height: 22, background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary-emerald)', flexShrink: 0 }}>{i + 1}</span>
                              <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600 }}>{adv.title}</span>
                              <span style={{ fontSize: '0.78rem', color: 'var(--accent-amber)' }}>★ {adv.rating?.toFixed(1) || '—'}</span>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{adv.reviewCount || 0}r</span>
                            </div>
                          ))
                      }
                    </div>
                  </div>
                </div>
              )}

              {/* ── BOOKING REPORTS ── */}
              {activeTab === 'bookings' && (
                <div className="animate-fadeIn">
                  <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <StatCard icon={Calendar}    label="Total Bookings"     value={data.bookings.total}        color="var(--primary-emerald)" />
                    <StatCard icon={ArrowUpRight} label="This Month"         value={data.bookings.thisMonth}    color="var(--primary-cyan)"    trend={data.bookings.trendPct} />
                    <StatCard icon={TrendingUp}   label="Total Revenue"      value={`₹${(data.revenue.total/1000).toFixed(0)}K`} color="var(--accent-amber)" />
                    <StatCard icon={Activity}     label="Revenue This Month" value={`₹${(data.revenue.thisMonth/1000).toFixed(0)}K`} color="var(--accent-magenta)" />
                  </div>

                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Recent Bookings</h3>
                    {data.bookings.recent.length === 0
                      ? <EmptyState label="booking" />
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {data.bookings.recent.map((b, i) => (
                            <div key={b._id || i} style={{ display: 'grid', gridTemplateColumns: '1fr 130px 90px 80px', alignItems: 'center', gap: '1rem', padding: '0.7rem 0.85rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{b.itemDetails?.title || b.itemType}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{b.user?.name || 'Unknown'} · {b.user?.email || ''}</div>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(b.createdAt).toLocaleDateString()}</div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-emerald)' }}>₹{b.totalPrice?.toLocaleString() || 0}</div>
                              <span className={`badge ${b.status === 'Confirmed' ? 'badge-emerald' : b.status === 'Cancelled' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: '0.62rem', justifyContent: 'center' }}>{b.status}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }
                  </div>
                </div>
              )}

              {/* ── USER BREAKDOWN ── */}
              {activeTab === 'users' && (
                <div className="animate-fadeIn">
                  <div className="grid-4" style={{ gap: '1rem', marginBottom: '1.5rem' }}>
                    <StatCard icon={Users}      label="Total Registered"  value={data.users.total.toLocaleString()}              color="var(--primary-emerald)" />
                    <StatCard icon={Activity}   label="New This Month"    value={data.users.newThisMonth}                        color="var(--primary-cyan)"    trend={data.users.trendPct} />
                    <StatCard icon={TrendingUp} label="Active This Month" value={data.users.activeThisMonth}                     color="var(--accent-amber)" />
                    <StatCard icon={BarChart2}  label="Avg Fitness Score" value={data.users.avgFitnessScore || '—'}              color="var(--accent-magenta)" />
                  </div>

                  <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem' }}>Users by Role</h3>
                    {data.users.byRole.length === 0
                      ? <EmptyState label="user role" />
                      : data.users.byRole.map(({ _id, count }) => {
                          const max = data.users.byRole[0].count;
                          const colors = { admin: '#ef4444', organizer: '#06b6d4', trainer: '#f59e0b', guide: '#8b5cf6', user: '#10b981' };
                          return (
                            <div key={_id} style={{ marginBottom: '0.85rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize' }}>{_id}</span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{count} users ({Math.round((count / data.users.total) * 100)}%)</span>
                              </div>
                              <div className="progress-bar-track" style={{ height: 8 }}>
                                <div className="progress-bar-fill" style={{ width: `${(count / max) * 100}%`, background: colors[_id] || 'var(--primary-emerald)' }} />
                              </div>
                            </div>
                          );
                        })
                    }
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Analytics;
