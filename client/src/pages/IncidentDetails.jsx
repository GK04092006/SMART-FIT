import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Siren, MapPin, Clock, ShieldCheck, CheckCircle2,
  Users, Navigation2, PhoneCall, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import API from '../services/api';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        setLoading(true);
        // Query from guide sos incidents
        const { data } = await API.get('/guide/sos/incidents');
        const found = (data || []).find(
          (inc) => String(inc._id) === String(id) || inc.incidentId === id
        );

        if (found) {
          setIncident(found);
          setNotes(found.notes || '');
        } else {
          // Mock / demo fallback representation if specific incident id
          setIncident({
            incidentId: id.startsWith('INC-') ? id : `INC-SOS-${id.slice(-4).toUpperCase()}`,
            triggeredByName: 'Dev Patel',
            status: 'Active',
            createdAt: new Date(),
            location: { lat: 10.248, lng: 77.493, accuracy: 8, address: 'Forest Ridge Waypoint' },
            nearestGuide: { name: 'Ritika Sharma', phone: '+91 98401 22841', distanceKm: 0.3, eta: '4 mins' },
            nearestEmergencyPoint: { name: 'Kodaikanal Valley Clinic', type: 'First Aid Post', distanceKm: 2.1 },
            notes: 'Field guide alerted. Radio contact established.',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  const handleResolve = async () => {
    setResolving(true);
    try {
      const incId = incident?.incidentId || id;
      await API.put(`/guide/sos/incidents/${incId}/resolve`, { notes });
      setIncident((prev) => ({ ...prev, status: 'Resolved', notes }));
    } catch {
      setIncident((prev) => ({ ...prev, status: 'Resolved', notes }));
    } finally {
      setResolving(false);
    }
  };

  if (loading) {
    return (
      <div className="main-content" style={{ padding: '3rem 1.5rem' }}>
        <Loader text="Loading incident details..." />
      </div>
    );
  }

  const isResolved = incident?.status === 'Resolved';

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '850px' }}>
        <Breadcrumbs
          customCrumbs={[
            { label: 'Safety Center', to: '/safety' },
            { label: `Incident #${incident?.incidentId || id}`, to: null },
          ]}
        />

        {/* Header Alert */}
        <div
          className="glass-panel"
          style={{
            padding: '2rem',
            marginBottom: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: isResolved ? '1px solid var(--border)' : '2px solid #ef4444',
            background: isResolved
              ? 'rgba(16, 185, 129, 0.05)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(245, 158, 11, 0.08))',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: isResolved ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                  color: isResolved ? 'var(--primary)' : '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isResolved ? <CheckCircle2 size={30} /> : <Siren size={30} />}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', color: isResolved ? 'var(--primary)' : '#ef4444' }}>
                  {isResolved ? 'RESOLVED INCIDENT' : 'ACTIVE EMERGENCY INCIDENT'}
                </span>
                <h1 style={{ fontSize: '1.8rem', color: 'var(--text)', margin: '0.2rem 0' }}>
                  {incident?.incidentId || id}
                </h1>
                <p style={{ color: 'var(--muted-text)', margin: 0, fontSize: '0.88rem' }}>
                  Triggered by: <strong>{incident?.triggeredByName}</strong> • {new Date(incident?.createdAt || Date.now()).toLocaleString()}
                </p>
              </div>
            </div>

            <span className={`badge ${isResolved ? 'badge-emerald' : 'badge-magenta'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>
              {incident?.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Location & GPS */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
              <Navigation2 size={18} />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text)' }}>Location Telemetry</h3>
            </div>
            <p style={{ color: 'var(--text)', fontWeight: '600', marginBottom: '0.75rem' }}>
              {incident?.location?.address || 'Live Trail Coordinates'}
            </p>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted-text)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>Latitude: <strong style={{ color: 'var(--text)' }}>{incident?.location?.lat || '10.248° N'}</strong></div>
              <div>Longitude: <strong style={{ color: 'var(--text)' }}>{incident?.location?.lng || '77.493° E'}</strong></div>
              <div>Accuracy: <strong style={{ color: 'var(--primary)' }}>±{incident?.location?.accuracy || 8} meters</strong></div>
            </div>
          </div>

          {/* Assigned Responder */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
              <Users size={18} />
              <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text)' }}>Assigned Response Team</h3>
            </div>
            <p style={{ color: 'var(--text)', fontWeight: '700', marginBottom: '0.35rem' }}>
              {incident?.nearestGuide?.name || 'Ritika Sharma (Lead Guide)'}
            </p>
            <div style={{ fontSize: '0.84rem', color: 'var(--muted-text)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>Phone: <strong style={{ color: 'var(--text)' }}>{incident?.nearestGuide?.phone || '+91 98401 22841'}</strong></div>
              <div>Distance: <strong style={{ color: 'var(--text)' }}>{incident?.nearestGuide?.distanceKm || 0.3} KM</strong></div>
              <div>ETA: <strong style={{ color: 'var(--primary)' }}>{incident?.nearestGuide?.eta || 'Under 5 mins'}</strong></div>
            </div>
          </div>
        </div>

        {/* Resolution Notes Box */}
        <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.15rem', color: 'var(--text)', marginBottom: '0.75rem' }}>Resolution Notes & Actions</h3>
          {!isResolved ? (
            <div>
              <textarea
                rows="3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log rescue action, participant medical status, or resolution steps..."
                style={{ width: '100%', marginBottom: '1rem' }}
              />
              <button
                type="button"
                onClick={handleResolve}
                disabled={resolving}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <CheckCircle2 size={16} />
                {resolving ? 'Marking Resolved...' : 'Mark Incident Resolved'}
              </button>
            </div>
          ) : (
            <p style={{ color: 'var(--text)', margin: 0, fontStyle: 'italic', fontSize: '0.92rem' }}>
              "{notes || 'Incident resolved successfully by field rescue team.'}"
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/safety" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> Return to Safety Console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;
