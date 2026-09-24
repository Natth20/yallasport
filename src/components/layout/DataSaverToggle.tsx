'use client';

import React from 'react';
import { Zap, ZapOff } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';
import { useTranslations } from 'next-intl';

/**
 * DataSaverToggle - Reduces live push traffic and caps stream quality.
 */
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
      className={`rounded-full p-2 transition-all ${
        dataSaver
          ? 'bg-orange-500 text-primary-foreground shadow-lg shadow-orange-500/25'
          : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-slate-800'
      }`}
      title={`${label} — ${t('data_saver_hint')}`}
      aria-label={label}
      aria-pressed={dataSaver}
    >
      {dataSaver ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
    </button>
  );
};
