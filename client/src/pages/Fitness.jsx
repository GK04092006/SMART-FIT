import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Dumbbell, Flame, Clock, X, Check, ArrowRight } from 'lucide-react';
import WorkoutCard from '../components/WorkoutCard';
import Loader from '../components/Loader';
import { useWorkout } from '../hooks/useWorkout';

const Fitness = () => {
  const navigate = useNavigate();
  const {
    workouts,
    loading,
    categoryFilter,
    setCategoryFilter,
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    fetchWorkouts,
  } = useWorkout();

  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const sortedWorkouts = [...workouts].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'duration':
        return (a.durationMinutes || 0) - (b.durationMinutes || 0);
      case 'calories':
        return (b.caloriesBurned || 0) - (a.caloriesBurned || 0);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedWorkouts.length / pageSize));
  const paginatedWorkouts = sortedWorkouts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = ['All', 'HIIT', 'Strength', 'Yoga', 'Cardio'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];

  const handleStartWorkout = (workout) => {
    navigate('/booking', { state: { item: workout, itemType: 'Fitness' } });
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <span className="section-subtitle">Tactical Performance</span>
          <h1 className="section-title">Fitness & Conditioning Library</h1>
          <p className="section-desc">Select workout programs engineered to optimize power, VO2 max, and functional endurance.</p>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search workouts by name or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.75rem' }}
              />
              <Search size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>

            <div>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                style={{ width: '100%' }}
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>Difficulty: {diff}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="featured">Sort: Featured</option>
                <option value="rating">Sort: Rating</option>
                <option value="duration">Sort: Shortest</option>
                <option value="calories">Sort: Calories</option>
                <option value="title">Sort: A–Z</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '0.5rem' }}>Category:</span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={categoryFilter === cat ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '0.4rem 1.1rem', fontSize: '0.85rem' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Workout Grid */}
        {loading ? (
          <Loader text="Fetching conditioning workouts..." />
        ) : workouts.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Dumbbell size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
            <h3>No Workouts Found</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try refining your search terms or filters.</p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {paginatedWorkouts.map((workout) => (
                <WorkoutCard
                  key={workout._id || workout.id}
                  workout={workout}
                  onSelect={(w) => setSelectedWorkout(w)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>

                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="btn-secondary"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <div className="modal-overlay" onClick={() => setSelectedWorkout(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-magenta" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                  {selectedWorkout.category}
                </span>
                <h2 style={{ fontSize: '1.75rem' }}>{selectedWorkout.title}</h2>
              </div>
              <button
                onClick={() => setSelectedWorkout(null)}
                style={{ background: 'none', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            <img
              src={selectedWorkout.imageUrl}
              alt={selectedWorkout.title}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}
            />

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{selectedWorkout.description}</p>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', background: 'rgba(15,23,42,0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Duration</span>
                <p style={{ fontWeight: '700', color: 'var(--primary-cyan)' }}>{selectedWorkout.durationMinutes} mins</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Est. Burn</span>
                <p style={{ fontWeight: '700', color: 'var(--accent-magenta)' }}>{selectedWorkout.caloriesBurned} kcal</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Level</span>
                <p style={{ fontWeight: '700', color: 'var(--primary-emerald)' }}>{selectedWorkout.difficulty}</p>
              </div>
            </div>

            {/* Exercise Breakdown */}
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Exercise Structure</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {selectedWorkout.exercises?.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontWeight: '600' }}>{typeof ex === 'string' ? ex : ex.name}</span>
                  {typeof ex !== 'string' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {ex.sets} sets × {ex.reps} ({ex.restSeconds}s rest)
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleStartWorkout(selectedWorkout)}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Book Session / Reserve Class <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fitness;
