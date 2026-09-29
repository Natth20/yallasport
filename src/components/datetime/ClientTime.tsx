'use client';

import { useParams } from 'next/navigation';
import { useSettings } from '@/lib/context/SettingsContext';
import { DEFAULT_TIMEZONE, formatKickoff } from '@/lib/datetime/format';

interface ClientTimeProps {
  value: string | Date;
  fallback?: string;
  className?: string;
  options?: Intl.DateTimeFormatOptions;
  /** Optional locale override — avoids next-intl context during edge SSR/streaming. */
  locale?: string;
  /** Resolved on the client so RSC JSON cannot drop `undefined` Intl keys. */
  variant?: 'clock' | 'day';
}

const CLOCK_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: undefined,
  day: undefined,
  month: undefined,
  hour: '2-digit',
  minute: '2-digit',
};

const DAY_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: undefined,
  hour: undefined,
  minute: undefined,
  day: 'numeric',
  month: 'short',
};

function resolveLanguage(locale: string | undefined): 'en' | 'ar' {
  return locale === 'en' ? 'en' : 'ar';
}

export function ClientTime({
  value,
  fallback,
  className,
  options,
  locale: localeProp,
  variant,
}: ClientTimeProps) {
  const { timezone } = useSettings();
  const params = useParams();
  const paramLocale = typeof params?.locale === 'string' ? params.locale : undefined;
  const language = resolveLanguage(localeProp || paramLocale);
  const resolvedOptions = variant === 'clock' ? CLOCK_OPTIONS : variant === 'day' ? DAY_OPTIONS : options;

  const date = value instanceof Date ? value : new Date(value);
  const iso = Number.isNaN(date.getTime()) ? '' : date.toISOString();
  const label = iso
    ? formatKickoff(iso, timezone || DEFAULT_TIMEZONE, language, resolvedOptions)
    : fallback;

  if (!iso) {
    return fallback ? <span className={className}>{fallback}</span> : null;
  }

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label || fallback}
    </time>
  );
}
