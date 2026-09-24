'use client';

import React from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface WinProbabilityBarProps {
  homeTeamName: string;
  awayTeamName: string;
  homeProb?: number; // e.g. 48
  drawProb?: number; // e.g. 26
  awayProb?: number; // e.g. 26
  homeRank?: number | null;
  awayRank?: number | null;
  locale?: string;
  compact?: boolean;
}

export function WinProbabilityBar({
  homeTeamName,
  awayTeamName,
  homeProb,
  drawProb,
  awayProb,
  homeRank,
  awayRank,
  locale = 'ar',
  compact = false,
}: WinProbabilityBarProps) {
  const isAr = locale === 'ar';

  // Calculate default plausible probabilities if not directly provided
  let hp = homeProb ?? 45;
  let dp = drawProb ?? 25;
  let ap = awayProb ?? 30;

  if (homeProb === undefined && awayProb === undefined) {
    if (homeRank && awayRank) {
      if (homeRank < awayRank) {
        hp = Math.min(65, 45 + (awayRank - homeRank) * 2);
        ap = Math.max(15, 30 - (awayRank - homeRank) * 1.5);
        dp = 100 - (hp + ap);
      } else if (awayRank < homeRank) {
        ap = Math.min(60, 35 + (homeRank - awayRank) * 2);
        hp = Math.max(18, 40 - (homeRank - awayRank) * 1.5);
        dp = 100 - (hp + ap);
      }
    }
  }

  // Normalize to 100
  const total = hp + dp + ap;
  const hPercent = Math.round((hp / total) * 100);
  const dPercent = Math.round((dp / total) * 100);
  const aPercent = 100 - (hPercent + dPercent);

  if (compact) {
    return (
      <div className="w-full space-y-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-foreground/60 tabular-nums">
          <span className="text-primary">{hPercent}%</span>
          <span className="text-muted-foreground">{dPercent}% {isAr ? 'تعادل' : 'Draw'}</span>
          <span className="text-blue-500">{aPercent}%</span>
        </div>
        <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <div style={{ width: `${hPercent}%` }} className="bg-primary transition-all duration-500" />
          <div style={{ width: `${dPercent}%` }} className="bg-muted-foreground/40 transition-all duration-500" />
          <div style={{ width: `${aPercent}%` }} className="bg-blue-500 transition-all duration-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
            {isAr ? 'احتمالات الفوز الذكية (AI Win Probability)' : 'AI Win Probability'}
          </h4>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
          YallaSport Analytics
        </span>
      </div>

      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/10 p-0.5">
        <div
          style={{ width: `${hPercent}%` }}
          className="rounded-s-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-500"
          title={`${homeTeamName}: ${hPercent}%`}
        />
        <div
          style={{ width: `${dPercent}%` }}
          className="bg-muted-foreground/40 transition-all duration-500"
          title={`${isAr ? 'تعادل' : 'Draw'}: ${dPercent}%`}
        />
        <div
          style={{ width: `${aPercent}%` }}
          className="rounded-e-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
          title={`${awayTeamName}: ${aPercent}%`}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 items-center text-center text-xs">
        <div className="flex flex-col items-start text-start">
          <span className="truncate max-w-[100px] text-[11px] font-bold text-foreground/70">
            {homeTeamName}
          </span>
          <strong className="text-sm font-black text-primary tabular-nums">
            {hPercent}%
          </strong>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[11px] font-bold text-muted-foreground">
            {isAr ? 'التعادل' : 'Draw'}
          </span>
          <strong className="text-sm font-black text-muted-foreground tabular-nums">
            {dPercent}%
          </strong>
        </div>

        <div className="flex flex-col items-end text-end">
          <span className="truncate max-w-[100px] text-[11px] font-bold text-foreground/70">
            {awayTeamName}
          </span>
          <strong className="text-sm font-black text-blue-500 tabular-nums">
            {aPercent}%
          </strong>
        </div>
      </div>
    </div>
  );
}
