import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, logout, loading, error: authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    const result = await login(email, password, 'admin');

    if (result.success) {
      if (result.user?.role === 'admin') {
        navigate('/analytics');
      } else {
        await logout();
        setFormError('This account does not have administrator access.');
      }
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@fitnessadventure.com');
    setPassword('Admin@2026');
  };

  return (
    <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#34d399', marginBottom: '1rem' }}>
            <ShieldCheck size={30} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Admin Access</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Sign in to manage operations, safety, and analytics</p>
        </div>

        {(formError || authError) && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{formError || authError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                placeholder="admin@fitnessadventure.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
              <Mail size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem', fontWeight: '600' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem' }}
              />
              <Lock size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', width: '100%', marginTop: '0.5rem' }}>
            {loading ? 'Authenticating...' : 'Admin Sign In'} <LogIn size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleFillDemo}
            className="btn-secondary"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem', marginBottom: '1rem' }}
          >
            Use Demo Admin
          </button>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Not an admin?{' '}
            <Link to="/login" style={{ color: 'var(--primary-emerald)', fontWeight: '700' }}>
              Participant Login
            </Link>
            {' · '}
            <Link to="/organizer-login" style={{ color: 'var(--primary-emerald)', fontWeight: '700' }}>
              Organizer Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
