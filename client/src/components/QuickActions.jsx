import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass, CheckCircle2, Dumbbell, Ticket, Calendar,
  Siren, PlusCircle, Users, ShieldAlert, BarChart2,
  MapPin, MessageSquare, ClipboardList, Activity, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const QuickActions = ({ onSosClick }) => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const actionsByRole = {
    user: [
      { label: 'Find Adventure', icon: Compass, color: '#10b981', to: '/adventure' },
      { label: 'Check Readiness', icon: CheckCircle2, color: '#06b6d4', to: '/adventure' },
      { label: 'Log Workout', icon: Dumbbell, color: '#8b5cf6', to: '/fitness' },
      { label: 'My Bookings', icon: Ticket, color: '#f59e0b', to: '/booking' },
      { label: 'View Schedule', icon: Calendar, color: '#38bdf8', to: '/event-schedule' },
      { label: 'Emergency SOS', icon: Siren, color: '#ef4444', onClick: onSosClick, isEmergency: true },
    ],
    organizer: [
      { label: 'Create Adventure', icon: PlusCircle, color: '#10b981', to: '/organizer' },
      { label: 'View Participants', icon: Users, color: '#06b6d4', to: '/booking' },
      { label: 'Adventure Planner', icon: Compass, color: '#8b5cf6', to: '/adventure-planner' },
      { label: 'Manage Schedule', icon: Calendar, color: '#f59e0b', to: '/event-schedule' },
      { label: 'Communication Center', icon: MessageSquare, color: '#ec4899', to: '/admin/communication' },
      { label: 'Safety Incidents', icon: ShieldAlert, color: '#ef4444', to: '/safety' },
    ],
    trainer: [
      { label: 'Assessments', icon: ClipboardList, color: '#8b5cf6', to: '/fitness/assessment' },
      { label: 'View Participants', icon: Users, color: '#10b981', to: '/trainer-dashboard' },
      { label: 'Create Workout Plan', icon: Dumbbell, color: '#06b6d4', to: '/fitness' },
      { label: 'Track Readiness', icon: Activity, color: '#f59e0b', to: '/dashboard' },
      { label: 'Challenge Hub', icon: Compass, color: '#38bdf8', to: '/challenge-hub' },
    ],
    guide: [
      { label: 'Active Event', icon: MapPin, color: '#06b6d4', to: '/live-event' },
      { label: 'Participants', icon: Users, color: '#10b981', to: '/live-event' },
      { label: 'Checkpoints GPS', icon: Compass, color: '#8b5cf6', to: '/live-event' },
      { label: 'Safety Center', icon: ShieldAlert, color: '#f59e0b', to: '/safety' },
      { label: 'Emergency SOS', icon: Siren, color: '#ef4444', to: '/safety', isEmergency: true },
    ],
    admin: [
      { label: 'Analytics Dashboard', icon: BarChart2, color: '#06b6d4', to: '/analytics' },
      { label: 'Communication Center', icon: MessageSquare, color: '#ec4899', to: '/admin/communication' },
      { label: 'Manage Adventures', icon: Compass, color: '#10b981', to: '/adventure-planner' },
      { label: 'Safety Incidents', icon: ShieldAlert, color: '#ef4444', to: '/safety' },
      { label: 'Organizer Console', icon: PlusCircle, color: '#f59e0b', to: '/organizer' },
    ],
  };

  const actions = actionsByRole[role] || actionsByRole.user;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', margin: 0, fontWeight: '700' }}>
            Quick Actions
          </h3>
          <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>
            One-click contextual operations for {role.toUpperCase()}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem',
        }}
      >
        {actions.map((action, i) => {
          const Icon = action.icon;

          if (action.onClick) {
            return (
              <button
                key={i}
                type="button"
                onClick={action.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.85rem 1rem',
                  background: action.isEmergency ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                  border: action.isEmergency ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: action.isEmergency ? '#ef4444' : 'var(--text)',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    padding: '6px',
                    borderRadius: '6px',
                    background: `${action.color}20`,
                    color: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} />
                </div>
                <span>{action.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={i}
              to={action.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.85rem 1rem',
                background: action.isEmergency ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                border: action.isEmergency ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: action.isEmergency ? '#ef4444' : 'var(--text)',
                textDecoration: 'none',
                fontSize: '0.84rem',
                fontWeight: '700',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: `${action.color}20`,
                  color: action.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={16} />
              </div>
              <span>{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
