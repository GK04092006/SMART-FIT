import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Lock, UserPlus, AlertCircle, Dumbbell,
  Eye, EyeOff, CheckCircle, Loader2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GoogleOAuthButton from '../components/GoogleOAuthButton';

/* ── Config ─────────────────────────────────────────────────────────────────── */
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
const GOOGLE_CONFIGURED =
  GOOGLE_CLIENT_ID &&
  GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID' &&
  !GOOGLE_CLIENT_ID.startsWith('your-google-client-id');

const decodeJwt = (token) => {
  try {
    const base64Url = token?.split('.')?.[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

/* ── Tiny helpers ────────────────────────────────────────────────────────────── */
const inputWrapStyle = { position: 'relative', marginBottom: 0 };
const iconStyle = { position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' };
const inputStyle = {
  width: '100%',
  height: '48px',
  background: 'rgba(15,23,42,0.6)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: '#f1f5f9',
  fontSize: '0.95rem',
  padding: '0 1rem 0 2.75rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
  boxSizing: 'border-box',
};
const labelStyle = {
  display: 'block', fontSize: '0.82rem', fontWeight: 600,
  color: '#94a3b8', marginBottom: '0.4rem', letterSpacing: '0.02em',
};

/** Password strength indicator */
const getStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  const map = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Weak', color: '#ef4444' },
    { score: 2, label: 'Fair', color: '#f59e0b' },
    { score: 3, label: 'Good', color: '#3b82f6' },
    { score: 4, label: 'Strong', color: '#10b981' },
  ];
  return map[score] || map[4];
};

/* ═══════════════════════════════════════════════════════════════════════════════
   REGISTER PAGE
═══════════════════════════════════════════════════════════════════════════════ */
const Register = () => {
  const navigate = useNavigate();
  const { register, loginWithGoogle, logout, loading, error: authError, clearError } = useAuth();

  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPwd, setConfirmPwd]   = useState('');
  const [role, setRole]               = useState('user');
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError]     = useState('');
  const [googleError, setGoogleError] = useState('');
  const [success, setSuccess]         = useState(false);

  const strength = getStrength(password);

  // Clear auth errors when component mounts
  useEffect(() => { clearError?.(); }, []);

  const validate = () => {
    if (!name.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Email address is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPwd) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const err = validate();
    if (err) { setFormError(err); return; }

    const result = await register({ name: name.trim(), email: email.trim().toLowerCase(), password, fitnessLevel, role });
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate(result.user?.role === 'organizer' ? '/organizer' : '/dashboard'), 1200);
    } else {
      setFormError(result.message || 'Registration failed. Please try again.');
    }
  };

  const displayError = formError || googleError || authError;

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes slideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .slide-in { animation: slideIn 0.4s ease both; }
        input:focus, select:focus {
          border-color: rgba(16,185,129,0.6) !important;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important;
        }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.05) 0%, transparent 60%)',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 32px rgba(16,185,129,0.35), 0 0 0 8px rgba(16,185,129,0.08)',
            }}>
              <ShieldCheck size={30} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>
              Create Account
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Join the ultimate fitness & adventure community
            </p>
          </div>

          {/* Card */}
          <div style={{
            background: 'rgba(15,23,42,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>

            {/* Success overlay */}
            {success && (
              <div className="slide-in" style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
                }}>
                  <CheckCircle size={30} color="#10b981" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Account Created!</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Redirecting to your dashboard…</p>
              </div>
            )}

            {!success && (
              <>
                {/* Error banner */}
                {displayError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px',
                    marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start',
                    gap: '0.5rem', fontSize: '0.875rem',
                  }}>
                    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{displayError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

                  {/* Full Name */}
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <div style={inputWrapStyle}>
                      <User size={17} style={iconStyle} />
                      <input
                        id="register-name"
                        type="text"
                        placeholder="Alex Hunter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoComplete="name"
                        autoFocus
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <div style={inputWrapStyle}>
                      <Mail size={17} style={iconStyle} />
                      <input
                        id="register-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={labelStyle}>Password</label>
                    <div style={inputWrapStyle}>
                      <Lock size={17} style={iconStyle} />
                      <input
                        id="register-password"
                        type={showPwd ? 'text' : 'password'}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        style={{ ...inputStyle, paddingRight: '3rem' }}
                      />
                      <button type="button"
                        onClick={() => setShowPwd((v) => !v)}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                        aria-label="Toggle password visibility"
                      >
                        {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {password && (
                      <div style={{ marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                          {[1,2,3,4].map((i) => (
                            <div key={i} style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.1)',
                              transition: 'background 0.3s',
                            }} />
                          ))}
                        </div>
                        {strength.label && (
                          <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                            {strength.label} password
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={labelStyle}>Confirm Password</label>
                    <div style={inputWrapStyle}>
                      <Lock size={17} style={iconStyle} />
                      <input
                        id="register-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Re-enter your password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        autoComplete="new-password"
                        style={{
                          ...inputStyle,
                          paddingRight: '3rem',
                          borderColor: confirmPwd && password !== confirmPwd
                            ? 'rgba(239,68,68,0.5)'
                            : confirmPwd && password === confirmPwd
                            ? 'rgba(16,185,129,0.5)'
                            : undefined,
                        }}
                      />
                      <button type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                        aria-label="Toggle confirm password visibility"
                      >
                        {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                      {confirmPwd && password === confirmPwd && (
                        <CheckCircle size={15} color="#10b981" style={{ position: 'absolute', right: '2.5rem', top: '50%', transform: 'translateY(-50%)' }} />
                      )}
                    </div>
                  </div>

                  {/* Account Role */}
                  <div>
                    <label style={labelStyle}>Account Role</label>
                    <div style={inputWrapStyle}>
                      <ShieldCheck size={17} style={iconStyle} />
                      <select
                        id="register-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        style={{ ...inputStyle, appearance: 'none', paddingRight: '2.5rem', cursor: 'pointer' }}
                      >
                        <option value="user">Participant</option>
                        <option value="organizer">Organizer</option>
                      </select>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.4rem 0 0' }}>
                      Admin accounts are provisioned separately.
                    </p>
                  </div>

                  {/* Fitness Level */}
                  <div>
                    <label style={labelStyle}>Fitness Conditioning Level</label>
                    <div style={inputWrapStyle}>
                      <Dumbbell size={17} style={iconStyle} />
                      <select
                        id="register-fitness-level"
                        value={fitnessLevel}
                        onChange={(e) => setFitnessLevel(e.target.value)}
                        style={{
                          ...inputStyle,
                          appearance: 'none',
                          paddingRight: '2.5rem',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="Beginner">🌱 Beginner — Starting my journey</option>
                        <option value="Intermediate">🏃 Intermediate — Regular training</option>
                        <option value="Advanced">💪 Advanced — High endurance</option>
                        <option value="Elite">🏆 Elite — Extreme conditioning</option>
                      </select>
                    </div>
                  </div>

                  {/* Terms note */}
                  <p style={{ fontSize: '0.78rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                    By creating an account, you agree to our{' '}
                    <span style={{ color: '#10b981', cursor: 'pointer' }}>Terms of Service</span>
                    {' '}and{' '}
                    <span style={{ color: '#10b981', cursor: 'pointer' }}>Privacy Policy</span>.
                  </p>

                  {/* Submit */}
                  <button
                    id="register-btn"
                    type="submit"
                    disabled={loading}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', padding: '0.85rem', borderRadius: '10px',
                      background: loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                      border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                      boxShadow: loading ? 'none' : '0 4px 20px rgba(16,185,129,0.4)',
                      transition: 'all 0.25s', width: '100%',
                    }}
                    onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    {loading ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}
                    {loading ? 'Creating Account…' : 'Create Account'}
                  </button>
                </form>

                {/* Google Register */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <span style={{ color: '#475569', fontSize: '0.78rem' }}>or</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>
                {googleError && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    color: '#f87171', padding: '0.7rem 1rem', borderRadius: '10px',
                    marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem',
                  }}>
                    <AlertCircle size={15} /><span>{googleError}</span>
                  </div>
                )}
                <GoogleOAuthButton
                  role={role}
                  label="Continue with Google"
                  loginWithGoogle={loginWithGoogle}
                  onSuccess={(u) => navigate(u?.role === 'organizer' ? '/organizer' : '/dashboard')}
                  onError={setGoogleError}
                />
              </>
            )}
          </div>

          {/* Footer */}
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Register;
