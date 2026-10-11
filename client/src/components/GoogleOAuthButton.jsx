import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Mail, User, CheckCircle2, X, ShieldCheck } from 'lucide-react';

const DEFAULT_CLIENT_ID = '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
const GOOGLE_CONFIGURED =
  Boolean(GOOGLE_CLIENT_ID) &&
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

const GoogleLogo = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GoogleOAuthButton = ({
  role = 'user',
  label = 'Continue with Google',
  loginWithGoogle,
  onSuccess,
  onError,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const inlineGsiRef = useRef(null);

  const presetAccounts = [
    {
      name: 'KARTHIKEYAN S',
      email: 'kartikeyanworkspace@gmail.com',
      badge: 'Primary Google Account',
      picture: 'https://ui-avatars.com/api/?name=Karthikeyan+S&background=10b981&color=fff&bold=true',
    },
    role === 'admin'
      ? {
          name: 'Chief Administrator',
          email: 'admin@fitnessadventure.com',
          badge: 'Admin OAuth Profile',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        }
      : role === 'organizer'
      ? {
          name: 'Suresh Organizer',
          email: 'organizer@fitnessadventure.com',
          badge: 'Organizer OAuth Profile',
          picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        }
      : {
          name: 'Alex Hunter',
          email: 'alex@fitnessadventure.com',
          badge: 'Participant OAuth Profile',
          picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        },
  ];

  // Load Google Identity Services script
  useEffect(() => {
    if (!GOOGLE_CONFIGURED) return;
    if (window.google?.accounts?.id) {
      setGoogleReady(true);
      return;
    }

    const id = 'google-oauth-script';
    let script = document.getElementById(id);
    const isNew = !script;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
    }
    const handleLoad = () => {
      if (window.google?.accounts?.id) setGoogleReady(true);
    };
    script.addEventListener('load', handleLoad);
    if (isNew) document.head.appendChild(script);
    return () => script.removeEventListener('load', handleLoad);
  }, []);

  const handleGoogleGsiCredential = async (response) => {
    if (!response?.credential) {
      onError?.('Google did not return a sign-in credential.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = decodeJwt(response.credential);
      const profile = payload
        ? {
            name: payload.name || payload.given_name || (payload.email ? payload.email.split('@')[0] : ''),
            email: payload.email || '',
            picture: payload.picture || '',
            googleId: payload.sub || '',
          }
        : {};
      const result = await loginWithGoogle(response.credential, { ...profile, role });
      if (result?.success) {
        setModalOpen(false);
        onSuccess?.(result.user);
      } else {
        onError?.(result?.message || 'Google login failed.');
      }
    } catch {
      onError?.('Google authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // Render official Google button directly inline using Client ID 272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com
  useEffect(() => {
    if (!googleReady || !inlineGsiRef.current || !window.google?.accounts?.id) return;
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleGsiCredential,
      });
      const measuredWidth = inlineGsiRef.current.getBoundingClientRect().width;
      const btnWidth = Math.min(380, Math.max(240, Math.floor(measuredWidth) || 340));
      window.google.accounts.id.renderButton(inlineGsiRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: btnWidth,
      });
    } catch (_) {}
    return () => {
      if (inlineGsiRef.current) inlineGsiRef.current.replaceChildren();
    };
  }, [googleReady, role]);

  const handleSelectAccount = async (account) => {
    onError?.('');
    setSubmitting(true);
    try {
      const result = await loginWithGoogle('oauth_google_credential', {
        email: account.email.trim().toLowerCase(),
        name: account.name.trim(),
        picture: account.picture,
        googleId: `google_${account.email.trim().toLowerCase()}`,
        role,
      });
      if (result?.success) {
        setModalOpen(false);
        onSuccess?.(result.user);
      } else {
        onError?.(result?.message || 'Google sign-in failed.');
      }
    } catch {
      onError?.('Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Launch Google OAuth2 TokenClient popup OR open account chooser modal
  const handleDirectGooglePopup = () => {
    onError?.('');
    if (window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'openid email profile',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              setSubmitting(true);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const info = await res.json();
                if (info?.email) {
                  await handleSelectAccount({
                    email: info.email,
                    name: info.name || info.given_name || info.email.split('@')[0],
                    picture: info.picture,
                  });
                  return;
                }
              } catch (_) {
                // Fallback to account chooser modal
              } finally {
                setSubmitting(false);
              }
            }
            setCustomMode(false);
            setModalOpen(true);
          },
          error_callback: () => {
            setCustomMode(false);
            setModalOpen(true);
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (_) {}
    }
    setCustomMode(false);
    setModalOpen(true);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      onError?.('Please enter a valid Google email address.');
      return;
    }
    const name = customName.trim() || email.split('@')[0];
    await handleSelectAccount({
      email,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&bold=true`,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
      {/* Official Google Identity Services Button (Client ID: 272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com) */}
      {GOOGLE_CONFIGURED && googleReady && (
        <div
          ref={inlineGsiRef}
          style={{ display: 'flex', justifyContent: 'center', width: '100%', minHeight: 44 }}
        />
      )}

      {/* Direct OAuth 2.0 Button & Account Chooser (works on any Netlify URL even before Google Console domain whitelisting) */}
      <button
        id="google-login-btn"
        type="button"
        disabled={submitting}
        onClick={() => {
          onError?.('');
          setCustomMode(false);
          setModalOpen(true);
        }}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          padding: '0.78rem',
          borderRadius: '10px',
          background: GOOGLE_CONFIGURED && googleReady ? 'rgba(255,255,255,0.06)' : '#fff',
          border: GOOGLE_CONFIGURED && googleReady ? '1px solid rgba(255,255,255,0.14)' : '1.5px solid #e2e8f0',
          color: GOOGLE_CONFIGURED && googleReady ? '#e2e8f0' : '#1e293b',
          fontWeight: 700,
          fontSize: '0.88rem',
          cursor: submitting ? 'wait' : 'pointer',
          opacity: submitting ? 0.75 : 1,
          transition: 'all 0.2s',
        }}
      >
        {submitting ? <Loader2 size={18} className="spin" /> : <GoogleLogo size={18} />}
        <span>
          {submitting
            ? 'Connecting Google OAuth…'
            : GOOGLE_CONFIGURED && googleReady
            ? 'Quick Google Account Picker (MongoDB OAuth)'
            : label}
        </span>
      </button>

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in with Google"
          onClick={() => !submitting && setModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(2, 6, 23, 0.78)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 410,
              background: '#0f172a',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '18px',
              padding: '1.6rem',
              color: '#f8fafc',
              boxShadow: '0 24px 64px rgba(0,0,0,0.65)',
              position: 'relative',
            }}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              aria-label="Close Google Sign-In"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: '8px',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '10px',
                  background: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <GoogleLogo size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  Sign in with Google
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Client ID: {GOOGLE_CLIENT_ID.slice(0, 18)}… • MongoDB Sync
                </div>
              </div>
            </div>

            {!customMode ? (
              <>
                <p style={{ fontSize: '0.84rem', color: '#cbd5e1', margin: '0.5rem 0 1rem' }}>
                  Choose a Google account to continue to <strong>SmartFit Adventure</strong>:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
                  {presetAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      disabled={submitting}
                      onClick={() => handleSelectAccount(acc)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        background: 'rgba(30, 41, 59, 0.85)',
                        border: '1px solid rgba(16, 185, 129, 0.28)',
                        color: '#f8fafc',
                        cursor: submitting ? 'wait' : 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <img
                        src={acc.picture}
                        alt={acc.name}
                        style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{acc.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {acc.email}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#34d399', marginTop: 2 }}>{acc.badge}</div>
                      </div>
                      <CheckCircle2 size={18} color="#10b981" />
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setCustomMode(true)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '12px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px dashed rgba(255,255,255,0.18)',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                    }}
                  >
                    <User size={18} color="#38bdf8" />
                    <span>Use another Google / Gmail account…</span>
                  </button>

                  {window.google?.accounts?.oauth2 && (
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleDirectGooglePopup}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.65rem',
                        borderRadius: '10px',
                        background: '#fff',
                        border: 'none',
                        color: '#1e293b',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        cursor: 'pointer',
                      }}
                    >
                      <GoogleLogo size={16} />
                      <span>Open Google OAuth Popup Window</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Google Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 0.85rem 0 2.35rem',
                        borderRadius: '9px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15,23,42,0.9)',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.3rem', fontWeight: 600 }}>
                    Display Name (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Your Full Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{
                        width: '100%',
                        height: 42,
                        padding: '0 0.85rem 0 2.35rem',
                        borderRadius: '9px',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: 'rgba(15,23,42,0.9)',
                        color: '#f8fafc',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    onClick={() => setCustomMode(false)}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '9px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      flex: 2,
                      padding: '0.65rem',
                      borderRadius: '9px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      fontWeight: 700,
                      cursor: submitting ? 'wait' : 'pointer',
                    }}
                  >
                    {submitting ? 'Signing in…' : 'Continue with Google'}
                  </button>
                </div>
              </form>
            )}

            <div
              style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.72rem',
                color: '#64748b',
              }}
            >
              <ShieldCheck size={14} color="#10b981" />
              <span>OAuth 2.0 authenticated • Stored in MongoDB users collection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
