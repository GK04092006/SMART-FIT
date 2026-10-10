import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Loader from '../components/Loader';
import Breadcrumbs from '../components/Breadcrumbs';
import QuickActions from '../components/QuickActions';
import {
  Flame, Calendar, Trophy, Compass, Dumbbell, ArrowUpRight,
  CheckCircle2, Clock, ShieldCheck, Settings, Map, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

// ── Role meta ──────────────────────────────────────────────────────────────
const ROLE_META = {
  admin: {
    label: 'Admin',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    icon: ShieldCheck,
    primaryLink: '/analytics',
    primaryLabel: 'Open Analytics',
    secondaryLink: '/safety',
    secondaryLabel: 'Safety Center',
    message: 'You have full system access. Monitor platform health via Analytics.',
  },
  organizer: {
    label: 'Organizer',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
    icon: Settings,
    primaryLink: '/organizer',
    primaryLabel: 'Event Organizer',
    secondaryLink: '/adventure-planner',
    secondaryLabel: 'Adventure Planner',
    message: 'Create and manage adventure events from the Organizer workspace.',
  },
  trainer: {
    label: 'Trainer',
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.12)',
    icon: Dumbbell,
    primaryLink: '/trainer-dashboard',
    primaryLabel: 'Trainer Workspace',
    secondaryLink: '/fitness/assessment',
    secondaryLabel: 'Run Assessment',
    message: 'Access training plans, assessments and participant progress.',
  },
  guide: {
    label: 'Guide',
    color: '#06b6d4',
    bg: 'rgba(6,182,212,0.12)',
    icon: Map,
    primaryLink: '/live-event',
    primaryLabel: 'Live Events',
    secondaryLink: '/safety',
    secondaryLabel: 'Safety Center',
    message: 'Monitor live adventure events and participant safety.',
  },
  user: {
    label: 'Participant',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.12)',
    icon: Compass,
    primaryLink: '/adventure',
    primaryLabel: 'Book Expedition',
    secondaryLink: '/fitness',
    secondaryLabel: 'Find Workout',
    message: 'Track your fitness journey and book your next adventure.',
  },
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const roleMeta = ROLE_META[user?.role] || ROLE_META.user;
  const RoleIcon = roleMeta.icon;

  // forbidden redirect
  const forbidden = new URLSearchParams(location.search).get('forbidden');

  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        const { data } = await API.get('/booking/my');
        setBookings(data);
        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    fetchUserBookings();
  }, []);

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />

        <main style={{ padding: '2rem 2rem 4rem 1rem' }}>
          <Breadcrumbs items={[{ label: 'Dashboard' }]} />

          {/* ── Forbidden Banner ── */}
          {forbidden && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444', padding: '0.875rem 1.25rem', borderRadius: 'var(--radius-sm)',
              marginBottom: '1.5rem', fontSize: '0.9rem',
            }}>
              <AlertTriangle size={18} />
              <span>You don't have permission to access that page. You've been redirected to your dashboard.</span>
            </div>
          )}

          {/* ── Header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              {/* Role Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: roleMeta.bg, color: roleMeta.color,
                padding: '0.3rem 0.8rem', borderRadius: '999px',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.05em',
                marginBottom: '0.5rem', border: `1px solid ${roleMeta.color}25`,
              }}>
                <RoleIcon size={13} /> {roleMeta.label.toUpperCase()}
              </div>

              <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
                Welcome Back, <span className="text-gradient">{user?.name || 'Athlete'}</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {roleMeta.message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to={roleMeta.secondaryLink} className="btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                {roleMeta.secondaryLabel}
              </Link>
              <Link to={roleMeta.primaryLink} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                <RoleIcon size={16} /> {roleMeta.primaryLabel}
              </Link>
            </div>
          </div>

          {/* ── Contextual Quick Actions (Feature 5) ── */}
          <div style={{ marginBottom: '2.5rem' }}>
            <QuickActions />
          </div>

          {/* ── Quick Metrics ── */}
          <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-emerald)' }}>
                <Flame size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Active Streak</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>{user?.streakDays ?? 0} Days {(user?.streakDays ?? 0) > 0 ? '🔥' : ''}</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary-cyan)' }}>
                <Trophy size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Total Calories Burned</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>{(user?.caloriesBurned ?? 0).toLocaleString()} kcal</h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(236, 72, 153, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--accent-magenta)' }}>
                <Calendar size={28} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Bookings & Trips</span>
                <h3 style={{ fontSize: '1.75rem', marginTop: '0.1rem' }}>{bookings.length} Reserved</h3>
              </div>
            </div>
          </div>

          {/* ── Reservations List ── */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.3rem' }}>Your Active Reservations</h3>
              <Link to="/booking" style={{ color: 'var(--primary-emerald)', fontSize: '0.9rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                View All <ArrowUpRight size={16} />
              </Link>
            </div>

            {loading ? (
              <Loader text="Loading your bookings..." />
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                <Compass size={42} color="var(--text-dim)" style={{ marginBottom: '0.75rem' }} />
                <p>No active reservations yet.</p>
                <Link to="/adventure" className="btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
                  Explore Expeditions
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bookings.map((booking) => (
                  <div
                    key={booking._id || booking.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '260px' }}>
                      <img
                        src={booking.itemDetails?.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'}
                        alt={booking.itemDetails?.title}
                        style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                      <div>
                        <span className={`badge ${booking.itemType === 'Adventure' ? 'badge-cyan' : 'badge-magenta'}`} style={{ fontSize: '0.65rem' }}>
                          {booking.itemType}
                        </span>
                        <h4 style={{ fontSize: '1.1rem', marginTop: '0.2rem' }}>{booking.itemDetails?.title}</h4>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {new Date(booking.bookingDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-emerald">
                          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} />
                          {booking.status}
                        </span>
                        <div style={{ fontWeight: '700', fontSize: '1.1rem', marginTop: '0.25rem' }}>
                          ₹{booking.totalPrice}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
