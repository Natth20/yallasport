'use client';

import React from 'react';
import { TrendingUp, ShieldCheck } from 'lucide-react';
import styles from '@/components/sports/match-dossier.module.css';

export interface WinProbabilityBarProps {
  homeTeamName: string;
  awayTeamName: string;
  homeProb?: number;
  drawProb?: number;
  awayProb?: number;
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

  if (homeProb == null && awayProb == null && drawProb == null && (homeRank == null || awayRank == null)) {
    return null;
  }

  let hp = homeProb ?? 33;
  let dp = drawProb ?? 34;
  let ap = awayProb ?? 33;

  if (homeProb == null && awayProb == null && homeRank != null && awayRank != null) {
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

  const total = hp + dp + ap;
  const hPercent = Math.round((hp / total) * 100);
  const dPercent = Math.round((dp / total) * 100);
  const aPercent = 100 - (hPercent + dPercent);

  if (compact) {
    return (
      <div className="w-full space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-black tabular-nums">
          <span className="text-emerald-500">{hPercent}%</span>
          <span className="text-[var(--muted-foreground)]">{dPercent}% {isAr ? 'تعادل' : 'Draw'}</span>
          <span className="text-blue-500">{aPercent}%</span>
        </div>
        <div className={styles.winProbBarTrack}>
          <div style={{ width: `${hPercent}%` }} className={styles.winProbSegmentHome} />
          <div style={{ width: `${dPercent}%` }} className={styles.winProbSegmentDraw} />
          <div style={{ width: `${aPercent}%` }} className={styles.winProbSegmentAway} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.panelCard}>
      <div className={styles.winProbBox}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
              {isAr ? 'احتمالات نتيجة اللقاء' : 'Match Outcome Probabilities'}
            </h4>
          </div>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
            {isAr ? 'تقدير تحريري' : 'Editorial index'}
          </span>
        </div>

        <div className={styles.winProbBarTrack}>
          <div
            style={{ width: `${hPercent}%` }}
            className={styles.winProbSegmentHome}
            title={`${homeTeamName}: ${hPercent}%`}
          />
          <div
            style={{ width: `${dPercent}%` }}
            className={styles.winProbSegmentDraw}
            title={`${isAr ? 'التعادل' : 'Draw'}: ${dPercent}%`}
          />
          <div
            style={{ width: `${aPercent}%` }}
            className={styles.winProbSegmentAway}
            title={`${awayTeamName}: ${aPercent}%`}
          />
        </div>

        <div className={styles.winProbValues}>
          <div className="flex flex-col items-start text-start">
            <span className="max-w-[110px] truncate text-[11px] font-bold text-[var(--foreground)]">
              {homeTeamName}
            </span>
            <span className="text-sm font-black tabular-nums text-emerald-500">
              {hPercent}%
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-[11px] font-bold text-[var(--muted-foreground)]">
              {isAr ? 'التعادل' : 'Draw'}
            </span>
            <span className="text-sm font-black tabular-nums text-[var(--muted-foreground)]">
              {dPercent}%
            </span>
          </div>

          <div className="flex flex-col items-end text-end">
            <span className="max-w-[110px] truncate text-[11px] font-bold text-[var(--foreground)]">
              {awayTeamName}
            </span>
            <span className="text-sm font-black tabular-nums text-blue-500">
              {aPercent}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
