import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  {
    id: 'light',
    name: 'Light',
    type: 'light',
    accent: '#059669',
    secondary: '#0891b2',
    bgPreview: '#ffffff',
    cardPreview: '#f8fafc',
    textPreview: '#0f172a',
    description: 'Clean, radiant daylight interface with crisp emerald and cyan accents.',
  },
  {
    id: 'dark',
    name: 'Dark',
    type: 'dark',
    accent: '#10b981',
    secondary: '#06b6d4',
    bgPreview: '#090d16',
    cardPreview: '#111827',
    textPreview: '#f8fafc',
    description: 'Sleek stealth dark mode engineered for focus, night training, and OLED displays.',
  },
  {
    id: 'adventure-green',
    name: 'Adventure Green',
    type: 'dark',
    accent: '#10b981',
    secondary: '#22c55e',
    bgPreview: '#071810',
    cardPreview: '#0e291c',
    textPreview: '#f0fdf4',
    description: 'Vibrant outdoor trails theme with lush green expedition aesthetics.',
  },
  {
    id: 'mountain-blue',
    name: 'Mountain Blue',
    type: 'dark',
    accent: '#0284c7',
    secondary: '#38bdf8',
    bgPreview: '#051124',
    cardPreview: '#0c2244',
    textPreview: '#f0f9ff',
    description: 'Alpine high-altitude glacier peaks with deep cobalt and ice cyan vitality.',
  },
  {
    id: 'sunset',
    name: 'Sunset Orange',
    type: 'dark',
    accent: '#f97316',
    secondary: '#eab308',
    bgPreview: '#170e09',
    cardPreview: '#29180e',
    textPreview: '#fffbeb',
    description: 'Rich dusk canyon palette with glowing volcanic amber and twilight warmth.',
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'dark',
    accent: '#16a34a',
    secondary: '#84cc16',
    bgPreview: '#08140c',
    cardPreview: '#112217',
    textPreview: '#f0fdf4',
    description: 'Deep rainforest woodland foliage with earthly moss and golden sunshine.',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'dark',
    accent: '#06b6d4',
    secondary: '#0284c7',
    bgPreview: '#041523',
    cardPreview: '#0a2339',
    textPreview: '#f0fdfa',
    description: 'Deep oceanic marine trench with tranquil turquoise and azure currents.',
  },
];

const THEME_ALIASES = {
  'emerald-light': 'light',
  'obsidian-dark': 'dark',
  'alpine-forest': 'forest',
  'oceanic-abyss': 'ocean',
  'sunset-amber': 'sunset',
  'sunset-orange': 'sunset',
  'cyberpunk-neon': 'dark',
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem('app_theme') || localStorage.getItem('theme');
      if (stored) {
        const normalized = THEME_ALIASES[stored] || stored;
        if (THEMES.some((t) => t.id === normalized)) return normalized;
      }
      return 'light';
    } catch {
      return 'light';
    }
  });

  const applyTheme = (themeId) => {
    const normalized = THEME_ALIASES[themeId] || themeId;
    const validTheme = THEMES.some((t) => t.id === normalized) ? normalized : 'light';

    document.documentElement.setAttribute('data-theme', validTheme);
    document.body.setAttribute('data-theme', validTheme);

    // Also support legacy theme attribute for styles that may target aliases
    document.documentElement.setAttribute('data-color-scheme', validTheme);

    try {
      localStorage.setItem('app_theme', validTheme);
      localStorage.setItem('theme', validTheme);
    } catch {}

    setThemeState(validTheme);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const setTheme = (themeId) => {
    applyTheme(themeId);
  };

  const currentThemeObj = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES, currentThemeObj }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
