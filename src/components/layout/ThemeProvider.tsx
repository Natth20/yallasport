'use client';

import React, { createContext, useContext, useEffect, useMemo } from 'react';

type Theme = 'dark';

interface ThemeContextValue {
  theme: 'dark';
  resolvedTheme: 'dark';
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  resolvedTheme: 'dark',
  setTheme: () => undefined,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  }, []);

  const value = useMemo(
    () => ({
      theme: 'dark' as const,
      resolvedTheme: 'dark' as const,
      setTheme: () => undefined,
    }),
    []
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  return context || {
    theme: 'dark' as const,
    resolvedTheme: 'dark' as const,
    setTheme: () => undefined,
  };
}
