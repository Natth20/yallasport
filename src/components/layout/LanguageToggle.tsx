'use client';

import React from 'react';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Languages } from 'lucide-react';
import styles from './chrome-control.module.css';

export const LanguageToggle: React.FC = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = () => {
    const query = window.location.search.replace(/^\?/, '');
    router.replace(`${pathname}${query ? `?${query}` : ''}`, {
      locale: locale === 'ar' ? 'en' : 'ar',
    });
  };

  return (
    <button
      type="button"
      onClick={switchLocale}
      className={`${styles.btn} ${styles.lang}`}
      aria-label={locale === 'ar' ? 'التبديل إلى الإنجليزية' : 'Switch to Arabic'}
    >
      <Languages className={styles.icon} />
      <span>{locale === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  );
};
