import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, CheckCircle2, ShieldAlert, CreditCard, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

const Booking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const itemType = location.state?.itemType || 'Adventure';
  const [selectedItem, setSelectedItem] = useState(
    location.state?.item || {
      _id: '6ac4be68a7fbad85a4561d39',
      title: 'Alpine Crest Glacier Trek',
      category: 'Trekking',
      location: 'Swiss Alps, Interlaken',
      price: 650,
      imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
    }
  );

  useEffect(() => {
    if (!location.state?.item) {
      API.get(itemType === 'Fitness' ? '/fitness' : '/adventure')
        .then(({ data }) => {
          if (Array.isArray(data) && data.length > 0) {
            setSelectedItem(data[0]);
          }
        })
        .catch(() => {});
    }
  }, [location.state?.item, itemType]);

  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [participants, setParticipants] = useState(1);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const unitPrice = selectedItem.price || (itemType === 'Fitness' ? 0 : 250);
  const totalPrice = unitPrice * participants;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await API.post('/booking', {
        itemType,
        itemRef: selectedItem._id || selectedItem.id || 'seed_ref',
        itemDetails: {
          title: selectedItem.title,
          category: selectedItem.category,
          imageUrl: selectedItem.imageUrl,
          location: selectedItem.location || 'Fitness Hub',
        },
        bookingDate,
        participants,
        totalPrice,
        notes,
      });

      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      const data = err.response?.data;

      if (err.response?.status === 403 && data?.weakAreas?.length) {
        // Readiness gate rejection — show specific weak areas
        setError(
          `${data.message} Areas to improve: ${data.weakAreas.join(', ')}. ` +
          (data.hint || 'Complete a fitness assessment first.')
        );
      } else {
        setError(data?.message || 'Failed to complete booking. Please try again.');
      }
    }
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '900px' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn-secondary"
          style={{ marginBottom: '2rem', padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        {success ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ width: '64px', height: '64px', background: 'rgba(16,185,129,0.15)', color: 'var(--primary-emerald)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto' }}>
              <CheckCircle2 size={36} />
            </div>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
              Your reservation for <strong style={{ color: 'var(--text-main)' }}>{selectedItem.title}</strong> has been confirmed. Detailed instructions have been dispatched to your email.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Link to="/dashboard" className="btn-primary">
                Go to Dashboard
              </Link>
              <Link to="/adventure" className="btn-secondary">
                Browse More Trips
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid-2">
            {/* Selected Summary Card */}
            <div>
              <span className="section-subtitle">Checkout Summary</span>
              <h2 style={{ fontSize: '1.75rem', marginBottom: '1.5rem' }}>Reservation Details</h2>

              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <img
                  src={selectedItem.imageUrl}
                  alt={selectedItem.title}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}
                />
                <span className={`badge ${itemType === 'Adventure' ? 'badge-cyan' : 'badge-magenta'}`} style={{ fontSize: '0.7rem' }}>
                  {itemType} • {selectedItem.category}
                </span>
                <h3 style={{ fontSize: '1.25rem', marginTop: '0.25rem', marginBottom: '0.5rem' }}>{selectedItem.title}</h3>
                {selectedItem.location && (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {selectedItem.location}</p>
                )}

                <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Price per slot</span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>₹{unitPrice}</span>
                </div>
              </div>
            </div>

            {/* Form Inputs */}
            <div>
              <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Select Preferences</h3>

                {error && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
                    Date of Session / Departure
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                      required
                    />
                    <Calendar size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
                    Number of Participants / Guests
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={participants}
                      onChange={(e) => setParticipants(Math.max(1, parseInt(e.target.value) || 1))}
                      style={{ width: '100%', paddingLeft: '2.5rem' }}
                      required
                    />
                    <Users size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>
                    Special Medical / Dietary Notes (Optional)
                  </label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Vegetarian diet, allergic to peanuts, intermediate swimmer"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ width: '100%' }}
                  ></textarea>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    <span>{participants} × ₹{unitPrice}</span>
                    <span>₹{totalPrice}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.25rem', color: 'var(--primary-emerald)' }}>
                    <span>Total Amount</span>
                    <span>₹{totalPrice}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Processing Reservation...' : isAuthenticated ? 'Confirm Booking' : 'Log In to Confirm'} <CreditCard size={18} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
