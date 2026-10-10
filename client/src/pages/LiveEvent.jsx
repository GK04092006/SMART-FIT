import React, { useEffect, useState, useCallback, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import {
  Map, Users, Radio, AlertTriangle, CheckCircle2,
  MapPin, Clock, Activity, PhoneCall, X, Wifi,
  Flag, Compass, AlertCircle,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import API from '../services/api';

/* ═══════════════════════════════════════════════════════════════════════════
   CONSTANTS & MOCK DATA
   ═══════════════════════════════════════════════════════════════════════════ */
const TOTAL_KM   = 15;
const TOTAL_SECS = 4920; // start offset — event began 06:30

const CHECKPOINTS = [
  { id: 0, label: 'START',            name: 'Kodaikanal Lake',        km: 0,     icon: '🏁' },
  { id: 1, label: 'CP 1',             name: 'Forest Junction',        km: 4.5,   icon: '🌲' },
  { id: 2, label: 'CP 2',             name: 'Ridge Viewpoint',        km: 9.0,   icon: '⛰️' },
  { id: 3, label: 'CP 3',             name: 'Shola Forest',           km: 12.5,  icon: '🌿' },
  { id: 4, label: 'FINISH',           name: 'Pine Ridge Summit',      km: 15,    icon: '🏆' },
];

/* Location tags near each checkpoint */
const CP_LOCATIONS = [
  'Kodaikanal Lake Trailhead',
  'Forest Junction Shelter',
  'Ridge Viewpoint (1,900m)',
  'Shola Forest Trail',
  'Pine Ridge Summit',
];

const GUIDE_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=60',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=60',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=60',
];

const GUIDES_INITIAL = [
  { id: 'g1', name: 'Ritika Sharma',  team: 'Team Alpha', avatar: GUIDE_AVATARS[0], cpIndex: 2, distFromTeam: 0.2, lat: 10.248, lng: 77.493 },
  { id: 'g2', name: 'Ishaan Kumar',   team: 'Team Beta',  avatar: GUIDE_AVATARS[1], cpIndex: 1, distFromTeam: 0.1, lat: 10.231, lng: 77.486 },
  { id: 'g3', name: 'Meera Pillai',   team: 'Team Gamma', avatar: GUIDE_AVATARS[2], cpIndex: 0, distFromTeam: 0.3, lat: 10.215, lng: 77.481 },
];

const TEAMS = [
  { id: 'alpha', name: 'Team Alpha', color: '#059669', guideId: 'g1', memberIds: [1, 4] },
  { id: 'beta',  name: 'Team Beta',  color: '#0891b2', guideId: 'g2', memberIds: [2, 3] },
  { id: 'gamma', name: 'Team Gamma', color: '#7c3aed', guideId: 'g3', memberIds: [5, 6] },
];

const PARTICIPANTS_INITIAL = [
  { id: 1, name: 'Arjun Mehta',   avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&q=60', status: 'Active',  heartRate: 142, batteryPct: 84, speed: 5.4, distKm: 8.7,  basePace: 5.2 },
  { id: 2, name: 'Priya Sharma',  avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=80&q=60', status: 'Active',  heartRate: 128, batteryPct: 72, speed: 4.8, distKm: 5.2,  basePace: 4.9 },
  { id: 3, name: 'Rohan Kapoor',  avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&q=60', status: 'Resting', heartRate: 95,  batteryPct: 61, speed: 0.0, distKm: 10.1, basePace: 5.5 },
  { id: 4, name: 'Ananya Singh',  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=60', status: 'Active',  heartRate: 155, batteryPct: 90, speed: 5.9, distKm: 7.4,  basePace: 5.6 },
  { id: 5, name: 'Dev Patel',     avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=80&q=60', status: 'Behind',  heartRate: 108, batteryPct: 45, speed: 3.1, distKm: 2.9,  basePace: 4.5 },
  { id: 6, name: 'Kavya Nair',    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=60', status: 'Active',  heartRate: 138, batteryPct: 78, speed: 5.2, distKm: 11.6, basePace: 5.3 },
];

const ALERTS_INITIAL = [
  { id: 1, type: 'info',    time: '06:42', msg: 'All participants cleared Start checkpoint.' },
  { id: 2, type: 'warning', time: '07:18', msg: 'Dev Patel (P5) is falling 12 min behind schedule.' },
  { id: 3, type: 'info',    time: '07:35', msg: 'Rohan Kapoor (P3) reached CP 2 early.' },
  { id: 4, type: 'success', time: '07:50', msg: 'Weather conditions: Clear ✓  Wind: 18 km/h ✓' },
];

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const statusColor = (s) => ({
  Active:  'var(--primary-emerald)',
  Resting: 'var(--accent-amber)',
  Behind:  'var(--accent-red)',
  SOS:     '#f87171',
  Finished:'var(--primary-cyan)',
}[s] || 'var(--text-dim)');

const cpOfDist = (km) => {
  for (let i = CHECKPOINTS.length - 1; i >= 0; i--) {
    if (km >= CHECKPOINTS[i].km) return i;
  }
  return 0;
};

const fmtDist = (km) => km.toFixed(1);
const fmtSpeed = (kmh) => kmh.toFixed(1);

/* ═══════════════════════════════════════════════════════════════════════════
   STATE REDUCER
   ═══════════════════════════════════════════════════════════════════════════ */
const init = {
  participants: PARTICIPANTS_INITIAL,
  guides:       GUIDES_INITIAL,
  alerts:       ALERTS_INITIAL,
  elapsed:      TOTAL_SECS,
  dataSource:   'demo', // 'demo' | 'live'
};

function reducer(state, action) {
  switch (action.type) {
    case 'TICK_CLOCK':
      return { ...state, elapsed: state.elapsed + 1 };

    case 'SIM_STEP': {
      const DT = 2 / 3600; // 2 seconds in hours
      const participants = state.participants.map(p => {
        if (p.status === 'SOS' || p.status === 'Finished') return p;
        const isMoving = p.status !== 'Resting';
        const speedDelta = (Math.random() - 0.48) * 0.4;
        const newSpeed = isMoving
          ? Math.max(1.5, Math.min(8.5, p.speed + speedDelta))
          : Math.max(0, p.speed - 0.3);
        const newDist = Math.min(TOTAL_KM, p.distKm + (isMoving ? newSpeed * DT : 0));
        const hrDelta = Math.round((Math.random() - 0.5) * 6);
        const newHR   = Math.min(195, Math.max(58, p.heartRate + hrDelta));
        const status  = newDist >= TOTAL_KM ? 'Finished' : p.status;
        return { ...p, speed: newSpeed, distKm: newDist, heartRate: newHR, status, prevSpeed: p.speed };
      });

      const guides = state.guides.map(g => ({
        ...g,
        distFromTeam: Math.max(0.05, Math.min(0.5, g.distFromTeam + (Math.random() - 0.5) * 0.05)),
      }));

      return { ...state, participants, guides };
    }

    case 'SOS': {
      const participants = state.participants.map(p =>
        p.id === action.id ? { ...p, status: 'SOS' } : p
      );
      const alert = { id: Date.now(), type: 'danger', time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), msg: `🆘 SOS triggered for ${action.name}! Response team dispatched.` };
      return { ...state, participants, alerts: [alert, ...state.alerts] };
    }

    case 'CLEAR_SOS': {
      const participants = state.participants.map(p =>
        p.id === action.id ? { ...p, status: 'Active' } : p
      );
      return { ...state, participants };
    }

    case 'PUSH_ALERT':
      return { ...state, alerts: [action.alert, ...state.alerts.slice(0, 9)] };

    case 'LOAD_REAL_DATA': {
      // Seed participants from real confirmed bookings
      const realParticipants = (action.bookings || []).map((b, i) => ({
        id:          b._id || i + 1,
        name:        b.user?.name || `Participant ${i + 1}`,
        avatar:      b.user?.avatar || PARTICIPANTS_INITIAL[i % PARTICIPANTS_INITIAL.length]?.avatar || '',
        status:      'Active',
        heartRate:   120 + Math.floor(Math.random() * 40),
        batteryPct:  60 + Math.floor(Math.random() * 35),
        speed:       4.5 + (Math.random() * 1.5),
        distKm:      Math.random() * (TOTAL_KM * 0.7),
        basePace:    4.8 + (Math.random() * 0.8),
        fitnessScore: b.user?.fitnessScore || 60,
      }));

      // Seed guides from adventure.guides array if present
      const realGuides = (action.guides || []).slice(0, 3).map((g, i) => ({
        id:           `g${i + 1}`,
        name:         g.name || `Guide ${i + 1}`,
        team:         TEAMS[i % TEAMS.length].name,
        avatar:       GUIDE_AVATARS[i % GUIDE_AVATARS.length],
        cpIndex:      Math.floor(Math.random() * CHECKPOINTS.length),
        distFromTeam: 0.1 + Math.random() * 0.3,
        lat:          10.215 + Math.random() * 0.05,
        lng:          77.481 + Math.random() * 0.02,
      }));

      const liveAlert = {
        id: Date.now(), type: 'success',
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        msg: `✓ Live data loaded: ${realParticipants.length} registered participants.`,
      };

      return {
        ...state,
        participants: realParticipants.length > 0 ? realParticipants : state.participants,
        guides:       realGuides.length > 0 ? realGuides : state.guides,
        alerts:       [liveAlert, ...state.alerts],
        dataSource:   realParticipants.length > 0 ? 'live' : 'demo',
      };
    }

    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: JourneyBar
   ═══════════════════════════════════════════════════════════════════════════ */
const JourneyBar = ({ participants }) => {
  const furthest = Math.max(...participants.map(p => p.distKm));
  const fillPct  = Math.min(100, (furthest / TOTAL_KM) * 100);

  return (
    <div className="monitor-journey-wrap">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Compass size={15} color="var(--primary-emerald)" />
        <span style={{ fontWeight: 800, fontSize: '0.88rem' }}>Live Route Progress</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Wifi size={11} /> GPS sync every 30s
        </span>
      </div>

      <div className="monitor-journey-track">
        {/* Background + fill line */}
        <div className="monitor-journey-line">
          <div className="monitor-journey-fill" style={{ width: `${fillPct}%` }} />
        </div>

        {/* Checkpoint nodes */}
        <div className="monitor-cp-nodes">
          {CHECKPOINTS.map((cp, idx) => {
            const atOrPast = participants.filter(p => p.distKm >= cp.km).length;
            const isDone   = atOrPast === participants.length;
            const isActive = !isDone && atOrPast > 0;
            const dotClass = `monitor-cp-dot${cp.label === 'FINISH' ? ' finish' : ''}${isDone ? ' done' : isActive ? ' active' : ''}`;
            return (
              <div key={cp.id} className="monitor-cp-node">
                <div className={dotClass}>
                  {isDone ? '✓' : cp.icon}
                </div>
                <div className="monitor-cp-label">{cp.label}</div>
                <div className="monitor-cp-km">{cp.km} km</div>
                {atOrPast > 0 && (
                  <div className="monitor-cp-count">{atOrPast} 🏃</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini legend */}
      <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
        {participants.map(p => {
          const pct = Math.min(100, (p.distKm / TOTAL_KM) * 100);
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              <img src={p.avatar} alt="" style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${statusColor(p.status)}` }} />
              <span style={{ fontWeight: 600 }}>{p.name.split(' ')[0]}</span>
              <span style={{ color: 'var(--text-dim)' }}>{fmtDist(p.distKm)} km</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: ParticipantGPSCard
   ═══════════════════════════════════════════════════════════════════════════ */
const ParticipantGPSCard = ({ p, onClick, onSOS }) => {
  const cpIdx     = cpOfDist(p.distKm);
  const remaining = Math.max(0, TOTAL_KM - p.distKm);
  const fillPct   = (p.distKm / TOTAL_KM) * 100;
  const loc       = CP_LOCATIONS[Math.min(cpIdx, CP_LOCATIONS.length - 1)];

  /* Speed trend vs previous tick */
  let trendClass = 'flat', trendIcon = '→';
  if (p.prevSpeed !== undefined) {
    if (p.speed > p.prevSpeed + 0.15)      { trendClass = 'up';   trendIcon = '↑'; }
    else if (p.speed < p.prevSpeed - 0.15) { trendClass = 'down'; trendIcon = '↓'; }
  }

  /* gradient based on progress */
  const barColor = p.distKm >= TOTAL_KM
    ? 'linear-gradient(90deg,#059669,#0891b2)'
    : p.distKm > TOTAL_KM * 0.6
      ? 'linear-gradient(90deg,#059669,#38bdf8)'
      : 'linear-gradient(90deg,#0891b2,#6366f1)';

  const statusClass = `participant-gps-card status-${p.status.toLowerCase()}`;

  return (
    <div className={statusClass} onClick={onClick}>
      {/* Header */}
      <div className="pgps-header">
        <img src={p.avatar} alt={p.name} className="pgps-avatar"
          style={{ border: `2.5px solid ${statusColor(p.status)}` }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="pgps-name">{p.name}</div>
          <div>
            <span className="pgps-status-dot" style={{ background: statusColor(p.status) }} />
            <span className="pgps-status-text" style={{ color: statusColor(p.status) }}>{p.status}</span>
            {p.status === 'Finished' && <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem' }}>🏆</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 700 }}>
            CP {cpIdx} / {CHECKPOINTS.length - 1}
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
            🔋 {p.batteryPct}%
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="pgps-location">
        <MapPin size={11} color="var(--primary-emerald)" />
        <span>{loc}</span>
        {p.status === 'SOS' && (
          <span style={{ marginLeft: 'auto', fontWeight: 800, color: '#dc2626', fontSize: '0.65rem', animation: 'sosPulse 1s infinite' }}>
            🆘 SOS ACTIVE
          </span>
        )}
      </div>

      {/* Distance bar */}
      <div className="pgps-distance-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.3rem' }}>
          <span style={{ fontWeight: 700 }}>{fmtDist(p.distKm)} km covered</span>
          <span>{fmtDist(remaining)} km remaining</span>
        </div>
        <div className="pgps-distance-bar-track">
          <div className="pgps-distance-bar-fill"
            style={{ width: `${fillPct}%`, background: barColor }} />
        </div>
      </div>

      {/* 3 Metrics */}
      <div className="pgps-metrics">
        <div className="pgps-metric">
          <div className="pgps-metric-value" style={{ color: p.speed > 7 ? '#dc2626' : 'var(--text-main)' }}>
            {p.status === 'Resting' ? '0.0' : fmtSpeed(p.speed)}
          </div>
          <div className="pgps-metric-label">km/h</div>
        </div>
        <div className="pgps-metric">
          <div className="pgps-metric-value">{fmtDist(p.distKm)}</div>
          <div className="pgps-metric-label">Distance</div>
        </div>
        <div className="pgps-metric">
          <div className="pgps-metric-value" style={{ color: remaining < 2 ? 'var(--primary-emerald)' : 'var(--text-main)' }}>
            {fmtDist(remaining)}
          </div>
          <div className="pgps-metric-label">Remaining</div>
        </div>
      </div>

      {/* Footer */}
      <div className="pgps-footer">
        <Activity size={11} color={p.heartRate > 160 ? '#dc2626' : 'var(--text-dim)'} />
        <span style={{ color: p.heartRate > 160 ? '#dc2626' : 'inherit' }}>{p.heartRate} bpm</span>
        <span className={`speed-trend ${trendClass}`} style={{ marginLeft: '0.25rem' }}>
          {trendIcon} {p.status !== 'Resting' ? 'pace' : 'resting'}
        </span>
        {p.status !== 'SOS' && p.status !== 'Finished' && (
          <button
            className="sos-btn"
            style={{ padding: '0.12rem 0.5rem', fontSize: '0.6rem', marginLeft: 'auto', letterSpacing: '0.5px' }}
            onClick={(e) => { e.stopPropagation(); onSOS(p); }}
          >
            SOS
          </button>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: CheckpointTimeline
   ═══════════════════════════════════════════════════════════════════════════ */
const CheckpointTimeline = ({ participants }) => (
  <div className="cp-timeline">
    {CHECKPOINTS.map((cp, idx) => {
      const atThis = participants.filter(p => {
        const cpIdx = cpOfDist(p.distKm);
        return cpIdx === idx || (idx === CHECKPOINTS.length - 1 && p.distKm >= cp.km);
      });
      const past   = participants.filter(p => p.distKm > cp.km + 0.1 && idx < CHECKPOINTS.length - 1);
      const isDone = idx === 0 || past.length === participants.length || participants.every(p => p.distKm >= cp.km);
      const isActive = !isDone && participants.some(p => cpOfDist(p.distKm) === idx);
      const stepClass = `cp-timeline-step${isDone ? ' done' : isActive ? ' active' : ' pending'}`;
      const dotClass  = `cp-timeline-dot${cp.label === 'FINISH' ? ' finish' : ''}${isDone ? ' done' : isActive ? ' active' : ''}`;

      return (
        <div key={cp.id} className={stepClass}>
          <div className={dotClass}>
            {isDone ? '✓' : cp.icon}
          </div>
          <div className="cp-timeline-body">
            <div className="cp-timeline-name">{cp.label} — {cp.name}</div>
            <div className="cp-timeline-meta">
              {cp.km} km · {isDone ? 'All passed' : isActive ? `${atThis.length} here` : 'Not reached'}
            </div>
            {atThis.length > 0 && (
              <div className="cp-timeline-participants">
                {atThis.map(p => (
                  <img key={p.id} src={p.avatar} alt={p.name} title={p.name}
                    style={{ width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${statusColor(p.status)}` }} />
                ))}
              </div>
            )}
          </div>
          <span className={`badge ${isDone ? 'badge-emerald' : isActive ? 'badge-cyan' : 'badge-amber'}`}
            style={{ fontSize: '0.58rem', alignSelf: 'flex-start', marginTop: '0.25rem' }}>
            {isDone ? 'Passed' : isActive ? 'Live' : 'Ahead'}
          </span>
        </div>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: GuidePanel
   ═══════════════════════════════════════════════════════════════════════════ */
const GuidePanel = ({ guides, participants }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
    {guides.map(g => {
      const team        = TEAMS.find(t => t.guideId === g.id);
      const members     = participants.filter(p => team?.memberIds.includes(p.id));
      const avgDist     = members.length
        ? members.reduce((s, p) => s + p.distKm, 0) / members.length
        : 0;
      const cpIdx       = cpOfDist(avgDist);
      const cpName      = CHECKPOINTS[cpIdx]?.name || '';

      return (
        <div key={g.id} className="guide-location-card">
          <div className="guide-avatar-wrap">
            <img src={g.avatar} alt={g.name} className="guide-avatar" />
            <div className="guide-live-dot" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{g.name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              {team?.name} · Near {cpName}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
              <MapPin size={9} style={{ verticalAlign: 'middle' }} /> {g.distFromTeam.toFixed(2)} km from team
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {members.map(p => (
              <img key={p.id} src={p.avatar} alt={p.name} title={p.name}
                style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${statusColor(p.status)}` }} />
            ))}
          </div>
        </div>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT: TeamOverview
   ═══════════════════════════════════════════════════════════════════════════ */
const TeamOverview = ({ participants }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
    {TEAMS.map(team => {
      const members  = participants.filter(p => team.memberIds.includes(p.id));
      const avgDist  = members.reduce((s, p) => s + p.distKm, 0) / (members.length || 1);
      const avgSpeed = members.filter(p => p.status !== 'Resting').reduce((s, p) => s + p.speed, 0) / (members.length || 1);
      const progress = (avgDist / TOTAL_KM) * 100;
      const cpIdx    = cpOfDist(avgDist);

      return (
        <div key={team.id} style={{ padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: `1.5px solid rgba(0,0,0,0.07)`, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: team.color }} />
              <strong style={{ fontSize: '0.84rem' }}>{team.name}</strong>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.58rem' }}>CP {cpIdx}</span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {members.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <img src={p.avatar} alt={p.name} style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', border: `1.5px solid ${statusColor(p.status)}` }} />
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{p.name.split(' ')[0]}</span>
              </div>
            ))}
          </div>

          <div style={{ height: 5, borderRadius: 999, background: 'rgba(148,163,184,0.18)', overflow: 'hidden', marginBottom: '0.4rem' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: `linear-gradient(90deg, ${team.color}, #38bdf8)`, borderRadius: 999, transition: 'width 1.5s ease' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            <span>Avg {fmtDist(avgDist)} km · {fmtSpeed(avgSpeed)} km/h</span>
            <span style={{ color: team.color, fontWeight: 700 }}>{progress.toFixed(0)}%</span>
          </div>
        </div>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN: LiveEvent
   ═══════════════════════════════════════════════════════════════════════════ */
const LiveEvent = () => {
  const [state,        dispatch]          = useReducer(reducer, init);
  const [sosTrigger,   setSosTrigger]     = useState(null);
  const [sosConfirmed, setSosConfirmed]   = useState(false);
  const [selectedP,    setSelectedP]      = useState(null);

  const { participants, guides, alerts, elapsed } = state;

  /* Clock tick — every 1s */
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'TICK_CLOCK' }), 1000);
    return () => clearInterval(t);
  }, []);

  /* Simulation step — every 2s */
  useEffect(() => {
    const t = setInterval(() => dispatch({ type: 'SIM_STEP' }), 2000);
    return () => clearInterval(t);
  }, []);

  const handleSOS = useCallback((p) => {
    setSosTrigger(p);
    setSosConfirmed(false);
    dispatch({ type: 'SOS', id: p.id, name: p.name });
  }, []);

  const confirmSOS = () => {
    setSosConfirmed(true);
    setTimeout(() => { setSosTrigger(null); setSosConfirmed(false); }, 3000);
  };

  /* Derived metrics */
  const active        = participants.filter(p => p.status === 'Active').length;
  const behind        = participants.filter(p => p.status === 'Behind').length;
  const sosCount      = participants.filter(p => p.status === 'SOS').length;
  const finished      = participants.filter(p => p.status === 'Finished').length;
  const avgSpeed      = (participants.filter(p => p.status !== 'Resting').reduce((s, p) => s + p.speed, 0) / (active || 1)).toFixed(1);
  const avgDist       = (participants.reduce((s, p) => s + p.distKm, 0) / participants.length).toFixed(1);
  const furthest      = Math.max(...participants.map(p => p.distKm));
  const furthestName  = participants.find(p => p.distKm === furthest)?.name?.split(' ')[0] || '';
  const gpsAccuracy   = '98.4%';

  const elapsedStr = [
    String(Math.floor(elapsed / 3600)).padStart(2, '0'),
    String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0'),
    String(elapsed % 60).padStart(2, '0'),
  ].join(':');

  const heroMetrics = [
    { icon: '🏃', label: 'Active',       value: active,                        color: 'var(--primary-emerald)' },
    { icon: '📍', label: 'GPS Accuracy', value: gpsAccuracy,                   color: 'var(--primary-cyan)'   },
    { icon: '⚡', label: 'Avg Speed',    value: `${avgSpeed} km/h`,             color: 'var(--accent-amber)'   },
    { icon: '📏', label: 'Avg Distance', value: `${avgDist} km`,                color: '#6366f1'               },
    { icon: '⏱',  label: 'Elapsed',      value: elapsedStr,                     color: 'var(--text-main)'      },
    { icon: '🏁', label: 'Lead',         value: `${fmtDist(furthest)} km`,      color: 'var(--accent-magenta)' },
  ];

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', overflowX: 'hidden' }}>

          {/* ── Header ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                <span className="badge badge-red" style={{ animation: 'pulse 1.5s infinite', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', display: 'inline-block' }} />
                  LIVE
                </span>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Kodaikanal 15 KM Trek</h1>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Live GPS Monitoring · {participants.length} participants · {TEAMS.length} teams · Event started 06:30
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {sosCount > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', background: 'rgba(220,38,38,0.1)', border: '1.5px solid rgba(220,38,38,0.3)', borderRadius: 'var(--radius-sm)', animation: 'sosPulse 1.2s infinite' }}>
                  <AlertTriangle size={14} color="#dc2626" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#dc2626' }}>{sosCount} SOS ACTIVE</span>
                </div>
              )}
              {behind > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.9rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius-sm)' }}>
                  <Clock size={14} color="var(--accent-amber)" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-amber)' }}>{behind} Behind pace</span>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Elapsed</div>
                <div style={{ fontFamily: 'monospace', fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-emerald)' }}>{elapsedStr}</div>
              </div>
            </div>
          </div>

          {/* ── Journey Progress Bar ─────────────────────────────────── */}
          <div className="glass-panel" style={{ marginBottom: '1.5rem', overflow: 'hidden' }}>
            <JourneyBar participants={participants} />
          </div>

          {/* ── Hero Metrics ─────────────────────────────────────────── */}
          <div className="monitor-hero-strip">
            {heroMetrics.map(m => (
              <div key={m.label} className="monitor-hero-card">
                <div className="monitor-hero-icon">{m.icon}</div>
                <div className="monitor-hero-value" style={{ color: m.color }}>{m.value}</div>
                <div className="monitor-hero-label">{m.label}</div>
              </div>
            ))}
          </div>

          {/* ── Main 2-column layout ─────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Live Route Map */}
              <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Map size={16} color="var(--primary-emerald)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Live Route Map</span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {participants.filter(p => p.status === 'SOS').map(p => (
                      <span key={p.id} className="badge badge-red" style={{ fontSize: '0.6rem', animation: 'sosPulse 1s infinite' }}>
                        🆘 {p.name.split(' ')[0]}
                      </span>
                    ))}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Wifi size={12} /> GPS every 30s
                    </span>
                  </div>
                </div>
                <div style={{ height: '340px', position: 'relative' }}>
                  <iframe
                    title="Live Event Map — Kodaikanal"
                    width="100%" height="100%" frameBorder="0"
                    scrolling="no" marginHeight={0} marginWidth={0}
                    src="https://www.openstreetmap.org/export/embed.html?bbox=77.45%2C10.19%2C77.52%2C10.27&layer=mapnik&marker=10.2325%2C77.4890"
                    style={{ border: 0 }}
                  />
                  {/* Participant Overlay */}
                  <div style={{ position: 'absolute', bottom: '0.75rem', left: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {participants.map(p => (
                      <div key={p.id} title={`${p.name} — ${fmtDist(p.distKm)} km — ${p.status}`}
                        style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid ${statusColor(p.status)}`, overflow: 'hidden', cursor: 'pointer', boxShadow: p.status === 'SOS' ? '0 0 12px rgba(248,113,113,0.9)' : '0 2px 6px rgba(0,0,0,0.2)', animation: p.status === 'SOS' ? 'sosPulse 1s infinite' : 'none' }}
                        onClick={() => setSelectedP(p)}
                      >
                        <img src={p.avatar} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                  {/* Guide overlay */}
                  <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {guides.map(g => (
                      <div key={g.id} title={`Guide: ${g.name}`}
                        style={{ width: 26, height: 26, borderRadius: '50%', border: '2.5px solid var(--primary-cyan)', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
                        <img src={g.avatar} alt={g.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    <div style={{ fontSize: '0.55rem', color: '#fff', textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '0.1rem 0.3rem' }}>guides</div>
                  </div>
                </div>
              </div>

              {/* Participant GPS Cards */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <MapPin size={16} color="var(--primary-emerald)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Participant GPS Tracker</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                    {active} active · {finished} finished · {behind} behind
                  </span>
                </div>
                <div className="participant-gps-list">
                  {[...participants].sort((a, b) => b.distKm - a.distKm).map(p => (
                    <ParticipantGPSCard
                      key={p.id}
                      p={p}
                      onClick={() => setSelectedP(p)}
                      onSOS={handleSOS}
                    />
                  ))}
                </div>
              </div>

              {/* Checkpoint Timeline */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <Flag size={16} color="var(--primary-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Checkpoint Status</span>
                </div>
                <CheckpointTimeline participants={participants} />
              </div>

              {/* Alerts Feed */}
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Radio size={16} color="var(--primary-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Event Alerts Feed</span>
                  {alerts.some(a => a.type === 'danger') && (
                    <span className="badge badge-red" style={{ fontSize: '0.6rem', marginLeft: 'auto' }}>⚠ Alert</span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {alerts.map(a => (
                    <div key={a.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${a.type === 'danger' ? '#dc2626' : a.type === 'warning' ? 'var(--accent-amber)' : a.type === 'success' ? 'var(--primary-emerald)' : 'var(--primary-cyan)'}` }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', fontFamily: 'monospace', marginTop: '0.1rem' }}>{a.time}</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

              {/* Quick Status Pills */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {[
                  { icon: Users,         label: 'Active',   value: active,   color: 'var(--primary-emerald)', bg: 'rgba(16,185,129,0.1)'  },
                  { icon: Clock,         label: 'Behind',   value: behind,   color: 'var(--accent-amber)',    bg: 'rgba(245,158,11,0.1)'  },
                  { icon: CheckCircle2,  label: 'Finished', value: finished, color: 'var(--primary-cyan)',    bg: 'rgba(6,182,212,0.1)'   },
                  { icon: AlertTriangle, label: 'SOS',      value: sosCount, color: 'var(--accent-red)',      bg: 'rgba(220,38,38,0.1)'   },
                ].map(({ icon: Icon, label, value, color, bg }) => (
                  <div key={label} className="glass-panel" style={{ padding: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '8px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Guide Locations */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Compass size={15} color="var(--primary-cyan)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Guide Locations</span>
                </div>
                <GuidePanel guides={guides} participants={participants} />
              </div>

              {/* Team Overview */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Users size={15} color="var(--primary-emerald)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>Team Overview</span>
                </div>
                <TeamOverview participants={participants} />
              </div>

              {/* QR Checkpoint System */}
              <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
                  <CheckCircle2 size={15} color="var(--accent-amber)" />
                  <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>QR Checkpoints</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                  {CHECKPOINTS.slice(0, 4).map((cp, i) => {
                    const scanned = participants.filter(p => p.distKm >= cp.km).length;
                    const statusLabel = scanned === participants.length ? 'All Scanned' : scanned > 0 ? 'Live' : 'Pending';
                    const statusCls   = scanned === participants.length ? 'badge-emerald' : scanned > 0 ? 'badge-cyan' : 'badge-amber';
                    return (
                      <div key={cp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.6rem 0.7rem', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: '1rem' }}>{cp.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.78rem' }}>{cp.name}</div>
                          <div style={{ fontSize: '0.64rem', color: 'var(--text-dim)' }}>{scanned}/{participants.length} scanned</div>
                        </div>
                        <span className={`badge ${statusCls}`} style={{ fontSize: '0.58rem' }}>{statusLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── SOS Confirmation Modal ─────────────────────────────────────────── */}
      {sosTrigger && (
        <div className="modal-overlay" onClick={() => setSosTrigger(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
            {!sosConfirmed ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🆘</div>
                <h2 style={{ color: 'var(--accent-red)', marginBottom: '0.5rem' }}>SOS Alert</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Send emergency alert for <strong style={{ color: 'var(--text-main)' }}>{sosTrigger.name}</strong>?
                  This will notify the medical team and nearest guide immediately.
                </p>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <button onClick={() => setSosTrigger(null)} className="btn-secondary">Cancel</button>
                  <button className="sos-btn sos-pulse" onClick={confirmSOS} style={{ padding: '0.65rem 1.5rem' }}>
                    <PhoneCall size={16} /> CONFIRM SOS
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h2 style={{ color: 'var(--primary-emerald)' }}>SOS Alert Sent!</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Medical team and rescue support notified. ETA: 8–12 minutes.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Participant Detail Modal ───────────────────────────────────────── */}
      {selectedP && (
        <div className="modal-overlay" onClick={() => setSelectedP(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3>Participant Details</h3>
              <button onClick={() => setSelectedP(null)} style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <img src={selectedP.avatar} alt="" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${statusColor(selectedP.status)}` }} />
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>{selectedP.name}</h3>
                <span style={{ color: statusColor(selectedP.status), fontWeight: 700, fontSize: '0.85rem' }}>● {selectedP.status}</span>
              </div>
            </div>
            <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1rem' }}>
              {[
                { label: 'Distance',   value: `${fmtDist(selectedP.distKm)} km`, highlight: false },
                { label: 'Remaining',  value: `${fmtDist(Math.max(0, TOTAL_KM - selectedP.distKm))} km`, highlight: false },
                { label: 'Speed',      value: `${selectedP.status === 'Resting' ? '0.0' : fmtSpeed(selectedP.speed)} km/h`, highlight: selectedP.speed > 7 },
                { label: 'Heart Rate', value: `${selectedP.heartRate} bpm`, highlight: selectedP.heartRate > 160 },
                { label: 'Battery',    value: `${selectedP.batteryPct}%`, highlight: selectedP.batteryPct < 25 },
                { label: 'GPS Signal', value: 'Strong ✓', highlight: false },
              ].map(({ label, value, highlight }) => (
                <div key={label} className="glass-panel" style={{ padding: '0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: highlight ? 'var(--accent-red)' : 'var(--text-main)', marginTop: '0.2rem' }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }}><PhoneCall size={14} /> Contact Guide</button>
              {selectedP.status !== 'SOS' && selectedP.status !== 'Finished' && (
                <button className="sos-btn" style={{ flex: 1 }} onClick={() => { handleSOS(selectedP); setSelectedP(null); }}>
                  <AlertTriangle size={14} /> SOS Alert
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveEvent;
