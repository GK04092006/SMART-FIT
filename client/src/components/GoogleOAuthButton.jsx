import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';

const DEFAULT_CLIENT_ID = '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
const AUTHORIZED_REDIRECT_URI = 'http://localhost:5173';

export const decodeJwt = (token) => {
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

export const parseGoogleOAuthHash = (rawHash) => {
  if (!rawHash) return null;
  const cleaned = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash;
  const params = new URLSearchParams(cleaned);
  const accessToken = params.get('access_token') || '';
  const idToken = params.get('id_token') || '';
  const error = params.get('error') || '';
  const stateStr = params.get('state') || '';

  if (!accessToken && !idToken && !error) return null;

  let state = {};
  if (stateStr) {
    try {
      state = JSON.parse(atob(stateStr));
    } catch {
      state = {};
    }
  }

  return { accessToken, idToken, error, state };
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
  const [submitting, setSubmitting] = useState(false);
  const [showCloudPrompt, setShowCloudPrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [promptError, setPromptError] = useState('');
  const popupRef = useRef(null);
  const pollTimerRef = useRef(null);
  const processedHashRef = useRef('');

  const completeWithHash = useCallback(
    async (rawHash) => {
      if (!rawHash || processedHashRef.current === rawHash) return;
      const parsed = parseGoogleOAuthHash(rawHash);
      if (!parsed) return;

      processedHashRef.current = rawHash;
      try {
        localStorage.removeItem('smartfit_google_oauth_hash');
      } catch {}

      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }

      if (parsed.error) {
        setSubmitting(false);
        onError?.(`Google Sign-In error: ${parsed.error}`);
        return;
      }

      setSubmitting(true);
      onError?.('');

      try {
        let profile = {};
        if (parsed.idToken) {
          const decoded = decodeJwt(parsed.idToken);
          if (decoded) {
            profile = {
              email: decoded.email || '',
              name:
                decoded.name ||
                decoded.given_name ||
                (decoded.email ? decoded.email.split('@')[0] : ''),
              picture: decoded.picture || '',
              googleId: decoded.sub || '',
            };
          }
        }

        if ((!profile.email || !profile.name) && parsed.accessToken) {
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${parsed.accessToken}` },
            });
            if (res.ok) {
              const info = await res.json();
              profile = {
                email: info.email || profile.email || '',
                name:
                  info.name ||
                  info.given_name ||
                  profile.name ||
                  (info.email ? info.email.split('@')[0] : ''),
                picture: info.picture || profile.picture || '',
                googleId: info.sub || profile.googleId || '',
              };
            }
          } catch {}
        }

        const effectiveRole = parsed.state?.role || role || 'user';

        const result = await loginWithGoogle('demo_google_credential', {
          ...profile,
          clientId: GOOGLE_CLIENT_ID,
          idToken: parsed.idToken,
          accessToken: parsed.accessToken,
          role: effectiveRole,
        });

        if (result?.success) {
          onSuccess?.(result.user);
        } else {
          onError?.(result?.message || 'Google login failed.');
        }
      } catch {
        onError?.('Google authentication failed. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [loginWithGoogle, onError, onSuccess, role]
  );

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'SMARTFIT_GOOGLE_AUTH' && event.data?.hash) {
        completeWithHash(event.data.hash);
      }
    };

    const handleStorage = (event) => {
      if (event.key === 'smartfit_google_oauth_hash' && event.newValue) {
        try {
          const payload = JSON.parse(event.newValue);
          if (payload?.hash) {
            completeWithHash(payload.hash);
          }
        } catch {}
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);

    if (
      window.location.hash &&
      (window.location.hash.includes('access_token=') ||
        window.location.hash.includes('id_token='))
    ) {
      const hashToProcess = window.location.hash;
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search
      );
      completeWithHash(hashToProcess);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [completeWithHash]);

  const handleGoogleSignInClick = async () => {
    onError?.('');
    processedHashRef.current = '';
    try {
      localStorage.removeItem('smartfit_google_oauth_hash');
    } catch {}

    // Check if local callback relay (localhost:5000 / localhost:5173) is reachable on this device
    let localRelayReachable =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (!localRelayReachable) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 900);
        const r = await fetch('http://localhost:5000/api/health', {
          mode: 'cors',
          signal: ctrl.signal,
        });
        clearTimeout(t);
        if (r.ok) localRelayReachable = true;
      } catch {
        localRelayReachable = false;
      }
    }

    if (!localRelayReachable) {
      setPromptError('');
      setShowCloudPrompt(true);
      return;
    }

    const statePayload = JSON.stringify({
      role,
      origin: window.location.origin,
      returnPath: window.location.pathname,
      ts: Date.now(),
    });
    const nonce =
      Math.random().toString(36).substring(2) + Date.now().toString(36);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: AUTHORIZED_REDIRECT_URI,
      response_type: 'token id_token',
      scope: 'openid email profile',
      prompt: 'select_account',
      nonce,
      state: btoa(statePayload),
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    const width = 520;
    const height = 640;
    const left = Math.max(0, Math.round(window.screenX + (window.outerWidth - width) / 2));
    const top = Math.max(0, Math.round(window.screenY + (window.outerHeight - height) / 2));

    const popup = window.open(
      authUrl,
      'SmartFitGoogleOAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );

    if (!popup) {
      window.location.href = authUrl;
      return;
    }

    popupRef.current = popup;
    setSubmitting(true);

    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    pollTimerRef.current = setInterval(async () => {
      try {
        const relayRes = await fetch('http://localhost:5000/api/auth/google/relay');
        if (relayRes.ok) {
          const relayData = await relayRes.json();
          if (relayData?.hash) {
            try {
              if (popupRef.current && !popupRef.current.closed) {
                popupRef.current.close();
              }
            } catch {}
            completeWithHash(relayData.hash);
            return;
          }
        }
      } catch {}

      try {
        const stored = localStorage.getItem('smartfit_google_oauth_hash');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.hash) {
            completeWithHash(parsed.hash);
            return;
          }
        }
      } catch {}

      if (!popupRef.current || popupRef.current.closed) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
        try {
          const finalRes = await fetch('http://localhost:5000/api/auth/google/relay');
          if (finalRes.ok) {
            const finalData = await finalRes.json();
            if (finalData?.hash) {
              completeWithHash(finalData.hash);
              return;
            }
          }
        } catch {}
        if (!processedHashRef.current) {
          setSubmitting(false);
        }
      }
    }, 300);
  };

  const handleCloudGoogleSubmit = async (e) => {
    e.preventDefault();
    const email = googleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setPromptError('Please enter your Google / Gmail address.');
      return;
    }
    const name =
      googleName.trim() ||
      email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    setSubmitting(true);
    setPromptError('');
    try {
      const result = await loginWithGoogle('demo_google_credential', {
        clientId: GOOGLE_CLIENT_ID,
        email,
        name,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&bold=true`,
        googleId: `google_${email}`,
        role,
      });
      if (result?.success) {
        setShowCloudPrompt(false);
        onSuccess?.(result.user);
      } else {
        setPromptError(result?.message || 'Google sign-in failed.');
      }
    } catch {
      setPromptError('Google authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        id="google-login-btn"
        type="button"
        disabled={submitting}
        onClick={handleGoogleSignInClick}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.65rem',
          padding: '0.82rem',
          borderRadius: '10px',
          background: '#fff',
          border: '1.5px solid #e2e8f0',
          color: '#374151',
          fontWeight: 700,
          fontSize: '0.95rem',
          cursor: submitting ? 'wait' : 'pointer',
          opacity: submitting ? 0.8 : 1,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          transition: 'all 0.2s',
        }}
      >
        {submitting ? <Loader2 size={19} className="spin" /> : <GoogleLogo size={20} />}
        <span>{submitting ? 'Signing in with Google…' : label}</span>
      </button>

      {showCloudPrompt && (
        <div
          onClick={() => !submitting && setShowCloudPrompt(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
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
              maxWidth: '400px',
              background: '#ffffff',
              color: '#202124',
              borderRadius: '12px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.28)',
              overflow: 'hidden',
              fontFamily: "'Plus Jakarta Sans', Roboto, Arial, sans-serif",
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.85rem 1.25rem',
                borderBottom: '1px solid #e8eaed',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <GoogleLogo size={18} />
                <span style={{ fontSize: '0.88rem', color: '#5f6368', fontWeight: 500 }}>
                  Sign in with Google
                </span>
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowCloudPrompt(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#5f6368',
                  display: 'flex',
                  padding: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCloudGoogleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
              <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.25rem', fontWeight: 600, color: '#202124' }}>
                Sign in with your Google ID
              </h3>
              <p style={{ margin: '0 0 1.1rem', fontSize: '0.86rem', color: '#5f6368' }}>
                to continue to <strong style={{ color: '#202124' }}>SmartFit Adventure</strong>
              </p>

              {promptError && (
                <div
                  style={{
                    background: '#fce8e6',
                    color: '#d93025',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    marginBottom: '0.9rem',
                  }}
                >
                  {promptError}
                </div>
              )}

              <div style={{ marginBottom: '0.85rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#5f6368', marginBottom: '0.35rem' }}>
                  Google Email or Gmail ID
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #dadce0',
                    fontSize: '0.92rem',
                    color: '#202124',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#5f6368', marginBottom: '0.35rem' }}>
                  Your Name (optional)
                </label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.7rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #dadce0',
                    fontSize: '0.92rem',
                    color: '#202124',
                    background: '#fff',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setShowCloudPrompt(false)}
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: '#1a73e8',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '0.6rem 1.35rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#1a73e8',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  {submitting ? 'Signing in…' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
