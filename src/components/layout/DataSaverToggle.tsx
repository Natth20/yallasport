'use client';

import React from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTranslations } from 'next-intl';
import styles from './chrome-control.module.css';

export const DataSaverToggle: React.FC = () => {
  const t = useTranslations('ui');
  const { dataSaver, toggleDataSaver } = useSettings();
  const label = dataSaver ? t('data_saver_on') : t('enable_data_saver');

  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleDataSaver();
      }}
      className={`${styles.btn} ${dataSaver ? styles.btnOn : ''}`}
      title={`${label} — ${t('data_saver_hint')}`}
      aria-label={label}
      aria-pressed={dataSaver}
      suppressHydrationWarning
    >
      {dataSaver ? <ZapOff className={styles.icon} /> : <Zap className={styles.icon} />}
    </button>
  );
};
