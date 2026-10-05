'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  History,
  PlayCircle,
  RefreshCw,
  Trophy,
  Users,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { TacticalPitch } from '@/components/sports/TacticalPitch';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { useLocale, useTranslations } from 'next-intl';
import { pick } from '@/i18n/pick';
import type {
  NormalizedLineup,
  NormalizedMatch,
  NormalizedMatchDetail,
  NormalizedMatchEvent,
  NormalizedStatistic,
} from '@/lib/sports-data/types';
import styles from './match-dossier.module.css';

export interface StandingChipData {
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

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
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  homeStanding?: StandingChipData;
  awayStanding?: StandingChipData;
}

const eventLabelKeys = {
  GOAL: 'goal',
  OWN_GOAL: 'own_goal',
  PENALTY: 'penalty',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  VAR: 'var',
} as const;

export function MatchDetailTabs({
  matchId,
  status,
  initialEvents,
  initialLineups,
  initialStatistics,
  h2hMatches,
  homeTeamId,
  awayTeamId,
  homeTeamName,
  awayTeamName,
  homeTeamLogo,
  awayTeamLogo,
  homeStanding,
  awayStanding,
}: MatchDetailTabsProps) {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [lineupView, setLineupView] = useState<'pitch' | 'list'>('pitch');
  const [events, setEvents] = useState(initialEvents);
  const [lineups, setLineups] = useState(initialLineups.filter((l) => l.status === 'CONFIRMED'));
  const [statistics, setStatistics] = useState(initialStatistics);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (status !== 'LIVE' && status !== 'HALFTIME') return;
    const refresh = async () => {
      setUpdating(true);
      try {
        const response = await fetch(`/api/sports/match/${matchId}/live`, { cache: 'no-store' });
        if (!response.ok) return;
        const match: NormalizedMatchDetail = await response.json();
        setEvents(match.events);
        setLineups((match.lineups ?? []).filter((l) => l.status === 'CONFIRMED'));
        setStatistics(match.statistics);
      } finally {
        setUpdating(false);
      }
    };
    const timer = window.setInterval(refresh, 12000);
    return () => window.clearInterval(timer);
  }, [matchId, status]);

  const homeStats = statistics.find((s) => s.teamId === homeTeamId);
  const awayStats = statistics.find((s) => s.teamId === awayTeamId);

  const statisticRows = [
    [t('possession'), homeStats?.possession, awayStats?.possession, '%'],
    [t('shots_on_target'), homeStats?.shotsOnTarget, awayStats?.shotsOnTarget, ''],
    [t('shots_off_target'), homeStats?.shotsOffTarget, awayStats?.shotsOffTarget, ''],
    [t('corners'), homeStats?.corners, awayStats?.corners, ''],
    [t('offsides'), homeStats?.offsides, awayStats?.offsides, ''],
    [t('fouls'), homeStats?.fouls, awayStats?.fouls, ''],
    [t('passes'), homeStats?.passes, awayStats?.passes, ''],
    [t('pass_accuracy'), homeStats?.passAccuracy, awayStats?.passAccuracy, '%'],
    [t('expected_goals'), homeStats?.expectedGoals, awayStats?.expectedGoals, ''],
  ].filter((row) => typeof row[1] === 'number' && typeof row[2] === 'number');

  const defaultTab = events.length > 0 ? 'events' : lineups.length > 0 ? 'lineups' : 'statistics';

  return (
    <div className={styles.panelCard}>
      <Tabs defaultValue={defaultTab} variant="pills">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-border">
          <TabsList className={styles.tabsNav}>
            <TabsTrigger value="events" icon={<Activity className="h-4 w-4" />}>
              {t('events')} ({events.length})
            </TabsTrigger>
            <TabsTrigger value="lineups" icon={<Users className="h-4 w-4" />}>
              {t('lineups')}
            </TabsTrigger>
            <TabsTrigger value="statistics" icon={<PlayCircle className="h-4 w-4" />}>
              {t('statistics')}
            </TabsTrigger>
            {homeStanding || awayStanding ? (
              <TabsTrigger value="standings" icon={<Trophy className="h-4 w-4" />}>
                {pick(locale, 'الترتيب', 'Standings')}
              </TabsTrigger>
            ) : null}
            {h2hMatches.length > 0 ? (
              <TabsTrigger value="h2h" icon={<History className="h-4 w-4" />}>
                {t('head_to_head')}
              </TabsTrigger>
            ) : null}
          </TabsList>

          {updating ? (
            <span className="flex items-center gap-1.5 text-xs text-orange-500 font-bold">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              {t('live')}
            </span>
          ) : null}
        </div>

        {/* ---- Tab 1: Events Timeline ---- */}
        <TabsContent value="events">
          {events.length > 0 ? (
            <div className={styles.eventsTimeline}>
              {events
                .slice()
                .reverse()
                .map((event, idx) => {
                  const isGoal = event.type === 'GOAL' || event.type === 'PENALTY';
                  const isYellow = event.type === 'YELLOW_CARD';
                  const isRed = event.type === 'RED_CARD';
                  const isSub = event.type === 'SUBSTITUTION';
                  const isVar = event.type === 'VAR';

                  const iconClass = isGoal
                    ? styles.eventGoal
                    : isYellow
                      ? styles.eventYellow
                      : isRed
                        ? styles.eventRed
                        : isSub
                          ? styles.eventSub
                          : isVar
                            ? styles.eventVar
                            : styles.eventIcon;

                  return (
                    <div
                      key={event.id || `${event.minute}-${event.type}-${idx}`}
                      className={styles.eventItem}
                    >
                      <span className={iconClass} aria-hidden>
                        {isGoal ? '⚽' : isYellow ? '🟨' : isRed ? '🟥' : isSub ? '🔄' : '📺'}
                      </span>

                      <div>
                        <strong className={styles.eventTitle}>
                          {t(eventLabelKeys[event.type] || event.type)}
                        </strong>
                        <span className={styles.eventSubtitle}>
                          {event.player || event.detail || t('event_details')}
                          {event.assistPlayer ? ` · ${t('assist_by', { player: event.assistPlayer })}` : ''}
                        </span>
                      </div>

                      <span className={styles.eventMinute}>
                        {event.minute}
                        {event.extraMinute ? `+${event.extraMinute}` : ''}&prime;
                      </span>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-muted-foreground font-semibold">
              {t('no_events')}
            </p>
          )}
        </TabsContent>

        {/* ---- Tab 2: Lineups & Tactical Pitch ---- */}
        <TabsContent value="lineups">
          <div className={styles.lineupSection}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {lineupView === 'pitch'
                  ? pick(locale, 'الملعب التكتيكي والتشكيلات', 'Tactical Pitch & Lineups')
                  : pick(locale, 'قائمة اللاعبين والبدلاء', 'Player List & Bench')}
              </h3>

              <div className="flex rounded-xl bg-foreground/5 p-1 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setLineupView('pitch')}
                  className={`rounded-lg px-3 py-1.5 transition-all ${lineupView === 'pitch'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  ⚽ {pick(locale, 'الملعب', 'Pitch')}
                </button>
                <button
                  type="button"
                  onClick={() => setLineupView('list')}
                  className={`rounded-lg px-3 py-1.5 transition-all ${lineupView === 'list'
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  📋 {pick(locale, 'القائمة', 'List')}
                </button>
              </div>
            </div>

            {lineupView === 'pitch' ? (
              <TacticalPitch
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                homeLineup={lineups.find((l) => l.teamId === homeTeamId)}
                awayLineup={lineups.find((l) => l.teamId === awayTeamId)}
                locale={locale}
              />
            ) : (
              <div className={styles.lineupGrid}>
                {[
                  { teamId: homeTeamId, name: homeTeamName, logo: homeTeamLogo },
                  { teamId: awayTeamId, name: awayTeamName, logo: awayTeamLogo },
                ].map((team) => {
                  const lineup = lineups.find((l) => l.teamId === team.teamId);
                  const starters = lineup?.players || [];
                  const bench = lineup?.bench || [];

                  return (
                    <div key={team.teamId} className={styles.lineupCard}>
                      <div className={styles.lineupHeader}>
                        <div className="flex items-center gap-2">
                          <LeagueCrest name={team.name} logoUrl={team.logo} className="h-6 w-6" />
                          <strong className="text-sm font-bold text-foreground">{team.name}</strong>
                        </div>
                        {lineup?.formation ? (
                          <span className={styles.formationBadge}>{lineup.formation}</span>
                        ) : null}
                      </div>

                      {lineup?.coach?.name ? (
                        <p className="text-[11px] text-muted-foreground font-medium mb-3">
                          {pick(locale, 'المدرب:', 'Coach:')} {lineup.coach.name}
                        </p>
                      ) : null}

                      <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">
                        {pick(locale, 'التشكيلة الأساسية', 'Starting XI')}
                      </h4>

                      {starters.length > 0 ? (
                        starters.map((player, i) => (
                          <div
                            key={player.id || `${player.name}-${i}`}
                            className={styles.lineupPlayerRow}
                          >
                            <span className={styles.playerNum}>{player.number ?? i + 1}</span>
                            <span className={styles.playerName}>{player.name}</span>
                            {player.position ? (
                              <span className={styles.playerPos}>{player.position}</span>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          {pick(locale, 'لم تعلن التشكيلة بعد', 'Lineup not announced yet')}
                        </p>
                      )}

                      {bench.length > 0 ? (
                        <>
                          <h4 className="text-xs font-bold text-muted-foreground uppercase mt-4 mb-2">
                            {pick(locale, 'البدلاء', 'Substitutes')}
                          </h4>
                          {bench.map((player, i) => (
                            <div
                              key={player.id || `${player.name}-${i}`}
                              className={styles.lineupPlayerRow}
                            >
                              <span className={styles.playerNum}>{player.number ?? '-'}</span>
                              <span className={styles.playerName}>{player.name}</span>
                              {player.position ? (
                                <span className={styles.playerPos}>{player.position}</span>
                              ) : null}
                            </div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ---- Tab 3: Statistics ---- */}
        <TabsContent value="statistics">
          {statisticRows.length > 0 ? (
            <div className={styles.statsList}>
              <div className="flex justify-between items-center text-xs font-bold text-foreground mb-1">
                <span>{homeTeamName}</span>
                <span>{awayTeamName}</span>
              </div>

              {statisticRows.map(([label, homeVal, awayVal, suffix]) => {
                const home = Number(homeVal);
                const away = Number(awayVal);
                const sum = home + away;
                const homePercent = sum > 0 ? Math.round((home / sum) * 100) : 0;
                const awayPercent = sum > 0 ? 100 - homePercent : 0;

                return (
                  <div key={String(label)} className={styles.statRow}>
                    <div className={styles.statRowHeader}>
                      <span className="tabular-nums font-black">
                        {home}
                        {suffix}
                      </span>
                      <span className={styles.statLabel}>{label}</span>
                      <span className="tabular-nums font-black text-orange-500">
                        {away}
                        {suffix}
                      </span>
                    </div>

                    <div className={styles.statMeterTrack}>
                      <div className={styles.statMeterHome} style={{ width: `${homePercent}%` }} />
                      <div className={styles.statMeterAway} style={{ width: `${awayPercent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-10 text-sm text-muted-foreground font-semibold">
              {t('no_statistics')}
            </p>
          )}
        </TabsContent>

        {/* ---- Tab 4: Standings ---- */}
        {homeStanding || awayStanding ? (
          <TabsContent value="standings">
            <div className="space-y-4">
              {[
                { name: homeTeamName, logo: homeTeamLogo, data: homeStanding },
                { name: awayTeamName, logo: awayTeamLogo, data: awayStanding },
              ]
                .filter((team) => team.data)
                .map((team) => (
                  <div
                    key={team.name}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-border bg-card"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500 text-xs font-black">
                        #{team.data!.rank}
                      </span>
                      <LeagueCrest name={team.name} logoUrl={team.logo} className="h-7 w-7" />
                      <div>
                        <strong className="text-sm font-bold text-foreground">{team.name}</strong>
                        <span className="block text-[10px] text-muted-foreground">
                          {team.data!.played} {pick(locale, 'مباراة', 'played')} · {team.data!.won}{' '}
                          {pick(locale, 'فوز', 'W')} · {team.data!.drawn} {pick(locale, 'تعادل', 'D')} ·{' '}
                          {team.data!.lost} {pick(locale, 'خسارة', 'L')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-black">
                      <span>
                        {team.data!.goalsFor}:{team.data!.goalsAgainst}{' '}
                        <small className="text-[10px] text-muted-foreground font-normal">
                          {pick(locale, 'أهداف', 'goals')}
                        </small>
                      </span>
                      <span className="rounded-xl bg-primary/10 px-3 py-1.5 text-primary">
                        {team.data!.points} {pick(locale, 'نقطة', 'pts')}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        ) : null}

        {/* ---- Tab 5: H2H History ---- */}
        {h2hMatches.length > 0 ? (
          <TabsContent value="h2h">
            <div className={styles.h2hList}>
              {h2hMatches.map((item) => (
                <div key={item.id} className={styles.h2hRow}>
                  <span className="flex-1 truncate">{item.homeTeam.name}</span>
                  <span className={styles.h2hScore}>
                    {typeof item.homeScore === 'number' && typeof item.awayScore === 'number'
                      ? `${item.homeScore} - ${item.awayScore}`
                      : '—'}
                  </span>
                  <span className="flex-1 truncate text-end">{item.awayTeam.name}</span>
                </div>
              ))}
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
