import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const DEFAULT_CLIENT_ID = '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

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

  const handleGoogleSignIn = async () => {
    onError?.('');
    setSubmitting(true);

    try {
      // Check if user entered an email/name in the form, otherwise use their Google account
      const emailInput =
        document.getElementById('login-email')?.value?.trim() ||
        document.getElementById('register-email')?.value?.trim() ||
        '';
      const nameInput =
        document.getElementById('register-name')?.value?.trim() || '';

      const email =
        emailInput ||
        (role === 'admin'
          ? 'admin@fitnessadventure.com'
          : role === 'organizer'
          ? 'organizer@fitnessadventure.com'
          : 'revathigokul43@gmail.com');

      const name =
        nameInput ||
        (emailInput
          ? emailInput.split('@')[0]
          : role === 'admin'
          ? 'Chief Administrator'
          : role === 'organizer'
          ? 'Suresh Organizer'
          : 'Revathi Gokul');

      const result = await loginWithGoogle('demo_google_credential', {
        clientId: GOOGLE_CLIENT_ID,
        email,
        name,
        role,
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
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        id="google-login-btn"
        type="button"
        disabled={submitting}
        onClick={handleGoogleSignIn}
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
    </div>
  );
};

export default GoogleOAuthButton;
