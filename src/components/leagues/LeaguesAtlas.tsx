import React from 'react';
import { ArrowUpLeft, Globe, Radio, Search, Star, Target } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueFollowChip } from '@/components/leagues/LeagueFollowChip';
import { LeagueFilterBar } from '@/components/leagues/LeagueFilterBar';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { LeagueDeskCard } from '@/components/leagues/LeagueDeskCard';
import { pick } from '@/i18n/pick';
import { localizeCompetitionTitle, localizeCountryName, localizeLeagueRegion, localizeRoundName } from '@/lib/i18n/competition-names';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import styles from './leagues-atlas.module.css';

type Crest = { name: string; logoUrl: string | null };
type Venue = { name: string; city: string | null } | null;

export type AtlasLeague = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country: string | null;
  standings: number;
  season: string | null;
  seasonId?: string | null;
  extraLive: number;
  census: { live: number; upcoming: number; finished: number; total: number };
  nextMatch: {
    id: string;
    kickoffAt: Date;
    round?: string | null;
    venue?: Venue;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  lastResult: {
    id: string;
    round?: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  liveMatch: {
    id: string;
    status: string;
    minute: number | null;
    round?: string | null;
    homeScore: number | null;
    awayScore: number | null;
    homeTeam: Crest;
    awayTeam: Crest;
  } | null;
  leader: { team: Crest; points: number; played?: number } | null;
  runnerUp: { team: Crest; points: number; played?: number } | null;
  podium: Array<{
    id: string;
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn?: number;
    lost?: number;
    goalsFor: number;
    goalsAgainst: number;
    team: Crest & { slug: string };
  }>;
};

type LiveMatch = {
  id: string;
  status: string;
  minute: number | null;
  round?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  venue?: Venue;
  homeTeam: Crest;
  awayTeam: Crest;
  league: { id: string; name: string; slug: string; country: string | null; externalId?: string | null };
  channels?: { channel: { name: string } }[];
};

type DeskMatch = {
  id: string;
  kickoffAt: Date;
  round?: string | null;
  homeScore?: number | null;
  awayScore?: number | null;
  homeTeam: Crest;
  awayTeam: Crest;
  league: { name: string; slug?: string; country?: string | null; externalId?: string | null };
};

function leagueLabel(
  locale: string,
  league: { name: string; country?: string | null; externalId?: string | null },
) {
  return localizeCompetitionTitle(locale, league);
}

function countryLabel(locale: string, country?: string | null) {
  return localizeLeagueRegion(locale, country) || localizeCountryName(locale, country) || pick(locale, 'غير مصنفة', 'Unclassified');
}

function teamLabel(locale: string, name: string) {
  return localizeTeamName(locale, name);
}

function roundLabel(locale: string, round?: string | null) {
  return round ? localizeRoundName(locale, round) : '';
}

function raceLine(locale: string, gap: number, leader: string, runner: string) {
  if (gap === 0) {
    return pick(locale, `يتساوى الفريقان في النقاط. ${leader} و ${runner}`, `${leader} and ${runner} are level on points.`);
  }
  return pick(
    locale,
    `الفارق بين الفريقين: ${gap} نقطة. ${leader} و ${runner}`,
    `The gap between the two teams is ${gap} pts — ${leader} and ${runner}`
  );
}

function hasScore(home: number | null | undefined, away: number | null | undefined) {
  return typeof home === 'number' && typeof away === 'number';
}

function goalDifference(goalsFor: number, goalsAgainst: number) {
  const diff = goalsFor - goalsAgainst;
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

function countryAnchor(country: string) {
  return `country-${country.trim().replace(/\s+/g, '-')}`;
}

function liveClock(match: { status: string; minute: number | null }, locale: string) {
  if (match.status === 'HALFTIME') return pick(locale, 'استراحة', 'Half-time');
  if (match.minute) return `${match.minute}'`;
  return pick(locale, 'مباشر', 'Live');
}

function medalClass(rank: number) {
  if (rank === 1) return 'atlas-medal atlas-medal-1';
  if (rank === 2) return 'atlas-medal atlas-medal-2';
  if (rank === 3) return 'atlas-medal atlas-medal-3';
  return 'atlas-medal bg-muted text-muted-foreground dark:bg-muted/10 dark:text-foreground/70';
}

export function LeaguesAtlas({
  locale,
  now,
  paramsQ,
  selectedCountry,
  activeFilter,
  activeSort,
  loggedIn,
  liveMatches,
  followedSet,
  followedLeagues,
  spotlightLeague,
  spotlightLiveMatches,
  liveBoard,
  liveGoalByMatch,
  sortedLeagues,
  chapterEntries,
  unlocated,
  directoryCapped = false,
  jumpCountries,
  visibleCountries,
  extraCountryCount,
  countryCoverage,
  countryHref,
  filterCounts,
  census,
  providerIsLive,
  syncedAt,
  upcomingMatches,
  recentResults,
  titleRaces,
  scorers,
  leagueNews,
}: {
  locale: string;
  now: Date;
  paramsQ?: string;
  selectedCountry: string;
  activeFilter: string;
  activeSort: string;
  loggedIn: boolean;
  liveMatches: LiveMatch[];
  followedSet: Set<string>;
  followedLeagues: AtlasLeague[];
  spotlightLeague?: AtlasLeague;
  spotlightLiveMatches: LiveMatch[];
  liveBoard: LiveMatch[];
  liveGoalByMatch: Map<string, { minute: number; extraMinute: number | null; playerName: string | null; player: { name: string } | null }>;
  sortedLeagues: AtlasLeague[];
  chapterEntries: Array<{ country: string; rows: AtlasLeague[]; total: number }>;
  unlocated: AtlasLeague[];
  directoryCapped?: boolean;
  jumpCountries: Array<{ country: string; live: number; count: number; nextKickoff: Date | null }>;
  visibleCountries: string[];
  extraCountryCount: number;
  countryCoverage: Array<{ country: string; live: number }>;
  countryHref: (country: string) => string;
  filterCounts: { all: number; following: number; live: number; standings: number; covered: number };
  census: Array<{ value: number; label: string; live: boolean }>;
  providerIsLive: boolean;
  syncedAt?: Date;
  upcomingMatches: DeskMatch[];
  recentResults: DeskMatch[];
  titleRaces: Array<{ league: AtlasLeague; leader: NonNullable<AtlasLeague['leader']>; runnerUp: NonNullable<AtlasLeague['runnerUp']>; gap: number }>;
  scorers: Array<{
    goals: number;
    player: { id: string; name: string; slug: string | null; photoUrl: string | null };
    teamName?: string;
    league?: { name: string; slug: string };
  }>;
  leagueNews: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    publishedAt: Date | null;
    featuredImage: string | null;
    leagueName: string;
    leagueSlug: string;
  }>;
}) {
  return (
    <div className={`${styles.leagueAtlas} league-atlas pb-10`}>
      <span className="atlas-flood atlas-flood-a" aria-hidden />
      <span className="atlas-flood atlas-flood-b" aria-hidden />
      {liveMatches.length > 0 && (
        <div className="atlas-wire">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-2.5 sm:px-6 lg:px-8">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
              {pick(locale, 'مباشر', 'Live')}
            </span>
            <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto no-scrollbar">
              {liveMatches.slice(0, 12).map((match) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-foreground/80 hover:text-orange-500"
                >
                  <span className="max-w-[8rem] truncate">{teamLabel(locale, match.homeTeam.name)}</span>
                  {hasScore(match.homeScore, match.awayScore) ? (
                    <span className="tabular-nums atlas-ink">
                      {match.homeScore}–{match.awayScore}
                    </span>
                  ) : (
                    <Radio className="h-3 w-3 text-rose-400" />
                  )}
                  <span className="max-w-[8rem] truncate">{teamLabel(locale, match.awayTeam.name)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <section className={`${styles.atlasHero} atlas-hero`}>
        <div className="relative mx-auto max-w-7xl px-5 pb-8 pt-4 sm:px-6 lg:px-8">
          <header className={styles.mast}>
            <div className={styles.mastMark}>
              <span className={styles.seal} aria-hidden>YS</span>
              <span className={styles.kicker}>{pick(locale, 'قاعة البطولات', 'League hall')}</span>
            </div>
            <div className={styles.mastCopy}>
              <h1>{pick(locale, 'البطولات', 'Leagues')}</h1>
              <p>
                {pick(
                  locale,
                  'جداول ومباشر ومواعيد من المصدر فقط — بلا تعبئة وبلا أرقام وهمية.',
                  'Tables, live and fixtures from the source only — no filler, no invented numbers.'
                )}
              </p>
              <div className="atlas-hero-meta">
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${liveMatches.length > 0
                      ? 'bg-rose-500'
                      : providerIsLive
                        ? 'bg-orange-500'
                        : 'bg-amber-400'
                      }`}
                  />
                  {liveMatches.length > 0
                    ? pick(locale, `${liveMatches.length} مباراة على الملعب`, `${liveMatches.length} live now`)
                    : providerIsLive
                      ? pick(locale, 'متصل بالمصدر', 'Source connected')
                      : pick(locale, 'المزوّد غير مفعّل', 'Provider offline')}
                </span>
                {syncedAt && (
                  <span>
                    {pick(locale, 'مزامنة', 'Synced')} · <ClientTime value={syncedAt} />
                  </span>
                )}
                <span>{now.getFullYear()}</span>
              </div>
            </div>
          </header>

          {census.length > 0 ? (
            <div className="atlas-census">
              {census.map((stat) => (
                <div key={stat.label} className="atlas-stat" data-live={stat.live ? 'true' : 'false'}>
                  <strong className="tabular-nums">{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          {spotlightLeague && (spotlightLeague.liveMatch || spotlightLeague.podium.length > 0 || spotlightLeague.nextMatch || spotlightLeague.lastResult) && (
            <div className="atlas-programme relative mt-5">
              <div
                className={`relative grid ${spotlightLeague.podium.length > 0 || spotlightLiveMatches.length > 0
                  ? 'lg:grid-cols-[auto_minmax(0,1.1fr)_minmax(0,0.9fr)]'
                  : 'lg:grid-cols-[auto_minmax(0,1fr)]'
                  }`}
              >
                <div className="flex items-center justify-center border-b border-border px-6 py-6 lg:border-b-0 lg:border-e">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-border bg-card p-4 shadow-[0_18px_36px_-24px_rgba(15,25,42,0.45)]">
                    <LeagueCrest name={spotlightLeague.name} logoUrl={spotlightLeague.logoUrl} className="h-full w-full text-4xl" />
                  </div>
                </div>
                <div className="relative p-5 sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] atlas-muted">
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-bold text-primary-foreground">
                        {pick(locale, 'البطولة المختارة', 'Featured league')}
                      </span>
                      {spotlightLeague.country ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-orange-500" />
                          {countryLabel(locale, spotlightLeague.country)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-orange-500" />
                          {pick(locale, 'غير محدد', 'Unspecified')}
                        </span>
                      )}
                      {spotlightLeague.season && <span>· {spotlightLeague.season}</span>}
                    </span>
                    {spotlightLeague.liveMatch ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 text-[10px] font-bold text-rose-600 dark:text-rose-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                        {pick(locale, 'مباشر الآن', 'Live now')}
                        {spotlightLeague.census.live > 1 ? ` · ${spotlightLeague.census.live}` : ''}
                      </span>
                    ) : spotlightLeague.nextMatch ? (
                      <ClientTime value={spotlightLeague.nextMatch.kickoffAt} className="font-semibold text-orange-500" />
                    ) : null}
                  </div>

                  <h2 className="mt-4 text-2xl font-bold tracking-[-0.04em] atlas-ink sm:text-3xl">{spotlightLeague.name}</h2>
                  <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] atlas-muted">
                    {spotlightLeague.census.live > 0 && (
                      <span className="font-semibold text-rose-600 dark:text-rose-300">
                        {spotlightLeague.census.live} {pick(locale, 'مباشرة', 'live')}
                      </span>
                    )}
                    {spotlightLeague.census.upcoming > 0 && (
                      <span>
                        {spotlightLeague.census.upcoming} {pick(locale, 'قادمة', 'upcoming')}
                      </span>
                    )}
                    {spotlightLeague.census.finished > 0 && (
                      <span>
                        {spotlightLeague.census.finished} {pick(locale, 'منتهية', 'finished')}
                      </span>
                    )}
                    {spotlightLeague.census.total > 0 && (
                      <span>
                        {spotlightLeague.census.total} {pick(locale, 'مباراة', 'matches')}
                      </span>
                    )}
                    {spotlightLeague.standings > 0 && (
                      <span>
                        {spotlightLeague.standings} {pick(locale, 'فريق', 'teams')}
                      </span>
                    )}
                  </p>

                  {spotlightLeague.nextMatch && (
                    <Link
                      href={`/match/${spotlightLeague.nextMatch.id}`}
                      className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-[11px] hover:border-orange-400/40"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-semibold text-orange-500">
                          {pick(locale, 'المباراة القادمة', 'Next match')}
                          {spotlightLeague.nextMatch.round ? ` · ${roundLabel(locale, spotlightLeague.nextMatch.round)}` : ''}
                        </span>
                        <span className="mt-1 block font-semibold atlas-ink">
                          {teamLabel(locale, spotlightLeague.nextMatch.homeTeam.name)} × {teamLabel(locale, spotlightLeague.nextMatch.awayTeam.name)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-0.5 atlas-muted">
                        {spotlightLeague.nextMatch.venue?.name && (
                          <span className="hidden max-w-40 truncate sm:inline">{spotlightLeague.nextMatch.venue.name}</span>
                        )}
                        <ClientTime value={spotlightLeague.nextMatch.kickoffAt} className="font-semibold text-orange-500" />
                      </span>
                    </Link>
                  )}

                  {spotlightLeague.lastResult &&
                    hasScore(spotlightLeague.lastResult.homeScore, spotlightLeague.lastResult.awayScore) && (
                      <Link href={`/match/${spotlightLeague.lastResult.id}`} className="mt-3 flex items-center justify-between gap-3 text-[11px] atlas-muted">
                        <span>
                          {pick(locale, 'آخر نتيجة:', 'Latest result:')} {teamLabel(locale, spotlightLeague.lastResult.homeTeam.name)}{' '}
                          {spotlightLeague.lastResult.homeScore}–{spotlightLeague.lastResult.awayScore} {teamLabel(locale, spotlightLeague.lastResult.awayTeam.name)}
                          {spotlightLeague.lastResult.round ? ` · ${roundLabel(locale, spotlightLeague.lastResult.round)}` : ''}
                        </span>
                        <ArrowUpLeft className="h-3.5 w-3.5" />
                      </Link>
                    )}

                  <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
                    <LeagueFollowChip
                      leagueId={spotlightLeague.id}
                      isLoggedIn={loggedIn}
                      initialIsFollowing={followedSet.has(spotlightLeague.id)}
                      variant="soft"
                    />
                    {spotlightLeague.standings > 0 && (
                      <Link
                        href={`/league/${spotlightLeague.slug}/standings`}
                        className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-[11px] font-semibold atlas-ink hover:border-orange-400/40"
                      >
                        {pick(locale, 'الجدول', 'Table')}
                      </Link>
                    )}
                    {spotlightLeague.census.finished > 0 && (
                      <Link
                        href={`/league/${spotlightLeague.slug}/archive`}
                        className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-[11px] font-semibold atlas-ink hover:border-orange-400/40"
                      >
                        {pick(locale, 'الأرشيف', 'Archive')}
                      </Link>
                    )}
                    <Link
                      href={`/league/${spotlightLeague.slug}`}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[11px] font-bold text-primary-foreground hover:bg-orange-400"
                    >
                      {pick(locale, 'فتح البطولة', 'Open league')}
                      <ArrowUpLeft className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {spotlightLeague.podium.length > 0 ? (
                  <div className="relative border-t border-border bg-foreground/[0.03] p-5 sm:p-6 lg:border-s lg:border-t-0">
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-orange-500">
                      {pick(locale, 'لمحة الجدول', 'Table snapshot')}
                    </span>
                    <h3 className="mt-1 text-base font-semibold atlas-ink">{pick(locale, 'المراكز الأولى', 'Top positions')}</h3>
                    <p className="mt-2 text-[9px] atlas-muted">
                      {pick(locale, 'المركز · الفريق · لعب · فاز · تعادل · خسر · له · عليه · الفارق · النقاط', 'Pos · Team · P · W · D · L · GF · GA · GD · Pts')}
                    </p>
                    <div className="mt-4 space-y-2">
                      {spotlightLeague.podium.map((row) => (
                        <Link
                          key={row.id}
                          href={`/team/${row.team.slug}`}
                          className="relative flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 hover:border-orange-400/35"
                        >
                          <span className={medalClass(row.rank)}>{String(row.rank).padStart(2, '0')}</span>
                          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-border bg-card p-1.5">
                            <LeagueCrest name={teamLabel(locale, row.team.name)} logoUrl={row.team.logoUrl} className="h-full w-full text-sm" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate text-[11px] atlas-ink">{teamLabel(locale, row.team.name)}</strong>
                            <span className="text-[9px] atlas-muted">
                              {pick(locale, 'لعب', 'P')} {row.played}
                              {' · '}
                              {pick(locale, 'فاز', 'W')} {row.won}
                              {' · '}
                              {pick(locale, 'تعادل', 'D')} {row.drawn ?? '—'}
                              {' · '}
                              {pick(locale, 'خسر', 'L')} {row.lost ?? '—'}
                              {' · '}
                              {pick(locale, 'له', 'GF')} {row.goalsFor}
                              {' · '}
                              {pick(locale, 'عليه', 'GA')} {row.goalsAgainst}
                              {' · '}
                              {pick(locale, 'الفارق', 'GD')} {goalDifference(row.goalsFor, row.goalsAgainst)}
                            </span>
                          </div>
                          <strong className="text-sm tabular-nums text-orange-500" title={pick(locale, 'النقاط', 'Points')}>
                            {row.points}
                          </strong>
                        </Link>
                      ))}
                    </div>
                    {spotlightLeague.leader && spotlightLeague.runnerUp && (
                      <p className="mt-4 text-[10px] atlas-muted">
                        {raceLine(
                          locale,
                          spotlightLeague.leader.points - spotlightLeague.runnerUp.points,
                          teamLabel(locale, spotlightLeague.leader.team.name),
                          teamLabel(locale, spotlightLeague.runnerUp.team.name)
                        )}
                      </p>
                    )}
                  </div>
                ) : spotlightLiveMatches.length > 0 ? (
                  <div className="relative border-t border-rose-500/20 bg-rose-500/10 p-5 sm:p-6 lg:border-s lg:border-t-0">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-rose-600 dark:text-rose-300">
                        {pick(locale, 'على الملعب', 'On the pitch')}
                      </span>
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                        {spotlightLiveMatches.length} {pick(locale, 'مباشرة', 'live')}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {spotlightLiveMatches.map((match) => (
                        <Link
                          key={match.id}
                          href={`/match/${match.id}`}
                          className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5"
                        >
                          <span className="w-10 shrink-0 text-[10px] font-bold text-rose-600 dark:text-rose-300">{liveClock(match, locale)}</span>
                          <span className="min-w-0 flex-1 truncate text-[11px] font-semibold atlas-ink">{teamLabel(locale, match.homeTeam.name)}</span>
                          {hasScore(match.homeScore, match.awayScore) ? (
                            <strong className="shrink-0 text-[12px] tabular-nums atlas-ink">
                              {match.homeScore}–{match.awayScore}
                            </strong>
                          ) : (
                            <span className="text-[9px] text-rose-600 dark:text-rose-300">{pick(locale, 'مباشر', 'Live')}</span>
                          )}
                          <span className="min-w-0 flex-1 truncate text-start text-[11px] font-semibold atlas-ink">
                            {teamLabel(locale, match.awayTeam.name)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="atlas-toolbar sticky top-[76px] z-30">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
            <form method="get" className="relative lg:w-72 lg:shrink-0">
              <button type="submit" className="absolute start-3 top-1/2 -translate-y-1/2 text-orange-500" aria-label={pick(locale, 'بحث', 'Search')}>
                <Search className="h-4 w-4" />
              </button>
              <input
                name="q"
                type="search"
                defaultValue={paramsQ}
                placeholder={pick(locale, 'ابحث عن بطولة أو دولة أو رقم البطولة', 'Search league, country, or league ID')}
                className="h-11 w-full rounded-full border border-border/80 bg-card/90 ps-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-orange-400 dark:border-border dark:bg-card/[0.04] dark:text-foreground"
              />
              {selectedCountry !== 'all' && <input type="hidden" name="country" value={selectedCountry} />}
              {activeFilter !== 'all' && <input type="hidden" name="filter" value={activeFilter} />}
              {activeSort !== 'coverage' && <input type="hidden" name="sort" value={activeSort} />}
            </form>
            <div className="min-w-0 flex-1">
              <LeagueFilterBar
                activeFilter={activeFilter}
                activeSort={activeSort}
                counts={filterCounts}
                baseParams={{ q: paramsQ, country: selectedCountry }}
              />
            </div>
          </div>
        </div>
      </div>

      <main className="relative mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
        {followedLeagues.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                <h2 className="text-sm font-bold text-foreground dark:text-foreground">{pick(locale, 'بطولاتك', 'Your leagues')}</h2>
              </div>
              <Link href="/leagues?filter=following" className="text-[11px] font-semibold text-orange-500">
                {pick(locale, 'عرض الكل', 'View all')}
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {followedLeagues.map((league) => (
                <Link
                  key={league.id}
                  href={`/league/${league.slug}`}
                  className="flex min-w-52 shrink-0 items-center gap-3 rounded-2xl border border-border/80 bg-card px-4 py-3 dark:border-border dark:bg-card/[0.04]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/80 bg-foreground/5 p-2 dark:border-border dark:bg-card/[0.04]">
                    <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-full w-full" />
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-[11px] text-foreground dark:text-foreground">{leagueLabel(locale, league)}</strong>
                    <span className="text-[9px] text-muted-foreground">{league.liveMatch ? pick(locale, 'مباشر', 'Live') : countryLabel(locale, league.country)}</span>
                  </div>
                  {league.liveMatch && <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-rose-500" />}
                </Link>
              ))}
            </div>
          </section>
        )}

        {liveMatches.length > 0 && (
          <section className={`${styles.atlasDesk} atlas-desk is-live relative mb-12`}>
            <div className="flex items-center justify-between border-b border-border px-6 py-5 dark:border-border">
              <div>
                <span className="atlas-section-kicker text-rose-500">{pick(locale, 'على الملعب', 'On the pitch')}</span>
                <h2 className="mt-1 text-lg font-bold tracking-[-0.03em] text-foreground dark:text-foreground">{pick(locale, 'الآن على الملعب', 'Live on the pitch')}</h2>
              </div>
              <Link href="/matches?status=live" className="text-[11px] font-semibold text-orange-500">
                {liveMatches.length > liveBoard.length
                  ? `${pick(locale, 'كل المباريات الحية', 'All live matches')} · ${liveMatches.length}`
                  : pick(locale, 'كل المباريات الحية', 'All live matches')}
              </Link>
            </div>
            <div className="atlas-live-grid">
              {liveBoard.map((match) => {
                const lastGoal = liveGoalByMatch.get(match.id);
                const scorer = lastGoal?.player?.name || lastGoal?.playerName;
                const channel = match.channels?.[0]?.channel.name;
                return (
                  <Link key={match.id} href={`/match/${match.id}`} className="atlas-live-ticket">
                    <div className="flex items-center justify-between gap-2 text-[10px]">
                      <span className="truncate text-muted-foreground">
                        {leagueLabel(locale, match.league)}
                        {match.round ? ` · ${roundLabel(locale, match.round)}` : ''}
                        {channel ? ` · ${channel}` : ''}
                      </span>
                      <span className="shrink-0 font-bold text-rose-500">{liveClock(match, locale)}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <span className="flex min-w-0 items-center justify-end gap-2 text-[12px] font-semibold">
                        <span className="truncate">{teamLabel(locale, match.homeTeam.name)}</span>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card p-0.5 dark:bg-muted/10">
                          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-full w-full" />
                        </span>
                      </span>
                      {hasScore(match.homeScore, match.awayScore) ? (
                        <strong className="rounded-lg bg-foreground/5 px-2.5 py-1 text-[13px] font-bold tabular-nums text-foreground">
                          {match.homeScore}–{match.awayScore}
                        </strong>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500">{pick(locale, 'مباشر', 'Live')}</span>
                      )}
                      <span className="flex min-w-0 items-center gap-2 text-[12px] font-semibold">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-card p-0.5 dark:bg-muted/10">
                          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-full w-full" />
                        </span>
                        <span className="truncate">{teamLabel(locale, match.awayTeam.name)}</span>
                      </span>
                    </div>
                    {(scorer && lastGoal) || match.venue?.name ? (
                      <div className="truncate text-[10px] text-muted-foreground">
                        {scorer && lastGoal
                          ? `${scorer} ${lastGoal.minute}${lastGoal.extraMinute ? `+${lastGoal.extraMinute}` : ''}′`
                          : match.venue?.name}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {sortedLeagues.length > 0 ? (
          <>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'حسب العالم والقارات والدول', 'By world, continents and countries')}</span>
                <h2 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-foreground dark:text-foreground">
                  {selectedCountry === 'all'
                    ? directoryCapped
                      ? pick(locale, 'أبرز البطولات', 'Featured leagues')
                      : pick(locale, 'دليل البطولات', 'League directory')
                    : countryLabel(locale, selectedCountry)}
                </h2>
              </div>
              <span className="text-[12px] text-muted-foreground">
                {directoryCapped
                  ? pick(
                    locale,
                    `عرض مختار من ${sortedLeagues.length} بطولة — اختر دولة لرؤية الكل`,
                    `A desk selection of ${sortedLeagues.length} leagues — pick a country to see all`
                  )
                  : `${sortedLeagues.length} ${pick(locale, 'بطولة', 'leagues')}`}
                <span className="mx-2 text-muted-foreground">·</span>
                <ClientTime value={now} options={{ weekday: 'long', day: 'numeric', month: 'short' }} />
                {selectedCountry !== 'all' && (
                  <>
                    {' · '}
                    <Link href={countryHref('all')} className="text-orange-500 hover:underline">
                      {pick(locale, 'كل الدول', 'All countries')}
                    </Link>
                  </>
                )}
              </span>
            </div>

            {visibleCountries.length > 0 && (
              <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <Link
                  href={countryHref('all')}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold ${selectedCountry === 'all'
                    ? 'bg-foreground text-white dark:bg-card dark:text-foreground'
                    : 'border border-border bg-card text-muted-foreground hover:text-foreground dark:border-border dark:bg-card/[0.04] dark:text-muted-foreground'
                    }`}
                >
                  {pick(locale, 'كل الدول', 'All countries')}
                </Link>
                {visibleCountries.map((country) => {
                  const liveHere = countryCoverage.find((entry) => entry.country === country)?.live ?? 0;
                  return (
                    <Link
                      key={country}
                      href={countryHref(country)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold ${selectedCountry === country
                        ? 'bg-foreground text-white dark:bg-card dark:text-foreground'
                        : liveHere > 0
                          ? 'border border-rose-200 bg-rose-500/10 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
                          : 'border border-border bg-card text-muted-foreground hover:text-foreground dark:border-border dark:bg-card/[0.04] dark:text-muted-foreground'
                        }`}
                    >
                      {liveHere > 0 && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
                      {countryLabel(locale, country)}
                    </Link>
                  );
                })}
                {extraCountryCount > 0 && selectedCountry === 'all' && (
                  <span className="text-[10px] text-muted-foreground">+{extraCountryCount}</span>
                )}
              </div>
            )}

            <div className="space-y-7">
              {chapterEntries.map(({ country, rows, total }, chapterIndex) => {
                const liveInCountry = rows.filter((league) => league.liveMatch).length;
                const nextKickoff = jumpCountries.find((entry) => entry.country === country)?.nextKickoff;
                const hidden = Math.max(0, total - rows.length);
                return (
                  <section key={country} id={countryAnchor(country)} className="atlas-chapter scroll-mt-[8.5rem]">
                    <div className="atlas-chapter-head mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                          <div>
                            <span className="atlas-section-kicker">
                              {pick(locale, 'دولة', 'Country')} {String(chapterIndex + 1).padStart(2, '0')}
                            </span>
                            <h3 className="mt-1 text-xl font-bold tracking-[-0.04em] text-foreground dark:text-foreground">{countryLabel(locale, country)}</h3>
                          </div>
                          <span className="text-[11px] text-muted-foreground">
                            {total} {pick(locale, 'بطولة', 'leagues')}
                            {liveInCountry > 0 ? ` · ${liveInCountry} ${pick(locale, 'مباشر', 'live')}` : ''}
                            {nextKickoff ? (
                              <>
                                {' · '}
                                <ClientTime value={nextKickoff} />
                              </>
                            ) : null}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="atlas-directory">
                      {rows.map((league, cardIndex) => (
                        <div key={league.id} className="atlas-card-rise" style={{ animationDelay: `${Math.min(cardIndex, 8) * 55}ms` }}>
                          <LeagueDeskCard
                            league={league}
                            followed={followedSet.has(league.id)}
                            loggedIn={loggedIn}
                            locale={locale}
                          />
                        </div>
                      ))}
                    </div>
                    {hidden > 0 ? (
                      <div className="mt-3 flex justify-end">
                        <Link
                          href={countryHref(country)}
                          className="text-[12px] font-semibold text-orange-500 hover:underline"
                        >
                          {pick(locale, `كل بطولات ${countryLabel(locale, country)} · ${total}`, `All ${countryLabel(locale, country)} leagues · ${total}`)}
                        </Link>
                      </div>
                    ) : null}
                  </section>
                );
              })}

              {unlocated.length > 0 && (
                <section className="atlas-chapter">
                  <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                    {pick(locale, 'بطولات غير مصنفة', 'Unclassified competitions')}
                  </h3>
                  <div className="atlas-directory">
                    {unlocated.map((league) => (
                      <LeagueDeskCard
                        key={league.id}
                        league={league}
                        followed={followedSet.has(league.id)}
                        loggedIn={loggedIn}
                        locale={locale}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <div className="rounded-[1.5rem] border border-border bg-card px-6 py-16 text-center dark:border-border dark:bg-card/[0.04]">
            <p className="text-sm text-muted-foreground">{pick(locale, 'لا توجد بطولة مطابقة لهذا الاختيار', 'No league matches this selection')}</p>
            <Link href="/leagues" className="mt-4 inline-block text-[12px] font-bold text-orange-500">
              {pick(locale, 'عرض الكل', 'View all')}
            </Link>
          </div>
        )}

        {(upcomingMatches.length > 0 || titleRaces.length > 0) && (
          <section className={`mt-8 grid gap-5 ${upcomingMatches.length > 0 && titleRaces.length > 0 ? 'md:grid-cols-2' : ''}`}>
            {upcomingMatches.length > 0 && (
              <div className={`${styles.atlasDesk} atlas-desk is-upcoming`}>
                <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-border">
                  <h2 className="text-base font-bold text-foreground dark:text-foreground">{pick(locale, 'أقرب المباريات', 'Upcoming matches')}</h2>
                  <Link href="/matches" className="text-[11px] font-semibold text-muted-foreground hover:text-orange-500">
                    {pick(locale, 'الجدول', 'Schedule')}
                  </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {upcomingMatches.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-orange-500/[0.04] dark:hover:bg-card/[0.04]">
                      <div className="hidden w-32 sm:block">
                        <span className="block truncate text-[9px] text-muted-foreground">
                          {leagueLabel(locale, match.league)}
                          {match.round ? ` · ${roundLabel(locale, match.round)}` : ''}
                        </span>
                        <ClientTime value={match.kickoffAt} className="mt-1 block text-[11px] font-bold text-orange-500" />
                      </div>
                      <span className="min-w-0 flex-1 truncate text-end text-[12px] font-semibold">{teamLabel(locale, match.homeTeam.name)}</span>
                      <span className="text-[9px] text-muted-foreground">×</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{teamLabel(locale, match.awayTeam.name)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {titleRaces.length > 0 && (
              <div className={`${styles.atlasDesk} atlas-desk is-race`}>
                <div className="border-b border-border px-5 py-4 dark:border-border">
                  <h2 className="text-base font-bold text-foreground dark:text-foreground">
                    {pick(locale, 'أقرب المنافسات على الصدارة', 'Closest races for first place')}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {titleRaces.map((race) => (
                    <Link
                      key={race.league.id}
                      href={`/league/${race.league.slug}/standings`}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-orange-500/[0.04] dark:hover:bg-muted"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-card p-1.5">
                        <LeagueCrest name={teamLabel(locale, race.leader.team.name)} logoUrl={race.leader.team.logoUrl} className="h-full w-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <strong className="block truncate text-[12px] text-foreground dark:text-foreground">{teamLabel(locale, race.leader.team.name)}</strong>
                        <span className="mt-1 block truncate text-[10px] text-muted-foreground">
                          {race.league.name} · {raceLine(locale, race.gap, teamLabel(locale, race.leader.team.name), teamLabel(locale, race.runnerUp.team.name))}
                        </span>
                      </div>
                      <div className="text-start">
                        <strong className="block text-lg tabular-nums text-orange-500">{race.gap}</strong>
                        <span className="text-[10px] text-muted-foreground">
                          {race.gap === 0
                            ? pick(locale, 'الفارق بين المتصدر والمنافس: 0 نقطة', 'Gap to second: 0 pts')
                            : pick(locale, 'نقطة فارق', 'point gap')}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {(recentResults.length > 0 || scorers.length > 0) && (
          <section className="mt-5 space-y-5">
            {recentResults.length > 0 && (
              <div className={`${styles.atlasResults} atlas-results`}>
                <div className="atlas-results-head">
                  <div>
                    <span className="atlas-section-kicker">{pick(locale, 'من المصدر', 'From source')}</span>
                    <h2>{pick(locale, 'آخر النتائج', 'Latest results')}</h2>
                  </div>
                </div>
                <div className="atlas-results-grid">
                  {recentResults.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`} className="atlas-result-slip">
                      <div className="atlas-result-slip-meta">
                        <span className="truncate pe-10">
                          {leagueLabel(locale, match.league)}
                          {match.round ? ` · ${roundLabel(locale, match.round)}` : ''}
                        </span>
                        <ClientTime value={match.kickoffAt} />
                      </div>
                      <div className="atlas-result-slip-body">
                        <span className="atlas-result-side is-home">
                          <span className="atlas-result-crest">
                            <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-full w-full" />
                          </span>
                          <strong className="truncate">{teamLabel(locale, match.homeTeam.name)}</strong>
                        </span>
                        <span className="atlas-result-score" aria-label={`${match.homeScore}-${match.awayScore}`}>
                          <b className="tabular-nums">{match.homeScore}</b>
                          <i>–</i>
                          <b className="tabular-nums">{match.awayScore}</b>
                        </span>
                        <span className="atlas-result-side is-away">
                          <span className="atlas-result-crest">
                            <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-full w-full" />
                          </span>
                          <strong className="truncate">{teamLabel(locale, match.awayTeam.name)}</strong>
                        </span>
                      </div>
                      <span className="atlas-result-slip-mark">{pick(locale, 'نهاية', 'FT')}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {scorers.length > 0 && (
              <div className="atlas-desk is-scorers">
                <div className="border-b border-border px-5 py-4 dark:border-border">
                  <h2 className="text-base font-bold text-foreground dark:text-foreground">
                    {pick(locale, 'هدافو آخر 14 يوماً', 'Scorers — last 14 days')}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/10">
                  {scorers.map((scorer, index) => {
                    const href = scorer.player.slug ? `/player/${scorer.player.slug}` : undefined;
                    const row = (
                      <>
                        <span className="w-5 text-[11px] font-bold tabular-nums text-orange-500">{String(index + 1).padStart(2, '0')}</span>
                        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-orange-500/10">
                          {scorer.player.photoUrl ? (
                            <img src={scorer.player.photoUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Target className="h-4 w-4 text-orange-500" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px]">{scorer.player.name}</strong>
                          <span className="text-[9px] text-muted-foreground">{[scorer.teamName, scorer.league?.name].filter(Boolean).join(' · ')}</span>
                        </div>
                        <strong className="text-lg font-bold tabular-nums text-orange-500">{scorer.goals}</strong>
                      </>
                    );
                    return href ? (
                      <Link key={scorer.player.id} href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-orange-500/[0.04] dark:hover:bg-muted">
                        {row}
                      </Link>
                    ) : (
                      <div key={scorer.player.id} className="flex items-center gap-4 px-5 py-4">
                        {row}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {leagueNews.length > 0 && (
          <section className="atlas-desk is-news mt-5">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 dark:border-border">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'من الأطلس', 'From the atlas')}</span>
                <h2 className="mt-1 text-base font-bold tracking-[-0.03em] text-foreground dark:text-foreground">{pick(locale, 'تقارير البطولات المعتمدة', 'Verified league reports')}</h2>
              </div>
              <Link href="/news" className="text-[11px] font-semibold text-orange-500">
                {pick(locale, 'الموجز', 'Briefing')}
              </Link>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              {leagueNews.map((article) => (
                <Link
                  key={article.id}
                  href={`/news/${article.slug}`}
                  className="border-b border-border px-5 py-4 last:border-b-0 hover:bg-orange-500/[0.04] dark:border-border dark:hover:bg-muted md:border-e md:odd:border-e md:[&:nth-last-child(2)]:border-b-0"
                >
                  {article.leagueName && (
                    <span className="text-[9px] font-bold uppercase tracking-wider text-orange-500">{article.leagueName}</span>
                  )}
                  <strong className="mt-1 block text-[13px] leading-6 text-foreground dark:text-foreground">{article.title}</strong>
                  {article.publishedAt && <ClientTime value={article.publishedAt} className="mt-1 block text-[10px] text-muted-foreground" />}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
