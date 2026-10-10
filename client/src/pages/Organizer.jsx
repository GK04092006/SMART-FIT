import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, MapPin, Users, ShieldCheck, Sparkles, CheckCircle, AlertCircle, Loader2, Pencil, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import API from '../services/api';

// ── Static demo panels (inventory, transport etc.) stay as-is ─────────────────
const INVENTORY = [
  { item: 'Tents', count: 18, status: 'Ready' },
  { item: 'GPS Devices', count: 14, status: 'Synced' },
  { item: 'First Aid Kits', count: 9, status: 'Stocked' },
  { item: 'Headlamps', count: 22, status: 'Assigned' },
];

const ASSIGNMENTS = [
  { team: 'Team Alpha', equipment: '2 tents, 4 GPS, 2 kits', owner: 'Arjun' },
  { team: 'Team Beta', equipment: '3 tents, 3 GPS, 1 kit', owner: 'Priya' },
  { team: 'Team Gamma', equipment: '2 tents, 2 GPS, 2 kits', owner: 'Rohan' },
];

const TRANSPORT = [
  { vehicle: 'Bus 1', driver: 'Suresh', pickup: 'Kodaikanal Lake', seats: 14 },
  { vehicle: 'Bus 2', driver: 'Karthik', pickup: 'Pine Base', seats: 12 },
  { vehicle: 'Van 1', driver: 'Asha', pickup: 'Town Square', seats: 8 },
];

const FOOD_SUPPLIES = [
  { name: 'Breakfast Packs', qty: 42, status: 'Prepared' },
  { name: 'Hydration Kits', qty: 60, status: 'Ready' },
  { name: 'Energy Bars', qty: 150, status: 'Packed' },
  { name: 'Water Cans', qty: 24, status: 'Loaded' },
];

const GUIDE_ALLOCATION = [
  { team: 'Team Alpha', guide: 'Ritika', route: 'Forest Ridge' },
  { team: 'Team Beta', guide: 'Ishaan', route: 'Lake Loop' },
  { team: 'Team Gamma', guide: 'Meera', route: 'Summit Trail' },
];

const VOLUNTEERS = [
  { checkpoint: 'Start Gate', volunteer: 'Nandini', role: 'Check-in' },
  { checkpoint: 'Midpoint', volunteer: 'Vikram', role: 'Hydration' },
  { checkpoint: 'Finish Line', volunteer: 'Sonia', role: 'Arrival' },
];

// ── Form state — field names match what buildPayload() expects ─────────────────
const initialForm = {
  // Core (required by Adventure schema)
  title:           '',
  category:        'Trekking',
  location:        '',
  difficulty:      'Moderate',
  durationDays:    '1',
  price:           '',
  description:     '',
  imageUrl:        '',

  // Route
  startLocation:   '',
  endLocation:     '',
  routeDescription:'',
  distanceKm:      '',

  // Event meta
  date:            '',
  schedule:        '',
  maxParticipants: '20',
  ageRequirement:  '18+',
  status:          'Published',

  // Fitness requirements (numeric thresholds used by readiness engine)
  requiredFitnessScore: '60',
  minimumAge:           '18',
  requiredEndurance:    '50',
  requiredStrength:     '50',
  requiredStamina:      '50',
  requiredFlexibility:  '50',
  fitnessDescription:   'Intermediate endurance fitness',

  // Logistics
  safetyTeam:      '',
  foodPlan:        '',
  transportNotes:  '',
  equipmentList:   '',
  emergencyLocations: '',
  weatherCriteria: '',
};

// ── Map form fields → Adventure schema shape ──────────────────────────────────
const buildPayload = (f) => ({
  title:           f.title,
  category:        f.category,
  location:        f.location,
  difficulty:      f.difficulty,
  durationDays:    Number(f.durationDays) || 1,
  price:           Number(f.price) || 0,
  description:     f.description,
  imageUrl:        f.imageUrl,

  startLocation:   f.startLocation,
  endLocation:     f.endLocation,
  date:            f.date,
  schedule:        f.schedule,
  maxParticipants: Number(f.maxParticipants) || 12,
  ageRequirement:  f.ageRequirement,
  foodPlan:        f.foodPlan,

  route: {
    description:   f.routeDescription,
    distanceKm:    Number(f.distanceKm) || 0,
  },

  // Numeric fitness thresholds — used by readinessController & booking gate
  requiredFitnessScore: Number(f.requiredFitnessScore) || 60,
  minimumAge:           Number(f.minimumAge)           || 18,
  requiredEndurance:    Number(f.requiredEndurance)    || 50,
  requiredStrength:     Number(f.requiredStrength)     || 50,
  requiredStamina:      Number(f.requiredStamina)      || 50,
  requiredFlexibility:  Number(f.requiredFlexibility)  || 50,

  fitnessRequirement: {
    minScore:    Number(f.requiredFitnessScore) || 60,
    description: f.fitnessDescription,
  },

  transport: {
    notes: f.transportNotes,
  },

  // Flatten comma-separated equipment into schema array
  equipment: f.equipmentList
    .split(',')
    .map((item) => ({ item: item.trim(), required: true, providedByUs: false }))
    .filter((e) => e.item),

  emergencyLocations: f.emergencyLocations
    .split(',')
    .map((l) => l.trim())
    .filter(Boolean),

  medicalTeam: {
    staffCount: 1,
    emergencyContacts: [],
  },

  status: f.status,
});

const toFormData = (adventure) => ({
  ...initialForm,
  title: adventure.title || '',
  category: adventure.category || initialForm.category,
  location: adventure.location || '',
  difficulty: adventure.difficulty || initialForm.difficulty,
  durationDays: String(adventure.durationDays ?? 1),
  price: String(adventure.price ?? ''),
  description: adventure.description || '',
  imageUrl: adventure.imageUrl || '',
  startLocation: adventure.startLocation || '',
  endLocation: adventure.endLocation || '',
  routeDescription: adventure.route?.description || '',
  distanceKm: String(adventure.route?.distanceKm ?? ''),
  date: String(adventure.date || adventure.startDate || '').slice(0, 10),
  schedule: adventure.schedule || '',
  maxParticipants: String(adventure.maxParticipants ?? 20),
  ageRequirement: adventure.ageRequirement || '18+',
  status: adventure.status || 'Published',
  requiredFitnessScore: String(adventure.requiredFitnessScore ?? 60),
  minimumAge: String(adventure.minimumAge ?? 18),
  requiredEndurance: String(adventure.requiredEndurance ?? 50),
  requiredStrength: String(adventure.requiredStrength ?? 50),
  requiredStamina: String(adventure.requiredStamina ?? 50),
  requiredFlexibility: String(adventure.requiredFlexibility ?? 50),
  fitnessDescription: adventure.fitnessRequirement?.description || '',
  transportNotes: adventure.transport?.notes || '',
  foodPlan: adventure.foodPlan || '',
  equipmentList: Array.isArray(adventure.equipment)
    ? adventure.equipment.map((item) => typeof item === 'string' ? item : item.item).filter(Boolean).join(', ')
    : '',
  emergencyLocations: Array.isArray(adventure.emergencyLocations) ? adventure.emergencyLocations.join(', ') : '',
});

// ── Component ──────────────────────────────────────────────────────────────────
const Organizer = () => {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const formRef = useRef(null);

  useEffect(() => {
    let active = true;
    API.get('/adventure')
      .then(({ data }) => {
        if (active) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (active) setEventsError(err.response?.data?.message || 'Could not load events.');
      })
      .finally(() => {
        if (active) setEventsLoading(false);
      });
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitResult(null);
    try {
      const payload = buildPayload(formData);
      const { data } = editingId
        ? await API.put(`/adventure/${editingId}`, payload)
        : await API.post('/adventure', payload);
      if (editingId) {
        setEvents((current) => current.map((event) => (event._id || event.id) === editingId ? data : event));
      } else {
        setEvents((current) => [data, ...current]);
      }
      setSubmitResult({ success: true, adventure: data, mode: editingId ? 'updated' : 'created' });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || `Failed to ${editingId ? 'update' : 'publish'} event.`;
      setSubmitResult({ success: false, error: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (event) => {
    setEditingId(event._id || event.id);
    setFormData(toFormData(event));
    setSubmitResult(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const startCreating = () => {
    setEditingId(null);
    setFormData(initialForm);
    setSubmitResult(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const summaryItems = useMemo(
    () => [
      { icon: CalendarDays, label: 'Date',     value: formData.date },
      { icon: MapPin,       label: 'Route',    value: formData.routeDescription },
      { icon: Users,        label: 'Capacity', value: `${formData.maxParticipants} participants` },
      { icon: ShieldCheck,  label: 'Safety',   value: formData.safetyTeam },
    ],
    [formData]
  );

  // Helper: text input
  const field = (name, label, extra = {}) => (
    <label key={name}>
      {label}
      <input name={name} value={formData[name]} onChange={handleChange} {...extra} />
    </label>
  );

  // Helper: select
  const select = (name, label, options) => (
    <label key={name}>
      {label}
      <select name={name} value={formData[name]} onChange={handleChange}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );

  return (
    <div className="main-content organizer-page">
      <div className="container">
        <section className="section-header">
          <span className="section-subtitle">Adventure Organizer</span>
          <h1 className="section-title">Create and manage a premium adventure event</h1>
          <p className="section-desc">
            Plan routes, fitness prerequisites, safety teams, guides, logistics, and event day operations in one place.
          </p>
        </section>

        <section className="glass-panel organizer-events" aria-labelledby="organizer-events-title">
          <div className="organizer-events-heading">
            <div>
              <span className="section-subtitle">Organizer workspace</span>
              <h2 id="organizer-events-title">Manage events</h2>
            </div>
            <button type="button" className="btn-primary" onClick={startCreating}>
              <Plus size={17} /> Create event
            </button>
          </div>
          {eventsError && <p className="organizer-events-message error" role="alert">{eventsError}</p>}
          {eventsLoading ? (
            <p className="organizer-events-message">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="organizer-events-message">No events yet. Create your first event below.</p>
          ) : (
            <div className="organizer-event-list">
              {events.map((event) => {
                const eventId = event._id || event.id;
                return (
                  <article className="organizer-event-item" key={eventId}>
                    <div className="organizer-event-copy">
                      <strong>{event.title}</strong>
                      <span>{[event.date, event.location, event.status].filter(Boolean).join(' · ')}</span>
                    </div>
                    <button type="button" className="btn-secondary organizer-edit-button" onClick={() => startEditing(event)}>
                      <Pencil size={15} /> Edit
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <div className="organizer-grid">
          {/* ── Form ── */}
          <form ref={formRef} className="glass-panel organizer-form" onSubmit={handleSubmit}>

            {/* Core details */}
            <div className="organizer-form-heading">
              <div className="form-section-title"><Sparkles size={18} /><span>{editingId ? 'Edit Event' : 'Event Setup'}</span></div>
              {editingId && <button type="button" className="organizer-cancel-edit" onClick={startCreating}>Cancel edit</button>}
            </div>
            {field('title',       'Adventure Name *',    { required: true })}
            {field('date',        'Date *',              { type: 'date', required: true })}

            <div className="form-row">
              {select('category', 'Category *', ['Trekking', 'Kayaking', 'Rock Climbing', 'Trail Running', 'Camping', 'Skydiving'])}
              {select('difficulty', 'Difficulty *', ['Easy', 'Moderate', 'Challenging', 'Extreme'])}
            </div>

            {field('location',    'Location *',          { required: true })}
            {field('description', 'Description *',       { required: true })}
            {field('imageUrl',    'Cover Image URL *',   { type: 'url', required: true })}

            <div className="form-row">
              {field('durationDays', 'Duration (days) *',  { type: 'number', min: 1, required: true })}
              {field('price',        'Price per slot (₹) *', { type: 'number', min: 0, required: true })}
            </div>
            {select('status', 'Event Status', ['Draft', 'Published', 'Live', 'Completed', 'Cancelled'])}

            {/* Route */}
            <div className="form-section-title" style={{ marginTop: '1.5rem' }}><MapPin size={18} /><span>Route Details</span></div>
            <div className="form-row">
              {field('startLocation', 'Start Location *', { required: true })}
              {field('endLocation',   'End Location *',   { required: true })}
            </div>
            {field('routeDescription', 'Route Description', {})}
            <div className="form-row">
              {field('distanceKm',    'Distance (km)',     { type: 'number', min: 0 })}
              {field('maxParticipants','Max Participants *', { type: 'number', min: 1, required: true })}
            </div>
            {field('ageRequirement', 'Age Requirement (e.g. 18+)', {})}

            {/* Fitness requirements */}
            <div className="form-section-title" style={{ marginTop: '1.5rem' }}><ShieldCheck size={18} /><span>Fitness Requirements</span></div>
            <div className="form-row">
              {field('requiredFitnessScore', 'Min Fitness Score (0-100) *', { type: 'number', min: 0, max: 100, required: true })}
              {field('minimumAge',           'Minimum Age *',               { type: 'number', min: 0, required: true })}
            </div>
            <div className="form-row">
              {field('requiredEndurance',   'Required Endurance (0-100)',  { type: 'number', min: 0, max: 100 })}
              {field('requiredStrength',    'Required Strength (0-100)',   { type: 'number', min: 0, max: 100 })}
            </div>
            <div className="form-row">
              {field('requiredStamina',     'Required Stamina (0-100)',    { type: 'number', min: 0, max: 100 })}
              {field('requiredFlexibility', 'Required Flexibility (0-100)',{ type: 'number', min: 0, max: 100 })}
            </div>
            {field('fitnessDescription', 'Fitness Description (shown to users)', {})}

            {/* Logistics */}
            <div className="form-section-title" style={{ marginTop: '1.5rem' }}><Sparkles size={18} /><span>Logistics & Safety</span></div>
            {field('safetyTeam',        'Safety Team', {})}
            {field('transportNotes',    'Transport',   {})}
            {field('foodPlan',          'Food Plan',   {})}
            {field('equipmentList',     'Equipment (comma-separated)', {})}
            {field('emergencyLocations','Emergency Locations (comma-separated)', {})}
            {field('weatherCriteria',   'Weather Criteria', {})}
            <label>
              Event Schedule
              <textarea name="schedule" value={formData.schedule} onChange={handleChange} rows="3" />
            </label>

            {/* Feedback banners */}
            {submitResult?.success && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981', padding:'0.85rem 1rem', borderRadius:'10px', marginTop:'0.5rem', fontSize:'0.9rem' }}>
                <CheckCircle size={18} />
                <span>
                  Event <strong>"{submitResult.adventure?.title}"</strong> {submitResult.mode}!{' '}
                  <Link to="/adventure" style={{ color:'#10b981', fontWeight:700 }}>Browse adventures →</Link>
                </span>
              </div>
            )}
            {submitResult?.success === false && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:'0.5rem', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', padding:'0.85rem 1rem', borderRadius:'10px', marginTop:'0.5rem', fontSize:'0.9rem' }}>
                <AlertCircle size={18} style={{ flexShrink:0, marginTop:2 }} />
                <span>{submitResult.error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop:'0.5rem', justifyContent:'center', width:'100%' }}>
              {submitting
                ? <><Loader2 size={17} style={{ animation:'spin 0.8s linear infinite' }} /> {editingId ? 'Updating…' : 'Publishing…'}</>
                : editingId ? 'Update Event' : 'Publish Adventure Event'}
            </button>
          </form>

          {/* ── Live Preview ── */}
          <aside className="glass-panel organizer-preview">
            <div className="form-section-title"><ShieldCheck size={18} /><span>Live Event Summary</span></div>

            <div className="preview-card">
              <h2>{formData.title}</h2>
              <p>{formData.startLocation} → {formData.endLocation}</p>
              <div className="summary-list">
                {summaryItems.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="summary-item">
                    <Icon size={16} />
                    <div><strong>{label}</strong><span>{value}</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="preview-card compact">
              <h3>Fitness Thresholds</h3>
              <ul>
                <li><strong>Min Score:</strong> {formData.requiredFitnessScore}/100</li>
                <li><strong>Endurance:</strong> {formData.requiredEndurance}/100</li>
                <li><strong>Strength:</strong> {formData.requiredStrength}/100</li>
                <li><strong>Stamina:</strong> {formData.requiredStamina}/100</li>
                <li><strong>Flexibility:</strong> {formData.requiredFlexibility}/100</li>
                <li><strong>Min Age:</strong> {formData.minimumAge} yrs</li>
              </ul>
            </div>

            <div className="preview-card compact">
              <h3>Operational Details</h3>
              <ul>
                <li><strong>Category:</strong> {formData.category}</li>
                <li><strong>Difficulty:</strong> {formData.difficulty}</li>
                <li><strong>Duration:</strong> {formData.durationDays} day(s)</li>
                <li><strong>Price:</strong> ₹{formData.price}/slot</li>
                <li><strong>Capacity:</strong> {formData.maxParticipants} participants</li>
                <li><strong>Weather:</strong> {formData.weatherCriteria}</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ── Static operational panels (unchanged) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Equipment Inventory</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem' }}>
              {INVENTORY.map((item) => (
                <div key={item.item} style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.item}</div>
                  <div style={{ marginTop: '0.35rem', fontSize: '1.3rem', fontWeight: 800 }}>{item.count}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Equipment Assignment</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {ASSIGNMENTS.map((a) => (
                <div key={a.team} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{a.team}</strong><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{a.owner}</span></div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.equipment}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Transport Management</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {TRANSPORT.map((t) => (
                <div key={t.vehicle} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{t.vehicle}</strong><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{t.driver}</span></div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.pickup} • {t.seats} seats</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Food &amp; Hydration</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem' }}>
              {FOOD_SUPPLIES.map((f) => (
                <div key={f.name} style={{ padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ fontWeight: 700 }}>{f.name}</div>
                  <div style={{ marginTop: '0.25rem', fontSize: '1.15rem', fontWeight: 800 }}>{f.qty}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.status}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Guide Allocation</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {GUIDE_ALLOCATION.map((g) => (
                <div key={g.team} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{g.team}</strong><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{g.route}</span></div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Guide: {g.guide}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div className="form-section-title"><Sparkles size={18} /><span>Volunteer Management</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {VOLUNTEERS.map((v) => (
                <div key={v.checkpoint} style={{ padding: '0.7rem 0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{v.checkpoint}</strong><span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{v.role}</span></div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Volunteer: {v.volunteer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Organizer;
