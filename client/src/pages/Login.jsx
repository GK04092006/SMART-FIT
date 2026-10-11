import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail, Lock, Phone, Eye, EyeOff, ArrowRight, RefreshCw,
  CheckCircle, AlertCircle, ChevronLeft, Loader2, Shield,
  UserRound, Mountain, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';
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

const COUNTRIES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', flag: '🇦🇪', name: 'UAE' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
];

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

/* ── Shared sub-styles ───────────────────────────────────────────────────────── */
const inputStyle = {
  width: '100%',
  height: '48px',
  background: 'rgba(15,23,42,0.6)',
  border: '1.5px solid rgba(255,255,255,0.1)',
  borderRadius: '10px',
  color: 'var(--text-primary, #f1f5f9)',
  fontSize: '0.95rem',
  padding: '0 1rem 0 2.75rem',
  outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: 'var(--text-muted, #94a3b8)',
  marginBottom: '0.4rem',
  letterSpacing: '0.02em',
};

const primaryBtn = (disabled) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.85rem',
  borderRadius: '10px',
  background: disabled
    ? 'rgba(16,185,129,0.35)'
    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  color: '#fff',
  fontWeight: 700,
  fontSize: '0.95rem',
  border: 'none',
  cursor: disabled ? 'not-allowed' : 'pointer',
  boxShadow: disabled ? 'none' : '0 4px 20px rgba(16,185,129,0.4)',
  transition: 'all 0.25s',
  letterSpacing: '0.02em',
});

/* ═══════════════════════════════════════════════════════════════════════════════
   EMAIL / PASSWORD TAB
═══════════════════════════════════════════════════════════════════════════════ */
const EmailTab = ({ expectedRole, onSuccess }) => {
  const { login, logout, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    const result = await login(email.trim(), password);
    if (result.success) {
      if (result.user?.role !== expectedRole) {
        await logout();
        setError(`This account is not registered as a ${expectedRole === 'user' ? 'participant' : expectedRole}.`);
        return;
      }
      onSuccess(result.user);
    } else {
      setError(result.message || 'Login failed. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      {error && <ErrorBanner message={error} />}

      {/* Email */}
      <div>
        <label style={labelStyle}>Email Address</label>
        <div style={{ position: 'relative' }}>
          <Mail size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            id="email-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            style={inputStyle}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
        </div>
        <div style={{ position: 'relative' }}>
          <Lock size={17} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            id="password-input"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            style={{ ...inputStyle, paddingRight: '3rem' }}
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            style={{
              position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex',
            }}
            aria-label={showPwd ? 'Hide password' : 'Show password'}
          >
            {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <button
        id="email-login-btn"
        type="submit"
        disabled={loading}
        style={primaryBtn(loading)}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        {loading ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
    </form>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   PHONE OTP TAB
═══════════════════════════════════════════════════════════════════════════════ */
const PhoneTab = ({ expectedRole, onSuccess }) => {
  const { loginWithPhone, logout } = useAuth();
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [phoneNum, setPhoneNum] = useState('');
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showCountry, setShowCountry] = useState(false);
  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  const fullPhone = `${country.code}${phoneNum.replace(/\D/g, '')}`;

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');
    const digits = phoneNum.replace(/\D/g, '');
    if (digits.length < 7) { setError('Please enter a valid phone number.'); return; }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/phone/send-otp', { phone: fullPhone });
      setDevOtp(data.dev_otp || '');
      setStep('otp');
      setCountdown(RESEND_COOLDOWN);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp]; next[idx] = digit; setOtp(next);
    if (digit && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
    if (e.key === 'Enter' && otp.every(Boolean)) handleVerifyOtp();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
    e.preventDefault();
  };

  const handleVerifyOtp = async () => {
    setError('');
    const otpStr = otp.join('');
    if (otpStr.length < OTP_LENGTH) { setError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const result = await loginWithPhone(fullPhone, otpStr);
      if (result.success) {
        if (result.user?.role !== expectedRole) {
          await logout();
          setError(`This account is not registered as a ${expectedRole === 'user' ? 'participant' : expectedRole}.`);
          return;
        }
        setSuccess('Verified! Redirecting…');
        onSuccess(result.user);
      } else {
        setError(result.message || 'Invalid OTP.');
        setOtp(Array(OTP_LENGTH).fill(''));
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
      }
    } catch (err) {
      setError('Verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      {step === 'phone' && (
        <form onSubmit={handleSendOtp}>
          <label style={labelStyle}>Mobile Number</label>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {/* Country picker */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                id="country-picker"
                onClick={() => setShowCountry((v) => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0 0.85rem', height: '48px', borderRadius: '10px',
                  background: 'rgba(15,23,42,0.6)', border: '1.5px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary, #f1f5f9)', fontWeight: 600, fontSize: '0.88rem',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                <span>{country.flag}</span>
                <span>{country.code}</span>
              </button>
              {showCountry && (
                <div style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 100,
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px', boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  minWidth: 180, overflow: 'hidden', maxHeight: 240, overflowY: 'auto',
                }}>
                  {COUNTRIES.map((c) => (
                    <button
                      key={c.code} type="button"
                      onClick={() => { setCountry(c); setShowCountry(false); }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.6rem 0.9rem',
                        background: country.code === c.code ? 'rgba(16,185,129,0.12)' : 'transparent',
                        border: 'none', color: '#f1f5f9', fontSize: '0.85rem',
                        cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span>{c.flag}</span>
                      <span style={{ fontWeight: 600 }}>{c.code}</span>
                      <span style={{ color: '#94a3b8' }}>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              id="phone-input"
              type="tel"
              placeholder="9876543210"
              value={phoneNum}
              onChange={(e) => setPhoneNum(e.target.value.replace(/[^\d\s\-()+]/g, ''))}
              autoFocus
              style={{ ...inputStyle, flex: 1, paddingLeft: '1rem' }}
            />
          </div>
          <button
            id="send-otp-btn"
            type="submit"
            disabled={loading || phoneNum.replace(/\D/g, '').length < 7}
            style={primaryBtn(loading || phoneNum.replace(/\D/g, '').length < 7)}
          >
            <Phone size={17} />
            {loading ? 'Sending…' : 'Send OTP'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <>
          {devOtp && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24', padding: '0.6rem 1rem', borderRadius: '10px',
              marginBottom: '1.25rem', fontSize: '0.82rem', textAlign: 'center',
              fontFamily: 'monospace', letterSpacing: '0.05em',
            }}>
              🔑 Dev OTP: <strong style={{ fontSize: '1.1rem' }}>{devOtp}</strong>
            </div>
          )}

          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'center' }}>
            Sent to {country.flag} {country.code} {phoneNum}
          </p>

          {/* OTP boxes */}
          <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (otpRefs.current[idx] = el)}
                type="text" inputMode="numeric" maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKey(idx, e)}
                onPaste={idx === 0 ? handleOtpPaste : undefined}
                style={{
                  width: 50, height: 56, textAlign: 'center',
                  fontSize: '1.4rem', fontWeight: 700, letterSpacing: 0,
                  borderRadius: '10px',
                  border: digit ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)',
                  background: digit ? 'rgba(16,185,129,0.07)' : 'rgba(15,23,42,0.6)',
                  color: '#f1f5f9', transition: 'all 0.15s',
                  outline: 'none', padding: 0,
                }}
              />
            ))}
          </div>

          <button
            id="verify-otp-btn"
            type="button"
            onClick={handleVerifyOtp}
            disabled={loading || otp.some((d) => !d)}
            style={primaryBtn(loading || otp.some((d) => !d))}
          >
            <CheckCircle size={17} />
            {loading ? 'Verifying…' : 'Verify & Sign In'}
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button type="button"
              onClick={() => { setStep('phone'); setError(''); setOtp(Array(OTP_LENGTH).fill('')); }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
            >
              <ChevronLeft size={14} /> Change number
            </button>
            <button type="button"
              onClick={countdown > 0 ? undefined : handleSendOtp}
              disabled={countdown > 0 || loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: countdown > 0 ? '#64748b' : '#10b981', fontSize: '0.82rem', fontWeight: 600, cursor: countdown > 0 ? 'default' : 'pointer' }}
            >
              <RefreshCw size={13} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        </>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════════════════════════════════════ */
const ErrorBanner = ({ message }) => (
  <div style={{
    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#f87171', padding: '0.75rem 1rem', borderRadius: '10px',
    marginBottom: '1.1rem', display: 'flex', alignItems: 'flex-start',
    gap: '0.5rem', fontSize: '0.875rem',
  }}>
    <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
    <span>{message}</span>
  </div>
);

const SuccessBanner = ({ message }) => (
  <div style={{
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981', padding: '0.75rem 1rem', borderRadius: '10px',
    marginBottom: '1.1rem', display: 'flex', alignItems: 'center',
    gap: '0.5rem', fontSize: '0.875rem',
  }}>
    <CheckCircle size={16} />
    <span>{message}</span>
  </div>
);

const GoogleButton = ({ onClick, disabled = false, label = 'Continue with Google' }) => (
  <button
    id="google-login-btn"
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: '0.65rem', padding: '0.82rem', borderRadius: '10px',
      background: '#fff', border: '1.5px solid #e2e8f0', color: '#374151',
      fontWeight: 700, fontSize: '0.95rem', cursor: disabled ? 'wait' : 'pointer',
      opacity: disabled ? 0.7 : 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'all 0.2s',
    }}
    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    {label}
  </button>
);

const Divider = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    <span style={{ color: '#475569', fontSize: '0.78rem' }}>or</span>
    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════════
   MAIN LOGIN PAGE
═══════════════════════════════════════════════════════════════════════════════ */
const Login = ({ expectedRole = 'user' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, logout, clearError } = useAuth();
  const roleLabel = expectedRole === 'organizer' ? 'Organizer' : 'Participant';

  // Active tab: 'email' | 'phone'
  const [activeTab, setActiveTab] = useState('email');
  const [googleError, setGoogleError] = useState('');
  const [sessionExpired] = useState(() =>
    new URLSearchParams(location.search).get('session') === 'expired'
  );

  // Where to go after login (support ?redirect= param)
  const redirectAfterLogin = new URLSearchParams(location.search).get('redirect') || '/dashboard';

  const handleSuccess = (user) => {
    clearError();
    // Role-based post-login redirect
    if (user?.role === 'admin') navigate('/analytics', { replace: true });
    else if (user?.role === 'trainer') navigate('/trainer-dashboard', { replace: true });
    else if (user?.role === 'organizer') navigate('/organizer', { replace: true });
    else navigate(decodeURIComponent(redirectAfterLogin), { replace: true });
  };

  const tabStyle = (active) => ({
    flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
    background: active ? 'rgba(16,185,129,0.15)' : 'transparent',
    color: active ? '#10b981' : '#64748b',
    fontWeight: active ? 700 : 500, fontSize: '0.875rem',
    cursor: 'pointer', transition: 'all 0.2s',
    borderBottom: active ? '2px solid #10b981' : '2px solid transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
  });

  const roleLoginOptions = [
    { to: '/participant-login', label: 'Participant', role: 'user', icon: <UserRound size={16} /> },
    { to: '/organizer-login', label: 'Organizer', role: 'organizer', icon: <Mountain size={16} /> },
    { to: '/admin-login', label: 'Admin', role: 'admin', icon: <ShieldCheck size={16} /> },
  ];

  return (
    <>
      {/* Inject spin animation */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        input:focus { border-color: rgba(16,185,129,0.6) !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.12) !important; }
      `}</style>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', padding: '2rem 1rem',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(16,185,129,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.05) 0%, transparent 60%)',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* ── Header ── */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 68, height: 68, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: '0 8px 32px rgba(16,185,129,0.35), 0 0 0 8px rgba(16,185,129,0.08)',
            }}>
              <Shield size={30} color="#fff" />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 0.3rem', letterSpacing: '-0.02em' }}>
              {expectedRole === 'user' ? 'Participant Sign In' : `${roleLabel} Sign In`}
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Sign in to your {roleLabel.toLowerCase()} account
            </p>
          </div>

          <nav aria-label="Choose login role" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem', marginBottom: '1rem' }}>
            {roleLoginOptions.map(({ to, label, role, icon }) => {
              const active = role === expectedRole;
              return (
                <Link
                  key={role}
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  style={{
                    minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                    padding: '0.7rem 0.35rem', borderRadius: '10px',
                    border: `1px solid ${active ? 'rgba(16,185,129,0.55)' : 'rgba(255,255,255,0.1)'}`,
                    background: active ? 'rgba(16,185,129,0.14)' : 'rgba(15,23,42,0.55)',
                    color: active ? '#34d399' : '#94a3b8', fontSize: '0.78rem', fontWeight: 700,
                    textDecoration: 'none', whiteSpace: 'nowrap',
                  }}
                >
                  {icon}{label}
                </Link>
              );
            })}
          </nav>

          {/* Session expired banner */}
          {sessionExpired && (
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24', padding: '0.7rem 1rem', borderRadius: '10px',
              marginBottom: '1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <AlertCircle size={15} /> Your session expired. Please sign in again.
            </div>
          )}

          {/* ── Card ── */}
          <div style={{
            background: 'rgba(15,23,42,0.75)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
            padding: '2rem',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}>

            {/* Tab switcher */}
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px',
              padding: '4px', marginBottom: '1.5rem', gap: '2px',
            }}>
              <button id="tab-email" style={tabStyle(activeTab === 'email')} onClick={() => setActiveTab('email')}>
                <Mail size={15} /> Email
              </button>
              <button id="tab-phone" style={tabStyle(activeTab === 'phone')} onClick={() => setActiveTab('phone')}>
                <Phone size={15} /> Phone OTP
              </button>
            </div>

            {/* Tab content */}
            {activeTab === 'email' && <EmailTab expectedRole={expectedRole} onSuccess={handleSuccess} />}
            {activeTab === 'phone' && <PhoneTab expectedRole={expectedRole} onSuccess={handleSuccess} />}

            {/* Google — shown in both tabs */}
            <Divider />
            {googleError && <ErrorBanner message={googleError} />}
            <GoogleOAuthButton
              role={expectedRole}
              label="Continue with Google"
              loginWithGoogle={loginWithGoogle}
              onSuccess={handleSuccess}
              onError={setGoogleError}
            />
          </div>

          {/* ── Footer ── */}
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem' }}>
            {expectedRole === 'user' ? 'New here? ' : 'Looking for another role? '}
            {expectedRole === 'user' && <>
              <Link to="/register" style={{ color: '#10b981', fontWeight: 700, textDecoration: 'none' }}>
                Create an account
              </Link>
              {' · '}
            </>}
            <Link to={expectedRole === 'organizer' ? '/participant-login' : '/organizer-login'} style={{ color: '#64748b', textDecoration: 'none' }}>
              {expectedRole === 'organizer' ? 'Participant login' : 'Organizer login'}
            </Link>
            {' · '}
            <Link to="/admin-login" style={{ color: '#64748b', textDecoration: 'none' }}>
              Admin login
            </Link>
          </p>
        </div>
      </div>
    </>
  );
};

export default Login;
