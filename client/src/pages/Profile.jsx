import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import {
  User, Phone, Mail, Camera, Save, CheckCircle2, Upload,
  X, Link as LinkIcon, Trash2, AlertCircle,
  ChevronDown, Check, Loader,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

/* ─────────────────────────────────────────────────────────
   Phone country codes
───────────────────────────────────────────────────────── */
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+1',  flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+61', flag: '🇦🇺', name: 'Australia' },
  { code: '+81', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', flag: '🇫🇷', name: 'France' },
  { code: '+86', flag: '🇨🇳', name: 'China' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil' },
  { code: '+7',  flag: '🇷🇺', name: 'Russia' },
  { code: '+971',flag: '🇦🇪', name: 'UAE' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore' },
];

/* ─────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────── */
const parsePhone = (raw = '') => {
  const match = COUNTRY_CODES.find((c) => raw.startsWith(c.code));
  if (match) return { countryCode: match.code, local: raw.slice(match.code.length).trim() };
  return { countryCode: '+91', local: raw };
};

/* ═══════════════════════════════════════════════════════
   Profile Picture Modal
═══════════════════════════════════════════════════════ */
// onApply receives { preview: string, file: File|null }
const PhotoModal = ({ current, onClose, onApply }) => {
  const fileRef = useRef(null);
  const [tab, setTab] = useState('upload'); // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('');
  const [preview, setPreview] = useState(current);
  const [selectedFile, setSelectedFile] = useState(null); // raw File object
  const [dragOver, setDragOver] = useState(false);
  const [urlError, setUrlError] = useState('');

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('File exceeds 5 MB limit.');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    loadFile(e.dataTransfer.files[0]);
  };

  const handleUrlApply = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError('Please enter a URL.'); return; }
    setUrlError('');
    setSelectedFile(null); // URL mode: no file
    setPreview(trimmed);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(6px)', zIndex: 1000,
          animation: 'fadeInBg 0.2s ease',
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          background: 'linear-gradient(145deg,#0f172a,#1e293b)',
          border: '1px solid rgba(5,150,105,0.25)',
          borderRadius: '20px',
          width: 'min(96vw, 520px)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          zIndex: 1001,
          overflow: 'hidden',
          animation: 'slideUpModal 0.28s cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.4rem 1.6rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg,#059669,#10b981)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Camera size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9', fontWeight: 700 }}>
                Update Profile Photo
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>
                JPG, PNG or WebP · max 5 MB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#94a3b8',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94a3b8'; }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ padding: '1.4rem 1.6rem' }}>
          {/* Preview */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.4rem' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={preview}
                alt="Preview"
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=User&size=120&background=059669&color=fff'; }}
                style={{
                  width: 110, height: 110, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid rgba(5,150,105,0.6)',
                  boxShadow: '0 0 0 4px rgba(5,150,105,0.15), 0 8px 24px rgba(0,0,0,0.4)',
                }}
              />
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex', borderRadius: '10px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '4px', marginBottom: '1.2rem',
            }}
          >
            {[
              { id: 'upload', label: 'Upload File', icon: Upload },
              { id: 'url',    label: 'Image URL',  icon: LinkIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px',
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.82rem', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                  transition: 'all 0.18s ease',
                  background: tab === id
                    ? 'linear-gradient(135deg,#059669,#10b981)'
                    : 'transparent',
                  color: tab === id ? '#fff' : '#64748b',
                  boxShadow: tab === id ? '0 2px 8px rgba(5,150,105,0.35)' : 'none',
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {tab === 'upload' ? (
            <>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? '#10b981' : 'rgba(255,255,255,0.12)'}`,
                  borderRadius: '14px',
                  padding: '1.8rem 1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: dragOver
                    ? 'rgba(5,150,105,0.08)'
                    : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                  marginBottom: '0.9rem',
                }}
              >
                <div
                  style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(5,150,105,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 0.75rem',
                    border: '1px solid rgba(5,150,105,0.2)',
                  }}
                >
                  <Upload size={20} color="#10b981" />
                </div>
                <p style={{ margin: '0 0 0.25rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                  <strong style={{ color: '#10b981' }}>Click to browse</strong> or drag &amp; drop
                </p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569' }}>
                  JPG, PNG, WebP — max 5 MB
                </p>
              </div>
              <input
                ref={fileRef} type="file" accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => loadFile(e.target.files[0])}
              />
            </>
          ) : (
            <div style={{ marginBottom: '0.9rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem', fontWeight: 600 }}>
                Paste image URL
              </label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => { setUrlInput(e.target.value); setUrlError(''); }}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid ${urlError ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '10px', padding: '0.6rem 0.9rem',
                    color: '#f1f5f9', fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleUrlApply}
                  style={{
                    background: 'linear-gradient(135deg,#059669,#10b981)',
                    border: 'none', borderRadius: '10px',
                    padding: '0.6rem 1rem', color: '#fff',
                    fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Preview
                </button>
              </div>
              {urlError && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <AlertCircle size={12} /> {urlError}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '0.7rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', color: '#94a3b8',
                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Cancel
            </button>
            <button
              onClick={() => { onApply({ preview, file: selectedFile }); onClose(); }}
              style={{
                flex: 2, padding: '0.7rem',
                background: 'linear-gradient(135deg,#059669,#10b981)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(5,150,105,0.4)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,150,105,0.55)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(5,150,105,0.4)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <Check size={16} /> Apply Photo
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInBg { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUpModal {
          from { opacity:0; transform:translate(-50%,-46%) scale(0.95) }
          to   { opacity:1; transform:translate(-50%,-50%) scale(1) }
        }
      `}</style>
    </>
  );
};

/* ═══════════════════════════════════════════════════════
   Phone Input with Country Code Dropdown
═══════════════════════════════════════════════════════ */
const PhoneInput = ({ value, onChange }) => {
  const { countryCode, local } = parsePhone(value);
  const [code, setCode] = useState(countryCode);
  const [localNum, setLocalNum] = useState(local);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  const filtered = COUNTRY_CODES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search)
  );

  const handleCodeSelect = (c) => {
    setCode(c.code);
    setOpen(false);
    setSearch('');
    onChange(`${c.code} ${localNum}`);
  };

  const handleNumChange = (e) => {
    const digits = e.target.value.replace(/[^\d\s\-()]/g, '');
    setLocalNum(digits);
    onChange(`${code} ${digits}`);
  };

  return (
    <div style={{ position: 'relative', display: 'flex' }}>
      {/* Country code selector */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.35rem',
          padding: '0 0.75rem',
          background: 'rgba(5,150,105,0.08)',
          border: '1px solid rgba(5,150,105,0.25)',
          borderRight: 'none',
          borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
          cursor: 'pointer',
          fontSize: '0.88rem', fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          height: '100%',
          transition: 'all 0.15s ease',
        }}
      >
        <span>{COUNTRY_CODES.find((c) => c.code === code)?.flag || '\uD83C\uDFF3\uFE0F'}</span>
        <span style={{ fontSize: '0.8rem' }}>{code}</span>
        <ChevronDown size={13} style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Local number input */}
      <input
        type="tel"
        placeholder="98765 43210"
        value={localNum}
        onChange={handleNumChange}
        style={{
          flex: 1, paddingLeft: '0.9rem',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          borderLeft: 'none',
        }}
      />

      {/* Dropdown */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 49 }} />
          <div
            ref={dropRef}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0,
              width: '240px',
              background: '#0f172a',
              border: '1px solid rgba(5,150,105,0.3)',
              borderRadius: '12px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              zIndex: 50, overflow: 'hidden',
              animation: 'slideUpModal 0.2s ease',
            }}
          >
            {/* Search */}
            <div style={{ padding: '0.6rem' }}>
              <input
                autoFocus
                placeholder="Search country..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%', padding: '0.45rem 0.7rem',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#f1f5f9',
                  fontSize: '0.8rem', outline: 'none',
                }}
              />
            </div>
            {/* List */}
            <ul
              style={{
                margin: 0, padding: '0 0.4rem 0.4rem',
                maxHeight: '200px', overflowY: 'auto',
                listStyle: 'none',
              }}
            >
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleCodeSelect(c)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center',
                      gap: '0.6rem', padding: '0.5rem 0.6rem',
                      background: c.code === code ? 'rgba(5,150,105,0.15)' : 'transparent',
                      border: 'none', borderRadius: '8px',
                      cursor: 'pointer', color: '#cbd5e1',
                      fontSize: '0.83rem', textAlign: 'left',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = c.code === code ? 'rgba(5,150,105,0.15)' : 'transparent'; }}
                  >
                    <span>{c.flag}</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.78rem' }}>{c.code}</span>
                    {c.code === code && <Check size={13} color="#10b981" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Main Profile Page
═══════════════════════════════════════════════════════ */
const Profile = () => {
  const navigate = useNavigate();
  const { user, updateUser, uploadAvatar } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState('Intermediate');
  const [avatarUrl, setAvatarUrl] = useState(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  // Pending file to upload (set when user applies a file in the modal)
  const [pendingFile, setPendingFile] = useState(null);

  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState('');
  const [photoStatus, setPhotoStatus] = useState(''); // '', 'uploading', 'saved', 'local'

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const { data } = await API.get('/profile/me');
        const currentUser = data.user || data;

        setProfile(currentUser);
        setName(currentUser.name || '');
        setPhone(currentUser.phone || '');
        setBio(currentUser.bio || '');
        setFitnessLevel(currentUser.fitnessLevel || 'Intermediate');
        setAvatarUrl(
          currentUser.avatar
            ? currentUser.avatar.startsWith('http')
              ? currentUser.avatar
              : `/uploads${currentUser.avatar}`
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        );
      } catch (error) {
        console.error('Profile load failed:', error);
        if (user) {
          const fallbackUser = user;
          setProfile(fallbackUser);
          setName(fallbackUser.name || '');
          setPhone(fallbackUser.phone || '');
          setBio(fallbackUser.bio || '');
          setFitnessLevel(fallbackUser.fitnessLevel || 'Intermediate');
          setAvatarUrl(
            fallbackUser.avatar
              ? fallbackUser.avatar.startsWith('http')
                ? fallbackUser.avatar
                : `/uploads${fallbackUser.avatar}`
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
          );
          setLoading(false);
          return;
        }

        if (error.response?.status === 401) {
          navigate('/login');
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [user, navigate]);

  if (loading) return <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>Loading profile...</div>;
  if (!profile) return <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>Unable to load profile. Please sign in again.</div>;

  /* ── Photo apply from modal ── */
  const handlePhotoApply = ({ preview, file }) => {
    setAvatarUrl(preview); // show preview immediately
    setPendingFile(file);  // remember the File for upload on Save
    if (file) {
      setPhotoStatus('pending'); // will upload on Save
    } else {
      // URL mode — no upload needed, will be saved as URL string
      setPhotoStatus('url');
    }
  };

  /* ── Remove photo ── */
  const handleRemovePhoto = () => {
    const generatedUrl = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name || 'User') + '&size=200&background=059669&color=fff';
    setAvatarUrl(generatedUrl);
    setPendingFile(null);
    setPhotoStatus('');
  };

  /* ── Save all changes ── */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    let finalAvatarUrl = avatarUrl;

    // 1. If a new file was selected, upload it first
    if (pendingFile) {
      setUploadingPhoto(true);
      setPhotoStatus('uploading');
      const uploadRes = await uploadAvatar(pendingFile);
      setUploadingPhoto(false);
      if (uploadRes.success) {
        finalAvatarUrl = uploadRes.url;
        setAvatarUrl(uploadRes.url);
        setPendingFile(null);
        setPhotoStatus('saved');
      } else {
        // Upload failed (server offline) — keep base64 preview; save locally only
        setPhotoStatus('local');
        // finalAvatarUrl stays as the base64 — will be saved to localStorage but not DB
      }
    }

    // 2. Save profile fields (including final avatar URL)
    const res = await updateUser({ name, phone, bio, fitnessLevel, avatar: finalAvatarUrl });
    setSaving(false);

    if (res.success) {
      setMessage('Profile saved successfully!');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="main-content">
      <div className="dashboard-layout">
        <Sidebar />

        <main style={{ padding: '2rem 2rem 4rem 1rem', maxWidth: '860px' }}>
          {/* Page header */}
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>Profile &amp; Settings</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Manage your profile credentials and athletic preferences
            </p>
          </div>

          {/* Success banner */}
          {message && (
            <div
              style={{
                background: 'rgba(5,150,105,0.1)',
                border: '1px solid rgba(5,150,105,0.3)',
                color: 'var(--primary-emerald)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.5rem',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontSize: '0.9rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{message}</span>
            </div>
          )}

          {/* Photo upload status banner */}
          {photoStatus === 'uploading' && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1rem', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.3)', borderRadius:'var(--radius-sm)', marginBottom:'1.25rem', fontSize:'0.85rem', color:'#60a5fa' }}>
              <Loader size={15} style={{ animation:'spin 1s linear infinite' }} /> Uploading photo to server…
            </div>
          )}
          {photoStatus === 'saved' && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1rem', background:'rgba(5,150,105,0.1)', border:'1px solid rgba(5,150,105,0.3)', borderRadius:'var(--radius-sm)', marginBottom:'1.25rem', fontSize:'0.85rem', color:'#10b981' }}>
              <CheckCircle2 size={15} /> Photo uploaded &amp; saved to server.
            </div>
          )}
          {photoStatus === 'local' && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1rem', background:'rgba(234,179,8,0.1)', border:'1px solid rgba(234,179,8,0.3)', borderRadius:'var(--radius-sm)', marginBottom:'1.25rem', fontSize:'0.85rem', color:'#fbbf24' }}>
              <AlertCircle size={15} /> Server offline — photo saved locally in your browser.
            </div>
          )}
          {photoStatus === 'pending' && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.65rem 1rem', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'var(--radius-sm)', marginBottom:'1.25rem', fontSize:'0.85rem', color:'#a78bfa' }}>
              <Camera size={15} /> New photo ready — click <strong style={{margin:'0 0.2rem'}}>Save Profile Changes</strong> to upload.
            </div>
          )}

          <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem' }}>

            {/* ── Avatar section ── */}
            <div
              style={{
                display: 'flex', alignItems: 'flex-start',
                gap: '2rem', marginBottom: '2rem',
                paddingBottom: '2rem',
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              {/* Avatar preview */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={avatarUrl}
                  alt="Profile"
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&size=200&background=059669&color=fff`;
                  }}
                  style={{
                    width: '110px', height: '110px', borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--primary-emerald)',
                    display: 'block',
                    boxShadow: '0 4px 18px rgba(5,150,105,0.25)',
                  }}
                />
                {/* Camera overlay */}
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(true)}
                  title="Change photo"
                  style={{
                    position: 'absolute', bottom: '4px', right: '4px',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#059669,#10b981)',
                    border: '2.5px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <Camera size={14} color="#fff" />
                </button>
              </div>

              {/* Upload info & controls */}
              <div style={{ flex: 1, minWidth: '220px' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>Profile Photo</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Upload a photo from your device. JPG, PNG or WebP — max 5 MB.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  {/* Change photo button */}
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    disabled={uploadingPhoto}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.52rem 1.1rem',
                      background: 'linear-gradient(135deg,#059669,#10b981)',
                      border: 'none', borderRadius: '8px',
                      color: '#fff', fontSize: '0.82rem', fontWeight: 600,
                      cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
                      boxShadow: '0 3px 12px rgba(5,150,105,0.3)',
                      transition: 'all 0.15s ease',
                      opacity: uploadingPhoto ? 0.6 : 1,
                    }}
                    onMouseEnter={(e) => { if (!uploadingPhoto) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 5px 16px rgba(5,150,105,0.45)'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 3px 12px rgba(5,150,105,0.3)'; }}
                  >
                    {uploadingPhoto ? <Loader size={14} style={{ animation:'spin 1s linear infinite' }} /> : <Upload size={14} />}
                    {uploadingPhoto ? 'Uploading…' : 'Change Photo'}
                  </button>

                  {/* Remove photo */}
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.52rem 1rem',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px',
                      color: '#f87171', fontSize: '0.82rem', fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                  >
                    <Trash2 size={14} /> Remove
                  </button>
                </div>
              </div>
            </div>

            {/* ── Name & Email ── */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}
            >
              <div>
                <label style={labelStyle}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ width: '100%', paddingLeft: '2.4rem' }}
                  />
                  <User size={16} color="var(--text-dim)" style={iconStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    style={{ width: '100%', paddingLeft: '2.4rem', opacity: 0.5, cursor: 'not-allowed' }}
                  />
                  <Mail size={16} color="var(--text-dim)" style={iconStyle} />
                </div>
              </div>
            </div>

            {/* ── Phone & Fitness Level ── */}
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}
            >
              <div>
                <label style={labelStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={13} style={{ opacity: 0.7 }} />
                    Contact Phone
                  </span>
                </label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>

              <div>
                <label style={{ ...labelStyle, color: 'var(--primary-emerald)' }}>Fitness Level</label>
                <select
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Elite">Elite</option>
                </select>
              </div>
            </div>

            {/* ── Bio ── */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={labelStyle}>Bio &amp; Experience Summary</label>
              <textarea
                rows="4"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about your fitness background and outdoor experience..."
                style={{ width: '100%' }}
              />
            </div>

            {/* ── Save button ── */}
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </main>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <PhotoModal
          current={avatarUrl}
          onClose={() => setShowPhotoModal(false)}
          onApply={handlePhotoApply}
        />
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

/* ── Shared style helpers ─────────────────────── */
const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  color: 'var(--text-muted)',
  marginBottom: '0.4rem',
  fontWeight: '600',
};

const iconStyle = {
  position: 'absolute',
  left: '0.75rem',
  top: '50%',
  transform: 'translateY(-50%)',
  pointerEvents: 'none',
};

export default Profile;
