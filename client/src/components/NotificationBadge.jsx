import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Compass, AlertCircle, ShieldAlert, Award, Calendar, ChevronRight } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../hooks/useAuth';

const NotificationBadge = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchUnread = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await API.get('/notifications?limit=5');
      if (data?.success) {
        setUnreadCount(data.unreadCount || 0);
        setRecentNotifications(data.notifications || []);
      }
    } catch {
      // Demo fallback or offline
    }
  };

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Polling every 30s
    const handleLiveNotification = () => fetchUnread();
    window.addEventListener('app:notification', handleLiveNotification);
    return () => {
      clearInterval(interval);
      window.removeEventListener('app:notification', handleLiveNotification);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setUnreadCount(0);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SOS':
        return <ShieldAlert size={15} color="#ef4444" />;
      case 'BOOKING':
        return <Compass size={15} color="#059669" />;
      case 'READINESS':
        return <AlertCircle size={15} color="#0891b2" />;
      case 'COMPLETION':
        return <Award size={15} color="#f59e0b" />;
      case 'REMINDER':
      case 'EVENT_UPDATE':
        return <Calendar size={15} color="#8b5cf6" />;
      default:
        return <Bell size={15} color="var(--primary)" />;
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Notification Center"
        aria-label="Notifications"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-3px',
              right: '-3px',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '999px',
              background: '#ef4444',
              color: '#ffffff',
              fontSize: '0.68rem',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--surface)',
              boxShadow: '0 2px 8px rgba(239,68,68,0.5)',
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '340px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--card-shadow), 0 16px 40px rgba(0,0,0,0.5)',
            zIndex: 1100,
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>Notifications</strong>
              {unreadCount > 0 && (
                <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {recentNotifications.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted-text)' }}>
                <Bell size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.85rem', margin: 0 }}>No notifications yet</p>
              </div>
            ) : (
              recentNotifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => {
                    setOpen(false);
                    if (notif.actionUrl) navigate(notif.actionUrl);
                    else navigate('/notifications');
                  }}
                  style={{
                    padding: '0.85rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    background: notif.read ? 'transparent' : 'rgba(16, 185, 129, 0.05)',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'flex-start',
                    transition: 'background 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      marginTop: '2px',
                      padding: '6px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getTypeIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <strong
                        style={{
                          fontSize: '0.86rem',
                          color: 'var(--text)',
                          fontWeight: notif.read ? '600' : '800',
                          lineHeight: 1.3,
                        }}
                      >
                        {notif.title}
                      </strong>
                      {!notif.read && (
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '5px' }} />
                      )}
                    </div>
                    <p
                      style={{
                        fontSize: '0.78rem',
                        color: 'var(--muted-text)',
                        margin: '0.25rem 0 0 0',
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {notif.message}
                    </p>
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted-text)', opacity: 0.7, marginTop: '4px', display: 'inline-block' }}>
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer View All Link */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '1px solid var(--border)',
              color: 'var(--primary)',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: '700',
              textAlign: 'center',
            }}
          >
            <span>Open Notification Center</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;
