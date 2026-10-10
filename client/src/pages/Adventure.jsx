import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Compass, MapPin, Calendar, Check, X, Shield, ArrowRight } from 'lucide-react';
import AdventureCard from '../components/AdventureCard';
import Loader from '../components/Loader';
import { useWorkout } from '../hooks/useWorkout';

const Adventure = () => {
  const navigate = useNavigate();
  const {
    adventures,
    loading,
    categoryFilter,
    setCategoryFilter,
    difficultyFilter,
    setDifficultyFilter,
    searchQuery,
    setSearchQuery,
    fetchAdventures,
  } = useWorkout();

  const [selectedAdventure, setSelectedAdventure] = useState(null);
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    fetchAdventures();
  }, [fetchAdventures]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, difficultyFilter, searchQuery]);

  const sortedAdventures = [...adventures].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.price || 0) - (b.price || 0);
      case 'price-high':
        return (b.price || 0) - (a.price || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'duration':
        return (a.durationDays || 0) - (b.durationDays || 0);
      case 'title':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const totalPages = Math.max(1, Math.ceil(sortedAdventures.length / pageSize));
  const paginatedAdventures = sortedAdventures.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const categories = ['All', 'Trekking', 'Kayaking', 'Rock Climbing', 'Skydiving'];
  const difficulties = ['All', 'Moderate', 'Challenging', 'Extreme'];

  const handleBookAdventure = (adventure) => {
    navigate('/booking', { state: { item: adventure, itemType: 'Adventure' } });
  };

  return (
    <div className="main-content">
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="section-header" style={{ marginBottom: '2.5rem' }}>
          <span className="section-subtitle">Wilderness Expeditions</span>
          <h1 className="section-title">Outdoor Adventure Catalog</h1>
          <p className="section-desc">Experience breathtaking multi-day mountain climbs, river kayaking, and wilderness challenges.</p>
        </div>

        {/* Filter Controls */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '3rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by trip name or location (e.g., Swiss Alps, Utah)..."
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
                  <option key={diff} value={diff}>Terrain: {diff}</option>
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
                <option value="price-low">Sort: Price Low</option>
                <option value="price-high">Sort: Price High</option>
                <option value="duration">Sort: Shortest</option>
                <option value="title">Sort: A–Z</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', marginRight: '0.5rem' }}>Discipline:</span>
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

        {/* Adventure Grid */}
        {loading ? (
          <Loader text="Discovering expeditions..." />
        ) : adventures.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Compass size={48} color="var(--text-dim)" style={{ marginBottom: '1rem' }} />
            <h3>No Adventures Match Your Criteria</h3>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Try choosing another discipline or location query.</p>
          </div>
        ) : (
          <>
            <div className="grid-3">
              {paginatedAdventures.map((adventure) => (
                <AdventureCard
                  key={adventure._id || adventure.id}
                  adventure={adventure}
                  onSelect={(a) => setSelectedAdventure(a)}
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

      {/* Adventure Detail Modal */}
      {selectedAdventure && (
        <div className="modal-overlay" onClick={() => setSelectedAdventure(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <span className="badge badge-emerald" style={{ marginBottom: '0.4rem', display: 'inline-block' }}>
                  {selectedAdventure.category}
                </span>
                <h2 style={{ fontSize: '1.75rem' }}>{selectedAdventure.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-cyan)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                  <MapPin size={16} />
                  <span>{selectedAdventure.location}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAdventure(null)}
                style={{ background: 'none', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            <img
              src={selectedAdventure.imageUrl}
              alt={selectedAdventure.title}
              style={{ width: '100%', height: '240px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}
            />

            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{selectedAdventure.description}</p>

            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', background: 'var(--surface, rgba(255,255,255,0.04))', border: '1px solid var(--border-subtle)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Duration</span>
                <p style={{ fontWeight: '700', color: 'var(--primary-emerald)' }}>{selectedAdventure.durationDays} Days</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Difficulty</span>
                <p style={{ fontWeight: '700', color: 'var(--accent-amber)' }}>{selectedAdventure.difficulty}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Group Limit</span>
                <p style={{ fontWeight: '700', color: 'var(--primary-cyan)' }}>Max {selectedAdventure.maxParticipants} People</p>
              </div>
            </div>

            {/* Included Gear */}
            <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>Included Gear & Safety</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {selectedAdventure.includedGear?.map((item, i) => (
                <span key={i} className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Check size={12} /> {item}
                </span>
              ))}
            </div>

            {/* Daily Itinerary */}
            {selectedAdventure.itinerary && selectedAdventure.itinerary.length > 0 && (
              <>
                <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>Expedition Itinerary</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                  {selectedAdventure.itinerary.map((it) => (
                    <div key={it.day} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary-cyan)', fontWeight: '700' }}>DAY {it.day}</span>
                      <h5 style={{ fontSize: '0.95rem', margin: '0.1rem 0 0.25rem 0' }}>{it.title}</h5>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{it.description}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Cost</span>
                <div style={{ fontSize: '1.75rem', fontWeight: '800' }}>₹{selectedAdventure.price}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate(`/adventures/${selectedAdventure._id}/readiness`)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Shield size={15} /> Check Fitness Readiness
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/adventures/${selectedAdventure._id}`)}
                  className="btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Full Details & Guide
                </button>
                <button
                  onClick={() => handleBookAdventure(selectedAdventure)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  Book Expedition <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Adventure;
