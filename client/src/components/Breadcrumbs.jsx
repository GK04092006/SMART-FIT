import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_LABELS = {
  dashboard: 'Dashboard',
  adventure: 'Adventures',
  adventures: 'Adventures',
  booking: 'My Bookings',
  bookings: 'My Bookings',
  fitness: 'Fitness Hub',
  assessment: 'Fitness Assessment',
  readiness: 'Fitness Readiness',
  'ai-coach': 'AI Coach',
  'challenge-hub': 'Challenges',
  'adventure-planner': 'Adventure Planner',
  'event-schedule': 'Event Schedule',
  'equipment-rental': 'Equipment Rental',
  'live-event': 'Live Event',
  events: 'Live Event',
  safety: 'Safety Center',
  incidents: 'Incident Details',
  analytics: 'Analytics',
  organizer: 'Organizer Workspace',
  'trainer-dashboard': 'Trainer Workspace',
  engagement: 'XP & Rewards',
  profile: 'Profile',
  settings: 'Settings',
  notifications: 'Notification Center',
  contact: 'Contact & Support',
};

const Breadcrumbs = ({ customCrumbs = null }) => {
  const location = useLocation();

  if (location.pathname === '/') return null;

  // If custom breadcrumbs provided (e.g. { label: 'Kodaikanal Trek', to: '/adventures/123' })
  if (customCrumbs && Array.isArray(customCrumbs)) {
    return (
      <nav aria-label="Breadcrumb" className="breadcrumbs-nav" style={navStyle}>
        <div style={containerStyle}>
          <Link to="/dashboard" style={linkStyle} title="Dashboard">
            <Home size={13} />
          </Link>
          {customCrumbs.map((crumb, idx) => {
            const isLast = idx === customCrumbs.length - 1;
            return (
              <React.Fragment key={idx}>
                <ChevronRight size={12} style={separatorStyle} />
                {isLast || !crumb.to ? (
                  <span style={currentStyle}>{crumb.label}</span>
                ) : (
                  <Link to={crumb.to} style={linkStyle}>
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    );
  }

  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs-nav" style={navStyle}>
      <div style={containerStyle}>
        <Link to="/dashboard" style={linkStyle} title="Dashboard">
          <Home size={13} />
        </Link>
        {pathnames.map((segment, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const isId = segment.length >= 10 || /^[a-f0-9]{24}$/i.test(segment) || /^\d+$/.test(segment);
          const label = isId ? `#${segment.slice(-6).toUpperCase()}` : (ROUTE_LABELS[segment.toLowerCase()] || segment.replace(/-/g, ' '));

          return (
            <React.Fragment key={to}>
              <ChevronRight size={12} style={separatorStyle} />
              {isLast ? (
                <span style={currentStyle}>{label}</span>
              ) : (
                <Link to={to} style={linkStyle}>
                  {label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
};

const navStyle = {
  padding: '0.6rem 0 1.2rem',
  fontSize: '0.8rem',
  color: 'var(--muted-text)',
};

const containerStyle = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '0.35rem',
};

const linkStyle = {
  color: 'var(--muted-text)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  transition: 'color 0.15s ease',
  fontWeight: '500',
};

const separatorStyle = {
  opacity: 0.45,
  flexShrink: 0,
};

const currentStyle = {
  color: 'var(--primary)',
  fontWeight: '700',
};

export default Breadcrumbs;
