import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, MapPin, Ticket, Dumbbell, Bell, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import API from '../services/api';

const GlobalSearch = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({
    adventures: [],
    bookings: [],
    workouts: [],
    notifications: [],
  });
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ adventures: [], bookings: [], workouts: [], notifications: [] });
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search effect with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults({ adventures: [], bookings: [], workouts: [], notifications: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [advRes, bookRes, notifRes] = await Promise.allSettled([
          API.get(`/adventure?search=${encodeURIComponent(query)}`),
          API.get('/booking/my'),
          API.get(`/notifications?limit=10`),
        ]);

        const adventures = advRes.status === 'fulfilled' ? (advRes.value.data || []) : [];

        const myBookings = bookRes.status === 'fulfilled' ? (bookRes.value.data || []) : [];
        const filteredBookings = myBookings.filter((b) =>
          (b.itemDetails?.title || '').toLowerCase().includes(query.toLowerCase()) ||
          (b.ticketCode || '').toLowerCase().includes(query.toLowerCase()) ||
          (b.itemDetails?.location || '').toLowerCase().includes(query.toLowerCase())
        );

        const myNotifications = notifRes.status === 'fulfilled' ? (notifRes.value.data?.notifications || []) : [];
        const filteredNotifications = myNotifications.filter((n) =>
          (n.title || '').toLowerCase().includes(query.toLowerCase()) ||
          (n.message || '').toLowerCase().includes(query.toLowerCase())
        );

        // Predefined workouts matching query
        const commonWorkouts = [
          { id: 'w1', name: 'Hill Walking & Incline Rucking', category: 'Endurance', duration: '45 mins', link: '/fitness' },
          { id: 'w2', name: 'Trail Tempo Run & Interval Sprints', category: 'Cardio', duration: '35 mins', link: '/fitness' },
          { id: 'w3', name: 'Leg Power & Weighted Pack Squats', category: 'Strength', duration: '40 mins', link: '/fitness' },
          { id: 'w4', name: 'High-Altitude Lunges & Core Stabilization', category: 'Conditioning', duration: '30 mins', link: '/fitness' },
          { id: 'w5', name: 'Hip Mobility & Hamstring Flexibility Flow', category: 'Flexibility', duration: '20 mins', link: '/fitness' },
        ];
        const filteredWorkouts = commonWorkouts.filter(w =>
          w.name.toLowerCase().includes(query.toLowerCase()) ||
          w.category.toLowerCase().includes(query.toLowerCase())
        );

        setResults({
          adventures: adventures.slice(0, 5),
          bookings: filteredBookings.slice(0, 4),
          workouts: filteredWorkouts.slice(0, 3),
          notifications: filteredNotifications.slice(0, 3),
        });
      } catch (err) {
        console.error('[Search Error]', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalHits =
    results.adventures.length +
    results.bookings.length +
    results.workouts.length +
    results.notifications.length;

  const handleSelect = (url) => {
    onClose();
    navigate(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 10, 20, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '5rem 1rem 2rem',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '650px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--card-shadow), 0 25px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Search Bar Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '1.1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <Search size={20} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search adventures, locations, bookings, workouts, alerts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: '1.05rem',
              fontWeight: '500',
              padding: 0,
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--muted-text)', cursor: 'pointer', padding: '4px' }}
            >
              <X size={18} />
            </button>
          )}
          <span
            style={{
              padding: '0.2rem 0.5rem',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '6px',
              fontSize: '0.7rem',
              color: 'var(--muted-text)',
              fontWeight: '700',
            }}
          >
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.75rem' }}>
          {!query.trim() ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--muted-text)' }}>
              <Compass size={36} color="var(--primary)" style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <p style={{ fontSize: '0.9rem', margin: '0 0 0.5rem 0' }}>Search across the entire platform</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Kodaikanal', 'Trekking', 'Glacier', 'Kayaking', 'Fitness'].map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => setQuery(term)}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0.25rem 0.75rem',
                      color: 'var(--text)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : loading ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--muted-text)', fontSize: '0.9rem' }}>
              Searching platform records...
            </div>
          ) : totalHits === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted-text)' }}>
              <p style={{ fontSize: '0.95rem', margin: 0 }}>No matches found for "{query}"</p>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Try searching by adventure title, town, or discipline.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Adventures */}
              {results.adventures.length > 0 && (
                <div>
                  <div style={categoryHeaderStyle}>Expeditions & Adventures</div>
                  {results.adventures.map((adv) => (
                    <div
                      key={adv._id || adv.id}
                      onClick={() => handleSelect(`/adventures/${adv._id || adv.id}`)}
                      style={resultItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={adv.imageUrl}
                          alt={adv.title}
                          style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>
                            {adv.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <MapPin size={12} color="var(--primary)" /> {adv.location} • {adv.category} • ₹{adv.price}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={15} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              )}

              {/* Bookings */}
              {results.bookings.length > 0 && (
                <div>
                  <div style={categoryHeaderStyle}>My Bookings & Tickets</div>
                  {results.bookings.map((b) => (
                    <div
                      key={b._id}
                      onClick={() => handleSelect(`/bookings/${b._id}`)}
                      style={resultItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--primary)' }}>
                          <Ticket size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>
                            {b.itemDetails?.title || 'Adventure Booking'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                            Ticket: <span style={{ color: 'var(--primary)', fontWeight: '700' }}>{b.ticketCode}</span> • {b.status}
                          </div>
                        </div>
                      </div>
                      <ArrowRight size={15} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              )}

              {/* Workouts */}
              {results.workouts.length > 0 && (
                <div>
                  <div style={categoryHeaderStyle}>Recommended Training & Workouts</div>
                  {results.workouts.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => handleSelect(w.link)}
                      style={resultItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(8, 145, 178, 0.1)', color: 'var(--secondary)' }}>
                          <Dumbbell size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>{w.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>{w.category} • {w.duration}</div>
                        </div>
                      </div>
                      <ArrowRight size={15} color="var(--secondary)" />
                    </div>
                  ))}
                </div>
              )}

              {/* Notifications */}
              {results.notifications.length > 0 && (
                <div>
                  <div style={categoryHeaderStyle}>Alerts & Notifications</div>
                  {results.notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleSelect(n.actionUrl || '/notifications')}
                      style={resultItemStyle}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                          <Bell size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text)' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>{n.message.substring(0, 60)}…</div>
                        </div>
                      </div>
                      <ArrowRight size={15} color="var(--primary)" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderTop: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.01)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--muted-text)',
          }}
        >
          <span>Press <strong>ESC</strong> to close</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <span>Navigate</span>
            <CornerDownLeft size={12} />
          </span>
        </div>
      </div>
    </div>
  );
};

const categoryHeaderStyle = {
  fontSize: '0.72rem',
  fontWeight: '800',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--muted-text)',
  padding: '0.4rem 0.5rem',
};

const resultItemStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.55rem 0.65rem',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'background 0.15s ease',
  background: 'rgba(255,255,255,0.02)',
  marginBottom: '0.3rem',
  border: '1px solid transparent',
};

export default GlobalSearch;
