import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, Instagram, Twitter, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Link to="/" className="brand-logo" style={{ marginBottom: '1rem', display: 'inline-flex' }}>
              <div className="brand-logo-icon">
                <Dumbbell size={20} />
              </div>
              <span className="text-gradient">Fit</span>
            </Link>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem', maxWidth: '320px' }}>
              The premiere platform connecting high-intensity fitness training with thrilling wilderness expeditions worldwide.
            </p>
            <div style={{ display: 'flex', gap: '1rem', color: 'var(--primary-emerald)' }}>
              <Instagram size={20} style={{ cursor: 'pointer' }} />
              <Twitter size={20} style={{ cursor: 'pointer' }} />
              <Facebook size={20} style={{ cursor: 'pointer' }} />
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--text-main)' }}>Explore</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li><Link to="/fitness" style={{ color: 'var(--text-muted)' }}>Workout Library</Link></li>
              <li><Link to="/adventure" style={{ color: 'var(--text-muted)' }}>Outdoor Expeditions</Link></li>
              <li><Link to="/booking" style={{ color: 'var(--text-muted)' }}>Reservations</Link></li>
              <li><Link to="/dashboard" style={{ color: 'var(--text-muted)' }}>User Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--text-main)' }}>Categories</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)' }}>
              <li>HIIT & Metabolic Shred</li>
              <li>Alpine Glacial Treks</li>
              <li>Sandstone Rock Climbing</li>
              <li>White Water Kayaking</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: 'var(--text-main)' }}>Contact Us</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="var(--primary-emerald)" />
                <span>742 Adventure Ridge Way, Interlaken</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="var(--primary-emerald)" />
                <span>+1 (800) 459-EXPEDITION</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="var(--primary-emerald)" />
                <span>support@fit-adventure.com</span>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Fit & Outdoor Adventure System. All rights reserved. Built with React & Node.js.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
