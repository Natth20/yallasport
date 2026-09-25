'use client';

import React from 'react';
import { Activity, ShieldAlert } from 'lucide-react';
import type { NormalizedMatchEvent, NormalizedStatistic } from '@/lib/sports-data/types';
import {useTranslations} from 'next-intl';

export function MatchAIAnalyst({
  homeName,
  awayName,
  homeStats,
  awayStats,
  events,
}: {
  homeName: string;
  awayName: string;
  homeStats?: NormalizedStatistic;
  awayStats?: NormalizedStatistic;
  events: NormalizedMatchEvent[];
  matchMinute?: number;
}) {
  const t = useTranslations('sports');
  const notes: Array<{ kind: string; label: string; text: string }> = [];

  if (homeStats?.possession != null && awayStats?.possession != null) {
    const leader = homeStats.possession === awayStats.possession
      ? null
      : homeStats.possession > awayStats.possession
        ? homeName
        : awayName;
    notes.push({
      kind: 'possession',
      label: t('possession'),
      text: leader
        ? t('possession_leader', {team: leader, high: Math.max(homeStats.possession, awayStats.possession), low: Math.min(homeStats.possession, awayStats.possession)})
        : t('possession_even', {value: homeStats.possession}),
    });
  }

  if (homeStats?.shotsOnTarget != null && awayStats?.shotsOnTarget != null) {
    notes.push({
      kind: 'shooting',
      label: t('shooting'),
      text: t('shots_comparison', {homeShots: homeStats.shotsOnTarget, home: homeName, awayShots: awayStats.shotsOnTarget, away: awayName}),
    });
  }

  const yellows = events.filter((event) => event.type === 'YELLOW_CARD').length;
  const reds = events.filter((event) => event.type === 'RED_CARD').length;
  if (yellows > 0 || reds > 0) {
    notes.push({
      kind: 'discipline',
      label: t('discipline'),
      text: [
        yellows > 0 ? t('yellow_cards', {count: yellows}) : '',
        reds > 0 ? t('red_cards', {count: reds}) : '',
      ]
        .filter(Boolean)
        .join(' · '),
    });
  }

  if (notes.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {t('editorial_reading')}
      </p>
      {notes.map((note) => (
        <div key={note.label} className="flex gap-3 rounded-2xl bg-muted px-4 py-3 dark:bg-card/[0.04]">
          {note.kind === 'discipline' ? (
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          )}
          <div>
            <span className="block text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{note.label}</span>
            <p className="mt-1 text-[13px] font-medium leading-6 text-foreground">{note.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
