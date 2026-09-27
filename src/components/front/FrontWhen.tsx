'use client';

import { useParams } from 'next/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export function FrontWhen({ value }: { value: string }) {
  const params = useParams();
  const locale = params?.locale === 'en' ? 'en' : 'ar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const delta = date.getTime() - Date.now();
  const abs = Math.abs(delta);
  if (abs >= WEEK) {
    return <ClientTime value={value} locale={locale} options={{ day: 'numeric', month: 'short' }} />;
  }

  const rtf = new Intl.RelativeTimeFormat(locale === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  let amount: number;
  let unit: Intl.RelativeTimeFormatUnit;
  if (abs < 60_000) {
    amount = Math.round(delta / 1000);
    unit = 'second';
  } else if (abs < 3_600_000) {
    amount = Math.round(delta / 60_000);
    unit = 'minute';
  } else if (abs < 86_400_000) {
    amount = Math.round(delta / 3_600_000);
    unit = 'hour';
  } else {
    amount = Math.round(delta / 86_400_000);
    unit = 'day';
  }

  return (
    <time dateTime={date.toISOString()} suppressHydrationWarning>
      {rtf.format(amount, unit)}
    </time>
  );
}
