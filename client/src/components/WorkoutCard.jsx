import { Clock, Flame, Star, ArrowRight, Dumbbell } from 'lucide-react';

const difficultyColors = {
  Beginner:    { bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  Intermediate:{ bg: '#fffbeb', color: '#b45309', border: '#fcd34d' },
  Advanced:    { bg: '#fff1f2', color: '#be123c', border: '#fda4af' },
  Expert:      { bg: '#faf5ff', color: '#7e22ce', border: '#d8b4fe' },
};

const categoryColors = {
  HIIT:     '#ef4444',
  Strength: '#3b82f6',
  Yoga:     '#10b981',
  Cardio:   '#f97316',
  default:  '#6b7280',
};

const getExerciseName = exercise => (
  typeof exercise === 'string' ? exercise : exercise?.name
);

const WorkoutCard = ({ workout, onSelect }) => {
  const diff = difficultyColors[workout.difficulty] || difficultyColors.Intermediate;
  const catColor = categoryColors[workout.category] || categoryColors.default;

  return (
    <div
      onClick={() => onSelect?.(workout)}
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 130, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={workout.imageUrl}
          alt={workout.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {/* Category badge */}
        <span style={{
          position: 'absolute', top: 8, left: 8,
          background: catColor, color: '#fff',
          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4,
        }}>
          {workout.category}
        </span>
        {/* Rating */}
        {workout.rating && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.65)', color: '#fbbf24',
            fontSize: '0.76rem', fontWeight: 700,
            padding: '2px 6px', borderRadius: 4,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Star size={10} fill="#fbbf24" /> {workout.rating}
          </span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {/* Title */}
        <h3 style={{
          fontSize: '0.98rem', fontWeight: 700, color: '#111827',
          lineHeight: 1.3, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {workout.title}
        </h3>

        {/* Instructor */}
        {workout.instructor?.name && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.78rem', color: '#6b7280' }}>
            <Dumbbell size={9} />
            <span>{workout.instructor.name}</span>
          </div>
        )}

        {workout.exercises?.length > 0 && (
          <div style={{ fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.5, minHeight: '2.1em' }}>
            {workout.exercises.slice(0, 5).map(getExerciseName).filter(Boolean).join(' • ')}
            {workout.exercises.length > 5 ? ' • ...' : ''}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 'auto', paddingTop: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: '#374151' }}>
            <Clock size={10} color="#6b7280" /> {workout.durationMinutes}m
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.78rem', color: '#374151' }}>
            <Flame size={10} color="#ef4444" /> {workout.caloriesBurned}
          </span>
          <span style={{
            marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 700,
            padding: '1px 6px', borderRadius: 4,
            background: diff.bg, color: diff.color, border: `1px solid ${diff.border}`,
          }}>
            {workout.difficulty}
          </span>
        </div>

        {/* Button */}
        <button
          onClick={e => { e.stopPropagation(); onSelect?.(workout); }}
          style={{
            marginTop: '0.4rem', width: '100%', padding: '0.55rem',
            background: '#111827', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: '0.85rem',
            fontWeight: 700, cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#374151'}
          onMouseLeave={e => e.currentTarget.style.background = '#111827'}
        >
          Start <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutCard;
