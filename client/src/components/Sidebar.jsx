import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Siren, Search, Bell, Palette, User, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import GlobalSearch from './GlobalSearch';
import API from '../services/api';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme, themes } = useTheme();
  const { t } = useLanguage();
  const [sendingSos, setSendingSos] = useState(false);
  const [sosStatus, setSosStatus] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');
  const role = user?.role || 'user';
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels = {
    admin:       { label: t('role_admin', 'Admin'),             color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    icon: '🛡️' },
    organizer:   { label: t('role_organizer', 'Organizer'),     color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   icon: '⚙️' },
    trainer:     { label: t('role_trainer', 'Trainer'),         color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   icon: '🏋️' },
    guide:       { label: t('role_guide', 'Guide'),             color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',    icon: '🗺️' },
    user:        { label: t('role_participant', 'Participant'), color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '🏃' },
  };

  const badge = roleLabels[role] || roleLabels.user;

  const cycleTheme = () => {
    const currentIndex = themes.findIndex((item) => item.id === theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length] || themes[0];
    setTheme(nextTheme.id);
  };

  // Build sections based on role
  const commonSections = [
    {
      label: t('sb_my_space', 'MY SPACE'),
      items: [
        { to: '/dashboard', emoji: '🏠', label: t('sb_dashboard', 'Dashboard') },
        { to: '/profile', emoji: '👤', label: t('sb_profile', 'Profile') },
        { to: '/notifications', emoji: '🔔', label: t('sb_notifications', 'Notifications') },
        { to: '/settings', emoji: '⚙️', label: t('sb_settings', 'Settings') },
      ],
    },
    {
      label: t('sb_adventure_management', 'ADVENTURE MANAGEMENT'),
      items: [
        { to: '/adventure', emoji: '🧭', label: t('sb_adventures', 'Adventures') },
        { to: '/fitness/assessment', emoji: '✅', label: t('sb_fitness_readiness', 'Fitness Readiness') },
        { to: '/booking', emoji: '🎟️', label: t('sb_my_bookings', 'My Bookings') },
        { to: '/event-schedule', emoji: '📅', label: t('sb_event_schedule', 'Event Schedule') },
        { to: '/equipment-rental', emoji: '🎒', label: t('sb_equipment_rental', 'Equipment Rental') },
      ],
    },
    {
      label: t('sb_preparation', 'PREPARATION'),
      items: [
        { to: '/fitness', emoji: '🏋️', label: t('sb_workout_plans', 'Workout Plans') },
        { to: '/fitness/goals', emoji: '🎯', label: t('sb_fitness_goals', 'Fitness Goals') },
        { to: '/fitness/progress', emoji: '📈', label: t('sb_progress_tracking', 'Progress Tracking') },
        { to: '/diet-plans', emoji: '🥗', label: t('sb_diet_plans', 'Diet Plans') },
        { to: '/bmi-calculator', emoji: '⚖️', label: t('sb_bmi_calculator', 'BMI Calculator') },
      ],
    },
    {
      label: t('sb_engagement', 'ENGAGEMENT'),
      items: [
        { to: '/engagement', emoji: '🏆', label: t('sb_xp_rewards', 'XP & Rewards') },
      ],
    },
  ];

  // Role-specific sections
  const roleSections = {
    admin: [
      {
        label: `🛡️ ${t('role_admin', 'Admin')}`,
        items: [
          { to: '/admin/communication', emoji: '📢', label: t('sb_comm_center', 'Communication Center') },
          { to: '/analytics',       emoji: '📊', label: t('sb_analytics', 'Analytics') },
          { to: '/safety',          emoji: '🛡️', label: t('sb_safety_center', 'Safety Center') },
          { to: '/organizer',       emoji: '⚙️', label: t('sb_event_organizer', 'Event Organizer') },
          { to: '/live-event',      emoji: '🗺️', label: t('sb_live_events', 'Live Events') },
        ],
      },
    ],
    organizer: [
      {
        label: `⚙️ ${t('role_organizer', 'Organizer')}`,
        items: [
          { to: '/admin/communication', emoji: '📢', label: t('sb_comm_center', 'Communication Center') },
          { to: '/organizer',           emoji: '⚙️', label: t('sb_event_organizer', 'Event Organizer') },
          { to: '/adventure-planner',   emoji: '🗺️', label: t('sb_adventure_planner', 'Adventure Planner') },
        ],
      },
    ],
    trainer: [
      {
        label: `🏋️ ${t('role_trainer', 'Trainer')}`,
        items: [
          { to: '/trainer-dashboard',   emoji: '🏋️', label: t('sb_trainer_workspace', 'Trainer Workspace') },
          { to: '/fitness/assessment',  emoji: '📋', label: t('sb_run_assessment', 'Run Assessment') },
        ],
      },
    ],
    guide: [
      {
        label: `🗺️ ${t('role_guide', 'Guide')}`,
        items: [
          { to: '/live-event',  emoji: '🗺️', label: t('sb_live_events', 'Live Events') },
          { to: '/safety',      emoji: '🛡️', label: t('sb_safety_center', 'Safety Center') },
        ],
      },
    ],
    user: [],
  };

  const sections = [...commonSections, ...(roleSections[role] || [])];

  const sendSos = async (position) => {
    const hasLocation = Boolean(position?.coords);

    try {
      await API.post('/guide/sos/trigger', {
        lat: position?.coords.latitude ?? null,
        lng: position?.coords.longitude ?? null,
        accuracy: position?.coords.accuracy ?? null,
        address: hasLocation ? 'Live location from sidebar SOS' : 'Location unavailable — emergency alert sent without GPS',
        triggeredByName: user.name || user.email,
      });
      setSosStatus(hasLocation ? t('sos_sent_gps', 'SOS alert sent with your location.') : t('sos_sent_nogps', 'SOS alert sent without GPS location.'));
      if (['organizer', 'admin'].includes(role)) navigate('/safety');
    } catch {
      setSosStatus(t('sos_error', 'Unable to send SOS. Please try again or contact emergency services directly.'));
    } finally {
      setSendingSos(false);
    }
  };

  const handleSosClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSosStatus('');
    setSendingSos(true);

    if (!navigator.geolocation) {
      sendSos(null);
      return;
    }

    let requestStarted = false;
    let locationTimeout;
    const sendOnce = (position) => {
      if (requestStarted) return;
      requestStarted = true;
      window.clearTimeout(locationTimeout);
      sendSos(position);
    };
    locationTimeout = window.setTimeout(() => sendOnce(null), 1500);
    navigator.geolocation.getCurrentPosition(
      sendOnce,
      () => sendOnce(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <aside className="sidebar">
      {/* ── User info ── */}
      <div style={{ padding: '0.75rem 0.5rem 1rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
            alt="Avatar"
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)', filter: 'grayscale(15%)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em', lineHeight: 1.2 }}>
              {user?.name || 'Member'}
            </h4>
            <span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', fontWeight: 500, letterSpacing: '0.03em' }}>
              {user?.email?.split('@')[0] || 'user'}
            </span>
          </div>
        </div>
        {/* Role badge */}
        <div style={{
          marginTop: '0.6rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          background: badge.bg,
          color: badge.color,
          padding: '0.2rem 0.6rem',
          borderRadius: '999px',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.05em',
        }}>
          <span>{badge.icon}</span>
          <span>{badge.label.toUpperCase()}</span>
        </div>
      </div>

      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <button
            type="button"
            aria-label="Search"
            title={`${t('nav_search', 'Search')} (Ctrl+K)`}
            onClick={() => setSearchOpen(true)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.7rem 0.75rem',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Search size={16} />
            <span>{t('nav_search', 'Search')}</span>
          </button>
          <button
            type="button"
            aria-label="Notifications"
            title={t('sb_notifications', 'Notifications')}
            onClick={() => navigate('/notifications')}
            style={{
              width: '2.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 0.5rem',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              color: '#ffffff',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <Bell size={16} />
            <span style={{ position: 'absolute', top: '0.35rem', right: '0.45rem', width: 6, height: 6, background: '#ff5a1f', borderRadius: '50%' }} />
          </button>
          <button
            type="button"
            aria-label="Theme"
            title={t('theme_switch', 'Theme')}
            onClick={cycleTheme}
            style={{
              width: '2.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 0.5rem',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              color: '#ffffff',
              cursor: 'pointer',
            }}
          >
            <Palette size={16} />
          </button>
          <Link
            to="/profile"
            aria-label="Profile"
            title={t('sb_profile', 'Profile')}
            style={{
              width: '2.6rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.7rem 0.5rem',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255,255,255,0.04)',
              color: '#ffffff',
              textDecoration: 'none',
            }}
          >
            <User size={16} />
          </Link>
        </div>

        <button
          type="button"
          onClick={handleSosClick}
          disabled={sendingSos}
          aria-label="Send emergency SOS alert"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.6rem',
            padding: '0.7rem 0.85rem',
            border: '1px solid #b91c1c',
            borderRadius: 'var(--radius-sm)',
            background: sendingSos ? '#991b1b' : '#dc2626',
            color: '#ffffff',
            fontWeight: 800,
            cursor: sendingSos ? 'wait' : 'pointer',
          }}
        >
          <Siren size={18} />
          {sendingSos ? t('sos_sending', 'Sending SOS...') : t('sos_emergency', 'SOS Emergency')}
        </button>
        {sosStatus && (
          <div role="status" aria-live="polite" style={{ padding: '0.4rem 0.35rem', color: '#991b1b', fontSize: '0.75rem', lineHeight: 1.4 }}>
            {sosStatus}
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginTop: '0.65rem',
            padding: '0.65rem 0.85rem',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255,255,255,0.04)',
            color: '#ffffff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <LogOut size={16} /> {t('nav_logout', 'Log Out')}
        </button>
      </div>

      {/* ── Nav sections ── */}
      {sections.map((section) => (
        <div key={section.label} style={{ marginBottom: '0.5rem' }}>
          <div className="sidebar-section-label">{section.label}</div>
          <ul className="sidebar-menu">
            {section.items.map(({ to, emoji, label, hideWhenAuth }) => {
              if (hideWhenAuth && user) return null;
              return (
                <li key={to}>
                  <Link to={to} className={`sidebar-item ${isActive(to) ? 'active' : ''}`}>
                    <span style={{ width: 18, display: 'inline-block', textAlign: 'center' }}>{emoji}</span>
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {searchOpen && (
        <GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </aside>
  );
};

export default Sidebar;
