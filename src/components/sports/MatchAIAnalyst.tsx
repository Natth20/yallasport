'use client';

import React from 'react';
import {Activity, ShieldAlert, Zap} from 'lucide-react';
import type { NormalizedMatchEvent, NormalizedStatistic } from '@/lib/sports-data/types';
import { useTranslations } from 'next-intl';
import styles from '@/components/sports/match-dossier.module.css';

export interface MatchAIAnalystProps {
  homeName: string;
  awayName: string;
  homeStats?: NormalizedStatistic;
  awayStats?: NormalizedStatistic;
  events: NormalizedMatchEvent[];
  matchMinute?: number;
}

export function MatchAIAnalyst({
  homeName,
  awayName,
  homeStats,
  awayStats,
  events,
}: MatchAIAnalystProps) {
  const t = useTranslations('sports');
  const notes: Array<{ kind: string; label: string; text: string }> = [];

  if (homeStats?.possession != null && awayStats?.possession != null) {
    const leader =
      homeStats.possession === awayStats.possession
        ? null
        : homeStats.possession > awayStats.possession
          ? homeName
          : awayName;
    notes.push({
      kind: 'possession',
      label: t('possession'),
      text: leader
        ? t('possession_leader', {
            team: leader,
            high: Math.max(homeStats.possession, awayStats.possession),
            low: Math.min(homeStats.possession, awayStats.possession),
          })
        : t('possession_even', { value: homeStats.possession }),
    });
  }

  if (homeStats?.shotsOnTarget != null && awayStats?.shotsOnTarget != null) {
    notes.push({
      kind: 'shooting',
      label: t('shooting'),
      text: t('shots_comparison', {
        homeShots: homeStats.shotsOnTarget,
        home: homeName,
        awayShots: awayStats.shotsOnTarget,
        away: awayName,
      }),
    });
  }

  const yellows = events.filter((event) => event.type === 'YELLOW_CARD').length;
  const reds = events.filter((event) => event.type === 'RED_CARD').length;
  if (yellows > 0 || reds > 0) {
    notes.push({
      kind: 'discipline',
      label: t('discipline'),
      text: [
        yellows > 0 ? t('yellow_cards', { count: yellows }) : '',
        reds > 0 ? t('red_cards', { count: reds }) : '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  if (notes.length === 0) return null;

  return (
    <div className={styles.panelCard}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[var(--ys-orange)]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--foreground)]">
              {t('editorial_reading')}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-[var(--muted-foreground)]">
            AI Analytics
          </span>
        </div>

        <div className={styles.analystList}>
          {notes.map((note) => (
            <div key={note.label} className={styles.analystCard}>
              <div className={styles.analystIcon}>
                {note.kind === 'discipline' ? (
                  <ShieldAlert className="h-4 w-4 text-rose-500" />
                ) : (
                  <Activity className="h-4 w-4 text-[var(--primary)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-wider text-[var(--ys-orange)]">
                  {note.label}
                </span>
                <p className="mt-0.5 text-xs font-bold leading-relaxed text-[var(--foreground)]">
                  {note.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
