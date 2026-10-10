import React, { useState, useEffect, useRef } from 'react';
import {
  CloudRain, Wind, Thermometer, Eye, AlertTriangle, ShieldCheck,
  MapPin, Navigation2, Zap, Radio, PhoneCall, Check, X,
  Users, Clock, CheckCircle2,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

/* ── Constants ────────────────────────────────────────────────────────────── */

/* ── Mock Weather ──────────────────────────────────────────────────────────── */
const WEATHER = {
  location: 'Kodaikanal, Tamil Nadu',
  temp: 18, feelsLike: 15, humidity: 72, windKmh: 22, visibility: 8.5,
  condition: 'Partly Cloudy', icon: '⛅',
  forecast: [
    { day: 'Today', icon: '⛅', high: 20, low: 12, rain: 10 },
    { day: 'Fri',   icon: '🌤️', high: 22, low: 14, rain: 5  },
    { day: 'Sat',   icon: '⛈️', high: 17, low: 11, rain: 75 },
    { day: 'Sun',   icon: '🌧️', high: 15, low: 10, rain: 85 },
    { day: 'Mon',   icon: '🌤️', high: 21, low: 13, rain: 15 },
  ],
};

const RISK_FACTORS = [
  { factor: 'Weather Conditions',  status: 'OK',      detail: '18°C, wind 22km/h — within safe limits',   risk: 'Low'    },
  { factor: 'Terrain Difficulty',  status: 'CAUTION', detail: 'Wet forest trail — slight slip risk',        risk: 'Medium' },
  { factor: 'Participant Fitness', status: 'OK',      detail: 'Avg fitness score: 68 — above minimum',     risk: 'Low'    },
  { factor: 'Medical Coverage',    status: 'OK',      detail: '1 paramedic + clinic 6km from route',        risk: 'Low'    },
  { factor: 'Route Clearance',     status: 'OK',      detail: 'Guides cleared route at 05:00',              risk: 'Low'    },
  { factor: 'Weekend Forecast',    status: 'ALERT',   detail: 'Heavy rain expected Sat–Sun',                risk: 'High'   },
];

const GEOFENCE_ZONES = [
  { zone: 'Primary Route Corridor', radius: '500m',  status: 'Active',  breaches: 0, color: 'var(--primary-emerald)' },
  { zone: 'Restricted Area A',      radius: '200m',  status: 'Active',  breaches: 1, color: 'var(--accent-amber)'    },
  { zone: 'Emergency Exit Zone',    radius: '1km',   status: 'Standby', breaches: 0, color: 'var(--primary-cyan)'    },
  { zone: 'SOS Response Zone',      radius: '5km',   status: 'Active',  breaches: 0, color: 'var(--accent-magenta)'  },
];

const DEVIATIONS = [
  { id: 1, participant: 'Dev Patel',    time: '07:12', type: 'Geofence', detail: 'Crossed into restricted trail (Zone A)', resolved: false },
  { id: 2, participant: 'Priya Sharma', time: '06:55', type: 'Route',    detail: 'Deviated 180m from primary route',       resolved: true  },
];

const EVACUATION_ROUTES = [
  { name: 'North Exit',          distance: '0.9 km', status: 'Ready'  },
  { name: 'Forest Access Path',  distance: '1.4 km', status: 'Marked' },
  { name: 'Lake Rally Point',    distance: '2.1 km', status: 'Ready'  },
];

const MEDICAL_TEAM = [
  { name: 'Dr. Nisha', role: 'Lead paramedic',      availability: 'On site'    },
  { name: 'Amit',      role: 'Rescue coordinator',  availability: 'Monitoring' },
  { name: 'Karan',     role: 'Field medic',         availability: 'Mobile'     },
];

const CHECKLIST_ITEMS = [
  'First aid kits checked and restocked',
  'Emergency contact list distributed',
  'GPS trackers and QR beacons synced',
  'Weather briefing delivered to all guides',
  'Medical team and evacuation routes confirmed',
  'Route warning signs installed at all turns',
];

const NO_GPS = { lat: null, lng: null, accuracy: null, address: 'Location unavailable' };

/* ── Pipeline step builder — accepts real or fallback data ─────────────────── */
const buildPipelineSteps = (gps, guide, emergency) => [
  {
    icon: '📍',
    title: 'GPS Location Acquired',
    detail: gps.lat != null && gps.lng != null
      ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} · Accuracy ±${gps.accuracy}m`
      : 'No GPS coordinates provided',
    sub: gps.address,
  },
  {
    icon: '🧭',
    title: 'Nearest Guide Located',
    detail: guide ? `${guide.name} · ${guide.distanceKm} km away` : 'Safety team notified',
    sub: guide ? `ETA ${guide.eta} · ${guide.phone}` : 'Organizer, admin, and guides alerted',
  },
  {
    icon: '🏥',
    title: 'Nearest Emergency Point Found',
    detail: emergency ? emergency.name : 'Incident logged in Safety Center',
    sub: emergency ? `${emergency.type} · ${emergency.distanceKm} km away` : 'Open the Safety Center to coordinate response',
  },
  {
    icon: '📢',
    title: 'Organizer Notified',
    detail: 'Event Organizer — emergency dispatch triggered',
    sub: 'All field staff alerted via broadcast',
  },
  {
    icon: '🆘',
    title: 'Emergency Incident Created',
    detail: 'Incident logged in Safety Command Center',
    sub: 'Response team mobilised',
  },
];


/* ════════════════════════════════════════════════════════════════════════════
   SmartSOSButton — one click immediately triggers the safety alert
   ════════════════════════════════════════════════════════════════════════════ */
const SmartSOSButton = ({ onTriggered }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="sos-hold-wrap">
        <button
          id="smart-sos-hold-btn"
          className="sos-hold-btn"
          onClick={onTriggered}
          aria-label="Send emergency SOS alert"
        >
          <span className="sos-icon">🆘</span>
          <span className="sos-label">SEND SOS</span>
        </button>
      </div>
      <span className="sos-hold-hint">Click once to alert the safety team immediately</span>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   SOSPipelineModal — animated 5-step dispatch pipeline
   ════════════════════════════════════════════════════════════════════════════ */
const SOSPipelineModal = ({ onClose, onSaved }) => {
  const { user } = useAuth();
  const guide = null;
  const emergency = null;
  const steps = buildPipelineSteps(NO_GPS, guide, emergency);

  // Which steps are visible (animated in) and marked done
  const [visible, setVisible]   = useState([]);
  const [done,    setDone]      = useState([]);
  const [cardVis, setCardVis]   = useState(false);
  const [incId,   setIncId]     = useState('');
  const [saving,  setSaving]    = useState(false);
  const [requestError, setRequestError] = useState('');
  const requestStarted = useRef(false);

  /* Reveal progress while creating the incident immediately. */
  useEffect(() => {
    const DELAYS = [200, 900, 1700, 2600, 3500]; // ms per step
    const DONE_OFFSETS = 450; // ms after visible before marking done

    if (!requestStarted.current) {
      requestStarted.current = true;
      triggerAPI();
    }
    DELAYS.forEach((delay, i) => {
      setTimeout(() => {
        setVisible(v => [...v, i]);
        setTimeout(() => {
          setDone(d => [...d, i]);
          if (i === steps.length - 1) {
            setCardVis(true);
          }
        }, DONE_OFFSETS);
      }, delay);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerAPI = async () => {
    setSaving(true);
    try {
      const { data } = await API.post('/guide/sos/trigger', {
        ...NO_GPS,
        triggeredByName: user?.name || user?.email || 'Unknown',
      });
      setIncId(data.incidentId);
      onSaved?.(data);
    } catch (err) {
      setRequestError(err.response?.data?.message || 'SOS could not be sent. Please try again or contact emergency services directly.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sos-pipeline-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sos-pipeline-modal">

        {/* Header */}
        <div className="sos-modal-header">
          <span className="sos-modal-icon">🚨</span>
          <div>
            <h2>SMART SOS ACTIVATED</h2>
            <p>Emergency dispatch pipeline running…</p>
          </div>
          <button
            onClick={onClose}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', padding: '0.25rem' }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Pipeline Steps */}
        <div className="sos-pipeline">
          {steps.map((step, i) => {
            const isVisible = visible.includes(i);
            const isDone    = done.includes(i);
            const isActive  = isVisible && !isDone;

            return (
              <div key={i} className={`sos-step${isVisible ? ' visible' : ''}${isDone ? ' done' : ''}`}>
                <div className="sos-step-icon-wrap">{step.icon}</div>
                <div className="sos-step-body">
                  <div className="sos-step-title">{step.title}</div>
                  {isVisible && (
                    <div className="sos-step-detail">
                      {isDone ? (
                        <>
                          <div>{step.detail}</div>
                          {step.sub && <div style={{ marginTop: '0.15rem', opacity: 0.75 }}>{step.sub}</div>}
                        </>
                      ) : (
                        <div>Locating…</div>
                      )}
                    </div>
                  )}
                </div>
                {isVisible && (
                  <span className={`sos-step-badge ${isDone ? 'sos-badge-done' : isActive ? 'sos-badge-active' : 'sos-badge-pending'}`}>
                    {isDone ? '✓ Done' : isActive ? 'Active' : 'Pending'}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Incident ID Card */}
        <div className={`sos-incident-card${cardVis ? ' visible' : ''}`}>
          <div>
            <div className="sos-incident-id">{incId || (saving ? 'Sending alert…' : 'Alert not sent')}</div>
            <div className="sos-incident-label">{incId ? 'Emergency Incident ID' : 'Safety team notification'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: incId ? 'var(--accent-red)' : 'var(--text-dim)' }}>{incId ? '🔴 ACTIVE' : saving ? 'SENDING' : 'FAILED'}</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>
              {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            {requestError && <p role="alert" style={{ color: 'var(--accent-red)', fontSize: '0.8rem', marginTop: '0.6rem' }}>{requestError}</p>}
          </div>
        </div>

        {/* Footer */}
        {(cardVis || requestError) && (
          <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button
              className="btn-secondary"
              style={{ fontSize: '0.8rem', padding: '0.55rem 1.1rem' }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="sos-btn"
              style={{ fontSize: '0.8rem', padding: '0.55rem 1.1rem' }}
              onClick={() => { onClose(); window.location.assign('/safety'); }}
            >
              <PhoneCall size={14} /> View in Incidents
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   Main Safety Component
   ════════════════════════════════════════════════════════════════════════════ */
const Safety = () => {
  const [overallRisk,    setOverallRisk]    = useState('Medium');
  const [showPipeline,   setShowPipeline]   = useState(false);
  const [sosIncidents,   setSosIncidents]   = useState([]);
  const [incidentsLoaded, setIncidentsLoaded] = useState(false);
  const [incidentError, setIncidentError] = useState('');

  const riskColor = { Low: 'var(--primary-emerald)', Medium: 'var(--accent-amber)', High: 'var(--accent-red)', Extreme: '#c084fc' };

  /* Load recent SOS incidents on mount */
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get('/guide/sos/incidents');
        setSosIncidents(data);
      } catch (err) {
        setIncidentError(err.response?.data?.message || 'Could not load SOS incidents.');
      } finally {
        setIncidentsLoaded(true);
      }
    })();
  }, []);

  /* Called when pipeline modal saves a new incident */
  const handleIncidentSaved = (incident) => {
    setSosIncidents(prev => [incident, ...prev]);
  };

  /* Resolve an incident */
  const resolveIncident = async (incidentId) => {
    setIncidentError('');
    try {
      const { data } = await API.put(`/guide/sos/incidents/${incidentId}/resolve`, {
        notes: 'Resolved from Safety Command Center',
      });
      setSosIncidents(prev => prev.map(i => i.incidentId === incidentId ? data : i));
    } catch (err) {
      setIncidentError(err.response?.data?.message || 'Could not resolve this SOS incident.');
    }
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', overflowX: 'hidden' }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>
                🛡️ Safety <span className="text-gradient">Command Center</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Weather monitoring • Risk assessment • Geofence • Smart SOS
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: `${riskColor[overallRisk]}15`, border: `1px solid ${riskColor[overallRisk]}30`, borderRadius: 'var(--radius-sm)' }}>
                <ShieldCheck size={16} color={riskColor[overallRisk]} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: riskColor[overallRisk] }}>Overall Risk: {overallRisk}</span>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              🆘 SMART SOS SECTION — holds the ring button + active incidents
              ════════════════════════════════════════════════════════════════ */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '1.5rem', border: '1.5px solid rgba(220,38,38,0.15)', background: 'linear-gradient(135deg, rgba(220,38,38,0.03) 0%, rgba(255,255,255,0.95) 60%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Radio size={17} color="var(--accent-red)" />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--accent-red)' }}>Smart SOS</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: 'auto' }}>
                Sends an immediate alert to organizers, admins, and guides
              </span>
            </div>

            <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              {/* Left — hold button */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <SmartSOSButton onTriggered={() => setShowPipeline(true)} />

                {/* Pipeline preview — decorative arrows */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.18rem', marginTop: '0.5rem' }}>
                  {['📍 Location attached if available', '📢 Organizer + admin notified', '🆘 Incident sent to Safety Center'].map((label, i, arr) => (
                    <React.Fragment key={label}>
                      <div style={{
                        fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600,
                        padding: '0.2rem 0.6rem', borderRadius: 99,
                        background: 'rgba(220,38,38,0.06)',
                        border: '1px solid rgba(220,38,38,0.1)',
                        whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </div>
                      {i < arr.length - 1 && (
                        <div style={{ fontSize: '0.65rem', color: 'rgba(220,38,38,0.4)', lineHeight: 1 }}>↓</div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Right — Active SOS Incidents */}
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <AlertTriangle size={14} color="var(--accent-red)" />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Active SOS Incidents</span>
                  {sosIncidents.filter(i => i.status === 'Active').length > 0 && (
                    <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>
                      {sosIncidents.filter(i => i.status === 'Active').length} Active
                    </span>
                  )}
                </div>

                {!incidentsLoaded ? (
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>Loading…</div>
                ) : incidentError ? (
                  <div role="alert" style={{ color: 'var(--accent-red)', fontSize: '0.78rem' }}>{incidentError}</div>
                ) : sosIncidents.length === 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.12)' }}>
                    <CheckCircle2 size={18} color="var(--primary-emerald)" />
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary-emerald)' }}>All Clear</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>No SOS incidents recorded</div>
                    </div>
                  </div>
                ) : (
                  <div className="sos-incidents-list">
                    {sosIncidents.map((inc) => (
                      <div key={inc._id || inc.incidentId} className={`sos-incident-row${inc.status === 'Resolved' ? ' resolved' : ''}`}>
                        <div className={`sos-incident-dot ${inc.status === 'Active' ? 'active' : 'resolved'}`} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.82rem', color: inc.status === 'Active' ? 'var(--accent-red)' : 'var(--primary-emerald)', fontFamily: 'var(--font-heading)' }}>
                              {inc.incidentId}
                            </span>
                            <span className={`badge ${inc.status === 'Active' ? 'badge-red' : 'badge-emerald'}`} style={{ fontSize: '0.58rem' }}>
                              {inc.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                            <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {inc.location?.address || 'Location recorded'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '0.05rem' }}>
                            <Users size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {inc.triggeredByName || 'Unknown'} · <Clock size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
                            {new Date(inc.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                        {inc.status === 'Active' && (
                          <button
                            onClick={() => resolveIncident(inc.incidentId)}
                            style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.3rem 0.65rem', background: 'rgba(16,185,129,0.1)', color: 'var(--primary-emerald)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-full)', cursor: 'pointer', whiteSpace: 'nowrap' }}
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Top Row: Weather + Forecast ─────────────────────────────── */}
          <div className="grid-2" style={{ marginBottom: '1.5rem', gap: '1.5rem' }}>
            {/* Current Weather */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CloudRain size={16} color="var(--primary-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Weather</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={11} /> {WEATHER.location}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '3.5rem' }}>{WEATHER.icon}</div>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{WEATHER.temp}°C</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{WEATHER.condition} · Feels like {WEATHER.feelsLike}°C</div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {[
                  { icon: Wind,      label: 'Wind',       value: `${WEATHER.windKmh} km/h`, safe: WEATHER.windKmh < 40 },
                  { icon: CloudRain, label: 'Humidity',   value: `${WEATHER.humidity}%`,   safe: true },
                  { icon: Eye,       label: 'Visibility', value: `${WEATHER.visibility} km`, safe: WEATHER.visibility > 5 },
                ].map(({ icon: Icon, label, value, safe }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '0.6rem', background: safe ? 'rgba(16,185,129,0.06)' : 'rgba(248,113,113,0.06)', borderRadius: 'var(--radius-sm)', border: `1px solid ${safe ? 'rgba(16,185,129,0.15)' : 'rgba(248,113,113,0.2)'}` }}>
                    <Icon size={14} color={safe ? 'var(--primary-emerald)' : 'var(--accent-red)'} style={{ marginBottom: '0.25rem' }} />
                    <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{value}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5-Day Forecast */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Thermometer size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>5-Day Event Forecast</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {WEATHER.forecast.map(f => (
                  <div key={f.day} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', background: f.rain > 60 ? 'rgba(248,113,113,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${f.rain > 60 ? 'rgba(248,113,113,0.15)' : 'var(--border-subtle)'}` }}>
                    <span style={{ width: 40, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>{f.day}</span>
                    <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                    <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{f.high}° / {f.low}°C</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <div style={{ width: 50, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${f.rain}%`, height: '100%', background: f.rain > 60 ? '#f87171' : 'var(--primary-cyan)', borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '0.7rem', color: f.rain > 60 ? 'var(--accent-red)' : 'var(--text-dim)', fontWeight: 700 }}>{f.rain}%</span>
                    </div>
                    {f.rain > 60 && <span className="badge badge-red" style={{ fontSize: '0.6rem' }}>RISK</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Risk Assessment Engine ───────────────────────────────────── */}
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <AlertTriangle size={16} color="var(--accent-amber)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Risk Assessment Engine</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-dim)' }}>Auto-updated every 15 min</span>
            </div>
            <div className="grid-2" style={{ gap: '0.75rem' }}>
              {RISK_FACTORS.map(rf => (
                <div key={rf.factor} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.85rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: `1px solid ${rf.risk === 'High' ? 'rgba(248,113,113,0.2)' : rf.risk === 'Medium' ? 'rgba(245,158,11,0.15)' : 'var(--border-subtle)'}` }}>
                  <div style={{ marginTop: '0.1rem' }}>
                    {rf.status === 'OK' ? <Check size={14} color="var(--primary-emerald)" /> : rf.risk === 'High' ? <AlertTriangle size={14} color="var(--accent-red)" /> : <AlertTriangle size={14} color="var(--accent-amber)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.15rem' }}>{rf.factor}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{rf.detail}</div>
                  </div>
                  {riskBadge(rf.risk)}
                </div>
              ))}
            </div>
          </div>

          {/* ── Geofence + Deviations ────────────────────────────────────── */}
          <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Geofence Zones */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Navigation2 size={16} color="var(--primary-emerald)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Geofence Zones</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {GEOFENCE_ZONES.map(gz => (
                  <div key={gz.zone} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: gz.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{gz.zone}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Radius: {gz.radius}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${gz.status === 'Active' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.62rem', marginBottom: '0.2rem', display: 'block' }}>{gz.status}</span>
                      {gz.breaches > 0 && <span style={{ fontSize: '0.65rem', color: 'var(--accent-amber)', fontWeight: 700 }}>{gz.breaches} breach</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Route Deviations */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Zap size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Route Deviation Alerts</span>
              </div>
              {DEVIATIONS.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                  <ShieldCheck size={32} style={{ marginBottom: '0.5rem' }} />
                  <p>No route deviations detected</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {DEVIATIONS.map(d => (
                    <div key={d.id} style={{ padding: '0.85rem', background: d.resolved ? 'rgba(16,185,129,0.04)' : 'rgba(245,158,11,0.06)', border: `1px solid ${d.resolved ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.2)'}`, borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.participant}</span>
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>{d.time}</span>
                          <span className={`badge ${d.resolved ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.6rem' }}>{d.resolved ? 'Resolved' : 'Active'}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <strong style={{ color: d.type === 'Geofence' ? 'var(--accent-amber)' : 'var(--primary-cyan)' }}>[{d.type}]</strong> {d.detail}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Evacuation + Medical + Incidents ─────────────────────────── */}
          <div className="grid-3" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
            {/* Evacuation */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Navigation2 size={16} color="var(--primary-cyan)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Emergency Evacuation Planning</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {EVACUATION_ROUTES.map((route) => (
                  <div key={route.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{route.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{route.distance}</div>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>{route.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Medical Team */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <PhoneCall size={16} color="var(--accent-red)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Medical Team Dashboard</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {MEDICAL_TEAM.map((member) => (
                  <div key={member.name} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{member.name}</strong>
                      <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>{member.availability}</span>
                    </div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{member.role}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Incident Management */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <ShieldCheck size={16} color="var(--accent-amber)" />
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Incident Management</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {INCIDENT_QUEUE.map((incident) => (
                  <div key={incident.id} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <strong>{incident.id}</strong>
                      <span className={`badge ${incident.severity === 'High' ? 'badge-red' : incident.severity === 'Medium' ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '0.6rem' }}>{incident.severity}</span>
                    </div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{incident.title}</div>
                    <div style={{ marginTop: '0.2rem', fontSize: '0.68rem', color: 'var(--text-dim)' }}>{incident.owner} • {incident.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Safety Checklist ─────────────────────────────────────────── */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Check size={16} color="var(--primary-emerald)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Safety Checklist</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem' }}>
              {CHECKLIST_ITEMS.map((item) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)' }}>
                  <Check size={14} color="var(--primary-emerald)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* ── Smart SOS Pipeline Modal ─────────────────────────────────────── */}
      {showPipeline && (
        <SOSPipelineModal
          onClose={() => setShowPipeline(false)}
          onSaved={handleIncidentSaved}
        />
      )}
    </div>
  );
};

export default Safety;
