// src/components/layout/ThemeToggle.tsx
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeProvider';
import {useTranslations} from 'next-intl';

export function ThemeToggle() {
  const t = useTranslations('ui');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 text-muted-foreground hover:text-orange-500 transition-colors rounded-full hover:bg-muted dark:hover:bg-slate-800"
      aria-label={t('toggle_theme')}
    >
      {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}
