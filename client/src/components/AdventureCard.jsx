import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Clock, Users, ArrowRight, Zap } from 'lucide-react';

const DIFFICULTY_CONFIG = {
  Easy:        { color: '#16a34a', bg: 'rgba(22,163,74,0.12)',  border: 'rgba(22,163,74,0.3)',  dot: '#22c55e' },
  Moderate:    { color: '#d97706', bg: 'rgba(217,119,6,0.12)',  border: 'rgba(217,119,6,0.3)',  dot: '#f59e0b' },
  Challenging: { color: '#dc2626', bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.3)',  dot: '#ef4444' },
  Extreme:     { color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: 'rgba(124,58,237,0.3)', dot: '#a855f7' },
};

const CATEGORY_EMOJI = {
  Trekking:       '🏔️',
  Kayaking:       '🚣',
  'Rock Climbing':'🧗',
  Skydiving:      '🪂',
  Cycling:        '🚴',
  Camping:        '⛺',
};

const AdventureCard = ({ adventure, onSelect }) => {
  const navigate = useNavigate();
  const diff   = DIFFICULTY_CONFIG[adventure.difficulty] || DIFFICULTY_CONFIG.Moderate;
  const emoji  = CATEGORY_EMOJI[adventure.category] || '🧭';
  const hasXP  = adventure.xpReward ?? adventure.xp;

  const handleClick = () => {
    if (onSelect) {
      onSelect(adventure);
    } else if (adventure._id) {
      navigate(`/adventures/${adventure._id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: 'var(--surface, #1e293b)',
        borderRadius: 16,
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid var(--border, rgba(255,255,255,0.1))',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        boxShadow: 'var(--card-shadow, 0 4px 14px rgba(0,0,0,0.15))',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.14)';
        e.currentTarget.style.transform = 'translateY(-5px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      {/* Hero Image */}
      <div style={{ position: 'relative', height: 185, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={adventure.imageUrl}
          alt={adventure.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          pointerEvents: 'none',
        }} />

        {/* Category badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(6px)',
          color: '#fff',
          fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase',
          padding: '4px 9px', borderRadius: 6,
        }}>
          <span>{emoji}</span>
          <span>{adventure.category}</span>
        </div>

        {/* Rating badge */}
        {adventure.rating && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(6px)',
            color: '#fbbf24',
            fontSize: '0.72rem', fontWeight: 800,
            padding: '4px 8px', borderRadius: 6,
          }}>
            <Star size={11} fill="#fbbf24" /> {adventure.rating}
          </div>
        )}

        {/* XP reward chip */}
        {hasXP && (
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 3,
            background: 'rgba(217,119,6,0.85)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            fontSize: '0.65rem', fontWeight: 800,
            padding: '3px 7px', borderRadius: 20,
          }}>
            <Zap size={9} fill="#fff" /> +{hasXP} XP
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '0.9rem 1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>

        {/* Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted-text, #94a3b8)', fontSize: '0.7rem', fontWeight: 500 }}>
          <MapPin size={11} color="var(--primary, #10b981)" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adventure.location}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '0.95rem', fontWeight: 800, color: 'var(--text, #f8fafc)',
          lineHeight: 1.35, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {adventure.title}
        </h3>

        {/* Meta: duration + participants + difficulty */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.1rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--text-muted, #cbd5e1)', fontWeight: 600 }}>
            <Clock size={11} color="var(--muted-text, #94a3b8)" /> {adventure.durationDays}d
          </span>
          {adventure.maxParticipants && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.7rem', color: 'var(--text-muted, #cbd5e1)', fontWeight: 600 }}>
              <Users size={11} color="var(--muted-text, #94a3b8)" /> Max {adventure.maxParticipants}
            </span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.65rem', fontWeight: 700,
            background: diff.bg, color: diff.color,
            border: `1px solid ${diff.border}`,
            padding: '2px 8px', borderRadius: 20,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: diff.dot, display: 'inline-block' }} />
            {adventure.difficulty}
          </span>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--border-subtle, rgba(255,255,255,0.08))', marginTop: 'auto', paddingTop: '0.6rem' }} />

        {/* Price + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.62rem', color: 'var(--muted-text, #94a3b8)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>From</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text, #f8fafc)', letterSpacing: '-0.5px' }}>
              Rs.{adventure.price?.toLocaleString()}
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onSelect?.(adventure); }}
            style={{
              padding: '0.45rem 1rem',
              background: 'linear-gradient(135deg, #059669, #0284c7)',
              color: '#fff',
              border: 'none', borderRadius: 9,
              fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'opacity 0.15s, transform 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'scale(1.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Explore <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdventureCard;
