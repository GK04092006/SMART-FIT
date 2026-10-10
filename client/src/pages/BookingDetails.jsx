import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Ticket, Calendar, MapPin, CheckCircle2, QrCode,
  Compass, PhoneCall, Dumbbell, Clock, Users, ArrowLeft,
  Printer, Shield, AlertTriangle,
} from 'lucide-react';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      try {
        setLoading(true);
        // Find in user's bookings
        const { data } = await API.get('/booking/my');
        const found = (data || []).find((b) => String(b._id) === String(id) || b.ticketCode === id);
        if (found) {
          setBooking(found);
        } else {
          // Fallback query if direct ID
          setError('Booking record not found in your account.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to retrieve booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id, isAuthenticated]);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem' }}>
        <Loader text="Loading booking ticket..." />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={40} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h3>Booking Not Found</h3>
          <p style={{ color: 'var(--muted-text)', margin: '0.5rem 0 1.5rem 0' }}>{error}</p>
          <Link to="/booking" className="btn-primary">View All Bookings</Link>
        </div>
      </div>
    );
  }

  const adventureId = booking.itemRef?._id || booking.itemRef;
  const bookingDateStr = booking.bookingDate
    ? new Date(booking.bookingDate).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
    : 'TBD';

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '900px' }}>
        <Breadcrumbs
          customCrumbs={[
            { label: 'My Bookings', to: '/booking' },
            { label: `Booking #${booking.ticketCode || String(booking._id).slice(-6).toUpperCase()}`, to: null },
          ]}
        />

        {/* Header Ticket Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.1), rgba(8, 145, 178, 0.1))',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} /> {booking.status || 'Confirmed'}
              </span>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--text)', margin: '0 0 0.4rem 0', fontWeight: '800' }}>
                {booking.itemDetails?.title || 'Adventure Reservation'}
              </h1>
              <p style={{ color: 'var(--muted-text)', margin: 0, fontSize: '0.9rem' }}>
                Ticket Code: <strong style={{ color: 'var(--primary)', letterSpacing: '0.05em' }}>{booking.ticketCode}</strong>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem' }}
              >
                <QrCode size={16} /> View QR Ticket
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1rem' }}
              >
                <Printer size={16} /> Print
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons Group (Requested Feature 2) */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {adventureId && (
            <Link to={`/adventures/${adventureId}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <Compass size={15} /> View Adventure
            </Link>
          )}

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Ticket size={15} /> View Ticket
          </button>

          <Link to="/event-schedule" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Calendar size={15} /> Event Schedule
          </Link>

          <Link to="/contact" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <PhoneCall size={15} /> Contact Organizer
          </Link>

          <Link to="/fitness" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Dumbbell size={15} /> Fitness Preparation
          </Link>

          <Link
            to={`/events/${booking._id}`}
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}
          >
            Open Live Event Tracker
          </Link>
        </div>

        {/* Ticket Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem', color: 'var(--text)' }}>Expedition Details</h3>
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
              <img
                src={booking.itemDetails?.imageUrl || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80'}
                alt={booking.itemDetails?.title}
                style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
              />
              <div>
                <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>
                  {booking.itemType} • {booking.itemDetails?.category || 'Expedition'}
                </span>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text)', margin: '0.3rem 0 0.2rem 0' }}>
                  {booking.itemDetails?.title}
                </h4>
                <span style={{ fontSize: '0.85rem', color: 'var(--muted-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <MapPin size={13} color="var(--primary)" /> {booking.itemDetails?.location || 'Base Camp'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--muted-text)' }}>Scheduled Date</span>
                <strong style={{ color: 'var(--text)' }}>{bookingDateStr}</strong>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--muted-text)' }}>Participants Reserved</span>
                <strong style={{ color: 'var(--text)' }}>{booking.participants} Adventurer(s)</strong>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--muted-text)' }}>Assigned Team</span>
                <strong style={{ color: 'var(--secondary)' }}>{booking.team || 'Team Alpha'}</strong>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--muted-text)' }}>Trailhead Check-in Status</span>
                <strong style={{ color: booking.checkedIn ? 'var(--primary)' : 'var(--warning)' }}>
                  {booking.checkedIn ? `Checked In (${new Date(booking.checkedInAt).toLocaleTimeString()})` : 'Pending QR Scan at Trailhead'}
                </strong>
              </div>
              <div style={detailRowStyle}>
                <span style={{ color: 'var(--muted-text)' }}>Total Amount Paid</span>
                <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>₹{booking.totalPrice}</strong>
              </div>
            </div>
          </div>

          {/* Quick QR Card */}
          <div className="glass-panel" style={{ padding: '1.75rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '1rem' }}>Trailhead Pass</h3>
            <div
              style={{
                background: '#ffffff',
                padding: '1.25rem',
                borderRadius: '12px',
                display: 'inline-block',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                marginBottom: '1rem',
              }}
            >
              <QrCode size={130} color="#0f172a" />
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.05em' }}>
              {booking.ticketCode}
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted-text)', margin: '0.5rem 0 0 0' }}>
              Present this code to the Lead Guide at the start gate for instant check-in.
            </p>
          </div>
        </div>
      </div>

      {/* QR Modal */}
      {showQrModal && (
        <div className="modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px', textAlign: 'center' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '0.3rem' }}>Boarding Pass & QR Ticket</h3>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              {booking.itemDetails?.title}
            </p>
            <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
              <QrCode size={180} color="#0f172a" />
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
              {booking.ticketCode}
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--muted-text)', marginBottom: '1.5rem' }}>
              Participant: <strong>{user?.name}</strong> • Date: <strong>{bookingDateStr}</strong>
            </p>
            <button type="button" className="btn-primary" onClick={() => setShowQrModal(false)} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const detailRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.88rem',
};

export default BookingDetails;
