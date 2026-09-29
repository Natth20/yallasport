'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useTranslations } from 'next-intl';
import styles from './chrome-control.module.css';

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
      className={styles.btn}
      title={label}
      aria-label={label}
      aria-pressed={light}
      suppressHydrationWarning
    >
      {light ? <Moon className={styles.icon} /> : <Sun className={styles.icon} />}
    </button>
  );
}
