'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark' | 'hybrid';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
}

interface ThemePalette {
  background: string;
  backgroundAlt: string;
  text: string;
  textLight: string;
  border: string;
}

interface ThemeConfig {
  mode: ThemeMode;
  allowUserToggle: boolean;
  colors: ThemeColors;
  lightTheme: ThemePalette;
  darkTheme: ThemePalette;
  typography: {
    headingFont: string;
    bodyFont: string;
  };
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  config: ThemeConfig;
}

const defaultConfig: ThemeConfig = {
  mode: 'light',
  allowUserToggle: true,
  colors: {
    primary: '#C9A84C',
    primaryLight: '#E8D48B',
    primaryDark: '#A07D2E',
    accent: '#8B1A1A',
  },
  lightTheme: {
    background: '#FDFBF7',
    backgroundAlt: '#F5F0E8',
    text: '#2C2C2C',
    textLight: '#6B6B6B',
    border: '#E0D8CA',
  },
  darkTheme: {
    background: '#1A1A2E',
    backgroundAlt: '#16213E',
    text: '#F0EDE6',
    textLight: '#B8B5AE',
    border: '#2D2D4A',
  },
  typography: {
    headingFont: 'cormorant',
    bodyFont: 'montserrat',
  },
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  config: defaultConfig,
});

export function useTheme() {
  return useContext(ThemeContext);
}

const fontMap: Record<string, string> = {
  cormorant: "'Cormorant Garamond', Georgia, serif",
  playfair: "'Playfair Display', Georgia, serif",
  baskerville: "'Libre Baskerville', Georgia, serif",
  montserrat: "'Montserrat', 'Helvetica Neue', sans-serif",
  opensans: "'Open Sans', 'Helvetica Neue', sans-serif",
  lato: "'Lato', 'Helvetica Neue', sans-serif",
  sourcesans: "'Source Sans Pro', 'Helvetica Neue', sans-serif",
};

function applyThemeVariables(config: ThemeConfig, activeTheme: ThemeMode) {
  const root = document.documentElement;
  const { colors, lightTheme, darkTheme, typography } = config;

  // Shared colors
  root.style.setProperty('--color-gold', colors.primary);
  root.style.setProperty('--color-gold-light', colors.primaryLight);
  root.style.setProperty('--color-gold-dark', colors.primaryDark);
  root.style.setProperty('--color-accent', colors.accent);

  // Typography
  root.style.setProperty('--font-heading', fontMap[typography.headingFont] || fontMap.cormorant);
  root.style.setProperty('--font-body', fontMap[typography.bodyFont] || fontMap.montserrat);

  // Theme-specific colors
  const palette = activeTheme === 'dark' ? darkTheme : lightTheme;
  root.style.setProperty('--color-bg', palette.background);
  root.style.setProperty('--color-bg-alt', palette.backgroundAlt);
  root.style.setProperty('--color-text', palette.text);
  root.style.setProperty('--color-text-light', palette.textLight);
  root.style.setProperty('--color-border', palette.border);

  // For dark theme, also set the "on dark" colors
  if (activeTheme === 'dark') {
    root.style.setProperty('--color-text-on-dark', palette.text);
    root.style.setProperty('--color-bg-dark', palette.background);
    root.style.setProperty('--color-bg-dark-alt', palette.backgroundAlt);
  } else {
    root.style.setProperty('--color-text-on-dark', darkTheme.text);
    root.style.setProperty('--color-bg-dark', darkTheme.background);
    root.style.setProperty('--color-bg-dark-alt', darkTheme.backgroundAlt);
  }

  // Set data attribute for CSS selectors
  root.dataset.theme = activeTheme;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialConfig?: Partial<ThemeConfig>;
}

export function ThemeProvider({ children, initialConfig }: ThemeProviderProps) {
  const config: ThemeConfig = {
    ...defaultConfig,
    ...initialConfig,
    colors: { ...defaultConfig.colors, ...initialConfig?.colors },
    lightTheme: { ...defaultConfig.lightTheme, ...initialConfig?.lightTheme },
    darkTheme: { ...defaultConfig.darkTheme, ...initialConfig?.darkTheme },
    typography: { ...defaultConfig.typography, ...initialConfig?.typography },
  };

  const [theme, setThemeState] = useState<ThemeMode>(config.mode);
  const [mounted, setMounted] = useState(false);

  // On mount, check localStorage for user preference
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved && config.allowUserToggle) {
      setThemeState(saved);
    }
  }, [config.allowUserToggle]);

  // Apply theme variables whenever theme changes
  useEffect(() => {
    if (mounted) {
      applyThemeVariables(config, theme);
    }
  }, [theme, mounted, config]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    if (config.allowUserToggle) {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: config.mode, setTheme, config }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme toggle button component
export function ThemeToggle() {
  const { theme, setTheme, config } = useTheme();

  if (!config.allowUserToggle) return null;

  const nextTheme = theme === 'light' ? 'dark' : 'light';
  const label = theme === 'light' ? 'Mode sombre' : 'Mode clair';

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className="theme-toggle"
      aria-label={label}
      title={label}
    >
      {theme === 'light' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )}
    </button>
  );
}
