import React, { useState, useEffect } from 'react';
import {
  Palette, Globe, MessageSquare, Link2, Check, CheckCircle2,
  Sparkles, Bell, Mail, Phone, Shield, Smartphone, ExternalLink,
  RefreshCw, Save, AlertCircle, Info, Zap, X
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

const SETTINGS_STORAGE_KEY = 'smartfit_settings';

const readStoredSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistStoredSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota or browser privacy errors.
  }
};

const Settings = () => {
  const { theme, setTheme, themes } = useTheme();
  const { language, setLanguage, languages, t } = useLanguage();
  const { user, refreshCurrentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('appearance');
  const [saveStatus, setSaveStatus] = useState({ state: 'idle', message: '' });
  const [testModal, setTestModal] = useState({ open: false, channel: '', preview: '', loading: false, success: null });
  const [linkModal, setLinkModal] = useState({ open: false, service: null, accountName: '' });

  // Communication settings state
  const [communication, setCommunication] = useState({
    whatsapp: {
      enabled: true,
      phone: user?.phone || '+91 98765 43210',
      bookingAlerts: true,
      weatherAlerts: true,
      workoutReminders: false,
    },
    email: {
      enabled: true,
      email: user?.email || 'athlete@example.com',
      weeklyDigest: true,
      itineraryUpdates: true,
      achievementBadges: true,
    },
    sms: {
      enabled: true,
      phone: user?.phone || '+91 98765 43210',
      sosAlerts: true,
      departureChanges: true,
    },
  });

  // Multiple Linked Accounts state
  const [linkedAccounts, setLinkedAccounts] = useState({
    google: { connected: Boolean(user?.googleId || user?.email?.includes('gmail')), id: user?.email || 'user@gmail.com', lastSync: '10 mins ago' },
    apple:  { connected: false, id: '', lastSync: '—' },
    strava: { connected: false, id: '', lastSync: '—' },
    garmin: { connected: false, id: '', lastSync: '—' },
    whatsapp: { connected: Boolean(user?.phone), id: user?.phone || '', lastSync: 'Real-time active' },
    github: { connected: false, id: '', lastSync: '—' },
  });

  // Load existing settings from server on mount
  useEffect(() => {
    API.get('/profile/settings')
      .then(({ data }) => {
        if (data.settings) {
          if (data.settings.theme) setTheme(data.settings.theme);
          if (data.settings.language) setLanguage(data.settings.language);
          if (data.settings.communication) {
            setCommunication(prev => {
              const waPhone = data.settings.communication.whatsapp?.phone || user?.phone || prev.whatsapp.phone || '+91 98765 43210';
              const smsPhone = data.settings.communication.sms?.phone || user?.phone || prev.sms.phone || waPhone;
              const emailVal = data.settings.communication.email?.email || user?.email || prev.email.email || 'athlete@example.com';
              return {
                whatsapp: { ...prev.whatsapp, ...(data.settings.communication.whatsapp || {}), phone: waPhone },
                email:    { ...prev.email,    ...(data.settings.communication.email || {}), email: emailVal },
                sms:      { ...prev.sms,      ...(data.settings.communication.sms || {}), phone: smsPhone },
              };
            });
          }
          if (data.settings.linkedAccounts) {
            setLinkedAccounts(prev => ({ ...prev, ...data.settings.linkedAccounts }));
          }
        }
      })
      .catch(() => {
        // Offline / demo fallback uses existing state
      });
  }, [user]);

  // Sync user profile fields if communication fields are empty
  useEffect(() => {
    if (user) {
      setCommunication(prev => {
        const fallbackPh = user.phone || '+91 98765 43210';
        return {
          whatsapp: {
            ...prev.whatsapp,
            phone: prev.whatsapp.phone || fallbackPh,
          },
          email: {
            ...prev.email,
            email: prev.email.email || user.email || 'athlete@example.com',
          },
          sms: {
            ...prev.sms,
            phone: prev.sms.phone || fallbackPh,
          },
        };
      });
    }
  }, [user]);

  // Save all settings handler
  const handleSaveSettings = async () => {
    setSaveStatus({ state: 'saving', message: 'Saving your preferences...' });
    try {
      const sanitizedComm = {
        whatsapp: {
          ...communication.whatsapp,
          phone: communication.whatsapp.phone || user?.phone || '+91 98765 43210',
        },
        email: {
          ...communication.email,
          email: communication.email.email || user?.email || 'athlete@example.com',
        },
        sms: {
          ...communication.sms,
          phone: communication.sms.phone || communication.whatsapp.phone || user?.phone || '+91 98765 43210',
        },
      };
      await API.put('/profile/settings', {
        theme,
        language,
        communication: sanitizedComm,
        linkedAccounts,
      });
      persistStoredSettings({ theme, language, communication: sanitizedComm, linkedAccounts });
      if (refreshCurrentUser) await refreshCurrentUser();
      setSaveStatus({ state: 'success', message: t('btn_saved_success', 'Settings updated successfully!') });
      setTimeout(() => setSaveStatus({ state: 'idle', message: '' }), 4000);
    } catch (error) {
      setSaveStatus({
        state: 'error',
        message: error.response?.data?.message || 'Could not save settings to the server. Please try again.',
      });
      setTimeout(() => setSaveStatus({ state: 'idle', message: '' }), 4000);
    }
  };

  // Test communication alert trigger
  const handleSendTest = async (channel) => {
    const rawTarget =
      channel === 'email'
        ? communication.email.email || user?.email
        : communication[channel]?.phone || communication.whatsapp?.phone || communication.sms?.phone || user?.phone;
    const target = (rawTarget && rawTarget.trim()) || (channel === 'email' ? 'athlete@example.com' : '+91 98765 43210');

    // Ensure state displays this target so input is never confusingly empty
    if (channel === 'whatsapp' && !communication.whatsapp.phone) {
      setCommunication(prev => ({ ...prev, whatsapp: { ...prev.whatsapp, phone: target } }));
    } else if (channel === 'sms' && !communication.sms.phone) {
      setCommunication(prev => ({ ...prev, sms: { ...prev.sms, phone: target } }));
    } else if (channel === 'email' && !communication.email.email) {
      setCommunication(prev => ({ ...prev, email: { ...prev.email, email: target } }));
    }

    setTestModal({ open: true, channel, preview: '', loading: true, success: null });
    try {
      const { data } = await API.post('/profile/communication/test', { channel, target });
      setTestModal({
        open: true,
        channel,
        preview: data.success ? data.message : data.message || 'The provider did not send the test message.',
        loading: false,
        success: Boolean(data.success),
      });
    } catch (error) {
      setTestModal({
        open: true,
        channel,
        preview: error.response?.data?.message || 'Could not contact the server to send this test message.',
        loading: false,
        success: false,
      });
    }
  };

  // Connect or disconnect service
  const handleToggleService = (key) => {
    const current = linkedAccounts[key];
    if (current?.connected) {
      if (window.confirm(`Disconnect ${key.toUpperCase()} account?`)) {
        setLinkedAccounts(prev => ({
          ...prev,
          [key]: { connected: false, id: '', lastSync: '—' },
        }));
      }
    } else {
      setLinkModal({ open: true, service: key, accountName: '' });
    }
  };

  const confirmLinkService = () => {
    if (!linkModal.service) return;
    const key = linkModal.service;
    const identifier = linkModal.accountName.trim() || `${user?.name?.toLowerCase().replace(/\s+/g, '_') || 'adventurer'}_active`;
    setLinkedAccounts(prev => ({
      ...prev,
      [key]: {
        connected: true,
        id: identifier,
        lastSync: 'Just now (Synced)',
      },
    }));
    setLinkModal({ open: false, service: null, accountName: '' });
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem 2rem 6rem 2rem', maxWidth: '1000px', flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.85rem', marginBottom: '0.35rem', fontWeight: 800 }}>
                ⚙️ {t('settings_title', 'Settings & Preferences')}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                {t('settings_subtitle', 'Configure your application theme, regional language, communication channels, and linked fitness accounts')}
              </p>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700 }}
              onClick={handleSaveSettings}
              disabled={saveStatus.state === 'saving'}
            >
              <Save size={16} /> {saveStatus.state === 'saving' ? 'Saving...' : t('btn_save_settings', 'Save All Settings')}
            </button>
          </div>

          {/* Feedback banner */}
          {['success', 'error'].includes(saveStatus.state) && (
            <div
              className="animate-fadeIn"
              style={{
                background: saveStatus.state === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${saveStatus.state === 'success' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)'}`,
                color: saveStatus.state === 'success' ? 'var(--primary-emerald)' : '#ef4444',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              {saveStatus.state === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Settings Tabs */}
          <div className="tabs-container" style={{ marginBottom: '2rem' }}>
            <button
              className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              <Palette size={15} /> {t('tab_appearance', 'Theme & Appearance')}
            </button>
            <button
              className={`tab-btn ${activeTab === 'language' ? 'active' : ''}`}
              onClick={() => setActiveTab('language')}
            >
              <Globe size={15} /> {t('tab_language', 'Language & Regional')}
            </button>
            <button
              className={`tab-btn ${activeTab === 'communication' ? 'active' : ''}`}
              onClick={() => setActiveTab('communication')}
            >
              <MessageSquare size={15} /> {t('tab_communication', 'Communication Channels')}
            </button>
            <button
              className={`tab-btn ${activeTab === 'linking' ? 'active' : ''}`}
              onClick={() => setActiveTab('linking')}
            >
              <Link2 size={15} /> {t('tab_linking', 'Linked Accounts')}
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 1: THEME & APPEARANCE (Multi-Theme System)                 */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'appearance' && (
            <div className="animate-fadeIn">
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Palette size={18} color="var(--primary-emerald)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('appearance_heading', 'Display Themes')}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('appearance_desc', 'Select a theme to customize your entire visual experience across all dashboard pages, catalogs, and tools.')}
                </p>
              </div>

              {/* Theme Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                {themes.map(tOption => {
                  const isSelected = theme === tOption.id;
                  return (
                    <div
                      key={tOption.id}
                      onClick={() => setTheme(tOption.id)}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        border: isSelected ? '2px solid var(--primary-emerald)' : '1px solid var(--border-subtle)',
                        boxShadow: isSelected ? '0 0 20px rgba(16, 185, 129, 0.25)' : undefined,
                        position: 'relative',
                        transition: 'var(--transition-normal)',
                      }}
                    >
                      {/* Active theme badge */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '0.75rem',
                            right: '0.75rem',
                            background: 'var(--primary-emerald)',
                            color: '#fff',
                            borderRadius: '999px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                          }}
                        >
                          <Check size={11} /> ACTIVE
                        </div>
                      )}

                      {/* Theme Visual Palette Swatch */}
                      <div
                        style={{
                          height: '90px',
                          borderRadius: 'var(--radius-sm)',
                          background: tOption.bgPreview,
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '0.75rem',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: tOption.textPreview }}>
                            {tOption.type.toUpperCase()}
                          </span>
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: tOption.accent, display: 'inline-block' }} />
                            <span style={{ width: 14, height: 14, borderRadius: '50%', background: tOption.secondary, display: 'inline-block' }} />
                          </div>
                        </div>

                        {/* Mini sample card */}
                        <div
                          style={{
                            background: tOption.cardPreview,
                            borderRadius: '4px',
                            padding: '0.35rem 0.5rem',
                            border: `1px solid ${tOption.accent}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ fontSize: '0.65rem', color: tOption.textPreview, fontWeight: 700 }}>
                            SmartFit UI
                          </span>
                          <span style={{ fontSize: '0.6rem', color: tOption.accent, fontWeight: 800 }}>
                            ● Live
                          </span>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.25rem' }}>{tOption.name}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.85rem' }}>
                        {tOption.description}
                      </p>

                      <button
                        className={isSelected ? 'btn-primary' : 'btn-secondary'}
                        style={{ width: '100%', padding: '0.45rem', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme(tOption.id);
                        }}
                      >
                        {isSelected ? '✓ Theme Active' : t('theme_apply', 'Apply Theme')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 2: LANGUAGE & REGIONAL (i18n Translation)                  */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'language' && (
            <div className="animate-fadeIn">
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Globe size={18} color="var(--primary-emerald)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('language_heading', 'Language Preferences')}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('language_desc', 'Select your preferred language. The navigation, settings, and interactive interfaces will automatically update.')}
                </p>
              </div>

              {/* Language Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {languages.map(lang => {
                  const isCurrent = language === lang.code;
                  return (
                    <div
                      key={lang.code}
                      onClick={() => setLanguage(lang.code)}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem',
                        cursor: 'pointer',
                        border: isCurrent ? '2px solid var(--primary-emerald)' : '1px solid var(--border-subtle)',
                        background: isCurrent ? 'rgba(16, 185, 129, 0.05)' : undefined,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                        transition: 'var(--transition-fast)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ fontSize: '2rem' }}>{lang.flag}</div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.98rem' }}>{lang.nativeName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {lang.name} • {lang.region}
                          </div>
                        </div>
                      </div>

                      <div>
                        {isCurrent ? (
                          <span className="badge badge-emerald" style={{ fontSize: '0.68rem' }}>
                            <Check size={11} /> SELECTED
                          </span>
                        ) : (
                          <button
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setLanguage(lang.code);
                            }}
                          >
                            {t('language_select', 'Select')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 3: COMMUNICATION CHANNELS (WhatsApp, Email, SMS)           */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'communication' && (
            <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <MessageSquare size={18} color="var(--primary-emerald)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('comm_heading', 'Communication & Alert Preferences')}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('comm_desc', 'Manage how you receive booking vouchers, live weather warnings, workout reminders, and emergency SOS alerts.')}
                </p>
              </div>

              {/* 1. WHATSAPP CHANNEL CARD */}
              <div className="glass-panel" style={{ padding: '1.5rem', border: communication.whatsapp.enabled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(37, 211, 102, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      💬
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t('comm_whatsapp_title', 'WhatsApp Notifications')}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t('comm_whatsapp_desc', 'Receive immediate booking passes with QR codes, guide updates, and weather advisories directly on WhatsApp.')}
                      </p>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={communication.whatsapp.enabled}
                      onChange={e => setCommunication(prev => ({
                        ...prev,
                        whatsapp: { ...prev.whatsapp, enabled: e.target.checked },
                      }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{communication.whatsapp.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>

                {communication.whatsapp.enabled && (
                  <div className="animate-fadeIn" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {t('comm_phone_label', 'WhatsApp Phone Number')}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={communication.whatsapp.phone}
                          onChange={e => {
                            const val = e.target.value;
                            setCommunication(prev => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, phone: val },
                              sms: {
                                ...prev.sms,
                                phone: (!prev.sms.phone || prev.sms.phone === prev.whatsapp.phone || prev.sms.phone === '+91 98765 43210') ? val : prev.sms.phone,
                              },
                            }));
                          }}
                          style={{ maxWidth: '320px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => handleSendTest('whatsapp')}
                        >
                          💬 {t('comm_send_test', 'Send Test Alert')}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                      {[
                        { key: 'bookingAlerts', label: t('comm_booking_alerts', 'Booking & Ticket Confirmations') },
                        { key: 'weatherAlerts', label: t('comm_weather_alerts', 'Live Weather & Trail Safety Alerts') },
                        { key: 'workoutReminders', label: t('comm_workout_reminders', 'Daily Workout & Streak Reminders') },
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={communication.whatsapp[item.key]}
                            onChange={e => setCommunication(prev => ({
                              ...prev,
                              whatsapp: { ...prev.whatsapp, [item.key]: e.target.checked },
                            }))}
                            style={{ width: '15px', height: '15px' }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. EMAIL CHANNEL CARD */}
              <div className="glass-panel" style={{ padding: '1.5rem', border: communication.email.enabled ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      ✉️
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t('comm_email_title', 'Email Notifications')}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t('comm_email_desc', 'Comprehensive itineraries, weekly fitness digests, badge rewards, and detailed invoices.')}
                      </p>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={communication.email.enabled}
                      onChange={e => setCommunication(prev => ({
                        ...prev,
                        email: { ...prev.email, enabled: e.target.checked },
                      }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{communication.email.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>

                {communication.email.enabled && (
                  <div className="animate-fadeIn" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {t('comm_email_label', 'Notification Email')}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="email"
                          placeholder="athlete@example.com"
                          value={communication.email.email}
                          onChange={e => setCommunication(prev => ({
                            ...prev,
                            email: { ...prev.email, email: e.target.value },
                          }))}
                          style={{ maxWidth: '320px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => handleSendTest('email')}
                        >
                          ✉️ {t('comm_send_test', 'Send Test Alert')}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                      {[
                        { key: 'weeklyDigest', label: t('comm_weekly_digest', 'Weekly Performance & Calorie Digest') },
                        { key: 'itineraryUpdates', label: t('comm_itinerary_updates', 'Expedition Itineraries & Gear Lists') },
                        { key: 'achievementBadges', label: t('comm_badges_alerts', 'New Badge & Reward Unlocks') },
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={communication.email[item.key]}
                            onChange={e => setCommunication(prev => ({
                              ...prev,
                              email: { ...prev.email, [item.key]: e.target.checked },
                            }))}
                            style={{ width: '15px', height: '15px' }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. SMS CHANNEL CARD */}
              <div className="glass-panel" style={{ padding: '1.5rem', border: communication.sms.enabled ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                      📱
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{t('comm_sms_title', 'SMS Emergency & Live Alerts')}</h4>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {t('comm_sms_desc', 'High-priority SMS dispatch for mountain trail hazard notices and urgent departure schedule updates.')}
                      </p>
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      checked={communication.sms.enabled}
                      onChange={e => setCommunication(prev => ({
                        ...prev,
                        sms: { ...prev.sms, enabled: e.target.checked },
                      }))}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <span>{communication.sms.enabled ? 'Enabled' : 'Disabled'}</span>
                  </label>
                </div>

                {communication.sms.enabled && (
                  <div className="animate-fadeIn" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                        {t('comm_sms_label', 'Emergency Mobile Number')}
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={communication.sms.phone}
                          onChange={e => setCommunication(prev => ({
                            ...prev,
                            sms: { ...prev.sms, phone: e.target.value },
                          }))}
                          style={{ maxWidth: '320px' }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
                          onClick={() => handleSendTest('sms')}
                        >
                          📱 {t('comm_send_test', 'Send Test Alert')}
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                      {[
                        { key: 'sosAlerts', label: t('comm_sos_alerts', 'Emergency SOS & Dispatch Alerts') },
                        { key: 'departureChanges', label: t('comm_departure_changes', 'Urgent Schedule & Guide Changes') },
                      ].map(item => (
                        <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={communication.sms[item.key]}
                            onChange={e => setCommunication(prev => ({
                              ...prev,
                              sms: { ...prev.sms, [item.key]: e.target.checked },
                            }))}
                            style={{ width: '15px', height: '15px' }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TAB 4: MULTIPLE LINKING (Connected Fitness & Social Accounts) */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {activeTab === 'linking' && (
            <div className="animate-fadeIn">
              <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <Link2 size={18} color="var(--primary-emerald)" />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t('linking_heading', 'Connected Services & Trackers')}</h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {t('linking_desc', 'Link your third-party fitness trackers, smartwatches, and social identities for automated telemetry syncing.')}
                </p>
              </div>

              {/* Accounts List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  {
                    key: 'google',
                    icon: '🌐',
                    title: t('link_google', 'Google Account'),
                    desc: t('link_google_desc', 'Fast sign-in and automated calendar synchronization for booked expeditions.'),
                    color: '#4285f4',
                  },
                  {
                    key: 'apple',
                    icon: '🍎',
                    title: t('link_apple', 'Apple Health'),
                    desc: t('link_apple_desc', 'Sync daily step counts, resting heart rate, and active calories burned.'),
                    color: '#a3a3a3',
                  },
                  {
                    key: 'strava',
                    icon: '🏃',
                    title: t('link_strava', 'Strava'),
                    desc: t('link_strava_desc', 'Import alpine trail runs, cycling expeditions, and GPS elevation gains.'),
                    color: '#fc4c02',
                  },
                  {
                    key: 'garmin',
                    icon: '⌚',
                    title: t('link_garmin', 'Garmin Connect'),
                    desc: t('link_garmin_desc', 'Real-time expedition smartwatch telemetry, SPO2, and navigation tracking.'),
                    color: '#007cc3',
                  },
                  {
                    key: 'whatsapp',
                    icon: '💬',
                    title: t('link_whatsapp', 'WhatsApp Official Account'),
                    desc: t('link_whatsapp_desc', 'Two-way verified chat channel with licensed alpine guides and safety teams.'),
                    color: '#25d366',
                  },
                  {
                    key: 'github',
                    icon: '🐙',
                    title: t('link_github', 'GitHub / Social Identity'),
                    desc: t('link_github_desc', 'Display verified adventurer credentials and open-source contributions.'),
                    color: '#8b5cf6',
                  },
                ].map(service => {
                  const account = linkedAccounts[service.key] || { connected: false };
                  return (
                    <div
                      key={service.key}
                      className="glass-panel"
                      style={{
                        padding: '1.25rem 1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        border: account.connected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px', flex: 1 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '12px',
                            background: `${service.color}18`,
                            border: `1px solid ${service.color}35`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                            flexShrink: 0,
                          }}
                        >
                          {service.icon}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <h4 style={{ fontSize: '0.98rem', fontWeight: 800 }}>{service.title}</h4>
                            {account.connected ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.62rem' }}>
                                <Check size={10} /> {t('status_connected', 'Connected')}
                              </span>
                            ) : (
                              <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(148, 163, 184, 0.15)', color: 'var(--text-dim)' }}>
                                {t('status_not_connected', 'Not Connected')}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {service.desc}
                          </p>
                          {account.connected && account.id && (
                            <div style={{ fontSize: '0.72rem', color: 'var(--primary-emerald)', marginTop: '0.25rem', fontWeight: 600 }}>
                              Linked as: <strong>{account.id}</strong> • Last Sync: {account.lastSync || 'Recent'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {account.connected ? (
                          <>
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                              onClick={() => {
                                setLinkedAccounts(prev => ({
                                  ...prev,
                                  [service.key]: { ...prev[service.key], lastSync: 'Synced just now' },
                                }));
                                alert(`${service.title} synchronized successfully! Telemetry updated.`);
                              }}
                            >
                              <RefreshCw size={12} /> {t('btn_sync_now', 'Sync Now')}
                            </button>
                            <button
                              type="button"
                              className="btn-danger"
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.76rem' }}
                              onClick={() => handleToggleService(service.key)}
                            >
                              {t('btn_disconnect', 'Disconnect')}
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => handleToggleService(service.key)}
                          >
                            <Link2 size={13} /> {t('btn_connect', 'Connect Account')}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Clearance Spacer to ensure SMS Card & all form controls are fully visible */}
          <div style={{ height: '70px', width: '100%', pointerEvents: 'none' }} />

          {/* Sticky Save Action Bar */}
          <div
            className="glass-panel"
            style={{
              padding: '1.1rem 1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'sticky',
              bottom: '1.5rem',
              zIndex: 40,
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35)',
              marginTop: '2.5rem',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              background: 'var(--bg-card, rgba(15, 23, 42, 0.95))',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md, 12px)',
            }}
          >
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Theme: <strong style={{ color: 'var(--text)' }}>{themes.find(t => t.id === theme)?.name}</strong> • Language: <strong style={{ color: 'var(--text)' }}>{languages.find(l => l.code === language)?.name}</strong>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '0.65rem 1.75rem', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}
                onClick={handleSaveSettings}
                disabled={saveStatus.state === 'saving'}
              >
                <Save size={16} /> {saveStatus.state === 'saving' ? 'Saving...' : t('btn_save_settings', 'Save All Settings')}
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* TEST COMMUNICATION MODAL                                       */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {testModal.open && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(5, 12, 22, 0.85)',
                backdropFilter: 'blur(6px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
              onClick={() => setTestModal({ open: false, channel: '', preview: '', loading: false, success: null })}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '16px',
                  maxWidth: '520px',
                  width: '100%',
                  padding: '2rem',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setTestModal({ open: false, channel: '', preview: '', loading: false, success: null })}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                    {testModal.channel === 'whatsapp' ? '💬' : testModal.channel === 'sms' ? '📱' : '✉️'}
                  </div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                    {testModal.channel.toUpperCase()} Alert Dispatch Test
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {testModal.loading
                      ? 'Sending a real test message through the configured provider...'
                      : testModal.success
                        ? 'The provider accepted the test message.'
                        : 'The test message was not sent.'}
                  </p>
                </div>

                <div
                  style={{
                    background: 'var(--bg-input)',
                    border: `1px solid ${testModal.success === false ? '#ef4444' : 'var(--border-subtle)'}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '1.25rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    marginBottom: '1.5rem',
                    fontFamily: 'monospace',
                    color: testModal.success === false ? '#ef4444' : 'var(--text-main)',
                  }}
                >
                  {testModal.loading ? 'Dispatching test signal to carrier gateway...' : testModal.preview}
                </div>

                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.6rem' }}
                  onClick={() => setTestModal({ open: false, channel: '', preview: '', loading: false, success: null })}
                >
                  Done / Close
                </button>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* CONNECT ACCOUNT MODAL                                          */}
          {/* ══════════════════════════════════════════════════════════════ */}
          {linkModal.open && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(5, 12, 22, 0.85)',
                backdropFilter: 'blur(6px)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1.5rem',
              }}
              onClick={() => setLinkModal({ open: false, service: null, accountName: '' })}
            >
              <div
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-glow)',
                  borderRadius: '16px',
                  maxWidth: '480px',
                  width: '100%',
                  padding: '2rem',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                  position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => setLinkModal({ open: false, service: null, accountName: '' })}
                  style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                  Link {linkModal.service?.toUpperCase()} Account
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  Enter your username, registered email, or device ID to authorize automated telemetry sync.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.35rem' }}>
                    Account Identifier / Username
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${user?.name?.toLowerCase().replace(/\s+/g, '_') || 'athlete'}_2026`}
                    value={linkModal.accountName}
                    onChange={e => setLinkModal(prev => ({ ...prev, accountName: e.target.value }))}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    className="btn-secondary"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}
                    onClick={() => setLinkModal({ open: false, service: null, accountName: '' })}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    style={{ padding: '0.5rem 1.25rem', fontSize: '0.82rem' }}
                    onClick={confirmLinkService}
                  >
                    Authorize &amp; Link
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Settings;
