import React, { useState } from 'react';
import {
  Calendar, MapPin, Clock, Users, Star, Filter,
  Mountain, ChevronRight, X, CheckCircle2, Bell,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const EVENTS = [
  {
    id: 1,
    title: 'Kodaikanal Forest Trek',
    location: 'Kodaikanal, Tamil Nadu',
    date: '2026-10-12',
    time: '06:00 AM',
    duration: '1 Day',
    type: 'Trekking',
    difficulty: 'Moderate',
    spots: 20, booked: 14,
    price: 2200,
    rating: 4.9,
    guide: 'Ravi Kumar',
    minScore: 40,
    img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=500&q=70',
    highlights: ['Misty Forest Trail', 'Waterfalls', 'Sunrise View', 'Breakfast Included'],
    registered: false,
  },
  {
    id: 2,
    title: 'Rishikesh White Water Rafting',
    location: 'Rishikesh, Uttarakhand',
    date: '2026-10-18',
    time: '08:30 AM',
    duration: '1 Day',
    type: 'Rafting',
    difficulty: 'Moderate',
    spots: 12, booked: 12,
    price: 3500,
    rating: 4.8,
    guide: 'Amit Rawat',
    minScore: 35,
    img: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=500&q=70',
    highlights: ['Grade III–IV Rapids', 'Safety Briefing', 'Riverside Lunch', 'GoPro Photos'],
    registered: false,
  },
  {
    id: 3,
    title: 'Bir Billing Paragliding',
    location: 'Bir Billing, Himachal Pradesh',
    date: '2026-11-02',
    time: '09:00 AM',
    duration: 'Half Day',
    type: 'Paragliding',
    difficulty: 'Easy',
    spots: 10, booked: 7,
    price: 4800,
    rating: 5.0,
    guide: 'Suresh Thakur',
    minScore: 25,
    img: 'https://images.unsplash.com/photo-1542652735873-fb2825bac6e2?auto=format&fit=crop&w=500&q=70',
    highlights: ['30–45 min Flight', 'World Record Height', 'Tandem with Expert', 'Video Included'],
    registered: false,
  },
  {
    id: 4,
    title: 'Spiti Valley Snow Trek',
    location: 'Spiti Valley, Himachal Pradesh',
    date: '2026-11-15',
    time: '05:00 AM',
    duration: '6 Days',
    type: 'Trekking',
    difficulty: 'Extreme',
    spots: 8, booked: 3,
    price: 18500,
    rating: 4.9,
    guide: 'Karma Dorje',
    minScore: 75,
    img: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=500&q=70',
    highlights: ['4400m Altitude', 'Snow Camping', 'Buddhist Monasteries', 'Sherpa Support'],
    registered: false,
  },
  {
    id: 5,
    title: 'Andaman Scuba Diving',
    location: 'Havelock Island, Andaman',
    date: '2026-12-01',
    time: '07:30 AM',
    duration: '1 Day',
    type: 'Water Sport',
    difficulty: 'Easy',
    spots: 8, booked: 5,
    price: 6200,
    rating: 4.9,
    guide: 'Maria Thomas',
    minScore: 20,
    img: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=500&q=70',
    highlights: ['PADI Certified', '15m Depth', 'Coral Reefs', 'Underwater Photos'],
    registered: false,
  },
  {
    id: 6,
    title: 'Rajasthan Desert Safari',
    location: 'Jaisalmer, Rajasthan',
    date: '2026-12-15',
    time: '03:00 PM',
    duration: '2 Days',
    type: 'Safari',
    difficulty: 'Easy',
    spots: 15, booked: 8,
    price: 8900,
    rating: 4.7,
    guide: 'Hanuman Singh',
    minScore: 15,
    img: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=500&q=70',
    highlights: ['Camel Ride', 'Desert Camping', 'Folk Music Night', 'Sunrise at Dunes'],
    registered: false,
  },
];

const TYPES = ['All', 'Trekking', 'Rafting', 'Paragliding', 'Water Sport', 'Safari'];
const DIFFICULTY_BADGE = { Easy: 'badge-emerald', Moderate: 'badge-amber', Extreme: 'badge-red' };

const EventSchedule = () => {
  const [events, setEvents] = useState(EVENTS);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [booked, setBooked] = useState(null);

  const filtered = events.filter(e => filter === 'All' || e.type === filter);

  const registerEvent = (id) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, registered: true, booked: e.booked + 1 } : e));
    setBooked(id);
    setConfirming(null);
    setSelected(null);
    setTimeout(() => setBooked(null), 4000);
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    const diff = Math.ceil((date - new Date()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff <= 7) return `In ${diff} days`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', background: '#f8fafc' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <span className="section-subtitle"><Calendar size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Upcoming Events</span>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Event Schedule</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>All upcoming SMARTFIT ADVENTURE events — filter, browse and register your spot.</p>
          </div>

          {/* Success Banner */}
          {booked && (
            <div className="glass-panel animate-fadeIn" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', background: '#f0fdf4', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle2 size={20} color="#059669" />
              <span style={{ fontWeight: 700, color: '#065f46' }}>You're registered! Confirmation details sent to your email. See you on the trail 🏔️</span>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Events',      value: events.length,                                          icon: '📅', color: 'var(--primary-emerald)' },
              { label: 'Open for Booking',  value: events.filter(e => e.booked < e.spots).length,         icon: '✅', color: '#059669' },
              { label: 'Your Bookings',     value: events.filter(e => e.registered).length,               icon: '🎒', color: '#d97706' },
              { label: 'Price Range',       value: '₹2.2K–18.5K',                                        icon: '💰', color: '#0891b2' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="glass-panel" style={{ padding: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilter(t)} style={{
                padding: '0.4rem 1rem', borderRadius: 'var(--radius-full)', fontFamily: 'inherit',
                border: filter === t ? '2px solid var(--primary-emerald)' : '1.5px solid rgba(15,23,42,0.1)',
                background: filter === t ? '#ecfdf5' : '#fff',
                color: filter === t ? 'var(--primary-emerald)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
              }}>
                {t}
              </button>
            ))}
          </div>

          {/* Event Cards */}
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {filtered.map(event => {
              const slotsLeft = event.spots - event.booked;
              const isFull = slotsLeft === 0;
              return (
                <div key={event.id} className="glass-panel" style={{ overflow: 'hidden', border: event.registered ? '1px solid #a7f3d0' : '1px solid rgba(15,23,42,0.07)' }}>
                  <div style={{ height: 180, overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setSelected(event)}>
                    <img src={event.img} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem' }}>
                      <span className={`badge ${DIFFICULTY_BADGE[event.difficulty]}`} style={{ fontSize: '0.62rem' }}>{event.difficulty}</span>
                      {event.registered && <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>✓ Registered</span>}
                    </div>
                    <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', background: 'rgba(255,255,255,0.9)', borderRadius: 'var(--radius-sm)', padding: '0.2rem 0.6rem', backdropFilter: 'blur(4px)', fontSize: '0.78rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>
                      ₹{event.price.toLocaleString()}
                    </div>
                    <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: isFull ? 'rgba(220,38,38,0.85)' : 'rgba(5,150,105,0.85)', color: 'white', borderRadius: 'var(--radius-full)', padding: '0.2rem 0.6rem', fontSize: '0.68rem', fontWeight: 700 }}>
                      {isFull ? 'FULL' : `${slotsLeft} spots left`}
                    </div>
                  </div>

                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{event.title}</h4>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.65rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <MapPin size={11} /> {event.location}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Calendar size={11} /> {getDateLabel(event.date)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Clock size={11} /> {event.duration}
                      </span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#d97706' }}>
                        ★ {event.rating}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                        <span>{event.booked} registered</span>
                        <span>{event.spots} max</span>
                      </div>
                      <div className="progress-bar-track" style={{ height: 5 }}>
                        <div className="progress-bar-fill" style={{ width: `${(event.booked / event.spots) * 100}%`, background: isFull ? '#dc2626' : 'var(--primary-gradient)' }} />
                      </div>
                    </div>

                    <button
                      className={event.registered ? 'btn-secondary' : 'btn-primary'}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
                      disabled={isFull && !event.registered}
                      onClick={() => event.registered ? null : setConfirming(event)}
                    >
                      {event.registered ? <><CheckCircle2 size={14} /> Registered</> : isFull ? 'Event Full' : <>Register <ChevronRight size={14} /></>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Detail Modal */}
      {selected && !confirming && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <img src={selected.img} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{selected.title}</h2>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={12} /> {selected.location}
                </span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Date',       value: getDateLabel(selected.date) + ' · ' + selected.time },
                { label: 'Duration',   value: selected.duration },
                { label: 'Type',       value: selected.type },
                { label: 'Guide',      value: selected.guide },
                { label: 'Min Score',  value: `${selected.minScore} pts` },
                { label: 'Price',      value: `₹${selected.price.toLocaleString()}` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f8fafc', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.85rem', border: '1px solid rgba(15,23,42,0.07)' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', marginTop: '0.1rem' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem' }}>✨ Highlights</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {selected.highlights.map(h => <span key={h} className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>{h}</span>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelected(null)}>Back</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => setConfirming(selected)} disabled={selected.registered}>
                {selected.registered ? '✓ Already Registered' : `Register — ₹${selected.price.toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Registration Modal */}
      {confirming && (
        <div className="modal-overlay" onClick={() => setConfirming(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏔️</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Confirm Registration</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <strong>{confirming.title}</strong><br />
              {getDateLabel(confirming.date)} · ₹{confirming.price.toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn-secondary" onClick={() => setConfirming(null)}>Cancel</button>
              <button className="btn-primary" onClick={() => registerEvent(confirming.id)}>
                <CheckCircle2 size={15} /> Confirm & Pay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSchedule;
