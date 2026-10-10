import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector = () => {
  const { theme, setTheme, themes, currentThemeObj } = useTheme();
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

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="btn-theme-selector"
        title={`Current Theme: ${currentThemeObj?.name || 'Theme'}`}
        aria-label="Select Theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.45rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.08)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: '600',
          transition: 'all 0.2s ease',
        }}
      >
        <span
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: currentThemeObj?.accent || '#10b981',
            boxShadow: `0 0 6px ${currentThemeObj?.accent || '#10b981'}`,
            display: 'inline-block',
          }}
        />
        <Palette size={14} style={{ opacity: 0.85 }} />
        <span className="theme-name-label" style={{ display: 'inline' }}>
          {currentThemeObj?.name || 'Theme'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '260px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--card-shadow), 0 12px 36px rgba(0,0,0,0.45)',
            zIndex: 1100,
            padding: '0.6rem',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.5rem 0.6rem',
              borderBottom: '1px solid var(--border)',
              marginBottom: '0.4rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              color: 'var(--muted-text)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>Select Global Theme</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '800' }}>
              {themes.length} THEMES
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: '320px', overflowY: 'auto' }}>
            {themes.map((t) => {
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.5rem 0.65rem',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid var(--primary)' : '1px solid transparent',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {/* Visual Color Swatch Preview */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '2px',
                        background: t.bgPreview,
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                      }}
                    >
                      <span style={{ width: '8px', height: '14px', background: t.accent, borderRadius: '2px 0 0 2px' }} />
                      <span style={{ width: '8px', height: '14px', background: t.secondary, borderRadius: '0 2px 2px 0' }} />
                    </div>

                    <div>
                      <div style={{ fontWeight: isSelected ? '700' : '500', color: 'var(--text)' }}>
                        {t.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--muted-text)' }}>
                        {t.type === 'light' ? 'Light Mode' : 'Dark Mode'}
                      </div>
                    </div>
                  </div>

                  {isSelected && <Check size={16} color="var(--primary)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
