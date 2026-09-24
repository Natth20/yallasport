'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useTranslations } from 'next-intl';

export function ThemeToggle() {
  const t = useTranslations('ui');
  const { theme, toggleTheme } = useTheme();
  const light = theme === 'light';
  const label = light ? t('theme_to_dark') : t('theme_to_light');

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleTheme();
      }}
      className="rounded-full p-2 text-muted-foreground transition-all hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-slate-800"
      title={label}
      aria-label={label}
      aria-pressed={light}
    >
      {light ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </button>
  );
}
