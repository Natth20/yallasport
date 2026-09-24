'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from '@/i18n/navigation';
import { RefreshCw } from 'lucide-react';
import { LiveScoreDigits } from '@/components/sports/LiveScoreDigits';
import { ClientTime } from '@/components/datetime/ClientTime';
import { DeskRule } from '@/components/news/NewsOrnaments';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { BrandMark } from '@/components/brand/BrandMark';
import { EntityFrame, EntityHero } from '@/components/entity/EntityFrame';
import { Reveal } from '@/components/motion/PageMotion';
import type {
  NormalizedLineup,
  NormalizedLineupPlayer,
  NormalizedMatch,
  NormalizedMatchDetail,
  NormalizedMatchEvent,
} from '@/lib/sports-data/types';
import { useLocale, useTranslations } from 'next-intl';

const eventLabelKeys = {
  GOAL: 'goal',
  OWN_GOAL: 'own_goal',
  PENALTY: 'penalty',
  YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card',
  SUBSTITUTION: 'substitution',
  VAR: 'var',
} as const;

const goalTypes = new Set(['GOAL', 'OWN_GOAL', 'PENALTY']);

export type FormLetter = 'W' | 'D' | 'L';

export type StandingChip = {
  rank: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
};

type DossierMatch = Pick<
  NormalizedMatchDetail,
  | 'id'
  | 'status'
  | 'minute'
  | 'homeScore'
  | 'awayScore'
  | 'kickoffAt'
  | 'homeTeam'
  | 'awayTeam'
  | 'league'
  | 'events'
  | 'lineups'
  | 'statistics'
  | 'channels'
  | 'commentators'
  | 'referee'
  | 'venueDetail'
  | 'venue'
  | 'round'
  | 'attendance'
>;

function belongsToTeam(teamId: string, team: { id: string; externalId: string }) {
  return teamId === team.id || teamId === team.externalId;
}

function isLiveStatus(status: string) {
  return status === 'LIVE' || status === 'HALFTIME';
}

function minuteLabel(event: NormalizedMatchEvent) {
  return `${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ''}`;
}

function shortName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

function buildPitchRows(lineup: NormalizedLineup): NormalizedLineupPlayer[][] | null {
  const starters = lineup.players.filter((player) => !player.isSubstitute);
  if (starters.length < 8) return null;

  const gridded = starters.filter((player) => player.grid && /^\d+:\d+$/.test(player.grid));
  if (gridded.length >= 8) {
    const byRow = new Map<number, Array<NormalizedLineupPlayer & { col: number }>>();
    for (const player of gridded) {
      const [row, col] = player.grid!.split(':').map(Number);
      const current = byRow.get(row) ?? [];
      current.push({ ...player, col });
      byRow.set(row, current);
    }
    return Array.from(byRow.entries())
      .sort((first, second) => first[0] - second[0])
      .map(([, players]) => players.sort((first, second) => first.col - second.col));
  }

  const parts = lineup.formation
    ?.split('-')
    .map((value) => Number(value))
    .filter((value) => value > 0);
  if (!parts || parts.length < 2) return null;

  const rows: NormalizedLineupPlayer[][] = [starters.slice(0, 1)];
  let cursor = 1;
  for (const count of parts) {
    rows.push(starters.slice(cursor, cursor + count));
    cursor += count;
  }
  return rows.some((row) => row.length === 0) ? null : rows;
}

function SectionHead({
  folio,
  kicker,
  title,
  note,
}: {
  folio: string;
  kicker: string;
  title: string;
  note?: string;
}) {
  return (
    <div className="match-section-head">
      <div className="match-section-kicker-row">
        <span className="match-folio-mark" aria-hidden>
          {folio}
        </span>
        <span className="atlas-section-kicker">{kicker}</span>
      </div>
      <h2 className="match-section-title">{title}</h2>
      {note ? <p className="match-section-note">{note}</p> : null}
      <DeskRule className="mt-3 max-w-sm opacity-50" />
    </div>
  );
}

export function MatchDossier({
  initial,
  h2hMatches,
  homeStanding,
  awayStanding,
  homeForm = [],
  awayForm = [],
  h2hTally,
  leagueCountry,
  headerActions,
  children,
}: {
  initial: DossierMatch;
  h2hMatches: NormalizedMatch[];
  homeStanding?: StandingChip;
  awayStanding?: StandingChip;
  homeForm?: FormLetter[];
  awayForm?: FormLetter[];
  h2hTally?: { home: number; draw: number; away: number };
  leagueCountry?: string;
  headerActions?: ReactNode;
  children?: ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations('sports');
  const [match, setMatch] = useState(initial);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isLiveStatus(initial.status)) return;
    const refresh = async () => {
      setUpdating(true);
      try {
        const response = await fetch(`/api/sports/match/${initial.id}/live`, { cache: 'no-store' });
        if (!response.ok) return;
        const next: NormalizedMatchDetail = await response.json();
        setMatch((current) => ({
          ...current,
          status: next.status,
          minute: next.minute,
          homeScore: next.homeScore,
          awayScore: next.awayScore,
          events: next.events ?? current.events,
          lineups: (next.lineups ?? current.lineups).filter((lineup) => lineup.status === 'CONFIRMED'),
          statistics: next.statistics ?? current.statistics,
          attendance: next.attendance ?? current.attendance,
        }));
      } finally {
        setUpdating(false);
      }
    };
    const timer = window.setInterval(refresh, 12000);
    void refresh();
    return () => window.clearInterval(timer);
  }, [initial.id, initial.status]);

  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  const homeStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.homeTeam));
  const awayStats = match.statistics.find((item) => belongsToTeam(item.teamId, match.awayTeam));
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

  const scorers = useMemo(
    () =>
      match.events
        .filter((event) => goalTypes.has(event.type))
        .map((event) => ({
          ...event,
          isHome: belongsToTeam(event.teamId, match.homeTeam),
        })),
    [match.events, match.homeTeam.id]
  );

  const officialLineups = match.lineups.filter((lineup) => lineup.status === 'CONFIRMED');
  const homeLineup = officialLineups.find((lineup) => belongsToTeam(lineup.teamId, match.homeTeam));
  const awayLineup = officialLineups.find((lineup) => belongsToTeam(lineup.teamId, match.awayTeam));
  const venueName = match.venueDetail?.name || (typeof match.venue === 'string' ? match.venue : undefined);
  const orderedEvents = live ? match.events.slice().reverse() : match.events;
  const clockProgress = Math.min(100, Math.max(4, ((match.minute ?? 0) / 90) * 100));

  const metaChips = [
    match.round,
    venueName,
    match.venueDetail?.city,
    match.referee?.name ? t('referee', { name: match.referee.name }) : null,
    typeof match.attendance === 'number'
      ? t('seats', { count: match.attendance.toLocaleString(locale) })
      : null,
  ].filter(Boolean) as string[];

  const signature = statisticRows.slice(0, 3).map(([label, homeValue, awayValue, suffix]) => ({
    label: String(label),
    value: `${Number(homeValue)}${suffix} — ${Number(awayValue)}${suffix}`,
  }));

  const folioNav = [
    statisticRows.length > 0 ? { href: '#folio-numbers', label: t('statistics'), folio: '01' } : null,
    { href: '#folio-events', label: t('events'), folio: '02' },
    { href: '#folio-lineups', label: t('lineups'), folio: '03' },
    h2hMatches.length > 0 ? { href: '#folio-history', label: t('previous_meetings'), folio: '04' } : null,
  ].filter(Boolean) as Array<{ href: string; label: string; folio: string }>;

  const ghostMark = live ? 'LIVE' : finished ? 'FT' : 'VS';

  return (
    <EntityFrame tone="match">
    <div className="match-dossier ys-dossier-stack">
      <EntityHero>
      <section className="match-hero">
        <div className="match-hero-grid" aria-hidden />
        <span className="match-hero-foil" aria-hidden />
        <span className="match-hero-ghost" aria-hidden>
          {ghostMark}
        </span>
        <div className="match-hero-vignette" aria-hidden />
        <span className="match-hero-corner is-tl" aria-hidden />
        <span className="match-hero-corner is-tr" aria-hidden />
        <span className="match-hero-corner is-bl" aria-hidden />
        <span className="match-hero-corner is-br" aria-hidden />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-10 pt-5 sm:px-8 lg:px-12">
          <div className="match-edition-bar mb-7">
            <Link href="/matches" className="match-back-link">
              {t('back_to_matches')}
            </Link>
            <span className="match-edition-mark inline-flex items-center gap-2" aria-hidden>
              <BrandMark size={28} />
              YS · MATCH
            </span>
            {headerActions ? <div className="match-hero-actions">{headerActions}</div> : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              {match.league.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={match.league.logoUrl} alt="" className="h-6 w-6 object-contain" />
              ) : null}
              <Link href={`/league/${match.league.slug}`} className="match-league-pill">
                {match.league.name}
                {leagueCountry ? ` · ${leagueCountry}` : ''}
              </Link>
              {match.round ? <span className="match-meta-chip">{match.round}</span> : null}
            </div>
            <div className="flex items-center gap-2">
              {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin text-orange-400" /> : null}
              {live ? (
                <span className="match-status-chip is-live">
                  <span className="match-status-dot" />
                  {match.status === 'HALFTIME'
                    ? t('halftime')
                    : match.minute
                      ? `${t('live')} ${match.minute}'`
                      : t('live')}
                </span>
              ) : (
                <span className="match-status-chip">
                  {finished ? t('finished') : <ClientTime value={match.kickoffAt} />}
                </span>
              )}
            </div>
          </div>

          <div className="match-scoreboard-stage mt-10">
            <span className="match-scoreboard-orbit" aria-hidden />
            <div className="match-scoreboard">
              <TeamCrestColumn
                team={match.homeTeam}
                scorers={scorers.filter((event) => event.isHome)}
                standing={homeStanding}
                form={homeForm}
                formation={homeLineup?.formation}
                align="end"
              />

              <div className="match-score-center">
                <div className="match-score-ring">
                  <LiveScoreDigits home={match.homeScore} away={match.awayScore} />
                  {live ? (
                    <div className="match-clock-track">
                      <div className="match-clock-fill" style={{ width: `${clockProgress}%` }} />
                    </div>
                  ) : null}
                </div>
                <span className="match-score-caption">
                  {live ? t('score_now') : finished ? t('final_score') : t('before_kickoff')}
                </span>
              </div>

              <TeamCrestColumn
                team={match.awayTeam}
                scorers={scorers.filter((event) => !event.isHome)}
                standing={awayStanding}
                form={awayForm}
                formation={awayLineup?.formation}
                align="start"
              />
            </div>
          </div>

          {metaChips.length > 0 ? (
            <div className="match-meta-row mt-8">
              {metaChips.map((chip) => (
                <span key={chip}>{chip}</span>
              ))}
            </div>
          ) : null}

          {signature.length > 0 ? (
            <div className="match-signature-rail mt-10">
              <div className="match-signature-rail-label">
                <span>{t('match_signature')}</span>
                <DeskRule className="max-w-[8rem] opacity-40" />
              </div>
              <div className="match-signature">
                {signature.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`match-signature-tile${index === 0 ? ' is-lead' : ''}`}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>
      </EntityHero>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12">
        {folioNav.length > 0 ? (
          <nav className="match-folio-nav match-folio-nav-sticky mb-10" aria-label={t('match_sections')}>
            {folioNav.map((section) => (
              <a key={section.href} href={section.href} className="match-folio-nav-link">
                <em>{section.folio}</em>
                {section.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="match-body-grid">
          <Reveal className="match-main-column space-y-10">
            {statisticRows.length > 0 ? (
              <section id="folio-numbers" className="match-plate match-plate-accent scroll-mt-28 club-rise">
                <SectionHead folio="01" kicker={t('statistics')} title={t('numbers_duet')} />
                <div className="match-stat-lead mb-6">
                  {statisticRows.slice(0, 3).map(([label, homeValue, awayValue, suffix], index) => (
                    <div
                      key={String(label)}
                      className={`match-stat-lead-cell${index === 0 ? ' is-featured' : ''}`}
                    >
                      <span>{label}</span>
                      <strong>
                        {Number(homeValue)}
                        {suffix}
                        <em>—</em>
                        {Number(awayValue)}
                        {suffix}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="mb-5 flex items-center justify-between gap-3 text-[11px] font-bold text-foreground dark:text-foreground">
                  <span className="flex min-w-0 items-center gap-2">
                    <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-6 w-6" />
                    <span className="truncate">{match.homeTeam.name}</span>
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{match.awayTeam.name}</span>
                    <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-6 w-6" />
                  </span>
                </div>
                <div className="space-y-4">
                  {statisticRows.map(([label, homeValue, awayValue, suffix], index) => {
                    const home = Number(homeValue);
                    const away = Number(awayValue);
                    const total = Math.max(home + away, 1);
                    return (
                      <div
                        key={String(label)}
                        className="match-bar-row"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <div className="mb-1.5 flex items-center justify-between text-[11px]">
                          <strong className="w-16 tabular-nums text-foreground dark:text-foreground">
                            {home}
                            {suffix}
                          </strong>
                          <span className="font-medium text-muted-foreground">{label}</span>
                          <strong className="w-16 text-left tabular-nums text-foreground dark:text-foreground">
                            {away}
                            {suffix}
                          </strong>
                        </div>
                        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted dark:bg-muted/10">
                          <div className="bg-orange-500" style={{ width: `${(home / total) * 100}%` }} />
                          <div
                            className="bg-emerald-800 dark:bg-emerald-300"
                            style={{ width: `${(away / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section id="folio-events" className="match-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio="02"
                  kicker={t('events')}
                  title={t('event_sheet')}
                  note={t('events_provider_note')}
                />
                {match.events.length > 0 ? (
                  <>
                <div className="mb-4 hidden grid-cols-[1fr_3.25rem_1fr] text-[9px] font-bold text-muted-foreground sm:grid">
                  <span className="text-right">{match.homeTeam.name}</span>
                  <span className="text-center">{t('minute_short')}</span>
                  <span>{match.awayTeam.name}</span>
                </div>
                <ol className="relative space-y-1.5">
                  <span className="event-spine pointer-events-none absolute bottom-3 left-1/2 top-3 hidden w-px -translate-x-1/2 sm:block" />
                  {orderedEvents.map((event, index) => {
                    const homeEvent = belongsToTeam(event.teamId, match.homeTeam);
                    return (
                      <li
                        key={event.id ?? `${event.minute}-${event.type}-${index}`}
                        className="grid items-center gap-2 sm:grid-cols-[1fr_3.25rem_1fr]"
                      >
                        <EventChip event={event} active={homeEvent} align="end" />
                        <span
                          className={`relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-bold tabular-nums shadow-sm ${
                            event.type === 'GOAL' || event.type === 'PENALTY'
                              ? 'bg-emerald-500 text-white'
                              : event.type === 'RED_CARD'
                                ? 'bg-red-500 text-white'
                                : event.type === 'YELLOW_CARD'
                                  ? 'bg-amber-400 text-foreground'
                                  : 'bg-orange-500 text-primary-foreground'
                          }`}
                        >
                          {minuteLabel(event)}
                        </span>
                        <EventChip event={event} active={!homeEvent} align="start" />
                      </li>
                    );
                  })}
                </ol>
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('no_events')}
                  </p>
                )}
              </section>

              <section id="folio-lineups" className="match-plate scroll-mt-28 club-rise">
                <SectionHead folio="03" kicker={t('lineups')} title={t('pitch_lineups')} />
                {officialLineups.length > 0 ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  {officialLineups.map((lineup) => (
                    <LineupColumn
                      key={`${lineup.teamId}-${lineup.status}`}
                      lineup={lineup}
                      teamName={
                        belongsToTeam(lineup.teamId, match.homeTeam)
                          ? match.homeTeam.name
                          : match.awayTeam.name
                      }
                      logoUrl={
                        belongsToTeam(lineup.teamId, match.homeTeam)
                          ? match.homeTeam.logoUrl
                          : match.awayTeam.logoUrl
                      }
                    />
                  ))}
                </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('no_lineups')}
                  </p>
                )}
              </section>

            {h2hMatches.length > 0 ? (
              <section id="folio-history" className="match-plate scroll-mt-28 club-rise">
                <SectionHead folio="04" kicker={t('previous_meetings')} title={t('previous_meetings')} />
                {h2hTally ? (
                  <div className="match-h2h-tally mb-5">
                    <div>
                      <strong>{h2hTally.home}</strong>
                      <span>{t('team_wins', { team: match.homeTeam.name })}</span>
                    </div>
                    <div>
                      <strong>{h2hTally.draw}</strong>
                      <span>{t('draw')}</span>
                    </div>
                    <div>
                      <strong>{h2hTally.away}</strong>
                      <span>{t('team_wins', { team: match.awayTeam.name })}</span>
                    </div>
                  </div>
                ) : null}
                <div className="space-y-2">
                  {h2hMatches.slice(0, 8).map((item) => (
                    <Link key={item.id} href={`/match/${item.id}`} className="match-h2h-row">
                      <span className="flex-1 truncate font-semibold">{item.homeTeam.name}</span>
                      <strong>
                        {typeof item.homeScore === 'number' && typeof item.awayScore === 'number'
                          ? `${item.homeScore} – ${item.awayScore}`
                          : '—'}
                      </strong>
                      <span className="flex-1 truncate text-left font-semibold">{item.awayTeam.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </Reveal>

          {children ? (
            <Reveal>
              <aside className="match-aside-column space-y-5 xl:sticky xl:top-28">{children}</aside>
            </Reveal>
          ) : null}
        </div>
      </div>
    </div>
    </EntityFrame>
  );
}

function FormPips({ form }: { form: FormLetter[] }) {
  const t = useTranslations('sports');
  if (form.length === 0) return null;
  return (
    <div className="mt-2 flex gap-1">
      {form.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={`flex h-4 w-4 items-center justify-center rounded-sm text-[7px] font-bold ${
            letter === 'W'
              ? 'bg-emerald-500 text-white'
              : letter === 'L'
                ? 'bg-red-500 text-white'
                : 'bg-white/20 text-white/80'
          }`}
        >
          {letter === 'W' ? t('win_short') : letter === 'L' ? t('loss_short') : t('draw_short')}
        </span>
      ))}
    </div>
  );
}

function TeamCrestColumn({
  team,
  scorers,
  standing,
  form,
  formation,
  align,
}: {
  team: DossierMatch['homeTeam'];
  scorers: Array<NormalizedMatchEvent & { isHome: boolean }>;
  standing?: StandingChip;
  form: FormLetter[];
  formation?: string;
  align: 'start' | 'end';
}) {
  const t = useTranslations('sports');
  return (
    <div className={`match-crest-col ${align === 'end' ? 'is-home' : 'is-away'}`}>
      <Link href={`/team/${team.slug}`} className="match-crest-link">
        <div className="match-crest-stage">
          <span className="match-crest-glow" aria-hidden />
          <div className="match-crest">
            <LeagueCrest name={team.name} logoUrl={team.logoUrl} className="h-full w-full" />
          </div>
        </div>
        <strong className="match-crest-name">{team.name}</strong>
      </Link>
      <div className="match-crest-meta">
        {formation ? <span className="text-orange-300">{formation}</span> : null}
        {standing ? (
          <span>
            #{standing.rank} · {t('points_short', { points: standing.points })}
          </span>
        ) : null}
      </div>
      <FormPips form={form} />
      {scorers.length > 0 ? (
        <ul className="match-scorer-list">
          {scorers.map((event, index) => (
            <li key={event.id ?? `${event.minute}-${index}`}>
              {event.player || t('goal')} {minuteLabel(event)}&prime;
              {event.type === 'PENALTY'
                ? ` (${t('penalty_short')})`
                : event.type === 'OWN_GOAL'
                  ? ` (${t('own_goal_short')})`
                  : ''}
              {event.assistPlayer ? ` · ${event.assistPlayer}` : ''}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EventChip({
  event,
  active,
  align,
}: {
  event: NormalizedMatchEvent;
  active: boolean;
  align: 'start' | 'end';
}) {
  const t = useTranslations('sports');
  if (!active) return <span className="hidden sm:block" />;
  return (
    <div className={`match-event-chip ${align === 'end' ? 'is-end' : 'is-start'}`}>
      <strong>{eventLabelKeys[event.type] ? t(eventLabelKeys[event.type]) : event.type}</strong>
      <p>
        {event.player ||
          event.detail ||
          (eventLabelKeys[event.type] ? t(eventLabelKeys[event.type]) : event.type)}
        {event.assistPlayer ? ` · ${event.assistPlayer}` : ''}
      </p>
    </div>
  );
}

function LineupColumn({
  lineup,
  teamName,
  logoUrl,
}: {
  lineup: NormalizedLineup;
  teamName: string;
  logoUrl?: string;
}) {
  const t = useTranslations('sports');
  const pitchRows = buildPitchRows(lineup);

  return (
    <div className="match-lineup-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <LeagueCrest name={teamName} logoUrl={logoUrl} className="h-7 w-7" />
          <div className="min-w-0">
            <strong className="block truncate text-sm text-foreground dark:text-foreground">{teamName}</strong>
            {(lineup.formation || lineup.coach?.name) && (
              <span className="mt-0.5 block truncate text-[9px] font-medium text-muted-foreground">
                {[lineup.formation ? t('formation', { formation: lineup.formation }) : '', lineup.coach?.name]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            )}
          </div>
        </div>
        <span className={`match-lineup-badge ${lineup.status === 'CONFIRMED' ? 'is-confirmed' : ''}`}>
          {lineup.status === 'CONFIRMED' ? t('confirmed') : t('predicted')}
        </span>
      </div>

      {pitchRows ? (
        <div className="lineup-pitch relative mb-4 overflow-hidden rounded-xl px-2 py-4">
          <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px bg-white/20" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
          <div className="relative flex flex-col-reverse gap-3">
            {pitchRows.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5">
                {row.map((player, index) => (
                  <div key={player.id || `${player.name}-${index}`} className="flex w-14 flex-col items-center">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-primary-foreground shadow">
                      {player.number ?? index + 1}
                    </span>
                    <span className="mt-1 w-full truncate text-center text-[8px] font-semibold text-white/90">
                      {shortName(player.name)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          {lineup.players.map((player, index) => (
            <div
              key={player.id || `${player.name}-${index}`}
              className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2 dark:bg-card/[0.04]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-card text-[9px] font-bold text-orange-500 dark:bg-muted/10">
                {player.number ?? index + 1}
              </span>
              <span className="flex-1 truncate text-[11px] font-semibold text-foreground dark:text-muted-foreground">
                {player.name}
              </span>
              {player.position ? (
                <span className="text-[8px] font-medium text-muted-foreground">{player.position}</span>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {lineup.bench && lineup.bench.length > 0 ? (
        <div className="mt-4 border-t border-border pt-3 dark:border-border">
          <span className="mb-2 block text-[9px] font-bold text-muted-foreground">{t('bench')}</span>
          <div className="flex flex-wrap gap-1.5">
            {lineup.bench.slice(0, 9).map((player, index) => (
              <span
                key={player.id || `bench-${player.name}-${index}`}
                className="rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground dark:bg-card/[0.04]"
              >
                {player.number ? `${player.number} ` : ''}
                {shortName(player.name)}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
