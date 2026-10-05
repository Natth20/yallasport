import { swallow, reportCaughtError } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { MatchCard } from '@/components/sports/MatchCard';
import { KickoffTimeline, type KickoffSlot } from '@/components/matches/KickoffTimeline';
import { LiveNowBoard } from '@/components/matches/LiveNowBoard';
import { PinnedMatchesBar } from '@/components/matches/PinnedMatchesBar';
import { MatchdayLenses } from '@/components/matches/MatchdayLenses';
import { MatchdayDesk } from '@/components/matches/MatchdayDesk';
import { MatchdayLedger } from '@/components/matches/MatchdayLedger';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import {
  currentHourInTimezone,
  dateKeyInTimezone,
  dayBoundsInTimezone,
  hourInTimezone,
  normalizeTimezone,
} from '@/lib/datetime/format';
import { toNormalizedMatch } from '@/lib/sports-data/from-db';
import { sportsData } from '@/lib/sports-data';
import { belongsOnTodayBoard, liveKickoffFloor, todayOrLiveWhere } from '@/lib/sports-data/match-window';
import { formatKickoff } from '@/lib/datetime/format';
import { foldSearch } from '@/lib/search/text';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LiveDataStatus } from '@/components/sports/LiveDataStatus';
import { TimezoneSelector } from '@/components/layout/TimezoneSelector';
import {
  ArrowLeftRight,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Radio,
  Search,
  Trophy,
} from 'lucide-react';
import { addDays, format, isValid, parseISO } from 'date-fns';
import { ar } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { Link } from '@/i18n/navigation';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { localizeEntityMap } from '@/lib/i18n/localized-content';
import { localizePlainName, localizeTeamName, sourceSearchQuery } from '@/lib/i18n/sports-lexicon';
import { localizeLeagueName, localizeRoundName } from '@/lib/i18n/competition-names';
import { countLabel } from '@/lib/i18n/arabic-count';
import { formatScore } from '@/lib/sports-data/score-format';
import { STREAMING_ENABLED } from '@/lib/streaming';
import { compareMatchdayGroups, isMajorLeague, leagueTier, matchdayWeight } from '@/lib/sports-data/matchday-weight';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { MatchdayConsole, type MatchdayReelItem } from '@/components/matches/MatchdayConsole';
import styles from '@/components/matches/matches-hall.module.css';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'المباريات اليوم مباشر والنتائج | يلا سبورت', "Today's live matches and results | Yalla Sport"),
    description: pick(
      locale,
      'تابع مباريات اليوم ونتائج كرة القدم المباشرة، مواعيد المباريات، البطولات، النتائج النهائية وسجل الأهداف عبر يلا سبورت.',
      "Follow today's football matches and live scores, kickoff times, competitions, full-time results and the goal log on Yalla Sport.",
    ),
    path: '/matches',
    absolute: true,
  });
}

interface MatchesPageProps {
  searchParams: Promise<{
    date?: string;
    q?: string;
    status?: string;
    favorites?: string;
    league?: string;
    channel?: string;
    hour?: string;
    scope?: string;
  }>;
}

type FormLetter = 'W' | 'D' | 'L';

type DayMatch = NormalizedMatch & {
  venueCity?: string;
  venueCapacity?: number;
  channels: Array<{ name: string; logoUrl?: string | null }>;
  leagueCountry?: string;
  refereeName?: string;
  commentators: Array<{ name: string; role?: string; language?: string | null }>;
  homeCoach?: string;
  awayCoach?: string;
  homeFormation?: string;
  awayFormation?: string;
  homePredicted?: boolean;
  awayPredicted?: boolean;
  hasLicensedStream?: boolean;
  homePossession?: number;
  awayPossession?: number;
  homeShotsOn?: number;
  awayShotsOn?: number;
  homeShotsOff?: number;
  awayShotsOff?: number;
  homeCorners?: number;
  awayCorners?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeOffsides?: number;
  awayOffsides?: number;
  homeStarters?: Array<{ name: string; number?: number }>;
  awayStarters?: Array<{ name: string; number?: number }>;
};

const isLiveStatus = (status: string) => status === 'LIVE' || status === 'HALFTIME';

const belongsToTeam = (teamId: string, team: { id: string; externalId: string }) =>
  teamId === team.id || teamId === team.externalId;

function lineupStarters(payload: unknown) {
  if (!payload || typeof payload !== 'object') return [];
  const players = (payload as {
    players?: Array<{ name?: string; number?: number; isSubstitute?: boolean }>;
  }).players;
  if (!Array.isArray(players)) return [];
  return players
    .filter((player) => player?.name && !player.isSubstitute)
    .slice(0, 11)
    .map((player) => ({
      name: String(player.name).trim(),
      number: typeof player.number === 'number' ? player.number : undefined,
    }))
    .filter((player) => player.name);
}

function resultLetter(forHome: boolean, homeScore: number, awayScore: number): FormLetter {
  if (homeScore === awayScore) return 'D';
  const homeWon = homeScore > awayScore;
  return forHome === homeWon ? 'W' : 'L';
}

function pairKey(left: string, right: string) {
  return left < right ? `${left}:${right}` : `${right}:${left}`;
}

function tableKey(leagueId: string, teamId: string) {
  return `${leagueId}:${teamId}`;
}

function FormPips({ letters }: { letters: FormLetter[] }) {
  if (letters.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {letters.map((letter, index) => (
        <span
          key={`${letter}-${index}`}
          className={`flex h-4 w-4 items-center justify-center rounded-[4px] text-[8px] font-black ${letter === 'W'
            ? 'bg-emerald-500 text-white'
            : letter === 'L'
              ? 'bg-red-500 text-white'
              : 'bg-slate-400 text-white'
            }`}
        >
          {letter}
        </span>
      ))}
    </span>
  );
}

const EVENT_LABEL_KEYS = {
  GOAL: 'goal', OWN_GOAL: 'own_goal', PENALTY: 'penalty', YELLOW_CARD: 'yellow_card',
  RED_CARD: 'red_card', SUBSTITUTION: 'substitution', VAR: 'var'
};

function toReelItem(match: DayMatch): MatchdayReelItem {
  return {
    id: match.id,
    status: match.status,
    minute: match.minute,
    homeScore: match.homeScore ?? null,
    awayScore: match.awayScore ?? null,
    kickoffAt: new Date(match.kickoffAt).toISOString(),
    venue: match.venue,
    venueCity: match.venueCity,
    round: match.round,
    homeFormation: match.homeFormation,
    awayFormation: match.awayFormation,
    homeCoach: match.homeCoach,
    awayCoach: match.awayCoach,
    hasLicensedStream: match.hasLicensedStream,
    channels: match.channels.map((channel) => ({ name: channel.name })),
    homeTeam: {
      name: match.homeTeam.name,
      slug: match.homeTeam.slug,
      logoUrl: match.homeTeam.logoUrl,
    },
    awayTeam: {
      name: match.awayTeam.name,
      slug: match.awayTeam.slug,
      logoUrl: match.awayTeam.logoUrl,
    },
    league: { name: match.league.name, slug: match.league.slug },
  };
}

function CompactFixture({
  match,
  followed,
  locale,
}: {
  match: DayMatch;
  followed?: boolean;
  locale: string;
}) {
  const live = isLiveStatus(match.status);
  const score = formatScore(match.homeScore, match.awayScore);
  const status =
    match.status === 'HALFTIME'
      ? pick(locale, 'استراحة', 'HT')
      : live
        ? match.minute
          ? pick(locale, `مباشر · ${match.minute}′`, `LIVE · ${match.minute}′`)
          : pick(locale, 'مباشر', 'LIVE')
        : match.status === 'FINISHED'
          ? pick(locale, 'انتهت', 'FT')
          : match.status === 'POSTPONED'
            ? pick(locale, 'مؤجلة', 'Postponed')
            : match.status === 'CANCELLED'
              ? pick(locale, 'ملغاة', 'Cancelled')
              : null;
  return (
    <Link
      href={`/match/${match.id}`}
      className={`${styles.fixtureCard} ${live ? styles.fixtureLive : match.status === 'FINISHED' ? styles.fixtureFt : ''}`}
    >
      <div className={styles.fixtureBody}>
        <div className={styles.fixtureClock}>
          {live ? (
            <em>{status}</em>
          ) : match.status === 'FINISHED' ? (
            <span dir="ltr">{score ?? '—'}</span>
          ) : (
            <ClientTime value={match.kickoffAt} />
          )}
        </div>
        <div className={styles.fixtureTeams}>
          <div className={styles.fixtureTeam}>
            <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
            <strong>{match.homeTeam.name}</strong>
            {live && score ? <b>{match.homeScore}</b> : null}
          </div>
          <div className={styles.fixtureTeam}>
            <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
            <strong>{match.awayTeam.name}</strong>
            {live && score ? <b>{match.awayScore}</b> : null}
          </div>
        </div>
      </div>
      {match.league.name ? (
        <span className={styles.fixtureLeague}>{match.league.name}</span>
      ) : null}
      {followed ? (
        <span className={styles.fixtureFollowed}>
          <Heart className="h-2.5 w-2.5 fill-current" />
        </span>
      ) : null}
    </Link>
  );
}

export default function MatchesPage({ searchParams }: MatchesPageProps) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <MatchesPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function MatchesPageBody({ searchParams }: MatchesPageProps) {
  const locale = await getLocale();
  const t = await getTranslations('sports');
  const eventLabel = (type: string) => {
    const key = EVENT_LABEL_KEYS[type as keyof typeof EVENT_LABEL_KEYS];
    return key ? t(key) : type;
  };
  const params = await searchParams;
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const today = parseISO(dateKeyInTimezone(new Date(), timezone));
  const requestedDate = params.date ? parseISO(params.date) : today;
  const selectedDate = isValid(requestedDate) ? requestedDate : today;
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const query = params.q?.toLowerCase() || '';
  const allowedStatuses = ['all', 'live', 'upcoming', 'finished'] as const;
  const statusFilter = allowedStatuses.includes(params.status as (typeof allowedStatuses)[number])
    ? params.status as (typeof allowedStatuses)[number]
    : 'all';
  const favoritesOnly = params.favorites === '1';
  const selectedLeague = params.league?.trim() || '';
  const selectedChannel = params.channel?.trim() || '';
  const hourCandidate = params.hour != null && params.hour !== '' ? Number(params.hour) : NaN;
  const selectedHour = Number.isInteger(hourCandidate) && hourCandidate >= 0 && hourCandidate <= 23
    ? hourCandidate
    : null;
  const requestedScope = params.scope === 'all' || params.scope === 'major' ? params.scope : null;
  const isToday = selectedDateStr === format(today, 'yyyy-MM-dd');

  const { start, end } = dayBoundsInTimezone(selectedDateStr, timezone);
  const stripDates = Array.from({ length: 7 }, (_, index) => format(addDays(selectedDate, index - 3), 'yyyy-MM-dd'));
  const { start: weekStart } = dayBoundsInTimezone(stripDates[0], timezone);
  const { end: weekEnd } = dayBoundsInTimezone(stripDates[6], timezone);

  const session = await auth();
  let matchRows: any[] = [];
  let dayEvents: any[] = [];
  let weekKickoffs: Array<{ kickoffAt: Date; status: string }> = [];
  try {
    matchRows = await prisma.match.findMany({
      where: isToday ? todayOrLiveWhere(start, end) : { kickoffAt: { gte: start, lt: end } },
      orderBy: { kickoffAt: 'asc' },
      select: {
        id: true,
        externalId: true,
        status: true,
        homeScore: true,
        awayScore: true,
        minute: true,
        kickoffAt: true,
        venue: { select: { name: true, city: true, capacity: true } },
        homeTeam: { select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, coach: { select: { name: true } } } },
        awayTeam: { select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, coach: { select: { name: true } } } },
        league: { select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, country: true } },
        referee: { select: { name: true } },
        commentators: { take: 3, select: { name: true, role: true, language: true } },
        streamAssets: {
          where: { status: { in: ['READY', 'LIVE'] } },
          take: 1,
          select: { id: true },
        },
        channels: {
          take: 4,
          select: { channel: { select: { name: true, logoUrl: true } } },
        },
        statistics: {
          select: {
            teamId: true,
            possession: true,
            shotsOnTarget: true,
            shotsOffTarget: true,
            corners: true,
            fouls: true,
            offsides: true,
          },
        },
        lineups: {
          select: { teamId: true, formation: true, isPredicted: true, playersJson: true },
        },
      },
    });
    weekKickoffs = await prisma.match.findMany({
      where: {
        OR: [
          { kickoffAt: { gte: weekStart, lt: weekEnd } },
          { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } },
        ],
      },
      select: { kickoffAt: true, status: true },
    });
    dayEvents = await prisma.matchEvent.findMany({
      where: { match: { kickoffAt: { gte: start, lt: end } } },
      orderBy: [{ minute: 'desc' }, { extraMinute: 'desc' }],
      take: 250,
      select: {
        id: true,
        type: true,
        minute: true,
        extraMinute: true,
        playerName: true,
        assistName: true,
        detail: true,
        teamId: true,
        matchId: true,
        match: {
          select: {
            id: true,
            homeTeamId: true,
            homeTeam: { select: { id: true, externalId: true, name: true, logoUrl: true } },
            awayTeam: { select: { id: true, externalId: true, name: true, logoUrl: true } },
            league: { select: { name: true, externalId: true, country: true } },
          },
        },
      },
    });
  } catch (error) {
    console.error('[MATCHES_PAGE_DB]', error);
  }

  const roundById = new Map<string, string>();
  if (matchRows.length > 0) {
    try {
      const roundRows = await prisma.match.findMany({
        where: { id: { in: matchRows.map((row) => row.id) } },
        select: { id: true, round: true },
      });
      for (const row of roundRows) {
        if (row.round) roundById.set(row.id, row.round);
      }
    } catch (error) {
      reportCaughtError("src/app/[locale]/matches/page.tsx:388", error);
      // Older Prisma query engines reject `round` until generate succeeds.
    }
  }

  // If DB is empty (no matches from Supabase), fetch from live API
  const apiMatches =
    matchRows.length === 0
      ? await sportsData.getMatchesByDate(selectedDateStr).catch(swallow("src/app/[locale]/matches/page.tsx:395", []))
      : [];

  // Merge: API matches come first, DB matches supplement
  const rawAllMatches: DayMatch[] = [
    ...apiMatches.map((m) => ({
      ...m,
      round: undefined as string | undefined,
      venueCity: undefined,
      venueCapacity: undefined,
      channels: [] as Array<{ name: string; logoUrl?: string | null }>,
      leagueCountry: undefined,
      refereeName: undefined,
      commentators: [] as Array<{ name: string; role?: string; language?: string | null }>,
      homeFormation: undefined,
      awayFormation: undefined,
      homePredicted: undefined,
      awayPredicted: undefined,
      homeCoach: undefined,
      awayCoach: undefined,
      hasLicensedStream: false,
      homePossession: undefined,
      awayPossession: undefined,
      homeShotsOn: undefined,
      awayShotsOn: undefined,
      homeShotsOff: undefined,
      awayShotsOff: undefined,
      homeCorners: undefined,
      awayCorners: undefined,
      homeFouls: undefined,
      awayFouls: undefined,
      homeOffsides: undefined,
      awayOffsides: undefined,
      homeStarters: undefined,
      awayStarters: undefined,
    } as DayMatch)),
    ...matchRows.map((row: any) => {
      const lineups = (row.lineups ?? []) as Array<{
        teamId: string;
        formation: string | null;
        isPredicted: boolean;
        playersJson: unknown;
      }>;
      const statistics = (row.statistics ?? []) as Array<{
        teamId: string;
        possession: number | null;
        shotsOnTarget: number | null;
        shotsOffTarget: number | null;
        corners: number | null;
        fouls: number | null;
        offsides: number | null;
      }>;
      const confirmedLineups = lineups.filter((lineup) => !lineup.isPredicted);
      const homeLineup = confirmedLineups.find((lineup) => belongsToTeam(lineup.teamId, row.homeTeam));
      const awayLineup = confirmedLineups.find((lineup) => belongsToTeam(lineup.teamId, row.awayTeam));
      const homeStats = statistics.find((stat) => belongsToTeam(stat.teamId, row.homeTeam));
      const awayStats = statistics.find((stat) => belongsToTeam(stat.teamId, row.awayTeam));
      return {
        ...toNormalizedMatch(row),
        round: localizeRoundName(locale, roundById.get(row.id)),
        venueCity: row.venue?.city ?? undefined,
        venueCapacity: row.venue?.capacity ?? undefined,
        channels: (row.channels ?? []).map((entry: { channel: { name: string; logoUrl?: string | null } }) => entry.channel),
        leagueCountry: row.league.country ?? undefined,
        refereeName: row.referee?.name ?? undefined,
        commentators: row.commentators ?? [],
        homeFormation: homeLineup?.formation ?? undefined,
        awayFormation: awayLineup?.formation ?? undefined,
        homePredicted: undefined,
        awayPredicted: undefined,
        homeCoach: row.homeTeam.coach?.name || undefined,
        awayCoach: row.awayTeam.coach?.name || undefined,
        hasLicensedStream: STREAMING_ENABLED && (row.streamAssets?.length ?? 0) > 0,
        homePossession: homeStats?.possession ?? undefined,
        awayPossession: awayStats?.possession ?? undefined,
        homeShotsOn: homeStats?.shotsOnTarget ?? undefined,
        awayShotsOn: awayStats?.shotsOnTarget ?? undefined,
        homeShotsOff: homeStats?.shotsOffTarget ?? undefined,
        awayShotsOff: awayStats?.shotsOffTarget ?? undefined,
        homeCorners: homeStats?.corners ?? undefined,
        awayCorners: awayStats?.corners ?? undefined,
        homeFouls: homeStats?.fouls ?? undefined,
        awayFouls: awayStats?.fouls ?? undefined,
        homeOffsides: homeStats?.offsides ?? undefined,
        awayOffsides: awayStats?.offsides ?? undefined,
        homeStarters: (() => {
          const starters = lineupStarters(homeLineup?.playersJson);
          return starters.length ? starters : undefined;
        })(),
        awayStarters: (() => {
          const starters = lineupStarters(awayLineup?.playersJson);
          return starters.length ? starters : undefined;
        })(),
      } as DayMatch;
    }),
  ];
  const allMatches = (isToday
    ? rawAllMatches.filter((match) => belongsOnTodayBoard(match, start, end))
    : rawAllMatches.filter((match) => {
      const kickoff = new Date(match.kickoffAt).getTime();
      return kickoff >= start.getTime() && kickoff < end.getTime();
    }));

  const nameLabels = await localizeEntityMap(
    allMatches.flatMap((match) => [
      { entityType: 'TEAM', entityId: match.homeTeam.id, fallback: match.homeTeam.name },
      { entityType: 'TEAM', entityId: match.awayTeam.id, fallback: match.awayTeam.name },
      { entityType: 'LEAGUE', entityId: match.league.id, fallback: match.league.name },
    ]),
    locale,
  );
  const searchIndex = new Map<string, string>();
  for (const match of allMatches) {
    const sourceHome = match.homeTeam.name;
    const sourceAway = match.awayTeam.name;
    const sourceLeague = match.league.name;
    match.homeTeam.name = localizeTeamName(locale, nameLabels.get(`TEAM:${match.homeTeam.id}`) || sourceHome);
    match.awayTeam.name = localizeTeamName(locale, nameLabels.get(`TEAM:${match.awayTeam.id}`) || sourceAway);
    match.league.name = localizeLeagueName(
      locale,
      match.league,
      nameLabels.get(`LEAGUE:${match.league.id}`) || sourceLeague,
    );
    if (match.leagueCountry) match.leagueCountry = localizePlainName(locale, match.leagueCountry);
    if (match.round) match.round = localizeRoundName(locale, match.round);
    searchIndex.set(
      match.id,
      [
        sourceHome,
        sourceAway,
        sourceLeague,
        match.homeTeam.name,
        match.awayTeam.name,
        match.league.name,
        match.homeTeam.slug,
        match.awayTeam.slug,
        match.league.slug,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    );
  }

  const daySheet = new Map<string, { total: number; live: number }>();
  const todayKey = format(today, 'yyyy-MM-dd');
  for (const row of weekKickoffs) {
    const key = isLiveStatus(row.status) ? todayKey : dateKeyInTimezone(row.kickoffAt, timezone);
    const current = daySheet.get(key) ?? { total: 0, live: 0 };
    current.total += 1;
    if (isLiveStatus(row.status)) current.live += 1;
    daySheet.set(key, current);
  }

  const playingTeamIds = [...new Set(allMatches.flatMap((match) => [match.homeTeam.id, match.awayTeam.id]))];
  const standingRows = playingTeamIds.length
    ? await prisma.standing.findMany({
      where: { teamId: { in: playingTeamIds } },
      orderBy: [{ seasonId: 'desc' }, { rank: 'asc' }],
      select: {
        teamId: true,
        leagueId: true,
        rank: true,
        points: true,
        played: true,
        won: true,
        drawn: true,
        lost: true,
        goalsFor: true,
        goalsAgainst: true,
        seasonId: true,
      },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:540", []))
    : [];
  const standingByTeam = new Map<string, (typeof standingRows)[number]>();
  const standingFor = (leagueId: string, teamId: string) => standingByTeam.get(tableKey(leagueId, teamId));
  for (const row of standingRows) {
    const keyed = tableKey(row.leagueId, row.teamId);
    if (!standingByTeam.has(keyed)) standingByTeam.set(keyed, row);
  }

  const formByTeam = new Map<string, FormLetter[]>();
  if (playingTeamIds.length > 0) {
    const formRows = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        kickoffAt: { lt: start },
        OR: [
          { homeTeamId: { in: playingTeamIds } },
          { awayTeamId: { in: playingTeamIds } },
        ],
      },
      orderBy: { kickoffAt: 'desc' },
      take: Math.min(playingTeamIds.length * 12, 400),
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
      },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:568", []));

    for (const id of playingTeamIds) formByTeam.set(id, []);
    for (const row of formRows) {
      if (row.homeScore == null || row.awayScore == null) continue;
      const homeForm = formByTeam.get(row.homeTeamId);
      const awayForm = formByTeam.get(row.awayTeamId);
      if (homeForm && homeForm.length < 5) {
        homeForm.push(resultLetter(true, row.homeScore, row.awayScore));
      }
      if (awayForm && awayForm.length < 5) {
        awayForm.push(resultLetter(false, row.homeScore, row.awayScore));
      }
    }
  }

  const h2hByPair = new Map<string, Array<{
    homeTeamId: string;
    awayTeamId: string;
    homeScore: number | null;
    awayScore: number | null;
    homeName: string;
    awayName: string;
  }>>();
  if (allMatches.length > 0) {
    const h2hRows = await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        id: { notIn: allMatches.map((match) => match.id) },
        OR: allMatches.flatMap((match) => [
          { homeTeamId: match.homeTeam.id, awayTeamId: match.awayTeam.id },
          { homeTeamId: match.awayTeam.id, awayTeamId: match.homeTeam.id },
        ]),
      },
      orderBy: { kickoffAt: 'desc' },
      take: Math.min(allMatches.length * 6, 200),
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:612", []));

    for (const row of h2hRows) {
      const key = pairKey(row.homeTeamId, row.awayTeamId);
      const list = h2hByPair.get(key) ?? [];
      if (list.length < 5) {
        list.push({
          homeTeamId: row.homeTeamId,
          awayTeamId: row.awayTeamId,
          homeScore: row.homeScore,
          awayScore: row.awayScore,
          homeName: row.homeTeam.name,
          awayName: row.awayTeam.name,
        });
        h2hByPair.set(key, list);
      }
    }
  }

  const summarizeH2h = (match: DayMatch) => {
    const meetings = h2hByPair.get(pairKey(match.homeTeam.id, match.awayTeam.id)) ?? [];
    const record = { homeWins: 0, draws: 0, awayWins: 0, lastScore: undefined as string | undefined };
    for (const meeting of meetings) {
      if (meeting.homeScore == null || meeting.awayScore == null) continue;
      const homeIsHome = meeting.homeTeamId === match.homeTeam.id;
      const homeGoals = homeIsHome ? meeting.homeScore : meeting.awayScore;
      const awayGoals = homeIsHome ? meeting.awayScore : meeting.homeScore;
      if (homeGoals === awayGoals) record.draws += 1;
      else if (homeGoals > awayGoals) record.homeWins += 1;
      else record.awayWins += 1;
    }
    const latest = meetings.find((meeting) => meeting.homeScore != null && meeting.awayScore != null);
    if (latest && latest.homeScore != null && latest.awayScore != null) {
      record.lastScore = `${latest.homeName} ${latest.homeScore}–${latest.awayScore} ${latest.awayName}`;
    }
    if (record.homeWins + record.draws + record.awayWins === 0) return undefined;
    return record;
  };

  const favoriteEntities = session?.user?.id
    ? await prisma.userFavorite.findMany({
      where: { userId: session.user.id },
      select: { entityId: true, entityType: true },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:655", []))
    : [];
  const teamFavoriteIds = favoriteEntities.filter((favorite) => favorite.entityType === 'TEAM').map((favorite) => favorite.entityId);
  const leagueFavoriteIds = favoriteEntities.filter((favorite) => favorite.entityType === 'LEAGUE').map((favorite) => favorite.entityId);
  const matchFavoriteIds = favoriteEntities.filter((favorite) => favorite.entityType === 'MATCH').map((favorite) => favorite.entityId);
  const favoriteTeams = teamFavoriteIds.length
    ? await prisma.team.findMany({ where: { id: { in: teamFavoriteIds } }, select: { externalId: true } }).catch(swallow("src/app/[locale]/matches/page.tsx:661", []))
    : [];
  const favoriteLeagues = leagueFavoriteIds.length
    ? await prisma.league.findMany({ where: { id: { in: leagueFavoriteIds } }, select: { externalId: true } }).catch(swallow("src/app/[locale]/matches/page.tsx:664", []))
    : [];
  const favoriteMatches = matchFavoriteIds.length
    ? await prisma.match.findMany({ where: { id: { in: matchFavoriteIds } }, select: { externalId: true } }).catch(swallow("src/app/[locale]/matches/page.tsx:667", []))
    : [];
  const reminderRows = session?.user?.id && allMatches.length
    ? await prisma.matchReminder.findMany({
      where: { userId: session.user.id, matchId: { in: allMatches.map((match) => match.id) } },
      select: { matchId: true },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:673", []))
    : [];
  const reminderIds = new Set(reminderRows.map((row) => row.matchId));
  const favoriteTeamExternalIds = new Set(favoriteTeams.map((team) => team.externalId));
  const favoriteLeagueExternalIds = new Set(favoriteLeagues.map((league) => league.externalId));
  const favoriteMatchExternalIds = new Set(favoriteMatches.map((match) => match.externalId));

  const queryMatches = allMatches.filter((match) => {
    if (!match.homeTeam || !match.awayTeam || !match.league) return false;
    const haystack = `${searchIndex.get(match.id) || ''} ${sourceSearchQuery(query)}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query) || haystack.includes(sourceSearchQuery(query).toLowerCase());
    const matchesFavorites = !favoritesOnly || (
      favoriteTeamExternalIds.has(match.homeTeam.externalId) ||
      favoriteTeamExternalIds.has(match.awayTeam.externalId) ||
      favoriteLeagueExternalIds.has(match.league.externalId) ||
      favoriteMatchExternalIds.has(match.externalId)
    );
    return matchesSearch && matchesFavorites;
  });

  const isFollowedMatch = (match: DayMatch) =>
    favoriteTeamExternalIds.has(match.homeTeam.externalId) ||
    favoriteTeamExternalIds.has(match.awayTeam.externalId) ||
    favoriteLeagueExternalIds.has(match.league.externalId) ||
    favoriteMatchExternalIds.has(match.externalId);

  const scopedMatches = queryMatches.filter((match) => {
    if (selectedLeague && match.league.slug !== selectedLeague) return false;
    if (selectedChannel && !match.channels.some((channel) => channel.name === selectedChannel)) return false;
    if (selectedHour != null && hourInTimezone(new Date(match.kickoffAt), timezone) !== selectedHour) return false;
    return true;
  });

  const lockProgrammeSlice = Boolean(query || favoritesOnly || selectedLeague);
  const majorScoped = scopedMatches.filter((match) => isMajorLeague(match.league));
  const restScoped = scopedMatches.filter((match) => !isMajorLeague(match.league));
  const hasProgrammeSplit = !lockProgrammeSlice && majorScoped.length > 0 && restScoped.length > 0;
  const programmeScope: 'major' | 'all' = lockProgrammeSlice
    ? 'all'
    : (requestedScope ?? (hasProgrammeSplit ? 'major' : 'all'));

  const filteredMatches = scopedMatches.filter((match) => {
    if (statusFilter === 'live') return isLiveStatus(match.status);
    if (statusFilter === 'upcoming') return match.status === 'NOT_STARTED';
    if (statusFilter === 'finished') return match.status === 'FINISHED';
    return true;
  });

  const liveCount = scopedMatches.filter((match) => isLiveStatus(match.status)).length;
  const finishedCount = scopedMatches.filter((match) => match.status === 'FINISHED').length;
  const upcomingCount = scopedMatches.filter((match) => match.status === 'NOT_STARTED').length;
  const totalGoals = dayEvents.filter(
    (event) => event.type === 'GOAL' || event.type === 'OWN_GOAL' || event.type === 'PENALTY',
  ).length;
  const leagueCount = new Set(queryMatches.map((match) => match.league.id)).size;
  const nextMatches = scopedMatches
    .filter((match) => match.status === 'NOT_STARTED')
    .sort((first, second) => new Date(first.kickoffAt).getTime() - new Date(second.kickoffAt).getTime())
    .slice(0, 4);
  const nextMatch = nextMatches[0];

  const eventTally = new Map<string, number>();
  for (const event of dayEvents) {
    eventTally.set(event.matchId, (eventTally.get(event.matchId) ?? 0) + 1);
  }
  const boardWeight = (match: DayMatch) =>
    matchdayWeight({
      league: match.league,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      hasLicensedStream: match.hasLicensedStream,
      eventCount: eventTally.get(match.id) ?? 0,
    });

  const liveBoardPool = programmeScope === 'major' && hasProgrammeSplit ? majorScoped : scopedMatches;
  const liveBoard = [...liveBoardPool]
    .filter((match) => isLiveStatus(match.status))
    .sort((first, second) => boardWeight(second) - boardWeight(first))
    .slice(0, 8);

  const spotlightWeight = (match: DayMatch) =>
    boardWeight(match) + (match.homeStarters?.length ? 20 : 0) + (match.awayStarters?.length ? 20 : 0);

  const spotlightMatch =
    liveBoard[0] ??
    [...scopedMatches].sort((first, second) => spotlightWeight(second) - spotlightWeight(first))[0] ??
    filteredMatches[0];

  const spotlightReminder = spotlightMatch ? reminderIds.has(spotlightMatch.id) : false;

  const spotlightH2h = spotlightMatch
    ? await prisma.match.findMany({
      where: {
        status: 'FINISHED',
        id: { not: spotlightMatch.id },
        OR: [
          { homeTeamId: spotlightMatch.homeTeam.id, awayTeamId: spotlightMatch.awayTeam.id },
          { homeTeamId: spotlightMatch.awayTeam.id, awayTeamId: spotlightMatch.homeTeam.id },
        ],
      },
      orderBy: { kickoffAt: 'desc' },
      take: 5,
      select: {
        id: true,
        kickoffAt: true,
        homeScore: true,
        awayScore: true,
        homeTeam: { select: { id: true, name: true } },
        awayTeam: { select: { id: true, name: true } },
      },
    }).catch(swallow("src/app/[locale]/matches/page.tsx:788", []))
    : [];

  const spotlightH2hRecord = spotlightH2h.reduce(
    (record, meeting) => {
      if (meeting.homeScore == null || meeting.awayScore == null || !spotlightMatch) return record;
      const homeIsHome = meeting.homeTeam.id === spotlightMatch.homeTeam.id;
      const homeGoals = homeIsHome ? meeting.homeScore : meeting.awayScore;
      const awayGoals = homeIsHome ? meeting.awayScore : meeting.homeScore;
      if (homeGoals === awayGoals) record.draws += 1;
      else if (homeGoals > awayGoals) record.homeWins += 1;
      else record.awayWins += 1;
      return record;
    },
    { homeWins: 0, draws: 0, awayWins: 0 }
  );

  const statusFilters = [
    { value: 'all', label: pick(locale, 'الكل', 'All'), count: scopedMatches.length },
    { value: 'live', label: t('live'), count: liveCount },
    { value: 'upcoming', label: pick(locale, 'قادمة', 'Upcoming'), count: upcomingCount },
    { value: 'finished', label: t('finished'), count: finishedCount },
  ] as const;

  const pageHref = (overrides: Record<string, string | undefined> = {}) => {
    const nextParams = new URLSearchParams();
    nextParams.set('date', overrides.date ?? selectedDateStr);
    const nextQuery = overrides.q ?? params.q;
    const nextStatus = overrides.status ?? (statusFilter !== 'all' ? statusFilter : undefined);
    const nextFavorites = 'favorites' in overrides ? overrides.favorites : (favoritesOnly ? '1' : undefined);
    const nextLeague = 'league' in overrides ? overrides.league : (selectedLeague || undefined);
    const nextChannel = 'channel' in overrides ? overrides.channel : (selectedChannel || undefined);
    const nextHour = 'hour' in overrides ? overrides.hour : (selectedHour != null ? String(selectedHour) : undefined);
    const nextScope = 'scope' in overrides
      ? overrides.scope
      : (requestedScope === 'all' || requestedScope === 'major' ? requestedScope : undefined);
    if (nextQuery) nextParams.set('q', nextQuery);
    if (nextStatus && nextStatus !== 'all') nextParams.set('status', nextStatus);
    if (nextFavorites === '1') nextParams.set('favorites', '1');
    if (nextLeague) nextParams.set('league', nextLeague);
    if (nextChannel) nextParams.set('channel', nextChannel);
    if (nextHour) nextParams.set('hour', nextHour);
    if (nextScope === 'all') nextParams.set('scope', 'all');
    return `/matches?${nextParams.toString()}`;
  };

  const favoritesHref = session?.user
    ? pageHref({ favorites: favoritesOnly ? undefined : '1' })
    : `/login?callbackUrl=${encodeURIComponent(pageHref({ favorites: '1' }))}`;

  const dates = stripDates.map((value) => {
    const date = parseISO(value);
    const sheet = daySheet.get(value);
    const todayKey = format(today, 'yyyy-MM-dd');
    const tomorrowKey = format(addDays(today, 1), 'yyyy-MM-dd');
    const afterKey = format(addDays(today, 2), 'yyyy-MM-dd');
    const dayName =
      value === todayKey
        ? pick(locale, 'اليوم', 'Today')
        : value === tomorrowKey
          ? pick(locale, 'غدًا', 'Tomorrow')
          : value === afterKey
            ? pick(locale, 'بعد غد', 'In two days')
            : format(date, 'EEEE', { locale: locale === 'ar' ? ar : enUS });
    return {
      value,
      isToday: value === todayKey,
      dayName,
      dayNumber: format(date, 'd'),
      month: format(date, 'MMM', { locale: locale === 'ar' ? ar : enUS }),
      fixtures: sheet?.total ?? 0,
      live: sheet?.live ?? 0,
    };
  });

  const nowHour = currentHourInTimezone(timezone);
  const hourBuckets = new Map<number, DayMatch[]>();
  for (const match of queryMatches) {
    const hour = hourInTimezone(new Date(match.kickoffAt), timezone);
    const bucket = hourBuckets.get(hour) ?? [];
    bucket.push(match);
    hourBuckets.set(hour, bucket);
  }
  const timelineSlots: KickoffSlot[] = Array.from(hourBuckets.entries())
    .sort((first, second) => first[0] - second[0])
    .map(([hour, matches]) => ({
      hour,
      label: `${String(hour).padStart(2, '0')}:00`,
      isNow: isToday && hour === nowHour,
      matches,
    }));

  const leagueGroups = Array.from(
    filteredMatches.reduce(
      (groups, match) => {
        const current = groups.get(match.league.id);
        if (current) {
          current.matches.push(match);
        } else {
          groups.set(match.league.id, {
            league: match.league,
            country: match.leagueCountry,
            matches: [match],
          });
        }
        return groups;
      },
      new Map<string, { league: DayMatch['league']; country?: string; matches: DayMatch[] }>()
    ).values()
  ).sort(compareMatchdayGroups).map((group) => ({
    ...group,
    rounds: [...new Set(group.matches.map((match) => match.round).filter((value): value is string => Boolean(value)))],
    matches: [...group.matches].sort((first, second) => {
      const rank = (match: DayMatch) => (isLiveStatus(match.status) ? 0 : match.status === 'NOT_STARTED' ? 1 : 2);
      return rank(first) - rank(second) || new Date(first.kickoffAt).getTime() - new Date(second.kickoffAt).getTime();
    }),
  }));
  const deskGroups = leagueGroups.filter((group) => isMajorLeague(group.league));
  const restGroups = leagueGroups.filter((group) => !isMajorLeague(group.league));
  const showProgrammeSplit = hasProgrammeSplit && deskGroups.length > 0;

  const eventsByMatch = new Map<string, typeof dayEvents>();
  for (const event of dayEvents) {
    const current = eventsByMatch.get(event.matchId) ?? [];
    current.push(event);
    eventsByMatch.set(event.matchId, current);
  }

  const namedActor = (value?: string | null) => {
    const name = value?.trim();
    return name || undefined;
  };

  const scorers = dayEvents
    .filter((event) => event.type === 'GOAL' || event.type === 'OWN_GOAL' || event.type === 'PENALTY')
    .slice(0, 24)
    .map((event) => {
      const concedingHome =
        event.teamId === event.match.homeTeamId ||
        event.teamId === event.match.homeTeam.id ||
        event.teamId === event.match.homeTeam.externalId;
      const isHome = event.type === 'OWN_GOAL' ? !concedingHome : concedingHome;
      const team = isHome ? event.match.homeTeam : event.match.awayTeam;
      const minuteLabel = event.extraMinute ? `${event.minute}+${event.extraMinute}` : `${event.minute}`;
      return {
        id: event.id,
        matchId: event.match.id,
        player: namedActor(event.playerName)
          ? localizeTeamName(locale, namedActor(event.playerName) as string)
          : pick(locale, 'هدف', 'Goal'),
        minute: minuteLabel,
        type: event.type,
        teamName: localizeTeamName(locale, team.name),
        teamLogo: team.logoUrl,
        leagueName: localizeLeagueName(locale, event.match.league, event.match.league.name),
        assist:
          namedActor(event.assistName) &&
          foldSearch(event.assistName || '') !== foldSearch(event.playerName || '')
            ? namedActor(event.assistName)
            : undefined,
      };
    });

  const discipline = dayEvents
    .filter((event) => event.type === 'YELLOW_CARD' || event.type === 'RED_CARD')
    .filter((event) => Boolean(namedActor(event.playerName)))
    .slice(0, 24)
    .map((event) => {
      const isHome =
        event.teamId === event.match.homeTeamId ||
        event.teamId === event.match.homeTeam.id ||
        event.teamId === event.match.homeTeam.externalId;
      const team = isHome ? event.match.homeTeam : event.match.awayTeam;
      const rawPlayer = namedActor(event.playerName) as string;
      return {
        id: event.id,
        matchId: event.match.id,
        player: localizeTeamName(locale, rawPlayer),
        minute: event.extraMinute ? `${event.minute}+${event.extraMinute}` : `${event.minute}`,
        type: event.type,
        teamName: localizeTeamName(locale, team.name),
        teamLogo: team.logoUrl,
      };
    });

  const spotlightGoals = spotlightMatch
    ? (eventsByMatch.get(spotlightMatch.id) ?? [])
      .filter((event) => event.type === 'GOAL' || event.type === 'OWN_GOAL' || event.type === 'PENALTY')
      .slice()
      .reverse()
    : [];
  const spotlightTimeline = spotlightMatch
    ? (eventsByMatch.get(spotlightMatch.id) ?? []).slice().reverse().slice(-8)
    : [];
  const spotlightHomeStanding = spotlightMatch
    ? standingFor(spotlightMatch.league.id, spotlightMatch.homeTeam.id)
    : undefined;
  const spotlightAwayStanding = spotlightMatch
    ? standingFor(spotlightMatch.league.id, spotlightMatch.awayTeam.id)
    : undefined;
  const spotlightYellow = spotlightMatch
    ? (eventsByMatch.get(spotlightMatch.id) ?? []).filter((event) => event.type === 'YELLOW_CARD').length
    : 0;
  const spotlightRed = spotlightMatch
    ? (eventsByMatch.get(spotlightMatch.id) ?? []).filter((event) => event.type === 'RED_CARD').length
    : 0;

  const eventCount = (type: string) => dayEvents.filter((event) => event.type === type).length;

  const broadcastMap = new Map<string, { name: string; logoUrl?: string | null; count: number }>();
  for (const match of queryMatches) {
    for (const channel of match.channels) {
      const current = broadcastMap.get(channel.name);
      if (current) current.count += 1;
      else broadcastMap.set(channel.name, { name: channel.name, logoUrl: channel.logoUrl, count: 1 });
    }
  }
  const broadcasts = Array.from(broadcastMap.values()).sort((first, second) => second.count - first.count);

  const toDeskMatch = (match: DayMatch) => ({
    id: match.id,
    kickoffAt: match.kickoffAt,
    status: match.status,
    minute: match.minute,
    homeTeam: { name: match.homeTeam.name, logoUrl: match.homeTeam.logoUrl },
    awayTeam: { name: match.awayTeam.name, logoUrl: match.awayTeam.logoUrl },
    league: { name: match.league.name },
    channel: match.channels[0]?.name,
    hasLicensedStream: match.hasLicensedStream,
  });

  const nowMs = Date.now();
  const soonDayMatches = isToday
    ? queryMatches
      .filter((match) => {
        if (match.status !== 'NOT_STARTED') return false;
        const kickoff = new Date(match.kickoffAt).getTime();
        return kickoff >= nowMs && kickoff <= nowMs + 2 * 60 * 60 * 1000;
      })
      .sort((first, second) => new Date(first.kickoffAt).getTime() - new Date(second.kickoffAt).getTime())
      .slice(0, 6)
    : [];
  const soonMatches = soonDayMatches.map(toDeskMatch);

  const reminderMatches = queryMatches
    .filter((match) => reminderIds.has(match.id))
    .map(toDeskMatch);

  const onAirMatches = queryMatches
    .filter((match) => isLiveStatus(match.status) && match.hasLicensedStream)
    .map(toDeskMatch);

  const followedTeamMatches = queryMatches.filter((match) => (
    (match.status === 'NOT_STARTED' || isLiveStatus(match.status)) &&
    (favoriteTeamExternalIds.has(match.homeTeam.externalId) || favoriteTeamExternalIds.has(match.awayTeam.externalId))
  ));
  const clashPairs: Array<{ a: ReturnType<typeof toDeskMatch>; b: ReturnType<typeof toDeskMatch> }> = [];
  for (let i = 0; i < followedTeamMatches.length; i += 1) {
    for (let j = i + 1; j < followedTeamMatches.length; j += 1) {
      const first = followedTeamMatches[i];
      const second = followedTeamMatches[j];
      const gap = Math.abs(new Date(first.kickoffAt).getTime() - new Date(second.kickoffAt).getTime());
      if (gap <= 20 * 60 * 1000) {
        clashPairs.push({ a: toDeskMatch(first), b: toDeskMatch(second) });
      }
    }
  }

  const leagueLenses = Array.from(
    queryMatches.reduce((groups, match) => {
      const current = groups.get(match.league.slug);
      if (current) current.count += 1;
      else {
        groups.set(match.league.slug, {
          value: match.league.slug,
          label: match.league.name,
          count: 1,
          logoUrl: match.league.logoUrl,
        });
      }
      return groups;
    }, new Map<string, { value: string; label: string; count: number; logoUrl?: string | null }>())
      .values()
  )
    .sort((first, second) => {
      const leagueFor = (slug: string) => queryMatches.find((match) => match.league.slug === slug)?.league;
      return (
        leagueTier(leagueFor(second.value) ?? { name: second.label }) -
        leagueTier(leagueFor(first.value) ?? { name: first.label }) ||
        second.count - first.count
      );
    })
    .map((chip) => ({
      ...chip,
      active: selectedLeague === chip.value,
      href: pageHref({ league: selectedLeague === chip.value ? undefined : chip.value }),
    }));

  const channelLenses = broadcasts.map((channel) => ({
    value: channel.name,
    label: channel.name,
    count: channel.count,
    logoUrl: channel.logoUrl,
    active: selectedChannel === channel.name,
    href: pageHref({ channel: selectedChannel === channel.name ? undefined : channel.name }),
  }));

  const hourLenses = timelineSlots.map((slot) => ({
    value: String(slot.hour),
    label: slot.isNow ? `${slot.label} · ${pick(locale, 'الآن', 'Now')}` : slot.label,
    count: slot.matches.length,
    active: selectedHour === slot.hour,
    href: pageHref({ hour: selectedHour === slot.hour ? undefined : String(slot.hour) }),
  }));

  const lensesActive = Boolean(selectedLeague || selectedChannel || selectedHour != null);

  const lastEvents: Record<string, string> = {};
  for (const match of liveBoard) {
    const latest = (eventsByMatch.get(match.id) ?? [])[0];
    if (!latest) continue;
    const label = [
      eventLabel(latest.type),
      namedActor(latest.playerName),
      `${latest.extraMinute ? `${latest.minute}+${latest.extraMinute}` : latest.minute}'`,
    ]
      .filter(Boolean)
      .join(' · ');
    lastEvents[match.id] = label;
    lastEvents[match.externalId] = label;
  }

  const heroStats = [
    { value: queryMatches.length, label: countLabel(locale, queryMatches.length, 'match', 'matches') },
    ...(liveCount > 0 ? [{ value: liveCount, label: countLabel(locale, liveCount, 'live', 'live') }] : []),
    ...(totalGoals > 0 ? [{ value: totalGoals, label: countLabel(locale, totalGoals, 'goal', 'goals') }] : []),
    ...(leagueCount > 0 ? [{ value: leagueCount, label: countLabel(locale, leagueCount, 'league', 'leagues') }] : []),
    ...(eventCount('YELLOW_CARD') > 0 ? [{ value: eventCount('YELLOW_CARD'), label: t('yellow_card') }] : []),
    ...(eventCount('RED_CARD') > 0 ? [{ value: eventCount('RED_CARD'), label: t('red_card') }] : []),
    ...(broadcasts.length > 0 ? [{ value: broadcasts.length, label: pick(locale, 'قناة', 'Channels') }] : []),
  ];

  const dayIds = liveBoardPool.flatMap((match) => [match.id, match.externalId]);

  const pinnedMatchesData = allMatches.map((m) => ({
    id: m.id,
    homeTeam: { name: m.homeTeam.name, logoUrl: m.homeTeam.logoUrl ?? null },
    awayTeam: { name: m.awayTeam.name, logoUrl: m.awayTeam.logoUrl ?? null },
    homeScore: m.homeScore ?? null,
    awayScore: m.awayScore ?? null,
    status: m.status,
    minute: m.minute ?? null,
    kickoffTime: format(new Date(m.kickoffAt), 'HH:mm'),
    leagueName: m.league.name,
  }));

  const groundsMap = new Map<string, { name: string; city?: string; count: number }>();
  for (const match of queryMatches) {
    if (match.venue) {
      const current = groundsMap.get(match.venue);
      if (current) current.count += 1;
      else groundsMap.set(match.venue, { name: match.venue, city: match.venueCity, count: 1 });
    }
  }
  const grounds = Array.from(groundsMap.values()).sort((first, second) => second.count - first.count);

  const matchCardFor = (match: DayMatch) => {
    const matchEvents = eventsByMatch.get(match.id) ?? [];
    const homeTable = standingFor(match.league.id, match.homeTeam.id);
    const awayTable = standingFor(match.league.id, match.awayTeam.id);
    return (
      <MatchCard
        key={match.id}
        match={match}
        channel={match.channels[0]?.name}
        country={match.leagueCountry}
        venueCity={match.venueCity}
        followed={isFollowedMatch(match)}
        homeTable={homeTable ? { rank: homeTable.rank, points: homeTable.points } : undefined}
        awayTable={awayTable ? { rank: awayTable.rank, points: awayTable.points } : undefined}
        homeForm={formByTeam.get(match.homeTeam.id)}
        awayForm={formByTeam.get(match.awayTeam.id)}
        h2h={summarizeH2h(match)}
        hasLicensedStream={match.hasLicensedStream}
        yellowCount={matchEvents.filter((event) => event.type === 'YELLOW_CARD').length}
        redCount={matchEvents.filter((event) => event.type === 'RED_CARD').length}
        homeFormation={match.homeFormation}
        awayFormation={match.awayFormation}
        homePossession={match.homePossession}
        awayPossession={match.awayPossession}
        round={match.round}
        events={matchEvents.map((event) => ({
          type: event.type as 'GOAL' | 'OWN_GOAL' | 'PENALTY' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR',
          minute: event.minute,
          extraMinute: event.extraMinute ?? undefined,
          player: event.playerName ?? undefined,
          teamId: event.teamId,
        }))}
      />
    );
  };

  const leagueBoard = (
    group: (typeof leagueGroups)[number],
    compact?: boolean,
    index?: number,
  ) => {
    const liveInLeague = group.matches.filter((match) => isLiveStatus(match.status)).length;
    const upcomingInLeague = group.matches.filter((match) => match.status === 'NOT_STARTED').length;
    const roundLabel = group.rounds[0]
      ? t('round_label', {
        round: group.rounds.length === 1 ? group.rounds[0] : group.rounds.join(' · '),
      })
      : '';
    return (
      <section
        key={group.league.id}
        id={`league-${group.league.slug}`}
        className={styles.leagueBoard}
      >
        <div className={styles.leagueHead}>
          <div className={styles.leagueHeadCopy}>
            {typeof index === 'number' ? (
              <span className={styles.leagueOrdinal} aria-hidden>
                {String(index + 1).padStart(2, '0')}
              </span>
            ) : null}
            <div className={styles.leagueCrest}>
              <img src={group.league.logoUrl || '/placeholder.png'} alt="" />
            </div>
            <div className={styles.leagueMeta}>
              <Link href={`/league/${group.league.slug}`} className={styles.leagueTitle}>
                {group.league.name}
              </Link>
              <span>
                {[group.country, roundLabel].filter(Boolean).join(' · ')}
              </span>
            </div>
          </div>
          <div className={styles.leagueHeadAside}>
            {liveInLeague > 0 ? (
              <span className={styles.liveChip}>
                <span className={styles.livePulse} />
                {liveInLeague} {t('live')}
              </span>
            ) : upcomingInLeague > 0 ? (
              <span className={styles.stateChip}>
                {upcomingInLeague} {pick(locale, 'قادمة', 'upcoming')}
              </span>
            ) : (
              <span className={styles.stateChip}>
                {pick(locale, 'منتهية', 'Finished')}
              </span>
            )}
            <span className={styles.countChip}>
              {group.matches.length}
            </span>
          </div>
        </div>
        <div className={`${styles.leagueBody} ${liveInLeague > 0 ? styles.leagueBodyLive : ''}`}>
          {compact
            ? group.matches.map((match) => (
              <CompactFixture key={match.id} match={match} followed={isFollowedMatch(match)} locale={locale} />
            ))
            : group.matches.map((match) => matchCardFor(match))}
        </div>
      </section>
    );
  };

  const reelItems: MatchdayReelItem[] = [];
  const seenReel = new Set<string>();
  const pushReel = (match?: DayMatch) => {
    if (!match || seenReel.has(match.id)) return;
    seenReel.add(match.id);
    reelItems.push(toReelItem(match));
  };
  liveBoard.forEach(pushReel);
  pushReel(spotlightMatch);
  soonDayMatches.forEach(pushReel);
  (programmeScope === 'major' ? majorScoped : scopedMatches).slice(0, 8).forEach(pushReel);
  const dateLabel = formatKickoff(selectedDate, timezone, locale === 'en' ? 'en' : 'ar', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: undefined,
    minute: undefined,
  });

  const dayCensus = [
    ...(totalGoals > 0 ? [{ value: totalGoals, label: t('goal') }] : []),
    ...(eventCount('YELLOW_CARD') > 0 ? [{ value: eventCount('YELLOW_CARD'), label: t('yellow_card') }] : []),
    ...(eventCount('RED_CARD') > 0 ? [{ value: eventCount('RED_CARD'), label: t('red_card') }] : []),
    ...(broadcasts.length > 0 ? [{ value: broadcasts.length, label: pick(locale, 'قناة', 'Channels') }] : []),
  ];

  return (
    <SalonStage
      tone="wire"
      wide
      compact
      kicker={pick(locale, 'المباريات', 'Matches')}
      title={pick(locale, 'مباريات اليوم', "Today's matches")}
      lead={pick(
        locale,
        'النتائج والمواعيد من المصدر الحي فقط. لا أرقام مخترعة — المباشر يظهر إن وصلت الحالة من المكتب.',
        'Scores and kickoffs from the live source only. No invented numbers — live appears when the desk files the status.',
      )}
      aside={
        liveCount > 0
          ? pick(locale, `${liveCount} مباشرة`, `${liveCount} live`)
          : pick(locale, 'من المصدر', 'From source')
      }
      tools={
        <HallFoyer
          label={pick(locale, 'المباريات', 'Matches')}
          items={[
            { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays, current: true },
            { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
            { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
            { href: '/transfers', label: pick(locale, 'الانتقالات', 'Transfers'), icon: ArrowLeftRight },
            { href: '/stats', label: pick(locale, 'إحصائيات', 'Stats'), icon: BarChart3 },
          ]}
        />
      }
    >
      <div className={styles.matchdayBoard}>
        {reelItems.length > 0 ? (
          <MatchdayConsole locale={locale} items={reelItems} dateLabel={dateLabel} />
        ) : null}

        <div className={styles.dock}>
          <div className={styles.dockMeta}>
            <LiveDataStatus />
            <TimezoneSelector />
          </div>
          <div className={styles.dateStrip}>
            <Link
              href={pageHref({ date: format(addDays(selectedDate, -1), 'yyyy-MM-dd') })}
              aria-label={pick(locale, 'اليوم السابق', 'Previous day')}
              className={styles.navArrow}
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            {dates.map((date) => {
              const active = date.value === selectedDateStr;
              return (
                <Link
                  key={date.value}
                  href={pageHref({ date: date.value })}
                  className={`${active ? styles.dateChipActive : styles.dateChip}${date.live > 0 && !active ? ` ${styles.dateChipLive}` : ''}`}
                >
                  {date.live > 0 && !active ? <span className={styles.dateLiveDot} /> : null}
                  <span className={styles.chipDay}>{date.dayName}</span>
                  <span className={styles.chipNumber}>{date.dayNumber}</span>
                  <span className={styles.chipCount}>
                    {date.fixtures > 0 ? `(${date.fixtures})` : '—'}
                  </span>
                </Link>
              );
            })}
            <Link
              href={pageHref({ date: format(addDays(selectedDate, 1), 'yyyy-MM-dd') })}
              aria-label={pick(locale, 'اليوم التالي', 'Next day')}
              className={styles.navArrow}
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.filterPills}>
              {statusFilters.map((filter) => {
                const active = filter.value === statusFilter;
                return (
                  <Link
                    key={filter.value}
                    href={pageHref({ status: filter.value })}
                    className={
                      active
                        ? filter.value === 'live'
                          ? styles.filterBtnActiveLive
                          : styles.filterBtnActive
                        : styles.filterBtn
                    }
                  >
                    {filter.label}
                    <span className={styles.filterCount}>{filter.count}</span>
                  </Link>
                );
              })}
              <span className={styles.filterDivider} />
              <Link
                href={favoritesHref}
                className={favoritesOnly ? styles.filterBtnActive : styles.filterBtn}
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                {pick(locale, session?.user ? 'فرقي المفضلة' : 'تابع فرقك', session?.user ? 'My teams' : 'Follow your teams')}
              </Link>
              {hasProgrammeSplit ? (
                <>
                  <span className={styles.filterDivider} />
                  <Link
                    href={pageHref({ scope: undefined })}
                    className={programmeScope === 'major' ? styles.filterBtnActive : styles.filterBtn}
                  >
                    {pick(locale, 'كبرى', 'Majors')}
                    <span className={styles.filterCount}>{majorScoped.length}</span>
                  </Link>
                  <Link
                    href={pageHref({ scope: 'all' })}
                    className={programmeScope === 'all' ? styles.filterBtnActive : styles.filterBtn}
                  >
                    {pick(locale, 'البرنامج كامل', 'Full programme')}
                    <span className={styles.filterCount}>{scopedMatches.length}</span>
                  </Link>
                </>
              ) : null}
            </div>

            <form className={styles.searchWrap}>
              <Search className={styles.searchIcon} />
              <input
                name="q"
                type="search"
                defaultValue={params.q}
                placeholder={pick(locale, 'ابحث عن فريق أو بطولة', 'Search for a team or league')}
                className={styles.searchInput}
              />
              <input type="hidden" name="date" value={selectedDateStr} />
              {statusFilter !== 'all' && <input type="hidden" name="status" value={statusFilter} />}
              {favoritesOnly && <input type="hidden" name="favorites" value="1" />}
              {selectedLeague && <input type="hidden" name="league" value={selectedLeague} />}
              {selectedChannel && <input type="hidden" name="channel" value={selectedChannel} />}
              {selectedHour != null && <input type="hidden" name="hour" value={String(selectedHour)} />}
              {requestedScope === 'all' && <input type="hidden" name="scope" value="all" />}
            </form>
          </div>

          {heroStats.length > 0 ? (
            <ul className={styles.dockMeters}>
              {heroStats.slice(0, 6).map((stat) => (
                <li key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <MatchdayLenses
          leagues={leagueLenses}
          channels={channelLenses}
          hours={hourLenses}
          clearHref={pageHref({ league: undefined, channel: undefined, hour: undefined })}
        />

        <LiveNowBoard seed={liveBoard} dayIds={dayIds} lastEvents={lastEvents} />

        <main className={styles.matchdayMain}>
          <section className={styles.fixtureProgramme} aria-labelledby="fixture-programme-title">
            <div className={styles.fixtureProgrammeHead}>
              <div>
                <span className={styles.programmeEyebrow}>
                  {pick(locale, 'البرنامج', 'Programme')}
                </span>
                <h2 id="fixture-programme-title">
                  {pick(locale, 'مباريات اليوم', "Today's matches")}
                </h2>
              </div>
              <span className={styles.fixtureProgrammeCount}>
                {filteredMatches.length}
                <small>{pick(locale, 'مباراة', 'matches')}</small>
              </span>
            </div>

            <div className={styles.contentGrid}>
              <div className={styles.programmeCol}>
                {leagueGroups.length > 0 ? (
                  <>
                    <nav className={styles.leagueJump} aria-label={pick(locale, 'البطولات في هذا اليوم', 'Competitions on this day')}>
                      {(showProgrammeSplit ? [...deskGroups, ...restGroups] : leagueGroups).map((group) => {
                        const liveInLeague = group.matches.filter((match) => isLiveStatus(match.status)).length;
                        return (
                          <a
                            key={group.league.id}
                            href={`#league-${group.league.slug}`}
                            className={`${styles.leagueJumpChip} ${liveInLeague > 0 ? styles.leagueJumpLive : ''}`}
                          >
                            <img src={group.league.logoUrl || '/placeholder.png'} alt="" />
                            <span>{group.league.name}</span>
                            <b>{liveInLeague > 0 ? liveInLeague : group.matches.length}</b>
                          </a>
                        );
                      })}
                    </nav>
                    {showProgrammeSplit ? (
                      <>
                        <div id="desk" className={`${styles.majorHall} scroll-mt-[18rem]`}>
                          <div className={styles.majorHead}>
                            <div>
                              <span className={styles.majorKicker}>
                                {pick(locale, 'البطولات', 'Competitions')}
                              </span>
                              <h2>
                                {pick(locale, 'البطولات الكبرى', 'Major competitions')}
                              </h2>
                              <p>
                                {pick(
                                  locale,
                                  'مباشر أولاً، ثم أقرب ركلة، كما وصلت من المصدر.',
                                  'Live first, then the next kickoff, as filed by the source.'
                                )}
                              </p>
                            </div>
                            <strong>
                              {deskGroups.reduce((total, group) => total + group.matches.length, 0)}
                              <span>{pick(locale, 'مباراة', 'matches')}</span>
                            </strong>
                          </div>
                          <div className={styles.majorStack}>
                            {deskGroups.map((group, index) => leagueBoard(group, false, index))}
                          </div>
                        </div>
                        {restGroups.length > 0 ? (
                          <div id="rest" className={`${styles.restHall} scroll-mt-[18rem]`}>
                            <div className={styles.majorHead}>
                              <div>
                                <span className={styles.restKicker}>
                                  {pick(locale, 'باقي اليوم', 'Rest of the day')}
                                </span>
                                <h2>
                                  {pick(locale, 'باقي برنامج اليوم', "The rest of today's programme")}
                                </h2>
                                <p>
                                  {pick(
                                    locale,
                                    'نفس الترتيب: مباشر، قادم، منتهٍ — في بطاقات أخف.',
                                    'The same order: live, upcoming, finished — in lighter cards.'
                                  )}
                                </p>
                              </div>
                              <div className={styles.restTools}>
                                <strong>
                                  {restGroups.reduce((total, group) => total + group.matches.length, 0)}
                                  <span>{pick(locale, 'مباراة', 'matches')}</span>
                                </strong>
                                {programmeScope === 'major' ? (
                                  <Link href={`${pageHref({ scope: 'all' })}#rest`} className={styles.restExpand}>
                                    {pick(locale, 'بطاقات كاملة', 'Full cards')}
                                  </Link>
                                ) : null}
                              </div>
                            </div>
                            <div className={styles.majorStack}>
                              {restGroups.map((group, index) => leagueBoard(group, programmeScope === 'major', deskGroups.length + index))}
                            </div>
                          </div>
                        ) : null}
                      </>
                    ) : (
                      leagueGroups.map((group, index) => leagueBoard(group, false, index))
                    )}
                  </>
                ) : (
                  <div className="rounded-[1.55rem] border border-dashed border-border bg-card/80 px-6 py-20 text-center dark:border-border dark:bg-muted">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-card/[0.04]">
                      <Clock3 className="h-6 w-6 text-muted-foreground dark:text-foreground" />
                    </div>
                    <h3 className="mt-6 text-xl font-bold text-foreground dark:text-foreground">
                      {favoritesOnly
                        ? (session?.user
                            ? pick(locale, 'لا توجد مباريات لفرقك المفضلة في هذا اليوم', 'No matches for your followed teams today')
                            : pick(locale, 'تابع أنديتك وفرقك المفضلة', 'Follow your favorite teams'))
                        : lensesActive
                          ? pick(locale, 'لا مباريات تحت هذه العدسة', 'No matches under this lens')
                          : statusFilter === 'live'
                            ? pick(locale, 'لا توجد مباريات مباشرة الآن', 'No live matches right now')
                            : statusFilter === 'upcoming'
                              ? pick(locale, 'لا مواعيد قادمة في هذا اليوم', 'No upcoming fixtures on this day')
                              : statusFilter === 'finished'
                                ? pick(locale, 'لا نتائج منتهية في هذا اليوم', 'No finished results on this day')
                                : pick(locale, 'لا توجد مباريات في هذا اليوم', 'No matches on this day')}
                    </h3>
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      {favoritesOnly
                        ? (session?.user
                            ? pick(locale, 'أضف مزيداً من الفرق أو البطولات لمتابعتها هنا، أو استعرض مباريات اليوم كاملة.', 'Add more teams to follow, or view the full day schedule.')
                            : pick(locale, 'سجل دخولك أو اختر أنديتك المفضلة لتظهر مبارياتها هنا تلقائياً.', 'Sign in or select your favorite teams to track their matches here.'))
                        : lensesActive
                          ? pick(locale, 'امسح البطولة أو القناة أو الساعة لعرض برنامج اليوم كاملاً.', 'Clear the competition, channel or hour to show the full day.')
                          : statusFilter === 'all'
                            ? pick(locale, 'جرّب يوماً آخر أو امسح عبارة البحث لعرض جميع المباريات.', 'Try another day or clear the search to show all matches.')
                            : pick(locale, 'غيّر الفلتر أو اختر يوماً آخر من شريط التواريخ.', 'Change the filter or choose another day.')}
                    </p>
                    <Link
                      href={favoritesOnly
                        ? (session?.user ? '/favorites' : `/login?callbackUrl=${encodeURIComponent('/matches?favorites=1')}`)
                        : lensesActive
                          ? pageHref({ league: undefined, channel: undefined, hour: undefined })
                          : '/matches'}
                      className="mt-6 inline-flex rounded-xl bg-foreground px-6 py-3 text-[11px] font-bold text-white transition-colors hover:bg-orange-500 dark:bg-card dark:text-foreground"
                    >
                      {favoritesOnly
                        ? (session?.user ? pick(locale, 'إدارة الفرق المفضلة', 'Manage favorites') : pick(locale, 'تسجيل الدخول لتتبع الفرق', 'Sign in to follow teams'))
                        : lensesActive
                          ? pick(locale, 'مسح العدسات', 'Clear lenses')
                          : pick(locale, 'العودة إلى مباريات اليوم', "Back to today's matches")}
                    </Link>
                  </div>
                )}
              </div>

              <aside className={styles.rail}>
                <section className={styles.plate}>
                  <div className="matchday-section-kicker">
                    <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                      {pick(locale, 'الموعد التالي', 'Next kickoff')}
                    </span>
                  </div>
                  <h2 className="mt-2 text-sm font-bold text-foreground dark:text-foreground">
                    {pick(locale, 'الموعد التالي', 'Next fixture')}
                  </h2>
                  {nextMatch ? (
                    <div className="mt-4 space-y-3">
                      {nextMatches.map((match) => (
                        <Link
                          key={match.id}
                          href={`/match/${match.id}`}
                          className="block rounded-xl border border-border px-3 py-3 transition-colors hover:border-orange-500/30 dark:border-border"
                        >
                          <div className="flex items-center justify-between gap-2 text-[9px] font-semibold text-muted-foreground">
                            <span className="truncate">{match.league.name}</span>
                            <ClientTime value={match.kickoffAt} className="tabular-nums text-orange-500" />
                          </div>
                          <p className="mt-1.5 truncate text-[12px] font-bold text-foreground dark:text-foreground">
                            {match.homeTeam.name} × {match.awayTeam.name}
                          </p>
                          {(formByTeam.get(match.homeTeam.id)?.length || formByTeam.get(match.awayTeam.id)?.length) ? (
                            <p className="mt-1.5 flex items-center gap-2">
                              <FormPips letters={formByTeam.get(match.homeTeam.id) ?? []} />
                              <span className="text-slate-200 dark:text-foreground/10">/</span>
                              <FormPips letters={formByTeam.get(match.awayTeam.id) ?? []} />
                            </p>
                          ) : null}
                          {(match.venue || match.channels[0]) && (
                            <p className="mt-1 truncate text-[9px] font-medium text-muted-foreground">
                              {[match.venue, match.venueCity, match.channels[0]?.name].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-[12px] font-medium text-muted-foreground">
                      {pick(locale, 'اكتمل جدول هذا اليوم.', "This day's schedule is complete.")}
                    </p>
                  )}
                </section>

                <div id="timeline" className={styles.railBlock}>
                  <KickoffTimeline
                    slots={timelineSlots}
                    activeHour={selectedHour}
                    hrefForHour={(hour) => pageHref({ hour: selectedHour === hour ? undefined : String(hour) })}
                  />
                </div>

                <MatchdayDesk
                  soon={soonMatches}
                  reminders={reminderMatches}
                  clashes={clashPairs}
                  onAir={onAirMatches}
                />

                <div id="ledger" className={styles.ledgerStack}>
                  <MatchdayLedger
                    census={dayCensus.map((item) => ({
                      label: item.label,
                      value: item.value,
                      tone: item.label === t('goal') ? 'goal' : item.label === t('yellow_card') ? 'yellow' : item.label === t('red_card') ? 'red' : undefined,
                    }))}
                    grounds={grounds}
                    broadcasts={broadcasts}
                    hrefForChannel={(name) => pageHref({ channel: selectedChannel === name ? undefined : name })}
                    activeChannel={selectedChannel}
                  />
                </div>

                <PinnedMatchesBar allMatches={pinnedMatchesData} locale={locale} />

                {scorers.length > 0 ? (
                  <section className={styles.plate}>
                    <div className="matchday-section-kicker">
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                        {pick(locale, 'سجل الأهداف', 'Scoresheet')}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-bold text-foreground dark:text-foreground">
                      {pick(locale, `سجل أهداف اليوم — ${scorers.length}`, `Today's goal log — ${scorers.length}`)}
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {scorers.map((scorer) => (
                        <li key={scorer.id}>
                          <Link href={`/match/${scorer.matchId}`} className="flex items-center gap-3">
                            <LeagueCrest name={scorer.teamName} logoUrl={scorer.teamLogo} className="h-7 w-7" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-bold text-foreground dark:text-foreground">{scorer.player}</p>
                              <p className="truncate text-[9px] font-medium text-muted-foreground">
                                {scorer.type === 'OWN_GOAL' ? t('own_goal') : scorer.type === 'PENALTY' ? t('penalty') : scorer.teamName}
                              </p>
                            </div>
                            <span className="text-[11px] font-bold tabular-nums text-orange-500">{scorer.minute}&prime;</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {discipline.length > 0 ? (
                  <section className={styles.plate}>
                    <div className="matchday-section-kicker">
                      <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                        {pick(locale, 'الانضباط', 'Discipline')}
                      </span>
                    </div>
                    <h2 className="mt-2 text-sm font-bold text-foreground dark:text-foreground">
                      {pick(locale, 'بطاقات اليوم', "Today's cards")}
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {discipline.map((card) => (
                        <li key={card.id}>
                          <Link href={`/match/${card.matchId}`} className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <LeagueCrest name={card.teamName} logoUrl={card.teamLogo} className="h-7 w-7" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[12px] font-bold text-foreground dark:text-foreground">{card.player}</p>
                              <p className="truncate text-[9px] font-medium text-muted-foreground">
                                {card.teamName} · {card.type === 'RED_CARD' ? t('red_card') : t('yellow_card')}
                              </p>
                            </div>
                            <span className={`text-[11px] font-bold tabular-nums ${card.type === 'RED_CARD' ? 'text-red-500' : 'text-amber-500'}`}>
                              {card.minute}&prime;
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

              </aside>
            </div>
          </section>
        </main>
      </div>
    </SalonStage>
  );
}
