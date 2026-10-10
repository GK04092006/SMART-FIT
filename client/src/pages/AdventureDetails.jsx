import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin, Calendar, Clock, Users, Shield, Dumbbell,
  CheckCircle, ArrowRight, Compass, PhoneCall, Backpack,
  AlertTriangle, Check, ChevronLeft,
} from 'lucide-react';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const AdventureDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [adventure, setAdventure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuideModal, setShowGuideModal] = useState(false);

  useEffect(() => {
    const fetchAdventure = async () => {
      try {
        setLoading(true);
        const { data } = await API.get(`/adventure/${id}`);
        setAdventure(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Adventure not found');
      } finally {
        setLoading(false);
      }
    };
    fetchAdventure();
  }, [id]);

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem' }}>
        <Loader text="Loading adventure expedition details..." />
      </div>
    );
  }

  if (error || !adventure) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem', maxWidth: '500px', margin: '0 auto' }}>
          <AlertTriangle size={42} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h2>Adventure Not Found</h2>
          <p style={{ color: 'var(--muted-text)', margin: '0.5rem 0 1.5rem 0' }}>{error || 'Unable to retrieve expedition data.'}</p>
          <Link to="/adventure" className="btn-primary">Browse All Adventures</Link>
        </div>
      </div>
    );
  }

  const handleRegister = () => {
    navigate('/booking', { state: { item: adventure, itemType: 'Adventure' } });
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
        <Breadcrumbs
          customCrumbs={[
            { label: 'Adventures', to: '/adventure' },
            { label: adventure.title, to: null },
          ]}
        />

        {/* Hero Section */}
        <div
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: '2rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <img
            src={adventure.imageUrl}
            alt={adventure.title}
            style={{
              width: '100%',
              height: '380px',
              objectFit: 'cover',
            }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              padding: '2.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              <span className="badge badge-emerald">{adventure.category}</span>
              <span className="badge badge-cyan">{adventure.difficulty}</span>
              <span className="badge badge-magenta">{adventure.durationDays} Days</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', color: '#ffffff', margin: '0 0 0.5rem 0', fontWeight: '800' }}>
              {adventure.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.95rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={16} color="var(--primary)" /> {adventure.location}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={16} /> {adventure.date || 'Multiple Departures'}
              </span>
              <span>•</span>
              <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#10b981' }}>
                ₹{adventure.price}
              </span>
            </div>
          </div>
        </div>

        {/* Connected Action Buttons Bar (Requested Feature 2) */}
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem 1.5rem',
            marginBottom: '2.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link
              to={`/adventures/${adventure._id}/readiness`}
              className="btn-primary"
              style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle size={16} /> Check Fitness Readiness
            </Link>

            <Link
              to="/fitness"
              className="btn-secondary"
              style={{ padding: '0.6rem 1.1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Dumbbell size={16} /> View Training Plan
            </Link>

            <button
              type="button"
              onClick={handleRegister}
              className="btn-secondary"
              style={{
                padding: '0.6rem 1.25rem',
                fontSize: '0.9rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(5, 150, 105, 0.12)',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                fontWeight: '700',
              }}
            >
              <Compass size={16} /> Register
            </button>

            <Link
              to="/booking"
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            >
              My Booking
            </Link>

            <Link
              to="/event-schedule"
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}
            >
              Event Schedule
            </Link>

            <Link
              to="/safety"
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Shield size={15} /> Safety Info
            </Link>

            <Link
              to="/equipment-rental"
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Backpack size={15} /> Required Equipment
            </Link>

            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="btn-secondary"
              style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PhoneCall size={15} /> Contact Guide
            </button>
          </div>
        </div>

        {/* Content Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div>
            {/* Description */}
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: 'var(--text)' }}>Expedition Overview</h3>
              <p style={{ color: 'var(--muted-text)', lineHeight: 1.7, fontSize: '0.98rem' }}>
                {adventure.description}
              </p>
            </div>

            {/* Itinerary */}
            {adventure.itinerary && adventure.itinerary.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text)' }}>Daily Route Itinerary</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {adventure.itinerary.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem 1.25rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '4px solid var(--primary)',
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase' }}>
                        DAY {item.day || idx + 1}
                      </span>
                      <h4 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '1rem', color: 'var(--text)' }}>{item.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--muted-text)', lineHeight: 1.5 }}>{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkpoints */}
            {adventure.checkpoints && adventure.checkpoints.length > 0 && (
              <div className="glass-panel" style={{ padding: '1.75rem' }}>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', color: 'var(--text)' }}>GPS Checkpoints & Water Points</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  {adventure.checkpoints.map((cp, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '1rem',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      <strong style={{ color: 'var(--text)', display: 'block', fontSize: '0.92rem' }}>{cp.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)' }}>{cp.distanceFromStartKm} KM from start</span>
                      <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                        {cp.hasWater && <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>💧 Water</span>}
                        {cp.hasFirstAid && <span className="badge badge-magenta" style={{ fontSize: '0.65rem' }}>🩹 First Aid</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar: Fitness Thresholds & Logistics */}
          <div>
            <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Shield size={20} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', margin: 0 }}>Required Fitness Thresholds</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={thresholdRowStyle}>
                  <span>Minimum Fitness Score</span>
                  <strong style={{ color: 'var(--primary)' }}>{adventure.requiredFitnessScore || 60}/100</strong>
                </div>
                <div style={thresholdRowStyle}>
                  <span>Endurance Capacity</span>
                  <strong>{adventure.requiredEndurance || 50}/100</strong>
                </div>
                <div style={thresholdRowStyle}>
                  <span>Strength Output</span>
                  <strong>{adventure.requiredStrength || 50}/100</strong>
                </div>
                <div style={thresholdRowStyle}>
                  <span>Stamina / Cardio</span>
                  <strong>{adventure.requiredStamina || 50}/100</strong>
                </div>
                <div style={thresholdRowStyle}>
                  <span>Flexibility</span>
                  <strong>{adventure.requiredFlexibility || 50}/100</strong>
                </div>
                <div style={thresholdRowStyle}>
                  <span>Age Requirement</span>
                  <strong>{adventure.minimumAge || 18}+ Years</strong>
                </div>
              </div>

              <Link
                to={`/adventures/${adventure._id}/readiness`}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', display: 'flex', padding: '0.75rem' }}
              >
                Evaluate My Readiness <ArrowRight size={16} />
              </Link>
            </div>

            {/* Included Gear */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '1rem' }}>Included Gear</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {adventure.includedGear && adventure.includedGear.length > 0 ? (
                  adventure.includedGear.map((g, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--muted-text)' }}>
                      <Check size={14} color="var(--primary)" /> {g}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--muted-text)', fontSize: '0.85rem' }}>Trekking poles, emergency first-aid kit, GPS beacon included.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Contact Modal */}
      {showGuideModal && (
        <div className="modal-overlay" onClick={() => setShowGuideModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Expedition Guide Team</h3>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
              Certified wilderness instructors assigned to {adventure.title}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
                  alt="Guide"
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <strong style={{ display: 'block', color: 'var(--text)' }}>Ravi Kumar (Lead Alpine Guide)</strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--primary)' }}>WFR Certified • 8 Years Exp</span>
                </div>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted-text)', margin: '0 0 0.5rem 0' }}>
                Direct Radio / Phone: +91 98401 22841
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted-text)', margin: 0 }}>
                Basecamp VHF: Channel 16
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Link to="/contact" className="btn-secondary" onClick={() => setShowGuideModal(false)}>
                Contact Support
              </Link>
              <button type="button" className="btn-primary" onClick={() => setShowGuideModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const thresholdRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0.5rem 0',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.86rem',
  color: 'var(--text)',
};

export default AdventureDetails;
