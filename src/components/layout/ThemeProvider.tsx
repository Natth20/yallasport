'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function persistTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
    document.cookie = `yalla-theme=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  } catch {
    /* ignore quota / private mode */
  }
}

function applyTheme(theme: Theme) {
  const resolved = theme === 'system' ? systemTheme() : theme;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const next: Theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
      persistTheme(next);
      setThemeState(next);
      setResolvedTheme(applyTheme(next));
    } catch {
      setResolvedTheme(applyTheme('system'));
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (theme === 'system') setResolvedTheme(applyTheme('system'));
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    setThemeState(next);
    persistTheme(next);
    setResolvedTheme(applyTheme(next));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      theme: 'system' as Theme,
      resolvedTheme: 'light' as const,
      setTheme: () => undefined,
    };
  }
  return context;
}
