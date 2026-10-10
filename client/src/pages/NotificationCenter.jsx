import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bell, CheckCheck, Trash2, ArrowRight, Filter,
  ShieldAlert, Compass, AlertCircle, Award, Calendar,
  Activity, ExternalLink, RefreshCw,
} from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const NOTIFICATION_TABS = [
  { id: 'ALL', label: 'All Notifications' },
  { id: 'BOOKING', label: 'Bookings' },
  { id: 'READINESS', label: 'Readiness' },
  { id: 'REMINDER', label: 'Reminders' },
  { id: 'EVENT_UPDATE', label: 'Schedule Updates' },
  { id: 'SOS', label: 'Safety & SOS' },
  { id: 'COMPLETION', label: 'Completions & XP' },
  { id: 'ANNOUNCEMENT', label: 'Announcements' },
];

const NotificationCenter = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const typeParam = activeTab === 'ALL' ? '' : `&type=${activeTab}`;
      const unreadParam = unreadOnly ? '&unreadOnly=true' : '';
      const { data } = await API.get(`/notifications?limit=50${typeParam}${unreadParam}`);

      if (data?.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('[Notification Load Error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeTab, unreadOnly, isAuthenticated]);

  useEffect(() => {
    const handleLiveNotification = () => fetchNotifications();
    window.addEventListener('app:notification', handleLiveNotification);
    return () => window.removeEventListener('app:notification', handleLiveNotification);
  }, [activeTab, unreadOnly, isAuthenticated]);

  const markAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const getDynamicActionUrl = (notif) => {
    if (notif.actionUrl) return notif.actionUrl;

    if (notif.relatedEntity === 'Adventure' && notif.relatedEntityId) {
      if (notif.type === 'READINESS') return `/adventures/${notif.relatedEntityId}/readiness`;
      return `/adventures/${notif.relatedEntityId}`;
    }
    if (notif.relatedEntity === 'Booking' && notif.relatedEntityId) {
      return `/bookings/${notif.relatedEntityId}`;
    }
    if (notif.relatedEntity === 'SosIncident') {
      return `/safety`;
    }
    if (notif.type === 'COMPLETION') return `/engagement`;
    if (notif.type === 'EVENT_UPDATE') return `/event-schedule`;
    if (notif.type === 'READINESS') return `/fitness/assessment`;

    return '/dashboard';
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'SOS':
        return { label: 'CRITICAL SOS', color: '#ef4444', icon: ShieldAlert };
      case 'BOOKING':
        return { label: 'EXPEDITION BOOKING', color: '#059669', icon: Compass };
      case 'READINESS':
        return { label: 'FITNESS READINESS', color: '#0891b2', icon: Activity };
      case 'REMINDER':
        return { label: 'TRIP REMINDER', color: '#8b5cf6', icon: Calendar };
      case 'EVENT_UPDATE':
        return { label: 'SCHEDULE UPDATE', color: '#f59e0b', icon: Calendar };
      case 'CANCELLATION':
        return { label: 'CANCELLATION', color: '#dc2626', icon: AlertCircle };
      case 'CHECKIN':
        return { label: 'TRAILHEAD CHECK-IN', color: '#10b981', icon: Compass };
      case 'COMPLETION':
        return { label: 'XP & REWARDS', color: '#f59e0b', icon: Award };
      case 'ANNOUNCEMENT':
        return { label: 'ANNOUNCEMENT', color: '#ec4899', icon: Bell };
      default:
        return { label: 'SYSTEM ALERT', color: 'var(--primary)', icon: Bell };
    }
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem 2rem 4rem 1rem', flex: 1, minWidth: 0, maxWidth: '1000px' }}>
          <Breadcrumbs
            customCrumbs={[
              { label: 'Dashboard', to: '/dashboard' },
              { label: 'Notification Center', to: null },
            ]}
          />

        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '2.1rem', color: 'var(--text)', margin: 0, fontWeight: '800' }}>
                Notification Center
              </h1>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ALL');
                    setUnreadOnly(true);
                  }}
                  className="badge badge-magenta"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.65rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                  title="Click to view all unread notifications"
                >
                  <Bell size={12} /> {unreadCount} UNREAD
                </button>
              )}
            </div>
            <p style={{ color: 'var(--muted-text)', margin: '0.4rem 0 0 0', fontSize: '0.95rem' }}>
              Real-time alerts for adventure bookings, fitness readiness, reminders, safety alerts, and schedules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={fetchNotifications}
              className="btn-secondary"
              title="Refresh notifications"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.55rem 0.85rem' }}
            >
              <RefreshCw size={15} /> Refresh
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem' }}
              >
                <CheckCheck size={16} /> Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills & Unread Toggle */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.75rem',
            background: 'var(--bg-card)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
            {NOTIFICATION_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.4rem 0.95rem', fontSize: '0.82rem', borderRadius: 'var(--radius-full)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.84rem',
              color: 'var(--text)',
              cursor: 'pointer',
              fontWeight: '700',
              whiteSpace: 'nowrap',
              padding: '0.4rem 0.75rem',
              background: unreadOnly ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-input)',
              border: unreadOnly ? '1px solid var(--primary-emerald)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              transition: 'all 0.2s ease',
            }}
          >
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer', width: '15px', height: '15px' }}
            />
            <span>Show Unread Only</span>
          </label>
        </div>

        {/* Notifications List */}
        {loading ? (
          <Loader text="Loading notifications from database..." />
        ) : notifications.length === 0 ? (
          <div className="glass-panel" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted-text)' }}>
            <Bell size={48} color="var(--primary)" style={{ opacity: 0.35, marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text)', fontSize: '1.25rem', fontWeight: 800 }}>
              {activeTab === 'ALL' ? 'No Notifications Found' : `No ${NOTIFICATION_TABS.find(t => t.id === activeTab)?.label || ''} Notifications`}
            </h3>
            <p style={{ margin: '0.5rem auto 1.5rem auto', fontSize: '0.9rem', maxWidth: '440px' }}>
              {unreadOnly
                ? 'You have cleared all unread notifications in this category.'
                : activeTab !== 'ALL'
                ? `You have no notifications under this category. Check "All Notifications" to view your other active alerts.`
                : 'You have no notifications yet.'}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              {activeTab !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ALL');
                    setUnreadOnly(false);
                  }}
                  className="btn-primary"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  View All Notifications
                </button>
              )}
              {unreadOnly && (
                <button
                  type="button"
                  onClick={() => setUnreadOnly(false)}
                  className="btn-secondary"
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  Show All (Including Read)
                </button>
              )}
              <Link to="/adventure" className="btn-secondary" style={{ padding: '0.55rem 1.25rem' }}>
                Explore Expeditions
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {notifications.map((notif) => {
              const badge = getTypeBadge(notif.type);
              const Icon = badge.icon;
              const targetUrl = getDynamicActionUrl(notif);

              return (
                <div
                  key={notif._id}
                  onClick={() => navigate(targetUrl)}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${badge.color}`,
                    background: notif.read ? 'var(--surface)' : 'rgba(16, 185, 129, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: 'var(--card-shadow)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          background: `${badge.color}18`,
                          color: badge.color,
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <Icon size={20} />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: '800',
                              letterSpacing: '0.06em',
                              color: badge.color,
                              textTransform: 'uppercase',
                            }}
                          >
                            {badge.label}
                          </span>
                          {!notif.read && (
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '0.1rem 0.45rem' }}>
                              NEW
                            </span>
                          )}
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', marginLeft: 'auto' }}>
                            {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '1.1rem', color: 'var(--text)', margin: '0 0 0.35rem 0', fontWeight: notif.read ? '600' : '800' }}>
                          {notif.title}
                        </h3>

                        <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-line' }}>
                          {notif.message}
                        </p>

                        {/* Action Link using real entity ID */}
                        <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span
                            style={{
                              color: 'var(--primary)',
                              fontSize: '0.84rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <span>Open Related Details</span>
                            <ArrowRight size={14} />
                          </span>

                          {notif.relatedEntity && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)', opacity: 0.7 }}>
                              Entity: {notif.relatedEntity} ({notif.relatedEntityId ? `#${String(notif.relatedEntityId).slice(-6)}` : ''})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={(e) => markAsRead(notif._id, e)}
                          title="Mark as read"
                          className="btn-secondary"
                          style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => deleteNotification(notif._id, e)}
                        title="Delete notification"
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem', color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </div>
  );
};

export default NotificationCenter;
