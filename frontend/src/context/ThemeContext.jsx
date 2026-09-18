import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const THEMES = [
  {
    id: 'midnight',
    name: 'Midnight Obsidian',
    description: 'Deep cosmic slate with emerald ambient aura',
    bgClass: 'bg-slate-950 text-slate-100',
    swatch: 'from-slate-950 to-slate-900',
    accentColor: '#10b981',
    isDark: true
  },
  {
    id: 'navy',
    name: 'Twilight Navy',
    description: 'Royal deep indigo and atmospheric night sky',
    bgClass: 'bg-[#070e24] text-slate-100',
    swatch: 'from-[#070e24] to-[#0f1d4a]',
    accentColor: '#38bdf8',
    isDark: true
  },
  {
    id: 'emerald',
    name: 'Cyber Emerald',
    description: 'High-contrast futuristic green atmospheric terminal',
    bgClass: 'bg-[#020e08] text-slate-100',
    swatch: 'from-[#020e08] to-[#052614]',
    accentColor: '#34d399',
    isDark: true
  },
  {
    id: 'light',
    name: 'Clean Daylight',
    description: 'High-clarity light theme with crisp contrast',
    bgClass: 'bg-slate-100 text-slate-900',
    swatch: 'from-slate-100 to-slate-200',
    accentColor: '#059669',
    isDark: false
  }
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem('airguard_theme');
      return stored || 'midnight';
    } catch {
      return 'midnight';
    }
  });

  const selectTheme = (themeId) => {
    setTheme(themeId);
    try {
      localStorage.setItem('airguard_theme', themeId);
    } catch (e) {
      console.warn('Could not save theme:', e);
    }
  };

  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0];

  useEffect(() => {
    // Apply background color to body for seamless scrolling
    if (theme === 'midnight') {
      document.body.style.backgroundColor = '#060a14';
      document.documentElement.classList.remove('theme-light', 'theme-navy', 'theme-emerald');
    } else if (theme === 'navy') {
      document.body.style.backgroundColor = '#070e24';
      document.documentElement.classList.add('theme-navy');
      document.documentElement.classList.remove('theme-light', 'theme-emerald');
    } else if (theme === 'emerald') {
      document.body.style.backgroundColor = '#020e08';
      document.documentElement.classList.add('theme-emerald');
      document.documentElement.classList.remove('theme-light', 'theme-navy');
    } else if (theme === 'light') {
      document.body.style.backgroundColor = '#f1f5f9';
      document.documentElement.classList.add('theme-light');
      document.documentElement.classList.remove('theme-navy', 'theme-emerald');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: selectTheme,
        activeTheme,
        themes: THEMES,
        isDark: activeTheme.isDark
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
