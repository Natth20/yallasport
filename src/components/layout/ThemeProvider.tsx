'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  THEME_COOKIE,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from '@/lib/theme/preference';

type Theme = ThemePreference;

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => undefined,
  toggleTheme: () => undefined,
});

function persistTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* storage blocked */
  }
}

function readClientTheme(): Theme | null {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${THEME_COOKIE}=(light|dark)`));
    if (match?.[1] === 'light' || match?.[1] === 'dark') return match[1];
  } catch {
    /* cookie blocked */
  }
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    /* storage blocked */
  }
  return null;
}

export function ThemeProvider({
  children,
  initialTheme = 'dark',
}: {
  children: React.ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readClientTheme();
    const fromDom = document.documentElement.classList.contains('light') ? 'light' : 'dark';
    const next = stored ?? fromDom;
    setThemeState(next);
    persistTheme(next);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    persistTheme(theme);
  }, [ready, theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: theme,
      setTheme,
      toggleTheme,
    }),
    [theme, setTheme, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
