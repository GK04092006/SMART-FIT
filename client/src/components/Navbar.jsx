import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Mountain, Dumbbell, Compass, Calendar, User, LogOut,
  Menu, X, PhoneCall, Trophy, BarChart2, Shield, Zap,
  Target, BrainCircuit, Search,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../context/LanguageContext';
import ThemeSelector from './ThemeSelector';
import LanguageSelector from './LanguageSelector';
import NotificationBadge from './NotificationBadge';
import GlobalSearch from './GlobalSearch';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/',                   labelKey: 'nav_home',         defaultLabel: 'Home',         public: true  },
    { to: '/adventure',          labelKey: 'nav_adventures',   defaultLabel: 'Adventures',   public: true  },
    { to: '/fitness/assessment', labelKey: 'nav_assessments',  defaultLabel: 'Assessments',  public: true  },
    { to: '/ai-coach',          labelKey: 'nav_ai_coach',     defaultLabel: 'AI Coach',     public: true  },
    { to: '/challenge-hub',      labelKey: 'nav_challenges',   defaultLabel: 'Challenges',   public: true  },
    { to: '/adventure-planner',  labelKey: 'nav_planner',      defaultLabel: 'Planner',      public: true  },
    { to: '/fitness',            labelKey: 'nav_how_it_works', defaultLabel: 'How It Works', public: true  },
    { to: '/dashboard',          labelKey: 'nav_dashboard',    defaultLabel: 'Dashboard',    public: false },
    { to: '/booking',            labelKey: 'nav_bookings',     defaultLabel: 'Bookings',     public: false },
    { to: '/contact',            labelKey: 'nav_contact',      defaultLabel: 'About Us',     public: true  },
  ];

  const visibleLinks = navLinks.filter(l => l.public || isAuthenticated);
  const organizerLinks = ['organizer', 'admin'].includes(user?.role)
    ? [{ to: '/organizer', labelKey: 'nav_organizer', defaultLabel: 'Organizer', public: false }]
    : [];
  const menuLinks = [...visibleLinks, ...organizerLinks];

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* Brand */}
          <Link to="/" className="brand-logo">
            <div className="brand-logo-icon">
              <Mountain size={18} />
            </div>
            <div style={{ lineHeight: 1.1 }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>SMARTFIT</div>
              <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Adventure Platform</div>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <ul className="nav-links">
            {menuLinks.map(({ to, labelKey, defaultLabel }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`nav-link ${isActive(to) && to !== '/' ? 'active' : location.pathname === '/' && to === '/' ? 'active' : ''}`}
                >
                  {t(labelKey, defaultLabel)}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions & Auth Section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: '8px',
                padding: '0.4rem 0.65rem',
                color: 'rgba(255,255,255,0.8)',
                fontSize: '0.78rem',
                cursor: 'pointer',
              }}
              title="Global Search (Ctrl+K)"
            >
              <Search size={14} />
              <span className="search-text-hide">{t('nav_search', 'Search')}</span>
              <kbd style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.12)', padding: '0.1rem 0.3rem', borderRadius: '3px' }}>⌘K</kbd>
            </button>

            {/* Language Selector Dropdown */}
            <LanguageSelector />

            {/* Theme Selector Popover */}
            <ThemeSelector />

            {/* Notification Center Bell Badge */}
            {isAuthenticated && <NotificationBadge />}

            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                {user?.fitnessScore > 0 && (
                  <Link
                    to="/fitness/assessment"
                    style={{
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.3rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Zap size={11} /> {user.fitnessScore}
                  </Link>
                )}
                <Link to="/profile" className="nav-profile">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                    alt={user?.name || 'User'}
                    className="avatar-img"
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>
                    {user?.name?.split(' ')[0] || user?.name || user?.email?.split('@')[0] || 'User'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="btn-secondary"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem', background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }}
                  title={t('nav_logout', 'Log Out')}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/login"
                  style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem' }}>
                  {t('nav_login', 'Log In')}
                </Link>
                <Link to="/register"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1.25rem', fontSize: '0.88rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                    color: '#fff', borderRadius: 8,
                    boxShadow: '0 2px 12px rgba(16,185,129,0.35)',
                  }}>
                  {t('nav_get_started', 'Get Started')}
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'none' }}
              className="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Global Search Modal */}
      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'rgba(6,13,26,0.97)',
          zIndex: 999,
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          {menuLinks.map(({ to, labelKey, defaultLabel }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${isActive(to) ? 'active' : ''}`}
              style={{ fontSize: '1.1rem', padding: '0.75rem 1rem' }}
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(labelKey, defaultLabel)}
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default Navbar;
