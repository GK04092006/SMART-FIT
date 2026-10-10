import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import API from '../services/api';

const LanguageSelector = () => {
  const { language, setLanguage, languages, currentLangObj, t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setOpen(false);
    if (user) {
      API.put('/profile/settings', { language: code }).catch(() => {});
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-theme-selector"
        title={`Language: ${currentLangObj?.nativeName || 'Language'}`}
        aria-label="Select Language"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border, rgba(255,255,255,0.12))',
          borderRadius: 'var(--radius-sm, 8px)',
          color: 'var(--text, #fff)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: '600',
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{currentLangObj?.flag || '🌐'}</span>
        <Globe size={14} style={{ opacity: 0.85 }} />
        <span className="theme-name-label" style={{ display: 'inline', fontWeight: 700 }}>
          {currentLangObj?.nativeName || 'EN'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            background: 'var(--surface, #0f172a)',
            border: '1px solid var(--border, rgba(255,255,255,0.15))',
            borderRadius: 'var(--radius-md, 12px)',
            boxShadow: 'var(--card-shadow, 0 12px 36px rgba(0,0,0,0.5))',
            zIndex: 1100,
            padding: '0.6rem',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.5rem 0.6rem',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
              marginBottom: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: 'var(--muted-text, #94a3b8)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{t('nav_select_language', 'Select Language')}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary, #10b981)', fontWeight: '800' }}>
              {languages.length} LANGS
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '320px', overflowY: 'auto' }}>
            {languages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelectLanguage(l.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.55rem 0.65rem',
                    background: isSelected ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary, #10b981)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: 'var(--text, #fff)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{l.flag}</span>
                    <div>
                      <div style={{ fontWeight: isSelected ? '800' : '600', color: isSelected ? 'var(--primary, #10b981)' : 'var(--text, #fff)' }}>
                        {l.nativeName}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted-text, #94a3b8)' }}>
                        {l.name} • {l.region}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={16} color="var(--primary, #10b981)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
