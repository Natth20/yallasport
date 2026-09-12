'use client';

import React, { useEffect, useState } from 'react';
import { intervalToDuration, isPast } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { pick } from '@/i18n/pick';

interface MatchCountdownProps {
  kickoffAt: Date;
  tone?: 'light' | 'dark';
  compact?: boolean;
}

export const MatchCountdown: React.FC<MatchCountdownProps> = ({ kickoffAt, tone = 'light', compact = false }) => {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [timeLeft, setTimeLeft] = useState('');
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (isPast(kickoffAt)) {
        setFinished(true);
        return false;
      }
      const duration = intervalToDuration({ start: new Date(), end: kickoffAt });
      const parts = [];
      if (duration.days) parts.push(`${duration.days}${pick(locale, 'ي', 'd')}`);
      if (duration.hours || duration.days) parts.push(`${String(duration.hours ?? 0).padStart(2, '0')}${pick(locale, 'س', 'h')}`);
      parts.push(`${String(duration.minutes ?? 0).padStart(2, '0')}${pick(locale, 'د', 'm')}`);
      parts.push(`${String(duration.seconds ?? 0).padStart(2, '0')}${pick(locale, 'ث', 's')}`);
      setTimeLeft(parts.join(' '));
      return true;
    };

    if (!tick()) return;
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [kickoffAt, locale]);

  if (finished) return null;

  if (compact) {
    return <span className="tabular-nums">{timeLeft || '--'}</span>;
  }

  const dark = tone === 'dark';

  return (
    <div className={`mx-auto flex w-fit flex-col items-center rounded-xl border px-4 py-2 ${
      dark
        ? 'border-orange-400/25 bg-orange-500/10'
        : 'border-orange-500/20 bg-orange-500/10'
    }`}>
      <span className={`mb-1 text-[10px] font-black uppercase tracking-widest ${dark ? 'text-orange-300' : 'text-orange-500'}`}>
        {t('before_kickoff')}
      </span>
      <span className={`text-sm font-black tabular-nums ${dark ? 'text-orange-200' : 'text-orange-600'}`}>
        {timeLeft || '--'}
      </span>
    </div>
  );
};
