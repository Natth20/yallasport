'use client';

import { useEffect, useState } from 'react';
import { Activity, History, PlayCircle, RefreshCw, Users } from 'lucide-react';
import type {
  NormalizedLineup,
  NormalizedMatch,
  NormalizedMatchDetail,
  NormalizedMatchEvent,
  NormalizedStatistic,
} from '@/lib/sports-data/types';
import {useTranslations} from 'next-intl';

interface MatchDetailTabsProps {
  matchId: string;
  status: NormalizedMatchDetail['status'];
  initialEvents: NormalizedMatchEvent[];
  initialLineups: NormalizedLineup[];
  initialStatistics: NormalizedStatistic[];
  h2hMatches: NormalizedMatch[];
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
}

type Tab = 'events' | 'lineups' | 'statistics' | 'h2h';

const eventLabelKeys = {
  GOAL: 'goal',
  OWN_GOAL: 'own_goal',
  PENALTY: 'penalty',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  VAR: 'var',
} as const;

export function MatchDetailTabs(props: MatchDetailTabsProps) {
  const t = useTranslations('sports');
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState(props.initialEvents);
  const [lineups, setLineups] = useState(props.initialLineups);
  const [statistics, setStatistics] = useState(props.initialStatistics);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (props.status !== 'LIVE' && props.status !== 'HALFTIME') return;
    const refresh = async () => {
      setUpdating(true);
      try {
        const response = await fetch(`/api/sports/match/${props.matchId}/live`, { cache: 'no-store' });
        if (!response.ok) return;
        const match: NormalizedMatchDetail = await response.json();
        setEvents(match.events);
        setLineups(match.lineups);
        setStatistics(match.statistics);
      } finally {
        setUpdating(false);
      }
    };
    const timer = window.setInterval(refresh, 15000);
    return () => window.clearInterval(timer);
  }, [props.matchId, props.status]);

  const tabs: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: 'events', label: t('events'), icon: Activity },
    { id: 'lineups', label: t('lineups'), icon: Users },
    { id: 'statistics', label: t('statistics'), icon: PlayCircle },
    { id: 'h2h', label: t('head_to_head'), icon: History },
  ];

  const homeStats = statistics.find((item) => item.teamId === props.homeTeamId);
  const awayStats = statistics.find((item) => item.teamId === props.awayTeamId);
  const statisticRows = [
    [t('possession'), homeStats?.possession, awayStats?.possession, '%'],
    [t('shots_on_target'), homeStats?.shotsOnTarget, awayStats?.shotsOnTarget, ''],
    [t('shots_off_target'), homeStats?.shotsOffTarget, awayStats?.shotsOffTarget, ''],
    [t('corners'), homeStats?.corners, awayStats?.corners, ''],
    [t('offsides'), homeStats?.offsides, awayStats?.offsides, ''],
    [t('fouls'), homeStats?.fouls, awayStats?.fouls, ''],
  ].filter((row) => row[1] !== undefined || row[2] !== undefined);

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_25px_70px_-45px_rgba(15,23,42,0.3)] dark:border-border dark:bg-white/[0.035]">
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-muted/70 p-2 no-scrollbar dark:border-border dark:bg-white/[0.025]">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex min-w-28 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[11px] font-bold transition-all ${
              tab === item.id
                ? 'bg-card text-foreground shadow-sm dark:bg-muted/10 dark:text-foreground'
                : 'text-muted-foreground hover:text-foreground dark:hover:text-white'
            }`}
          >
            <item.icon className={`h-3.5 w-3.5 ${tab === item.id ? 'text-orange-500' : ''}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-5 sm:p-8">
        {tab === 'events' && (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">{t('event_timeline')}</h3>
                <p className="mt-1 text-[10px] font-medium text-muted-foreground">{t('event_timeline_description')}</p>
              </div>
              {updating && <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />}
            </div>
            {events.length > 0 ? (
              <div className="relative space-y-3 before:absolute before:bottom-3 before:right-[15px] before:top-3 before:w-px before:bg-muted dark:before:bg-white/10">
                {events.slice().reverse().map((event, index) => (
                  <div key={event.id ?? `${event.minute}-${event.type}-${index}`} className="relative flex gap-4">
                    <span className={`relative z-10 mt-3 h-8 w-8 shrink-0 rounded-full border-4 border-white dark:border-slate-950 ${
                      event.type === 'GOAL' || event.type === 'PENALTY' ? 'bg-emerald-500'
                        : event.type === 'RED_CARD' ? 'bg-red-500'
                          : event.type === 'YELLOW_CARD' ? 'bg-amber-400' : 'bg-orange-500'
                    }`} />
                    <div className="flex flex-1 items-center justify-between rounded-xl bg-muted px-4 py-3 dark:bg-card/[0.04]">
                      <div>
                        <strong className="block text-sm text-foreground dark:text-foreground">{t(eventLabelKeys[event.type])}</strong>
                        <span className="mt-0.5 block text-[10px] font-medium text-muted-foreground">
                          {event.player || event.detail || t('event_details')}
                          {event.assistPlayer ? t('assist_by', {player: event.assistPlayer}) : ''}
                        </span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-orange-500">
                        {event.minute}{event.extraMinute ? `+${event.extraMinute}` : ''}&prime;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text={t('no_events')} />
            )}
          </div>
        )}

        {tab === 'lineups' && (
          lineups.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2">
              {lineups.map((lineup) => (
                <div key={`${lineup.teamId}-${lineup.status}`} className="rounded-2xl border border-border p-5 dark:border-border">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <strong className="text-sm text-foreground dark:text-foreground">
                        {lineup.teamId === props.homeTeamId ? props.homeTeamName : props.awayTeamName}
                      </strong>
                      <span className="mt-1 block text-[9px] font-medium text-muted-foreground">{t('formation', {formation: lineup.formation || t('unannounced')})}</span>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[8px] font-bold ${
                      lineup.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10'
                    }`}>
                      {lineup.status === 'CONFIRMED' ? t('confirmed') : t('predicted')}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {lineup.players.map((player, index) => (
                      <div key={player.id || `${player.name}-${index}`} className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 dark:bg-card/[0.04]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-[9px] font-bold text-orange-500 shadow-sm dark:bg-muted/10">
                          {player.number ?? index + 1}
                        </span>
                        <span className="flex-1 truncate text-[11px] font-semibold text-foreground dark:text-muted-foreground">{player.name}</span>
                        <span className="text-[8px] font-medium text-muted-foreground">{player.position}</span>
                      </div>
                    ))}
                  </div>
                  {lineup.status === 'PREDICTED' && (
                    <p className="mt-4 text-[9px] leading-5 text-amber-600">{t('prediction_disclaimer')}</p>
                  )}
                </div>
              ))}
            </div>
          ) : <EmptyState text={t('no_lineups')} />
        )}

        {tab === 'statistics' && (
          statisticRows.length > 0 ? (
            <div className="space-y-5">
              <div className="flex justify-between text-xs font-bold text-foreground dark:text-foreground">
                <span>{props.homeTeamName}</span>
                <span>{props.awayTeamName}</span>
              </div>
              {statisticRows.map(([label, homeValue, awayValue, suffix]) => {
                const home = Number(homeValue ?? 0);
                const away = Number(awayValue ?? 0);
                const total = Math.max(home + away, 1);
                return (
                  <div key={String(label)}>
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <strong className="w-12 text-foreground dark:text-foreground">{home}{suffix}</strong>
                      <span className="font-medium text-muted-foreground">{label}</span>
                      <strong className="w-12 text-left text-foreground dark:text-foreground">{away}{suffix}</strong>
                    </div>
                    <div className="flex h-1.5 overflow-hidden rounded-full bg-muted dark:bg-muted/10">
                      <div className="bg-orange-500" style={{ width: `${home / total * 100}%` }} />
                      <div className="bg-slate-800 dark:bg-slate-300" style={{ width: `${away / total * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState text={t('no_statistics')} />
        )}

        {tab === 'h2h' && (
          props.h2hMatches.length > 0 ? (
            <div className="space-y-2">
              {props.h2hMatches.slice(0, 5).map((match) => (
                <div key={match.id} className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 text-[11px] dark:bg-card/[0.04]">
                  <span className="flex-1 truncate font-semibold">{match.homeTeam.name}</span>
                  <strong className="mx-4 rounded-lg bg-card px-3 py-1.5 tabular-nums shadow-sm dark:bg-muted/10">
                    {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                      ? `${match.homeScore} - ${match.awayScore}`
                      : '—'}
                  </strong>
                  <span className="flex-1 truncate text-left font-semibold">{match.awayTeam.name}</span>
                </div>
              ))}
            </div>
          ) : <EmptyState text={t('no_h2h')} />
        )}
      </div>
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border px-5 py-14 text-center text-sm font-medium text-muted-foreground dark:border-border">
      {text}
    </div>
  );
}
