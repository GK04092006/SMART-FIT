import React, { useEffect, useState } from 'react';
import {
  Mail, MessageSquare, Smartphone, AlertTriangle, Send,
  Filter, CheckCircle, XCircle, Search, RefreshCw,
  Users, Bell, Calendar, ChevronRight, Check, ExternalLink,
  PhoneCall, ShieldAlert, Copy,
} from 'lucide-react';
import API from '../services/api';
import Sidebar from '../components/Sidebar';
import Breadcrumbs from '../components/Breadcrumbs';
import Loader from '../components/Loader';

const AdminCommunication = () => {
  // Metrics
  const [stats, setStats] = useState({
    totalLogs: 0,
    emailsSent: 0,
    smsSent: 0,
    whatsappSent: 0,
    inAppSent: 0,
    failedMessages: 0,
    unreadNotifications: 0,
  });

  // Logs & Filters
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Announcement Composer
  const [announcement, setAnnouncement] = useState({
    title: '',
    message: '',
    targetAudience: 'ALL',
    targetRole: '',
    targetAdventureId: '',
    targetUserId: '',
    channels: ['IN_APP', 'EMAIL', 'SMS', 'WHATSAPP'],
  });
  const [adventures, setAdventures] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientsLoadError, setRecipientsLoadError] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [generatedWhatsAppLinks, setGeneratedWhatsAppLinks] = useState([]);
  const [generatedEmailLinks, setGeneratedEmailLinks] = useState([]);
  const [generatedSmsLinks, setGeneratedSmsLinks] = useState([]);

  // Adventure Participants for WhatsApp/Email/SMS Group Dispatch
  const [adventureParticipants, setAdventureParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Quick Direct Dispatcher Tool State
  const [quickTab, setQuickTab] = useState('WHATSAPP'); // 'WHATSAPP' | 'EMAIL' | 'SMS'
  const [quickPhone, setQuickPhone] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickMessage, setQuickMessage] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  // Trigger Reminders Check
  const [triggeringReminders, setTriggeringReminders] = useState(false);
  const [reminderStatus, setReminderStatus] = useState('');

  const loadData = async () => {
    try {
      setLoadingLogs(true);
      const [statsRes, logsRes, advRes, recipientsRes] = await Promise.allSettled([
        API.get('/communication/stats'),
        API.get(`/communication/logs?channel=${channelFilter}&status=${statusFilter}&search=${encodeURIComponent(searchFilter)}`),
        API.get('/adventure'),
        API.get('/communication/recipients'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value.data?.success) {
        setStats(statsRes.value.data.stats);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.data?.success) {
        setLogs(logsRes.value.data.logs || []);
      }
      if (advRes.status === 'fulfilled') {
        setAdventures(advRes.value.data || []);
      }
      if (recipientsRes.status === 'fulfilled' && recipientsRes.value.data?.success) {
        setRecipients(recipientsRes.value.data.recipients || []);
        setRecipientsLoadError('');
      } else if (recipientsRes.status === 'rejected') {
        setRecipientsLoadError(recipientsRes.reason?.response?.data?.message || 'Could not load users to message.');
      } else {
        setRecipientsLoadError('Could not load users to message.');
      }
    } catch (err) {
      console.error('[Admin Communication Load Error]', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [channelFilter, statusFilter]);

  // When adventure selected, fetch registered participants for group messaging
  useEffect(() => {
    if (announcement.targetAudience === 'ADVENTURE' && announcement.targetAdventureId) {
      setLoadingParticipants(true);
      API.get(`/communication/adventure-participants/${announcement.targetAdventureId}`)
        .then((res) => {
          if (res.data?.success) {
            setAdventureParticipants(res.data.participants || []);
          }
        })
        .catch(() => setAdventureParticipants([]))
        .finally(() => setLoadingParticipants(false));
    } else {
      setAdventureParticipants([]);
    }
  }, [announcement.targetAudience, announcement.targetAdventureId]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleToggleChannel = (chan) => {
    setAnnouncement((prev) => {
      const exists = prev.channels.includes(chan);
      if (exists) {
        if (prev.channels.length === 1) return prev; // Keep at least one
        return { ...prev, channels: prev.channels.filter((c) => c !== chan) };
      }
      return { ...prev, channels: [...prev.channels, chan] };
    });
  };

  // Helper 1: Open WhatsApp Web / Mobile App
  const openWhatsApp = (rawPhone, msgText, msgTitle = '') => {
    if (!rawPhone) {
      alert('Recipient phone number is missing');
      return;
    }
    let clean = String(rawPhone).replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    else if (clean.length === 11 && clean.startsWith('0')) clean = `91${clean.substring(1)}`;

    const formatted = msgTitle
      ? `*${msgTitle}*\n\n${msgText}\n\n_Adventure Management System_`
      : msgText;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(formatted)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Helper 2: Open Email Client (mailto:)
  const openMailto = (rawEmail, msgText, msgTitle = '') => {
    if (!rawEmail) {
      alert('Recipient email address is missing');
      return;
    }
    const subject = msgTitle || 'Adventure Management Notification';
    const url = `mailto:${encodeURIComponent(rawEmail.trim())}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(msgText)}`;
    window.open(url, '_blank');
  };

  // Helper 3: Open Mobile SMS App (sms:)
  const openSms = (rawPhone, msgText, msgTitle = '') => {
    if (!rawPhone) {
      alert('Recipient phone number is missing');
      return;
    }
    let clean = String(rawPhone).replace(/[^0-9]/g, '');
    if (clean.length === 10) clean = `91${clean}`;
    else if (clean.length === 11 && clean.startsWith('0')) clean = `91${clean.substring(1)}`;

    const text = msgTitle ? `[SmartFit] ${msgTitle}: ${msgText}` : `[SmartFit] ${msgText}`;
    const url = `sms:+${clean}?body=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcement.title.trim() || !announcement.message.trim()) {
      alert('Please fill in title and message.');
      return;
    }
    if (announcement.targetAudience === 'SPECIFIC' && !announcement.targetUserId) {
      setBroadcastResult({ success: false, message: 'Choose a recipient before sending.' });
      return;
    }

    setSendingBroadcast(true);
    setBroadcastResult(null);
    setGeneratedWhatsAppLinks([]);
    setGeneratedEmailLinks([]);
    setGeneratedSmsLinks([]);

    try {
      const { data } = await API.post('/communication/announcement', announcement);
      const deliverySummary = data.deliverySummary || {};
      const deliveryDetails = Object.entries(deliverySummary)
        .map(([channel, counts]) => {
          const issues = counts.issues?.length ? ` (${counts.issues.join(', ')})` : '';
          return `${channel}: ${counts.sent} sent, ${counts.failed} failed, ${counts.skipped} skipped${issues}`;
        })
        .join(' | ');
      const hasDeliveryIssues = Object.values(deliverySummary)
        .some((counts) => counts.failed > 0 || counts.skipped > 0);

      setBroadcastResult({
        success: !hasDeliveryIssues,
        message: `${data.message}${deliveryDetails ? ` — ${deliveryDetails}` : ''}`,
      });

      if (data.whatsappLinks && data.whatsappLinks.length > 0) {
        setGeneratedWhatsAppLinks(data.whatsappLinks);
      }
      if (data.emailLinks && data.emailLinks.length > 0) {
        setGeneratedEmailLinks(data.emailLinks);
      }
      if (data.smsLinks && data.smsLinks.length > 0) {
        setGeneratedSmsLinks(data.smsLinks);
      }

      await loadData();
    } catch (err) {
      setBroadcastResult({
        success: false,
        message: err.response?.data?.message || 'Failed to dispatch announcement',
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleTriggerReminders = async () => {
    setTriggeringReminders(true);
    setReminderStatus('');
    try {
      const { data } = await API.post('/communication/trigger-reminders');
      setReminderStatus(data.message);
      loadData();
    } catch (err) {
      setReminderStatus('Failed to run reminder check.');
    } finally {
      setTriggeringReminders(false);
    }
  };

  const selectedSpecificUser = recipients.find((r) => r._id === announcement.targetUserId);

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />
        <main style={{ padding: '2rem 2rem 4rem 1rem', flex: 1, minWidth: 0, maxWidth: '1200px' }}>
          <Breadcrumbs
            customCrumbs={[
              { label: 'Admin Console', to: '/analytics' },
              { label: 'Communication Center', to: null },
            ]}
          />

          {/* Page Title */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: '800', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                OPERATIONS & DISPATCH
              </span>
              <h1 style={{ fontSize: '2.2rem', color: 'var(--text)', margin: '0.2rem 0 0.4rem 0', fontWeight: '800' }}>
                Communication Center
              </h1>
              <p style={{ color: 'var(--muted-text)', margin: 0, fontSize: '0.95rem' }}>
                Unified real-time dashboard for Email, Mobile SMS, WhatsApp, and In-App notifications.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleTriggerReminders}
                disabled={triggeringReminders}
                className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}
              >
                <Calendar size={15} />
                {triggeringReminders ? 'Checking Reminders...' : 'Run Scheduled Reminders Check'}
              </button>
              <button
                type="button"
                onClick={loadData}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1rem' }}
              >
                <RefreshCw size={15} /> Refresh Data
              </button>
            </div>
          </div>

          {reminderStatus && (
            <div
              style={{
                padding: '0.85rem 1.25rem',
                marginBottom: '1.5rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--primary)',
                fontSize: '0.9rem',
                fontWeight: '600',
              }}
            >
              {reminderStatus}
            </div>
          )}

          {/* Top Metric Cards */}
          <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(5, 150, 105, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: 'var(--primary)' }}>
                <Mail size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Emails Dispatched
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: 'var(--text)' }}>
                  {stats.emailsSent}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#06b6d4' }}>
                <Smartphone size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  SMS Sent
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: 'var(--text)' }}>
                  {stats.smsSent}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#22c55e' }}>
                <MessageSquare size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  WhatsApp Messages
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: 'var(--text)' }}>
                  {stats.whatsappSent}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#8b5cf6' }}>
                <Bell size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  In-App Notifications
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: 'var(--text)' }}>
                  {stats.inAppSent}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#ef4444' }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Failed Deliveries
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: '#ef4444' }}>
                  {stats.failedMessages}
                </h3>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', color: '#f59e0b' }}>
                <Users size={26} />
              </div>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--muted-text)', textTransform: 'uppercase', fontWeight: '700' }}>
                  Unread In-App Alerts
                </span>
                <h3 style={{ fontSize: '1.75rem', margin: '0.1rem 0 0 0', color: 'var(--text)' }}>
                  {stats.unreadNotifications}
                </h3>
              </div>
            </div>
          </div>

          {/* Announcement Composer */}
          <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Send size={20} color="var(--primary)" />
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text)', margin: 0, fontWeight: '800' }}>
                Broadcast Announcement / Message
              </h2>
            </div>
            <p style={{ color: 'var(--muted-text)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Send real-time messages to participants, guides, trainers, or specific adventure groups across Email, Mobile SMS, WhatsApp, and In-App.
            </p>

            <form onSubmit={handleSendAnnouncement}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={labelStyle}>Announcement Subject / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Kodaikanal Trek Reporting Time Rescheduled"
                    value={announcement.title}
                    onChange={(e) => setAnnouncement({ ...announcement, title: e.target.value })}
                    style={{ width: '100%' }}
                    required
                  />
                </div>

                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <select
                    value={announcement.targetAudience}
                    onChange={(e) => setAnnouncement({
                      ...announcement,
                      targetAudience: e.target.value,
                      targetRole: '',
                      targetAdventureId: '',
                      targetUserId: '',
                    })}
                    style={{ width: '100%' }}
                  >
                    <option value="ALL">All Registered Users</option>
                    <option value="ADVENTURE">Specific Adventure Participants (Group)</option>
                    <option value="ROLE">Specific User Role (Guides, Trainers)</option>
                    <option value="SPECIFIC">One Specific User</option>
                  </select>
                </div>
              </div>

              {/* Adventure Group Selection */}
              {announcement.targetAudience === 'ADVENTURE' && (
                <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label style={labelStyle}>Select Adventure Expedition</label>
                  <select
                    value={announcement.targetAdventureId}
                    onChange={(e) => setAnnouncement({ ...announcement, targetAdventureId: e.target.value })}
                    style={{ width: '100%', marginBottom: '0.75rem' }}
                    required
                  >
                    <option value="">-- Choose Adventure --</option>
                    {adventures.map((a) => (
                      <option key={a._id || a.id} value={a._id || a.id}>
                        {a.title} ({a.category} • {a.location})
                      </option>
                    ))}
                  </select>

                  {/* Registered Participants for this Adventure */}
                  {announcement.targetAdventureId && (
                    <div>
                      {loadingParticipants ? (
                        <span style={{ fontSize: '0.82rem', color: 'var(--muted-text)' }}>Loading registered participants...</span>
                      ) : adventureParticipants.length === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: '#f59e0b' }}>No confirmed participants registered for this adventure yet.</span>
                      ) : (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: '700' }}>
                              👥 {adventureParticipants.length} Adventure Participant(s)
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--muted-text)' }}>
                              Click any action to dispatch Email, SMS, or WhatsApp directly to the participant
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', maxHeight: '140px', overflowY: 'auto', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            {adventureParticipants.map((p) => (
                              <div
                                key={p.userId}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.4rem 0.65rem',
                                  borderRadius: '6px',
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid var(--border)',
                                  fontSize: '0.78rem',
                                }}
                              >
                                <strong>{p.name}</strong>
                                <div style={{ display: 'flex', gap: '0.3rem', marginLeft: '0.25rem' }}>
                                  {p.email && (
                                    <button
                                      type="button"
                                      onClick={() => openMailto(p.email, announcement.message || 'Adventure update', announcement.title || 'Adventure Update')}
                                      style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 5px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' }}
                                      title="Send Email via mail client"
                                    >
                                      ✉️ Email
                                    </button>
                                  )}
                                  {p.phone && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openSms(p.phone, announcement.message || 'Adventure update', announcement.title || 'Adventure Update')}
                                        style={{ background: '#0891b2', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 5px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' }}
                                        title="Send SMS via mobile SMS app"
                                      >
                                        📱 SMS
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => openWhatsApp(p.phone, announcement.message || 'Adventure update', announcement.title || 'Adventure Update')}
                                        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 5px', fontSize: '0.68rem', fontWeight: '700', cursor: 'pointer' }}
                                        title="Open direct WhatsApp message"
                                      >
                                        💬 WA
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {announcement.targetAudience === 'ROLE' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={labelStyle}>Select Role</label>
                  <select
                    value={announcement.targetRole}
                    onChange={(e) => setAnnouncement({ ...announcement, targetRole: e.target.value })}
                    style={{ width: '100%' }}
                    required
                  >
                    <option value="">-- Choose Role --</option>
                    <option value="guide">Guides</option>
                    <option value="trainer">Trainers</option>
                    <option value="organizer">Organizers</option>
                    <option value="user">Participants Only</option>
                  </select>
                </div>
              )}

              {/* Specific User Selection with Contact Details */}
              {announcement.targetAudience === 'SPECIFIC' && (
                <div style={{ marginBottom: '1.25rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                  <label style={labelStyle}>Select Specific User</label>
                  <select
                    value={announcement.targetUserId}
                    onChange={(e) => setAnnouncement({ ...announcement, targetUserId: e.target.value })}
                    style={{ width: '100%', marginBottom: '0.5rem' }}
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {recipients.map((recipient) => (
                      <option key={recipient._id} value={recipient._id}>
                        {recipient.name} ({recipient.email}) — 📞 {recipient.phone || 'No phone'}
                      </option>
                    ))}
                  </select>

                  {selectedSpecificUser && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.84rem', color: 'var(--muted-text)' }}>
                        Recipient: <strong>{selectedSpecificUser.name}</strong> • ✉️ {selectedSpecificUser.email} • 📞 {selectedSpecificUser.phone || 'No phone'}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {selectedSpecificUser.email && (
                          <button
                            type="button"
                            onClick={() => openMailto(selectedSpecificUser.email, announcement.message || 'Notification from Adventure Management', announcement.title || 'Official Message')}
                            style={{
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 'var(--radius-sm)',
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.78rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                          >
                            <Mail size={13} /> Email Client
                          </button>
                        )}
                        {selectedSpecificUser.phone && (
                          <>
                            <button
                              type="button"
                              onClick={() => openSms(selectedSpecificUser.phone, announcement.message || 'Notification from Adventure Management', announcement.title || 'Official Message')}
                              style={{
                                background: '#0891b2',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <Smartphone size={13} /> SMS App
                            </button>
                            <button
                              type="button"
                              onClick={() => openWhatsApp(selectedSpecificUser.phone, announcement.message || 'Notification from Adventure Management', announcement.title || 'Official Message')}
                              style={{
                                background: '#22c55e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.35rem 0.75rem',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              <MessageSquare size={13} /> WhatsApp
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {recipientsLoadError && (
                    <span style={{ display: 'block', marginTop: '0.4rem', fontSize: '0.82rem', color: '#ef4444' }}>
                      {recipientsLoadError}
                    </span>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={labelStyle}>Announcement Message Content</label>
                <textarea
                  rows="4"
                  placeholder="The reporting time has been changed to 5:30 AM due to early morning trail conditions..."
                  value={announcement.message}
                  onChange={(e) => setAnnouncement({ ...announcement, message: e.target.value })}
                  style={{ width: '100%' }}
                  required
                />
              </div>

              {/* Channels Checkboxes */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={labelStyle}>Dispatch Channels</label>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {[
                    { id: 'IN_APP', label: 'In-App Notification' },
                    { id: 'EMAIL', label: 'Email (SMTP / Brevo + 1-Click Link)' },
                    { id: 'SMS', label: 'SMS (Fast2SMS / Twilio + 1-Click Link)' },
                    { id: 'WHATSAPP', label: 'WhatsApp (Live API + 1-Click Link)' },
                  ].map((c) => {
                    const checked = announcement.channels.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          fontSize: '0.88rem',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontWeight: '600',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleChannel(c.id)}
                          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
                        />
                        {c.label}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.75rem' }}
                >
                  <Send size={16} />
                  {sendingBroadcast
                    ? 'Dispatching...'
                    : announcement.targetAudience === 'SPECIFIC'
                      ? 'Send Message to User'
                      : 'Send Broadcast Announcement'}
                </button>

                {broadcastResult && (
                  <span
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      color: broadcastResult.success ? 'var(--primary)' : '#ef4444',
                    }}
                  >
                    {broadcastResult.message}
                  </span>
                )}
              </div>
            </form>

            {/* If Direct links were generated from broadcast, display them interactively */}
            {(generatedWhatsAppLinks.length > 0 || generatedEmailLinks.length > 0 || generatedSmsLinks.length > 0) && (
              <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle size={18} color="var(--primary)" />
                  <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                    1-Click Direct Delivery Hub (Interactive Launchers)
                  </strong>
                </div>

                {/* WhatsApp Links */}
                {generatedWhatsAppLinks.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#22c55e', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                      💬 WhatsApp Direct Links ({generatedWhatsAppLinks.length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                      {generatedWhatsAppLinks.map((link, idx) => (
                        <div key={link.userId || idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'block' }}>{link.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>{link.phone}</span>
                          </div>
                          <a href={link.directUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#22c55e', color: '#fff', textDecoration: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <ExternalLink size={11} /> Open WA
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Links */}
                {generatedEmailLinks.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                      ✉️ Email Client Links ({generatedEmailLinks.length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                      {generatedEmailLinks.map((link, idx) => (
                        <div key={link.userId || idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'block' }}>{link.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>{link.email}</span>
                          </div>
                          <a href={link.directUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#059669', color: '#fff', textDecoration: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Mail size={11} /> Open Mail
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SMS Links */}
                {generatedSmsLinks.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.8rem', color: '#0891b2', fontWeight: '700', display: 'block', marginBottom: '0.4rem' }}>
                      📱 SMS App Links ({generatedSmsLinks.length})
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.5rem' }}>
                      {generatedSmsLinks.map((link, idx) => (
                        <div key={link.userId || idx} style={{ padding: '0.5rem 0.75rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--text)', display: 'block' }}>{link.name}</strong>
                            <span style={{ fontSize: '0.72rem', color: 'var(--muted-text)' }}>{link.phone}</span>
                          </div>
                          <a href={link.directUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#0891b2', color: '#fff', textDecoration: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Smartphone size={11} /> Open SMS
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3-in-1 Quick Dispatch Center */}
          <div className="glass-panel" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--text)', margin: 0, fontWeight: '800' }}>
                  Instant Quick Dispatcher
                </h2>
                <p style={{ color: 'var(--muted-text)', fontSize: '0.86rem', margin: '0.2rem 0 0 0' }}>
                  Quickly compose and send live messages via WhatsApp, Email, or SMS to any recipient.
                </p>
              </div>

              {/* Tab Selector */}
              <div style={{ display: 'flex', gap: '0.35rem', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setQuickTab('WHATSAPP')}
                  style={{
                    background: quickTab === 'WHATSAPP' ? '#22c55e' : 'transparent',
                    color: quickTab === 'WHATSAPP' ? '#fff' : 'var(--muted-text)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <MessageSquare size={13} /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('EMAIL')}
                  style={{
                    background: quickTab === 'EMAIL' ? '#059669' : 'transparent',
                    color: quickTab === 'EMAIL' ? '#fff' : 'var(--muted-text)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Mail size={13} /> Email
                </button>
                <button
                  type="button"
                  onClick={() => setQuickTab('SMS')}
                  style={{
                    background: quickTab === 'SMS' ? '#0891b2' : 'transparent',
                    color: quickTab === 'SMS' ? '#fff' : 'var(--muted-text)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Smartphone size={13} /> SMS
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>
                  {quickTab === 'EMAIL' ? 'Recipient Email' : 'Recipient Phone Number'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {quickTab === 'EMAIL' ? (
                    <input
                      type="email"
                      placeholder="e.g. user@gmail.com"
                      value={quickEmail}
                      onChange={(e) => setQuickEmail(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210 or 9876543210"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  )}
                  <select
                    onChange={(e) => {
                      const user = recipients.find((r) => r._id === e.target.value);
                      if (user) {
                        if (user.phone) setQuickPhone(user.phone);
                        if (user.email) setQuickEmail(user.email);
                      }
                    }}
                    style={{ width: '130px', fontSize: '0.8rem' }}
                  >
                    <option value="">User List...</option>
                    {recipients.map((r) => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Subject / Title (Header)</label>
                <input
                  type="text"
                  placeholder="e.g. Expedition Reminder & Route Details"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={labelStyle}>Message Body</label>
              <textarea
                rows="2"
                placeholder="Type the message content..."
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {quickTab === 'WHATSAPP' && (
              <button
                type="button"
                onClick={() => {
                  if (!quickPhone.trim()) return alert('Please enter phone number or choose a user.');
                  if (!quickMessage.trim()) return alert('Please enter a message.');
                  openWhatsApp(quickPhone, quickMessage, quickTitle);
                }}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)',
                }}
              >
                <MessageSquare size={16} /> Open & Send via WhatsApp App / Web
              </button>
            )}

            {quickTab === 'EMAIL' && (
              <button
                type="button"
                onClick={() => {
                  if (!quickEmail.trim()) return alert('Please enter email address or choose a user.');
                  if (!quickMessage.trim()) return alert('Please enter a message.');
                  openMailto(quickEmail, quickMessage, quickTitle);
                }}
                style={{
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                }}
              >
                <Mail size={16} /> Open & Send via Email Client
              </button>
            )}

            {quickTab === 'SMS' && (
              <button
                type="button"
                onClick={() => {
                  if (!quickPhone.trim()) return alert('Please enter phone number or choose a user.');
                  if (!quickMessage.trim()) return alert('Please enter a message.');
                  openSms(quickPhone, quickMessage, quickTitle);
                }}
                style={{
                  background: 'linear-gradient(135deg, #0891b2, #0e7490)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(8, 145, 178, 0.3)',
                }}
              >
                <Smartphone size={16} /> Open & Send via Mobile SMS App
              </button>
            )}
          </div>

          {/* Communication Logs Table */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.35rem', color: 'var(--text)', margin: 0, fontWeight: '800' }}>
                Communication History & Logs
              </h2>

              {/* Filter Inputs */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="SMS">SMS</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="IN_APP">In-App</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="SENT">Sent</option>
                  <option value="FAILED">Failed</option>
                  <option value="PENDING">Pending</option>
                </select>

                <form onSubmit={handleSearchSubmit} style={{ display: 'inline-flex', gap: '0.4rem' }}>
                  <input
                    type="text"
                    placeholder="Search recipient..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem', width: '160px' }}
                  />
                  <button type="submit" className="btn-secondary" style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}>
                    <Search size={14} />
                  </button>
                </form>
              </div>
            </div>

            {loadingLogs ? (
              <Loader text="Loading communication logs..." />
            ) : logs.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--muted-text)' }}>
                No communication logs matching the selected filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--muted-text)' }}>
                      <th style={{ padding: '0.75rem' }}>Channel</th>
                      <th style={{ padding: '0.75rem' }}>Event Type</th>
                      <th style={{ padding: '0.75rem' }}>Recipient</th>
                      <th style={{ padding: '0.75rem' }}>Subject / Preview</th>
                      <th style={{ padding: '0.75rem' }}>Status</th>
                      <th style={{ padding: '0.75rem' }}>Action</th>
                      <th style={{ padding: '0.75rem' }}>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const isSuccess = log.status === 'SENT';
                      const phone = log.metadata?.phone || (log.recipient && /[0-9]{8,}/.test(log.recipient) ? log.recipient : log.user?.phone);
                      const email = log.metadata?.email || (log.recipient && log.recipient.includes('@') ? log.recipient : log.user?.email);

                      return (
                        <tr key={log._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease' }}>
                          <td style={{ padding: '0.75rem' }}>
                            <span
                              className={`badge ${
                                log.channel === 'EMAIL'
                                  ? 'badge-emerald'
                                  : log.channel === 'SMS'
                                  ? 'badge-cyan'
                                  : log.channel === 'WHATSAPP'
                                  ? 'badge-magenta'
                                  : 'badge-amber'
                              }`}
                              style={{ fontSize: '0.7rem' }}
                            >
                              {log.channel}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--text)' }}>
                            {log.eventType}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--text)' }}>
                            {log.recipient}
                          </td>
                          <td style={{ padding: '0.75rem', maxWidth: '240px' }}>
                            <strong style={{ display: 'block', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {log.subject || '—'}
                            </strong>
                            <span style={{ fontSize: '0.76rem', color: 'var(--muted-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                              {log.message}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontWeight: '700',
                                fontSize: '0.76rem',
                                color: isSuccess ? 'var(--primary)' : '#ef4444',
                              }}
                            >
                              {isSuccess ? <CheckCircle size={13} /> : <XCircle size={13} />}
                              {log.status}
                            </span>
                            {log.errorMessage && (
                              <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '2px', maxWidth: '180px' }}>
                                {log.errorMessage}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            {log.channel === 'WHATSAPP' && phone ? (
                              <button
                                type="button"
                                onClick={() => openWhatsApp(phone, log.message, log.subject)}
                                style={{
                                  background: '#22c55e',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Open in WhatsApp"
                              >
                                <MessageSquare size={12} /> WhatsApp
                              </button>
                            ) : log.channel === 'EMAIL' && email ? (
                              <button
                                type="button"
                                onClick={() => openMailto(email, log.message, log.subject)}
                                style={{
                                  background: '#059669',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Open in Mail Client"
                              >
                                <Mail size={12} /> Mail
                              </button>
                            ) : log.channel === 'SMS' && phone ? (
                              <button
                                type="button"
                                onClick={() => openSms(phone, log.message, log.subject)}
                                style={{
                                  background: '#0891b2',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '0.3rem 0.6rem',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem',
                                  whiteSpace: 'nowrap',
                                }}
                                title="Open in Mobile SMS App"
                              >
                                <Smartphone size={12} /> SMS
                              </button>
                            ) : (
                              <span style={{ color: 'var(--muted-text)', fontSize: '0.75rem' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '0.75rem', color: 'var(--muted-text)', fontSize: '0.78rem' }}>
                            {new Date(log.sentAt || log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const labelStyle = {
  display: 'block',
  fontSize: '0.84rem',
  color: 'var(--text)',
  marginBottom: '0.4rem',
  fontWeight: '600',
};

export default AdminCommunication;
