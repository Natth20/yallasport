'use client';

import React, { useEffect, useState } from 'react';
import { intervalToDuration, isPast } from 'date-fns';
import { useLocale, useTranslations } from 'next-intl';
import { pick } from '@/i18n/pick';
import { Clock } from 'lucide-react';

interface MatchCountdownProps {
  kickoffAt: Date;
  tone?: 'light' | 'dark';
  compact?: boolean;
  variant?: 'default' | 'detailed' | 'pill';
  className?: string;
}

export const MatchCountdown: React.FC<MatchCountdownProps> = ({
  kickoffAt,
  tone = 'light',
  compact = false,
  variant = 'default',
  className = '',
}) => {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [duration, setDuration] = useState<{
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  }>({});
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const tick = () => {
      if (isPast(kickoffAt)) {
        setFinished(true);
        return false;
      }
      const dur = intervalToDuration({ start: new Date(), end: kickoffAt });
      setDuration({
        days: dur.days ?? 0,
        hours: dur.hours ?? 0,
        minutes: dur.minutes ?? 0,
        seconds: dur.seconds ?? 0,
      });
      return true;
    };

    if (!tick()) return;
    const timer = setInterval(() => {
      if (!tick()) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [kickoffAt]);

  if (finished) return null;

  const days = duration.days ?? 0;
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  // Single line text e.g. "01س 24د 18ث"
  const formattedCompact = [
    days > 0 ? `${days}${pick(locale, 'ي', 'd')}` : '',
    hours > 0 || days > 0 ? `${String(hours).padStart(2, '0')}${pick(locale, 'س', 'h')}` : '',
    `${String(minutes).padStart(2, '0')}${pick(locale, 'د', 'm')}`,
    `${String(seconds).padStart(2, '0')}${pick(locale, 'ث', 's')}`,
  ]
    .filter(Boolean)
    .join(' ');

  if (compact) {
    return <span className={`tabular-nums font-mono font-bold ${className}`}>{formattedCompact || '--'}</span>;
  }

  // Pill badge e.g. on match cards
  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-mono font-black text-primary shadow-xs tabular-nums ${className}`}
      >
        <Clock className="h-2.5 w-2.5 animate-pulse text-primary" />
        <span>{formattedCompact}</span>
      </span>
    );
  }

  // Detailed digital clock tiles (for spotlight cards & headers)
  if (variant === 'detailed') {
    return (
      <div className={`flex flex-col items-center gap-1.5 w-full ${className}`}>
        <span className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
          <Clock className="h-3 w-3 animate-spin-slow text-primary" />
          <span>{pick(locale, 'ينطلق خلال', 'Starts in')}</span>
        </span>
        <div className="flex items-center justify-center gap-1.5 tabular-nums text-center w-full">
          {days > 0 ? (
            <>
              <div className="flex flex-col items-center bg-background/80 border border-primary/30 rounded-xl px-2 py-1 shadow-xs min-w-[38px]">
                <span className="text-sm font-black text-foreground">{days}</span>
                <span className="text-[8px] font-bold text-muted-foreground">{pick(locale, 'يوم', 'day')}</span>
              </div>
              <span className="text-primary font-black text-xs animate-pulse">:</span>
            </>
          ) : null}
          <div className="flex flex-col items-center bg-background/80 border border-primary/30 rounded-xl px-2 py-1 shadow-xs min-w-[38px]">
            <span className="text-sm font-black text-foreground">{String(hours).padStart(2, '0')}</span>
            <span className="text-[8px] font-bold text-muted-foreground">{pick(locale, 'ساعة', 'hrs')}</span>
          </div>
          <span className="text-primary font-black text-xs animate-pulse">:</span>
          <div className="flex flex-col items-center bg-background/80 border border-primary/30 rounded-xl px-2 py-1 shadow-xs min-w-[38px]">
            <span className="text-sm font-black text-foreground">{String(minutes).padStart(2, '0')}</span>
            <span className="text-[8px] font-bold text-muted-foreground">{pick(locale, 'دقيقة', 'min')}</span>
          </div>
          <span className="text-primary font-black text-xs animate-pulse">:</span>
          <div className="flex flex-col items-center bg-background/80 border border-primary/30 rounded-xl px-2 py-1 shadow-xs min-w-[38px]">
            <span className="text-sm font-black text-primary">{String(seconds).padStart(2, '0')}</span>
            <span className="text-[8px] font-bold text-muted-foreground">{pick(locale, 'ثانية', 'sec')}</span>
          </div>
        </div>
      </div>
    );
  }

  const dark = tone === 'dark';

  return (
    <div
      className={`mx-auto flex w-fit flex-col items-center rounded-xl border px-4 py-2 ${
        dark
          ? 'border-orange-400/25 bg-orange-500/10'
          : 'border-orange-500/20 bg-orange-500/10'
      } ${className}`}
    >
      <span
        className={`mb-1 text-[10px] font-black uppercase tracking-widest ${
          dark ? 'text-orange-300' : 'text-orange-500'
        }`}
      >
        {t('before_kickoff')}
      </span>
      <span className={`text-sm font-black tabular-nums ${dark ? 'text-orange-200' : 'text-orange-600'}`}>
        {formattedCompact || '--'}
      </span>
    </div>
  );
};
