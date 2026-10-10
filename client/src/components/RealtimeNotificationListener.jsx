import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

const RealtimeNotificationListener = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!token) {
      setToasts([]);
      return undefined;
    }

    const controller = new AbortController();
    let retryTimer;

    const connect = async () => {
      try {
        const response = await fetch(`${API.defaults.baseURL}/notifications/stream`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Notification stream failed (${response.status})`);
        if (!response.body) throw new Error('Streaming is not supported by this browser');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) {
            reader.releaseLock();
            if (!controller.signal.aborted) retryTimer = window.setTimeout(connect, 3000);
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || '';

          for (const frame of frames) {
            const eventName = frame.match(/^event:\s*(.+)$/m)?.[1];
            if (eventName !== 'notification') continue;
            const data = frame.match(/^data:\s*(.+)$/m)?.[1];
            if (!data) continue;

            try {
              const notification = JSON.parse(data);
              window.dispatchEvent(new CustomEvent('app:notification', { detail: notification }));
              setToasts((current) => [...current, notification].slice(-3));
              window.setTimeout(() => {
                setToasts((current) => current.filter((item) => item._id !== notification._id));
              }, 8000);
            } catch (error) {
              console.error('[Notification Stream Parse Error]', error);
            }
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('[Notification Stream Error]', error);
          retryTimer = window.setTimeout(connect, 3000);
        }
      }
    };

    connect();
    return () => {
      controller.abort();
      window.clearTimeout(retryTimer);
    };
  }, [token]);

  if (!token || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      style={{ position: 'fixed', top: '5.5rem', right: '1rem', zIndex: 1200, display: 'grid', gap: '0.65rem', width: 'min(380px, calc(100vw - 2rem))' }}
    >
      {toasts.map((notification) => (
        <div
          key={notification._id}
          role="status"
          style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border-subtle)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
        >
          <Bell size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <button
            type="button"
            onClick={() => {
              setToasts((current) => current.filter((item) => item._id !== notification._id));
              navigate(notification.actionUrl || '/notifications');
            }}
            style={{ flex: 1, border: 0, padding: 0, background: 'none', color: 'inherit', textAlign: 'left', cursor: 'pointer' }}
          >
            <strong style={{ display: 'block', marginBottom: '0.2rem' }}>{notification.title}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)' }}>{notification.message}</span>
          </button>
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() => setToasts((current) => current.filter((item) => item._id !== notification._id))}
            style={{ border: 0, padding: 0, background: 'none', color: 'var(--muted-text)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default RealtimeNotificationListener;
