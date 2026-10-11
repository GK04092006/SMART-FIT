import React, { useState, useEffect } from 'react';
import { Loader2, UserPlus, X, ArrowLeft } from 'lucide-react';
import API from '../services/api';

const DEFAULT_CLIENT_ID = '272521297941-qis4ot0k4a9k9ll0sv1h7heal54ule9f.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
const SAVED_ACCOUNTS_KEY = 'smartfit_google_accounts_v3';

const DEFAULT_GOOGLE_ACCOUNTS = [
  {
    email: '24104011@nec.edu.in',
    name: 'KARTHIKEYAN S CSE-2024',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocJOaTY8jPYo_Z76nG7XdnYRt2It8gcBBvM4s0wsD7PVDPaIq73f=s96-c',
  },
  {
    email: 'kartikeyanworkspace@gmail.com',
    name: 'KARTHIKEYAN S',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocISvElxRKNyiDB67wMdUly_4s1ZInCCKda-4XH7eVXdAfv3Ag=s96-c',
  },
  {
    email: 'revathigokul43@gmail.com',
    name: 'Gokul Revathi',
    picture: 'https://ui-avatars.com/api/?name=Gokul+Revathi&background=4285F4&color=fff&bold=true',
  },
  {
    email: '24104125@nec.edu.in',
    name: 'RAGHAVAN P CSE-2024',
    picture: 'https://lh3.googleusercontent.com/a/ACg8ocK0whZQKpNZ0CTwnBExijUaiHymTP7uGBOkGWwiHZe2NEcnFoIu=s96-c',
  },
];

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

const mergeUniqueAccounts = (...lists) => {
  const seen = new Set();
  const result = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const acc of list) {
      const email = acc?.email?.trim()?.toLowerCase();
      if (!email || seen.has(email)) continue;
      seen.add(email);
      const name =
        acc.name?.trim() ||
        email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      result.push({
        email,
        name,
        picture:
          acc.picture ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&bold=true`,
      });
    }
  }
  return result;
};

const getSavedAccounts = () => {
  try {
    const raw = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    const saved = raw ? JSON.parse(raw) : [];
    return mergeUniqueAccounts(saved, DEFAULT_GOOGLE_ACCOUNTS);
  } catch {
    return DEFAULT_GOOGLE_ACCOUNTS;
  }
};

const saveCustomAccount = (account) => {
  try {
    const updated = mergeUniqueAccounts([account], getSavedAccounts());
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(updated));
  } catch {}
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
  const [showChooser, setShowChooser] = useState(false);
  const [addingAccount, setAddingAccount] = useState(false);
  const [accounts, setAccounts] = useState(getSavedAccounts);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (!showChooser) return;
    let active = true;
    API.get('/auth/google/accounts')
      .then(({ data }) => {
        if (active && Array.isArray(data?.accounts)) {
          setAccounts((prev) => mergeUniqueAccounts(prev, data.accounts));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [showChooser]);

  const openAccountChooser = () => {
    onError?.('');
    setModalError('');
    setAccounts(getSavedAccounts());
    setAddingAccount(false);
    setShowChooser(true);
  };

  const handleSelectAccount = async (account) => {
    if (submitting) return;
    setModalError('');
    onError?.('');
    setSelectedEmail(account.email);
    setSubmitting(true);

    try {
      const email = account.email.trim().toLowerCase();
      const name =
        account.name?.trim() ||
        email
          .split('@')[0]
          .replace(/[._-]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase());
      const picture =
        account.picture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&bold=true`;

      saveCustomAccount({ email, name, picture });

      const result = await loginWithGoogle('demo_google_credential', {
        clientId: GOOGLE_CLIENT_ID,
        email,
        name,
        picture,
        googleId: `google_${email}`,
        role,
      });

      if (result?.success) {
        setShowChooser(false);
        onSuccess?.(result.user);
      } else {
        const msg = result?.message || 'Google sign-in failed.';
        setModalError(msg);
        onError?.(msg);
      }
    } catch {
      const msg = 'Google authentication failed. Please try again.';
      setModalError(msg);
      onError?.(msg);
    } finally {
      setSubmitting(false);
      setSelectedEmail('');
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setModalError('Please enter a valid Google email address.');
      return;
    }
    const name =
      customName.trim() ||
      email
        .split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

    await handleSelectAccount({
      email,
      name,
      picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&bold=true`,
    });
  };

  return (
    <div style={{ width: '100%' }}>
      <button
        id="google-login-btn"
        type="button"
        disabled={submitting}
        onClick={openAccountChooser}
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

      {showChooser && (
        <div
          onClick={() => !submitting && setShowChooser(false)}
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
              maxWidth: '420px',
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
                onClick={() => setShowChooser(false)}
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

            <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
              {!addingAccount ? (
                <>
                  <h3
                    style={{
                      margin: '0 0 0.35rem',
                      fontSize: '1.35rem',
                      fontWeight: 600,
                      color: '#202124',
                      textAlign: 'center',
                    }}
                  >
                    Choose an account
                  </h3>
                  <p
                    style={{
                      margin: '0 0 1.25rem',
                      fontSize: '0.9rem',
                      color: '#5f6368',
                      textAlign: 'center',
                    }}
                  >
                    to continue to <strong style={{ color: '#202124' }}>SmartFit Adventure</strong>
                  </p>

                  {modalError && (
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
                      {modalError}
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid #e8eaed', maxHeight: '260px', overflowY: 'auto' }}>
                    {accounts.map((acc) => {
                      const isRowSubmitting = submitting && selectedEmail === acc.email;
                      return (
                        <button
                          key={acc.email}
                          type="button"
                          disabled={submitting}
                          onClick={() => handleSelectAccount(acc)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.85rem',
                            width: '100%',
                            padding: '0.75rem 0.65rem',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px solid #e8eaed',
                            cursor: submitting ? 'wait' : 'pointer',
                            textAlign: 'left',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            if (!submitting) e.currentTarget.style.background = '#f8f9fa';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          <img
                            src={acc.picture}
                            alt={acc.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(acc.name || acc.email)}&background=4285F4&color=fff&bold=true`;
                            }}
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '50%',
                              objectFit: 'cover',
                              flexShrink: 0,
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.92rem',
                                fontWeight: 600,
                                color: '#202124',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {acc.name}
                            </div>
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: '#5f6368',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {acc.email}
                            </div>
                          </div>
                          {isRowSubmitting && <Loader2 size={16} className="spin" color="#1a73e8" />}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => {
                        setModalError('');
                        setAddingAccount(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        width: '100%',
                        padding: '0.85rem 0.65rem',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '1px solid #e8eaed',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color: '#3c4043',
                        fontWeight: 500,
                        fontSize: '0.9rem',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#5f6368',
                        }}
                      >
                        <UserPlus size={19} />
                      </div>
                      <span>Use another account</span>
                    </button>
                  </div>
                </>
              ) : (
                <form onSubmit={handleCustomSubmit}>
                  <button
                    type="button"
                    onClick={() => {
                      setModalError('');
                      setAddingAccount(false);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'none',
                      border: 'none',
                      color: '#1a73e8',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: '0.85rem',
                    }}
                  >
                    <ArrowLeft size={15} /> Back to accounts
                  </button>

                  <h3
                    style={{
                      margin: '0 0 0.35rem',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#202124',
                    }}
                  >
                    Sign in with Google
                  </h3>
                  <p style={{ margin: '0 0 1.1rem', fontSize: '0.86rem', color: '#5f6368' }}>
                    Enter your Google email to continue to SmartFit Adventure
                  </p>

                  {modalError && (
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
                      {modalError}
                    </div>
                  )}

                  <div style={{ marginBottom: '0.85rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#5f6368',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Google Email or Gmail ID
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #dadce0',
                        fontSize: '0.92rem',
                        color: '#202124',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#5f6368',
                        marginBottom: '0.35rem',
                      }}
                    >
                      Display Name (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.7rem 0.85rem',
                        borderRadius: '6px',
                        border: '1px solid #dadce0',
                        fontSize: '0.92rem',
                        color: '#202124',
                        background: '#fff',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem' }}>
                    <button
                      type="button"
                      onClick={() => setAddingAccount(false)}
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleOAuthButton;
