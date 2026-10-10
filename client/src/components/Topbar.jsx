import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import NotificationBadge from './NotificationBadge';
import ThemeSelector from './ThemeSelector';
import GlobalSearch from './GlobalSearch';

const navItems = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Adventures', to: '/adventure' },
  { label: 'Assessments', to: '/fitness/assessment' },
  { label: 'AI Coach', to: '/trainer-dashboard' },
  { label: 'Challenges', to: '/engagement' },
  { label: 'Planner', to: '/event-schedule' },
  { label: 'How It Works', to: '/about' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Bookings', to: '/booking' },
  { label: 'About Us', to: '/profile' },
];

export default function Topbar({ title = 'Dashboard' }) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <>
      <aside className="sfa-topbar">
        <div className="sfa-topbar-title">
          <div className="sfa-brand-mark">S</div>
          <div className="sfa-brand-copy">
            <strong>{title}</strong>
            <span>SMARTFIT</span>
          </div>
        </div>

        <nav className="sfa-topbar-nav" aria-label="Main navigation">
          {navItems.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className={`sfa-topbar-link ${isActive(to) ? 'active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="sfa-topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="sfa-search"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              cursor: 'pointer',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.12))',
              color: 'var(--text-muted, #94a3b8)',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '0.82rem',
            }}
          >
            <Search size={14} />
            <span>Search adventures, workouts, bookings...</span>
            <kbd style={{ marginLeft: 'auto', fontSize: '0.62rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.35rem', borderRadius: '3px' }}>
              Ctrl+K
            </kbd>
          </button>

          <ThemeSelector />

          <NotificationBadge />

          <Link to="/profile" title={user?.name || 'Profile'}>
            <img
              className="sfa-avatar"
              src={user?.avatar || '/uploads/profile-images/default-avatar.jpg'}
              alt={user?.name || 'avatar'}
              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'; }}
              style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))' }}
            />
          </Link>
        </div>
      </aside>

      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
}
