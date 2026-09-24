'use client';

import { Clock3 } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';
import {useTranslations} from 'next-intl';

const timezones = [
  { value: 'auto', label: 'timezone_auto' },
  { value: 'Asia/Riyadh', label: 'riyadh' },
  { value: 'Asia/Amman', label: 'amman' },
  { value: 'Africa/Cairo', label: 'cairo' },
  { value: 'Asia/Dubai', label: 'dubai' },
  { value: 'Europe/London', label: 'london' },
] as const;

export function TimezoneSelector() {
  const t = useTranslations('sports');
  const { timezone, timezoneMode, setTimezone } = useSettings();

  return (
    <label className="inline-flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
      <Clock3 className="h-3.5 w-3.5 text-orange-500" />
      <span>{t('timezone')}</span>
      <select
        value={timezoneMode === 'auto' ? 'auto' : timezone}
        onChange={(event) => setTimezone(event.target.value)}
        className="rounded-lg border border-border bg-card px-2 py-1.5 text-[10px] font-semibold text-foreground outline-none focus:border-orange-500/40 dark:border-border dark:bg-background dark:text-foreground"
      >
        {timezones.map((item) => (
          <option key={item.value} value={item.value}>{t(item.label)}</option>
        ))}
      </select>
    </label>
  );
}
