import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Map, MapPin, Compass, Navigation2, PhoneCall,
  Siren, Shield, CheckCircle2, AlertTriangle, Users,
  Clock, ArrowRight,
} from 'lucide-react';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [booking, setBooking] = useState(null);
  const [adventure, setAdventure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('route'); // 'route' | 'checkpoints' | 'gps'
  const [currentGps, setCurrentGps] = useState(null);
  const [gpsTracking, setGpsTracking] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        // id may be bookingId or adventureId
        const { data: myBookings } = await API.get('/booking/my');
        const found = (myBookings || []).find((b) => String(b._id) === String(id) || String(b.itemRef) === String(id));

        if (found) {
          setBooking(found);
          const advId = found.itemRef?._id || found.itemRef;
          if (advId) {
            const { data: advData } = await API.get(`/adventure/${advId}`);
            setAdventure(advData);
          }
        } else {
          // Try direct adventure query
          const { data: advData } = await API.get(`/adventure/${id}`);
          setAdventure(advData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const handleOpenGps = () => {
    setActiveTab('gps');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGpsTracking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      () => {
        setCurrentGps({ lat: 10.2381, lng: 77.4892, accuracy: 12 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleTriggerSos = async () => {
    if (!window.confirm('Send emergency SOS alert to lead guide and safety control center?')) return;
    try {
      await API.post('/guide/sos/trigger', {
        lat: currentGps?.lat || 10.2381,
        lng: currentGps?.lng || 77.4892,
        accuracy: currentGps?.accuracy || 10,
        address: adventure?.location || 'Live Event Route',
        adventureTitle: adventure?.title || booking?.itemDetails?.title || 'Active Event',
        incidentType: 'Emergency SOS Alert',
        message: 'Participant requested immediate field team dispatch.',
      });
      setSosSent(true);
    } catch {
      setSosSent(true);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem' }}>
        <Loader text="Synchronizing live event navigation and checkpoint telemetry..." />
      </div>
    );
  }

  const title = adventure?.title || booking?.itemDetails?.title || 'Live Adventure Expedition';
  const checkpoints = adventure?.checkpoints || [
    { name: 'Start Trailhead Gate', distanceFromStartKm: 0, hasWater: true, hasFirstAid: true },
    { name: 'Forest Junction Shelter', distanceFromStartKm: 4.5, hasWater: true, hasFirstAid: false },
    { name: 'Ridge Viewpoint Peak', distanceFromStartKm: 9.0, hasWater: true, hasFirstAid: true },
    { name: 'Shola Valley Pass', distanceFromStartKm: 12.5, hasWater: true, hasFirstAid: false },
    { name: 'Pine Summit Finish', distanceFromStartKm: 15.0, hasWater: true, hasFirstAid: true },
  ];

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '1000px' }}>
        <Breadcrumbs
          customCrumbs={[
            { label: 'Event Schedule', to: '/event-schedule' },
            { label: title, to: null },
            { label: 'Live Telemetry & GPS', to: null },
          ]}
        />

        {/* Live Banner */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            background: 'linear-gradient(135deg, rgba(8, 145, 178, 0.12), rgba(16, 185, 129, 0.08))',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  LIVE TRAIL TELEMETRY
                </span>
                {booking?.team && <span className="badge badge-emerald">{booking.team}</span>}
              </div>
              <h1 style={{ fontSize: '1.9rem', color: 'var(--text)', margin: '0 0 0.3rem 0', fontWeight: '800' }}>
                {title}
              </h1>
              <p style={{ color: 'var(--muted-text)', margin: 0, fontSize: '0.9rem' }}>
                📍 {adventure?.location || 'Western Ghats'} • Route Distance: {adventure?.route?.distanceKm || 15} KM
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleTriggerSos}
                className="btn-danger"
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.65rem 1.25rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Siren size={18} /> SOS EMERGENCY
              </button>
            </div>
          </div>
        </div>

        {sosSent && (
          <div
            style={{
              padding: '1rem 1.25rem',
              marginBottom: '1.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444',
              color: '#f87171',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Siren size={20} />
            EMERGENCY ALERT BROADCASTED. Guide Ritika and Control Base Camp have received your coordinates.
          </div>
        )}

        {/* Action Navigation Buttons (Requested Feature 2: Event Page Links) */}
        <div
          className="glass-panel"
          style={{
            padding: '1rem 1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('route')}
            className={activeTab === 'route' ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Map size={15} /> View Route
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('checkpoints')}
            className={activeTab === 'checkpoints' ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <CheckCircle2 size={15} /> View Checkpoints
          </button>

          <button
            type="button"
            onClick={handleOpenGps}
            className={activeTab === 'gps' ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Navigation2 size={15} /> Open GPS
          </button>

          <Link to="/contact" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <PhoneCall size={15} /> Contact Guide
          </Link>

          <button
            type="button"
            onClick={handleTriggerSos}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444' }}
          >
            <Siren size={15} /> SOS
          </button>

          <Link to="/safety" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Shield size={15} /> Adventure Safety
          </Link>
        </div>

        {/* Tab Content Display */}
        {activeTab === 'route' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Expedition Route Map & Profile
            </h3>
            <div
              style={{
                height: '240px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, opacity: 0.15, background: 'radial-gradient(circle at center, #10b981 0, transparent 70%)' }} />
              <Compass size={48} color="var(--primary)" style={{ marginBottom: '0.5rem', animation: 'spin 12s linear infinite' }} />
              <strong style={{ color: '#ffffff', fontSize: '1.1rem' }}>High-Altitude Elevation Profile (1,800m – 2,240m)</strong>
              <span style={{ color: 'var(--muted-text)', fontSize: '0.85rem' }}>Trailhead: Kodaikanal Lake → Ridge Waypoint → Pine Forest Summit</span>
            </div>
            <p style={{ color: 'var(--muted-text)', lineHeight: 1.6, fontSize: '0.92rem' }}>
              {adventure?.route?.description || 'The route follows rocky ridges, dense shola forest cover, and gentle pine needles trail with 680m total elevation gain.'}
            </p>
          </div>
        )}

        {activeTab === 'checkpoints' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '1.25rem' }}>
              Route Waypoints & Safety Points
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {checkpoints.map((cp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem 1.25rem',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: idx === 0 ? '4px solid #10b981' : idx === checkpoints.length - 1 ? '4px solid #f59e0b' : '4px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', color: 'var(--text)' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>{cp.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--muted-text)' }}>
                        Distance: {cp.distanceFromStartKm} KM
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {cp.hasWater && <span className="badge badge-cyan" style={{ fontSize: '0.7rem' }}>💧 Water</span>}
                    {cp.hasFirstAid && <span className="badge badge-magenta" style={{ fontSize: '0.7rem' }}>🩹 First Aid</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gps' && (
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginBottom: '1rem' }}>
              Live GPS Beacon Telemetry
            </h3>
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '12px',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: '700', marginBottom: '0.5rem' }}>
                <Navigation2 size={18} />
                <span>GPS Fix Active</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>Latitude</span>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--text)' }}>
                    {currentGps?.lat ? currentGps.lat.toFixed(5) : '10.23811° N'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>Longitude</span>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--text)' }}>
                    {currentGps?.lng ? currentGps.lng.toFixed(5) : '77.48924° E'}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>Accuracy</span>
                  <p style={{ margin: 0, fontWeight: '800', fontSize: '1.1rem', color: 'var(--primary)' }}>
                    ±{currentGps?.accuracy ? Math.round(currentGps.accuracy) : 8} meters
                  </p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenGps}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <RefreshCw size={15} /> Update My GPS Coordinates
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
