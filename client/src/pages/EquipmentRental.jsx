import React, { useState } from 'react';
import {
  Package, Star, ShoppingCart, Check, X, Filter,
  Backpack, Tent, Clock, Shield,
} from 'lucide-react';
import Sidebar from '../components/Sidebar';

const EQUIPMENT = [
  {
    id: 1, name: 'High-Altitude Trekking Boots', category: 'Footwear',
    icon: '🥾', price: 450, priceUnit: '/week',
    rating: 4.9, reviews: 84,
    tags: ['Waterproof', 'Gore-Tex', 'Size 6–13'],
    desc: 'Professional LOWA Tibet GTX boots — used by Himalayan expedition guides. Ankle support + crampon-compatible.',
    available: true, qty: 3,
    img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 2, name: '4-Season Expedition Tent', category: 'Shelter',
    icon: '⛺', price: 800, priceUnit: '/week',
    rating: 4.8, reviews: 52,
    tags: ['2-Person', 'Wind 120km/h', 'Freestanding'],
    desc: 'Mountain Hardwear Trango tent — bombproof 4-season shelter tested on 6000m peaks. Includes footprint.',
    available: true, qty: 2,
    img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 3, name: 'GPS Satellite Tracker', category: 'Safety',
    icon: '📡', price: 350, priceUnit: '/week',
    rating: 5.0, reviews: 121,
    tags: ['SOS', '2-Way Msg', '100hr Battery'],
    desc: 'Garmin inReach Mini 2 — real-time GPS satellite tracking, global SOS and two-way messaging. No dead zones.',
    available: true, qty: 8,
    img: 'https://images.unsplash.com/photo-1516075480664-a03a1e9db49c?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 4, name: 'Osprey 65L Trekking Pack', category: 'Backpack',
    icon: '🎒', price: 300, priceUnit: '/week',
    rating: 4.7, reviews: 96,
    tags: ['65L', 'Rain Cover', 'Fit: S/M/L'],
    desc: "Osprey Atmos AG 65 — Anti-Gravity suspension, integrated rain cover, hydration-compatible. Trek India's best trails.",
    available: false, qty: 0,
    img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 5, name: 'Down Sleeping Bag (-15°C)', category: 'Sleep',
    icon: '🛏️', price: 400, priceUnit: '/week',
    rating: 4.8, reviews: 67,
    tags: ['800FP Down', '-15°C', '1.1kg'],
    desc: 'Western Mountaineering Alpinlite — premium 850FP down, designed for cold alpine nights and high-altitude camps.',
    available: true, qty: 5,
    img: 'https://images.unsplash.com/photo-1537745218867-abe21eaef96b?auto=format&fit=crop&w=400&q=70',
  },
  {
    id: 6, name: 'Portable Solar Power Bank', category: 'Electronics',
    icon: '☀️', price: 150, priceUnit: '/week',
    rating: 4.6, reviews: 43,
    tags: ['20000mAh', 'USB-C PD', 'Waterproof'],
    desc: "Goal Zero Nomad 10 — charges devices directly from the sun. 10W panel, 20000mAh storage. Devices won't die in the wild.",
    available: true, qty: 10,
    img: 'https://images.unsplash.com/photo-1585338651983-76e3e78bc4da?auto=format&fit=crop&w=400&q=70',
  },
];

const CATEGORIES = ['All', 'Footwear', 'Shelter', 'Safety', 'Backpack', 'Sleep', 'Electronics'];

const EquipmentRental = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rentalDays, setRentalDays] = useState(7);
  const [showCart, setShowCart] = useState(false);
  const [booked, setBooked] = useState(false);

  const filtered = EQUIPMENT.filter(e => activeCategory === 'All' || e.category === activeCategory);
  const cartTotal = cart.reduce((s, id) => {
    const item = EQUIPMENT.find(e => e.id === id);
    return s + (item ? Math.round(item.price * (rentalDays / 7)) : 0);
  }, 0);

  const toggleCart = (id) => {
    setCart(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const confirmBooking = () => {
    setBooked(true);
    setTimeout(() => { setBooked(false); setCart([]); setShowCart(false); }, 3000);
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem', background: '#f8fafc' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span className="section-subtitle"><Package size={12} style={{ display: 'inline', marginRight: '0.3rem' }} />Equipment</span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0 0.25rem' }}>Equipment Rental</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Premium adventure gear rented by the week — quality-checked after every expedition.</p>
            </div>
            <button
              className="btn-primary"
              onClick={() => setShowCart(true)}
              style={{ position: 'relative' }}
            >
              <ShoppingCart size={16} /> Cart
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -8, width: 20, height: 20, background: '#dc2626', color: 'white', borderRadius: '50%', fontSize: '0.65rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Rental Duration Picker */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={16} color="var(--primary-emerald)" />
              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Rental Duration:</span>
            </div>
            {[3, 7, 14, 30].map(d => (
              <button key={d} onClick={() => setRentalDays(d)} style={{
                padding: '0.35rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: rentalDays === d ? '2px solid var(--primary-emerald)' : '1.5px solid rgba(15,23,42,0.12)',
                background: rentalDays === d ? '#ecfdf5' : '#fff',
                color: rentalDays === d ? 'var(--primary-emerald)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {d} days
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: 'var(--text-muted)' }}>Prices shown for {rentalDays}-day rental</span>
          </div>

          {/* Category Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                padding: '0.4rem 1rem',
                borderRadius: 'var(--radius-full)',
                border: activeCategory === cat ? '2px solid var(--primary-emerald)' : '1.5px solid rgba(15,23,42,0.1)',
                background: activeCategory === cat ? '#ecfdf5' : '#fff',
                color: activeCategory === cat ? 'var(--primary-emerald)' : 'var(--text-muted)',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {cat}
              </button>
            ))}
          </div>

          {/* Equipment Grid */}
          <div className="grid-3" style={{ gap: '1.5rem' }}>
            {filtered.map(item => {
              const inCart = cart.includes(item.id);
              const rentalPrice = Math.round(item.price * (rentalDays / 7));
              return (
                <div key={item.id} className="glass-panel" style={{ overflow: 'hidden', opacity: item.available ? 1 : 0.65 }}>
                  <div style={{ height: 180, overflow: 'hidden', position: 'relative', cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
                    <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                      onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                    <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                      <span className={`badge ${item.available ? 'badge-emerald' : 'badge-red'}`} style={{ fontSize: '0.65rem' }}>
                        {item.available ? `${item.qty} available` : 'Out of Stock'}
                      </span>
                    </div>
                    <div style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'rgba(255,255,255,0.9)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.6rem', backdropFilter: 'blur(4px)' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--primary-emerald)' }}>₹{rentalPrice}</span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}> /{rentalDays}d</span>
                    </div>
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.4rem' }}>{item.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.6rem' }}>
                      <span style={{ color: '#d97706', fontWeight: 800, fontSize: '0.82rem' }}>★ {item.rating}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>({item.reviews} reviews)</span>
                      <span style={{ marginLeft: 'auto' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>{item.category}</span>
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                      {item.tags.map(t => (
                        <span key={t} style={{ background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', borderRadius: 'var(--radius-full)', padding: '0.1rem 0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                    <button
                      className={inCart ? 'btn-secondary' : 'btn-primary'}
                      style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', padding: '0.55rem' }}
                      disabled={!item.available}
                      onClick={() => toggleCart(item.id)}
                    >
                      {inCart ? <><Check size={14} /> Added to Cart</> : <><ShoppingCart size={14} /> Rent Now</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>{selectedItem.name}</h3>
              <button onClick={() => setSelectedItem(null)} style={{ background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <img src={selectedItem.img} alt="" style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>{selectedItem.desc}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {selectedItem.tags.map(t => <span key={t} className="badge badge-cyan" style={{ fontSize: '0.72rem' }}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setSelectedItem(null)}>Close</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={() => { toggleCart(selectedItem.id); setSelectedItem(null); }}>
                <ShoppingCart size={15} /> {cart.includes(selectedItem.id) ? 'Remove from Cart' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="modal-overlay" onClick={() => setShowCart(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3>Rental Cart</h3>
              <button onClick={() => setShowCart(false)} style={{ background: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {booked ? (
              <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
                <h3 style={{ color: 'var(--primary-emerald)' }}>Booking Confirmed!</h3>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Equipment will be delivered to the event base camp 24h before departure.</p>
              </div>
            ) : cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)' }}>
                <ShoppingCart size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <p>Your cart is empty.</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                  {cart.map(id => {
                    const item = EQUIPMENT.find(e => e.id === id);
                    if (!item) return null;
                    const rentalPrice = Math.round(item.price * (rentalDays / 7));
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(15,23,42,0.07)' }}>
                        <img src={item.img} alt="" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rentalDays} days</div>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--primary-emerald)', fontSize: '0.9rem' }}>₹{rentalPrice}</div>
                        <button onClick={() => toggleCart(id)} style={{ background: 'none', cursor: 'pointer', color: '#dc2626' }}><X size={14} /></button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.85rem', background: '#ecfdf5', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', border: '1px solid #a7f3d0' }}>
                  <span style={{ fontWeight: 700 }}>Total ({rentalDays} days)</span>
                  <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary-emerald)' }}>₹{cartTotal}</span>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={confirmBooking}>
                  <ShoppingCart size={16} /> Confirm Rental Booking
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentRental;
