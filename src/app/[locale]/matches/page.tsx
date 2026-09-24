import { swallow, reportCaughtError } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { MatchCard } from '@/components/sports/MatchCard';
import { MatchQuickActions } from '@/components/sports/MatchQuickActions';
import { KickoffTimeline, type KickoffSlot } from '@/components/matches/KickoffTimeline';
import { LiveNowBoard } from '@/components/matches/LiveNowBoard';
import { MatchdayLenses } from '@/components/matches/MatchdayLenses';
import { MatchdayDesk } from '@/components/matches/MatchdayDesk';
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
import { belongsOnTodayBoard, todayOrLiveWhere } from '@/lib/sports-data/match-window';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LiveDataStatus } from '@/components/sports/LiveDataStatus';
import { TimezoneSelector } from '@/components/layout/TimezoneSelector';
import { MatchCountdown } from '@/components/sports/MatchCountdown';
import {
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  MapPin,
  Radio,
  Search,
  Shield,
  Trophy,
  Tv,
  Users,
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
import { STREAMING_ENABLED } from '@/lib/streaming';
import { isMajorLeague, leagueTier, matchdayWeight } from '@/lib/sports-data/matchday-weight';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import '@/components/matches/matches-hall.css';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'المباريات', 'Matches'),
    description: pick(
      locale,
      'برنامج اليوم من يلا سبورت: النتائج المباشرة، مواعيد الركلات، المباريات الكبرى، وأهداف اليوم من مصدر البيانات الحقيقي فقط.',
      "Today's Yalla Sport programme: live results, kickoff times, major fixtures, and goals from the real data source only."
    ),
    path: '/matches',
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

function StatMeter({
  home,
  away,
  label,
  asPercent,
}: {
  home: number;
  away: number;
  label: string;
  asPercent?: boolean;
}) {
  const total = asPercent ? 100 : home + away;
  const homeShare = total > 0 ? (home / total) * 100 : 50;
  return (
    <div className="min-w-[7.5rem] flex-1">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[11px] font-black tabular-nums">
        <span className="text-emerald-300">{asPercent ? `${home}%` : home}</span>
        <span className="text-[8px] font-semibold uppercase tracking-[0.14em] text-emerald-100/45">{label}</span>
        <span className="text-orange-300">{asPercent ? `${away}%` : away}</span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-black/40">
        <span className="ys-grow-x bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, homeShare))}%` }} />
        <span className="flex-1 bg-orange-400" />
      </div>
    </div>
  );
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

function CompactFixture({
  match,
  followed,
}: {
  match: DayMatch;
  followed?: boolean;
}) {
  const live = isLiveStatus(match.status);
  const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
  return (
    <Link
      href={`/match/${match.id}`}
      className={`fixture-card !p-2.5 ${live ? 'is-live' : match.status === 'FINISHED' ? 'is-ft' : 'is-soon'}`}
    >
      <div className="fixture-card-body !gap-2">
        <div className="fixture-clock !pe-2">
          {live ? (
            <>
              <em>{match.minute ? `${match.minute}'` : 'LIVE'}</em>
            </>
          ) : match.status === 'FINISHED' ? (
            <span className="is-status" dir="ltr">
              {hasScore ? `${match.homeScore}–${match.awayScore}` : '–'}
            </span>
          ) : (
            <span>
              <ClientTime value={match.kickoffAt} />
            </span>
          )}
        </div>
        <div className="fixture-teams !gap-1">
          <div className="fixture-team">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
            <div className="min-w-0">
              <strong>{match.homeTeam.name}</strong>
            </div>
            {live && hasScore ? <b className="fixture-score-n is-live">{match.homeScore}</b> : null}
          </div>
          <div className="fixture-team">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
            <div className="min-w-0">
              <strong>{match.awayTeam.name}</strong>
            </div>
            {live && hasScore ? <b className="fixture-score-n is-live">{match.awayScore}</b> : null}
          </div>
        </div>
      </div>
      {followed ? (
        <span className="fixture-followed">
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
          { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
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
            league: { select: { name: true } },
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
        round: roundById.get(row.id),
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
  for (const match of allMatches) {
    match.homeTeam.name = nameLabels.get(`TEAM:${match.homeTeam.id}`) || match.homeTeam.name;
    match.awayTeam.name = nameLabels.get(`TEAM:${match.awayTeam.id}`) || match.awayTeam.name;
    match.league.name = nameLabels.get(`LEAGUE:${match.league.id}`) || match.league.name;
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
    const matchesSearch = !query ||
      match.homeTeam.name.toLowerCase().includes(query) ||
      match.awayTeam.name.toLowerCase().includes(query) ||
      match.league.name.toLowerCase().includes(query);
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
  const totalGoals = queryMatches.reduce((total, match) => {
    if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') return total;
    if (match.status === 'NOT_STARTED' || match.status === 'POSTPONED' || match.status === 'CANCELLED') return total;
    return total + match.homeScore + match.awayScore;
  }, 0);
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
    return {
      value,
      isToday: value === format(today, 'yyyy-MM-dd'),
      dayName: value === format(today, 'yyyy-MM-dd') ? pick(locale, 'اليوم', 'Today') : format(date, 'EEEE', { locale: locale === 'ar' ? ar : enUS }),
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
  ).sort((first, second) => {
    const liveScore = (matches: DayMatch[]) => matches.filter((match) => isLiveStatus(match.status)).length;
    return (
      leagueTier(second.league) - leagueTier(first.league) ||
      liveScore(second.matches) - liveScore(first.matches) ||
      second.matches.length - first.matches.length
    );
  }).map((group) => ({
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
    .filter((event) => Boolean(namedActor(event.playerName)))
    .slice(0, 14)
    .map((event) => {
      const isHome =
        event.teamId === event.match.homeTeamId ||
        event.teamId === event.match.homeTeam.id ||
        event.teamId === event.match.homeTeam.externalId;
      const team = isHome ? event.match.homeTeam : event.match.awayTeam;
      const minuteLabel = event.extraMinute ? `${event.minute}+${event.extraMinute}` : `${event.minute}`;
      return {
        id: event.id,
        matchId: event.match.id,
        player: namedActor(event.playerName) as string,
        minute: minuteLabel,
        type: event.type,
        teamName: team.name,
        teamLogo: team.logoUrl,
        leagueName: event.match.league.name,
        assist: namedActor(event.assistName),
      };
    });

  const discipline = dayEvents
    .filter((event) => event.type === 'YELLOW_CARD' || event.type === 'RED_CARD')
    .filter((event) => Boolean(namedActor(event.playerName)))
    .slice(0, 8)
    .map((event) => {
      const isHome =
        event.teamId === event.match.homeTeamId ||
        event.teamId === event.match.homeTeam.id ||
        event.teamId === event.match.homeTeam.externalId;
      const team = isHome ? event.match.homeTeam : event.match.awayTeam;
      return {
        id: event.id,
        matchId: event.match.id,
        player: namedActor(event.playerName) as string,
        minute: event.extraMinute ? `${event.minute}+${event.extraMinute}` : `${event.minute}`,
        type: event.type,
        teamName: team.name,
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
  const soonMatches = isToday
    ? queryMatches
      .filter((match) => {
        if (match.status !== 'NOT_STARTED') return false;
        const kickoff = new Date(match.kickoffAt).getTime();
        return kickoff >= nowMs && kickoff <= nowMs + 2 * 60 * 60 * 1000;
      })
      .slice(0, 6)
      .map(toDeskMatch)
    : [];

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
    { value: queryMatches.length, label: pick(locale, 'مباراة', 'Matches') },
    ...(liveCount > 0 ? [{ value: liveCount, label: t('live') }] : []),
    ...(totalGoals > 0 ? [{ value: totalGoals, label: t('goal') }] : []),
    ...(leagueCount > 0 ? [{ value: leagueCount, label: pick(locale, 'بطولة', 'Leagues') }] : []),
    ...(eventCount('YELLOW_CARD') > 0 ? [{ value: eventCount('YELLOW_CARD'), label: t('yellow_card') }] : []),
    ...(eventCount('RED_CARD') > 0 ? [{ value: eventCount('RED_CARD'), label: t('red_card') }] : []),
    ...(broadcasts.length > 0 ? [{ value: broadcasts.length, label: pick(locale, 'قناة', 'Channels') }] : []),
  ];

  const dayIds = liveBoardPool.flatMap((match) => [match.id, match.externalId]);

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
  ) => {
    const liveInLeague = group.matches.filter((match) => isLiveStatus(match.status)).length;
    return (
      <section
        key={group.league.id}
        id={`league-${group.league.slug}`}
        className="fixture-board scroll-mt-64 overflow-hidden"
      >
        <div className="matchday-league-head">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card dark:bg-muted/10 p-1.5 border border-border/60 dark:border-transparent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={group.league.logoUrl || '/placeholder.png'} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/league/${group.league.slug}`}
                className="block truncate text-sm font-bold text-foreground transition-colors hover:text-orange-600 dark:text-orange-50 dark:hover:text-orange-300"
              >
                {group.league.name}
              </Link>
              <span className="mt-0.5 block truncate text-[9px] font-medium text-muted-foreground dark:text-foreground/45">
                {[
                  group.country,
                  group.rounds[0]
                    ? t('round_label', {
                      round: group.rounds.length === 1 ? group.rounds[0] : group.rounds.join(' · '),
                    })
                    : '',
                  `${group.matches.length} ${pick(locale, group.matches.length === 1 ? 'مباراة' : 'مباريات', group.matches.length === 1 ? 'match' : 'matches')}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </div>
          </div>
          {liveInLeague > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[8px] font-bold text-red-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {liveInLeague} {t('live')}
            </span>
          ) : (
            <span className="matchday-folio-mark is-light" aria-hidden>
              YS
            </span>
          )}
        </div>
        <div className={`space-y-1 p-2.5 ${liveInLeague > 0 ? 'bg-red-50/40 dark:bg-red-500/[0.06]' : ''}`}>
          {compact
            ? group.matches.map((match) => (
              <CompactFixture key={match.id} match={match} followed={isFollowedMatch(match)} />
            ))
            : group.matches.map((match) => matchCardFor(match))}
        </div>
      </section>
    );
  };

  const dayCensus = [
    ...(totalGoals > 0 ? [{ value: totalGoals, label: t('goal') }] : []),
    ...(eventCount('YELLOW_CARD') > 0 ? [{ value: eventCount('YELLOW_CARD'), label: t('yellow_card') }] : []),
    ...(eventCount('RED_CARD') > 0 ? [{ value: eventCount('RED_CARD'), label: t('red_card') }] : []),
    ...(broadcasts.length > 0 ? [{ value: broadcasts.length, label: pick(locale, 'قناة', 'Channels') }] : []),
  ];

  return (
    <div className="matchday-board pb-32">
      <section className="floodlight-hero">
        <span className="flood-beam pointer-events-none absolute -left-10 -top-16 h-40 w-40 rounded-full bg-orange-400/20 blur-3xl" />
        <span
          className="flood-beam pointer-events-none absolute -right-8 -top-12 h-36 w-36 rounded-full bg-orange-500/14 blur-3xl"
          style={{ animationDelay: '2.4s' }}
        />
        <span
          className="pointer-events-none absolute inset-inline-end-[4%] top-[12%] text-[clamp(5rem,16vw,11rem)] font-black leading-none tracking-[-0.08em] text-transparent select-none"
          style={{
            background: 'linear-gradient(180deg, rgba(249,115,22,0.18), rgba(249,115,22,0.02))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
          }}
          aria-hidden
        >
          {liveCount > 0 ? liveCount : queryMatches.length || '—'}
        </span>
        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-6 pt-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <div className="matchday-section-kicker">
                <span className="matchday-folio-mark is-light" aria-hidden>
                  01
                </span>
                <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-orange-400">
                  {pick(locale, 'برنامج اليوم', "Today's fixtures")}
                </span>
              </div>
              <h1 className="matchday-wordmark mt-2">
                {format(selectedDate, 'EEEE d MMMM', { locale: locale === 'ar' ? ar : enUS })}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="matchday-status-chip">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${liveCount > 0 ? 'animate-pulse bg-red-500' : 'bg-orange-400'}`}
                />
                {liveCount > 0
                  ? pick(locale, `${liveCount} مباشرة`, `${liveCount} live`)
                  : pick(locale, 'من المصدر الحي', 'From the live source')}
              </span>
              <LiveDataStatus />
              <div className="hidden sm:block">
                <TimezoneSelector />
              </div>
            </div>
          </div>

          {heroStats.length > 0 ? (
            <div className="matchday-signature">
              {heroStats.slice(0, 6).map((stat, index) => (
                <div
                  key={stat.label}
                  className={`matchday-signature-tile${index === 0 ? ' is-lead' : ''}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <main className="matchday-main mx-auto max-w-7xl space-y-6 px-5 pb-8 pt-5 sm:px-6 lg:px-8">
        <MatchdayLenses
          leagues={leagueLenses}
          channels={channelLenses}
          hours={hourLenses}
          clearHref={pageHref({ league: undefined, channel: undefined, hour: undefined })}
        />

        <KickoffTimeline
          slots={timelineSlots}
          activeHour={selectedHour}
          hrefForHour={(hour) => pageHref({ hour: selectedHour === hour ? undefined : String(hour) })}
        />

        <MatchdayDesk
          soon={soonMatches}
          reminders={reminderMatches}
          clashes={clashPairs}
          onAir={onAirMatches}
        />

        <LiveNowBoard seed={liveBoard} dayIds={dayIds} lastEvents={lastEvents} />

        {spotlightMatch ? (
          <article
            className={`jumbotron matchday-spotlight relative overflow-hidden rounded-[1.85rem] text-white ${isLiveStatus(spotlightMatch.status)
                ? 'jumbotron-live'
                : spotlightMatch.status === 'FINISHED'
                  ? 'jumbotron-ft'
                  : ''
              }`}
          >
            <div className="matchday-spotlight-glow" aria-hidden />
            <div className="relative p-5 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-2 text-[10px] font-medium text-white/65">
                  <span className="rounded-full border border-orange-400/40 bg-orange-500/15 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-orange-200">
                    {pick(locale, 'المباراة المختارة', 'Selected match')}
                  </span>
                  <Link href={`/league/${spotlightMatch.league.slug}`} className="hover:text-orange-300">
                    {spotlightMatch.league.name}
                  </Link>
                  {spotlightMatch.leagueCountry ? (
                    <span className="text-white/35">· {spotlightMatch.leagueCountry}</span>
                  ) : null}
                  {spotlightMatch.round ? (
                    <span className="text-orange-200/80">
                      · {t('round_label', { round: spotlightMatch.round })}
                    </span>
                  ) : null}
                  {spotlightMatch.hasLicensedStream && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/15 px-2 py-0.5 text-[8px] font-bold text-orange-200">
                      <Radio className="h-3 w-3" />
                      {t('licensed_feed')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isLiveStatus(spotlightMatch.status) ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/20 px-2.5 py-1 text-[8px] font-bold text-red-200">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                      {spotlightMatch.status === 'HALFTIME'
                        ? t('halftime')
                        : spotlightMatch.minute
                          ? `${t('live')} ${spotlightMatch.minute}'`
                          : t('live')}
                    </span>
                  ) : (
                    <ClientTime
                      value={spotlightMatch.kickoffAt}
                      className="text-[11px] font-bold text-orange-300"
                    />
                  )}
                </div>
              </div>

              <div className="matchday-spotlight-grid relative mt-7">
                <div className="matchday-spotlight-side is-home">
                  <div className="matchday-crest-stage">
                    <span className="matchday-crest-glow" aria-hidden />
                    <div className="matchday-crest">
                      <LeagueCrest name={spotlightMatch.homeTeam.name} logoUrl={spotlightMatch.homeTeam.logoUrl} className="h-full w-full" />
                    </div>
                  </div>
                  <strong className="matchday-spotlight-name">{spotlightMatch.homeTeam.name}</strong>
                  <div className="matchday-spotlight-meta">
                    {(formByTeam.get(spotlightMatch.homeTeam.id)?.length ?? 0) > 0 && (
                      <FormPips letters={formByTeam.get(spotlightMatch.homeTeam.id) ?? []} />
                    )}
                    {spotlightMatch.homeFormation ? (
                      <span className="text-orange-300">{spotlightMatch.homeFormation}</span>
                    ) : null}
                  </div>
                  {spotlightMatch.homeCoach ? (
                    <span className="text-[9px] font-medium text-white/40">
                      {pick(locale, 'المدرب', 'Coach')} · {spotlightMatch.homeCoach}
                    </span>
                  ) : null}
                  {spotlightGoals.filter((event) =>
                    belongsToTeam(event.teamId, spotlightMatch.homeTeam)
                  ).length > 0 ? (
                    <p className="matchday-spotlight-scorers">
                      {spotlightGoals
                        .filter((event) => belongsToTeam(event.teamId, spotlightMatch.homeTeam))
                        .map(
                          (event) =>
                            `${namedActor(event.playerName) ? `${namedActor(event.playerName)} ` : ''}${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ''}'`
                        )
                        .join('  ·  ')}
                    </p>
                  ) : null}
                </div>

                <div className="matchday-spotlight-score">
                  {spotlightMatch.status === 'NOT_STARTED' ? (
                    <div className="space-y-3">
                      <div className="led-stat text-3xl font-black tabular-nums sm:text-5xl">
                        <ClientTime value={spotlightMatch.kickoffAt} />
                      </div>
                      <MatchCountdown kickoffAt={new Date(spotlightMatch.kickoffAt)} tone="dark" />
                    </div>
                  ) : (
                    <div
                      className={`matchday-score-ring${isLiveStatus(spotlightMatch.status) ? ' is-live' : ''}`}
                      dir="ltr"
                    >
                      <strong className="led-stat text-5xl font-black tabular-nums sm:text-6xl">
                        {typeof spotlightMatch.homeScore === 'number' &&
                          typeof spotlightMatch.awayScore === 'number' ? (
                          <>
                            {spotlightMatch.homeScore}
                            <span className="mx-2 text-orange-400/70">:</span>
                            {spotlightMatch.awayScore}
                          </>
                        ) : (
                          '–'
                        )}
                      </strong>
                    </div>
                  )}
                  <span className="mt-3 block text-[9px] font-bold uppercase tracking-[0.2em] text-orange-300/80">
                    {spotlightMatch.status === 'FINISHED'
                      ? t('finished')
                      : spotlightMatch.status === 'NOT_STARTED'
                        ? pick(locale, 'تبدأ الساعة', 'Starts at')
                        : t('score_now')}
                  </span>
                </div>

                <div className="matchday-spotlight-side is-away">
                  <div className="matchday-crest-stage">
                    <span className="matchday-crest-glow" aria-hidden />
                    <div className="matchday-crest">
                      <LeagueCrest name={spotlightMatch.awayTeam.name} logoUrl={spotlightMatch.awayTeam.logoUrl} className="h-full w-full" />
                    </div>
                  </div>
                  <strong className="matchday-spotlight-name">{spotlightMatch.awayTeam.name}</strong>
                  <div className="matchday-spotlight-meta">
                    {(formByTeam.get(spotlightMatch.awayTeam.id)?.length ?? 0) > 0 && (
                      <FormPips letters={formByTeam.get(spotlightMatch.awayTeam.id) ?? []} />
                    )}
                    {spotlightMatch.awayFormation ? (
                      <span className="text-orange-300">{spotlightMatch.awayFormation}</span>
                    ) : null}
                  </div>
                  {spotlightMatch.awayCoach ? (
                    <span className="text-[9px] font-medium text-white/40">
                      {pick(locale, 'المدرب', 'Coach')} · {spotlightMatch.awayCoach}
                    </span>
                  ) : null}
                  {spotlightGoals.filter((event) =>
                    belongsToTeam(event.teamId, spotlightMatch.awayTeam)
                  ).length > 0 ? (
                    <p className="matchday-spotlight-scorers">
                      {spotlightGoals
                        .filter((event) => belongsToTeam(event.teamId, spotlightMatch.awayTeam))
                        .map(
                          (event) =>
                            `${namedActor(event.playerName) ? `${namedActor(event.playerName)} ` : ''}${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ''}'`
                        )
                        .join('  ·  ')}
                    </p>
                  ) : null}
                </div>
              </div>

              {(spotlightMatch.homePossession != null && spotlightMatch.awayPossession != null) ||
                (spotlightMatch.homeShotsOn != null && spotlightMatch.awayShotsOn != null) ||
                (spotlightMatch.homeShotsOff != null && spotlightMatch.awayShotsOff != null) ||
                (spotlightMatch.homeCorners != null && spotlightMatch.awayCorners != null) ||
                (spotlightMatch.homeFouls != null && spotlightMatch.awayFouls != null) ||
                (spotlightMatch.homeOffsides != null && spotlightMatch.awayOffsides != null) ? (
                <div className="relative mt-4 flex flex-wrap justify-center gap-x-5 gap-y-4 rounded-2xl bg-black/25 px-4 py-4">
                  {spotlightMatch.homePossession != null && spotlightMatch.awayPossession != null && (
                    <StatMeter home={spotlightMatch.homePossession} away={spotlightMatch.awayPossession} label={t('possession')} asPercent />
                  )}
                  {spotlightMatch.homeShotsOn != null && spotlightMatch.awayShotsOn != null && (
                    <StatMeter home={spotlightMatch.homeShotsOn} away={spotlightMatch.awayShotsOn} label={t('shots_on_target')} />
                  )}
                  {spotlightMatch.homeShotsOff != null && spotlightMatch.awayShotsOff != null && (
                    <StatMeter home={spotlightMatch.homeShotsOff} away={spotlightMatch.awayShotsOff} label={t('shots_off_target')} />
                  )}
                  {spotlightMatch.homeCorners != null && spotlightMatch.awayCorners != null && (
                    <StatMeter home={spotlightMatch.homeCorners} away={spotlightMatch.awayCorners} label={t('corners')} />
                  )}
                  {spotlightMatch.homeFouls != null && spotlightMatch.awayFouls != null && (
                    <StatMeter home={spotlightMatch.homeFouls} away={spotlightMatch.awayFouls} label={t('fouls')} />
                  )}
                  {spotlightMatch.homeOffsides != null && spotlightMatch.awayOffsides != null && (
                    <StatMeter home={spotlightMatch.homeOffsides} away={spotlightMatch.awayOffsides} label={t('offsides')} />
                  )}
                </div>
              ) : null}

              {(spotlightYellow > 0 || spotlightRed > 0) && (
                <div className="relative mt-3 flex justify-center gap-4 text-[10px] font-bold">
                  {spotlightYellow > 0 && (
                    <span className="rounded-full bg-amber-400/15 px-3 py-1 text-amber-200">{t('yellow_cards', { count: spotlightYellow })}</span>
                  )}
                  {spotlightRed > 0 && (
                    <span className="rounded-full bg-red-500/15 px-3 py-1 text-red-300">{t('red_cards', { count: spotlightRed })}</span>
                  )}
                </div>
              )}

              {(spotlightMatch.homeStarters?.length || spotlightMatch.awayStarters?.length) ? (
                <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
                  {spotlightMatch.homeStarters?.length ? (
                    <div className="rounded-2xl bg-black/20 px-3 py-3">
                      <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-orange-200">
                        {t('starting_xi')}
                      </span>
                      <p className="mt-2 text-[10px] font-medium leading-5 text-white/75">
                        {spotlightMatch.homeStarters.map((player) =>
                          player.number != null ? `${player.number} ${player.name}` : player.name
                        ).join(' · ')}
                      </p>
                    </div>
                  ) : null}
                  {spotlightMatch.awayStarters?.length ? (
                    <div className="rounded-2xl bg-black/20 px-3 py-3">
                      <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-orange-300">
                        {t('starting_xi')}
                      </span>
                      <p className="mt-2 text-[10px] font-medium leading-5 text-white/75">
                        {spotlightMatch.awayStarters.map((player) =>
                          player.number != null ? `${player.number} ${player.name}` : player.name
                        ).join(' · ')}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {spotlightTimeline.length > 0 && (
                <ol className="relative mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {spotlightTimeline.map((event) => (
                    <li
                      key={event.id}
                      className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[9px] font-semibold text-emerald-50"
                    >
                      <span className="text-orange-300">
                        {event.minute}{event.extraMinute ? `+${event.extraMinute}` : ''}&prime;
                      </span>
                      {' '}
                      {eventLabel(event.type)}
                      {event.playerName ? ` · ${event.playerName}` : ''}
                    </li>
                  ))}
                </ol>
              )}

              {(spotlightHomeStanding || spotlightAwayStanding) && (
                <div className="relative mt-3 flex justify-between gap-4 text-[9px] font-semibold text-emerald-100/50">
                  <span>
                    {spotlightHomeStanding
                      ? pick(locale, `المركز ${spotlightHomeStanding.rank} · ${spotlightHomeStanding.played} لعب · ${spotlightHomeStanding.won}ف ${spotlightHomeStanding.drawn}ت ${spotlightHomeStanding.lost}خ · ${spotlightHomeStanding.goalsFor}:${spotlightHomeStanding.goalsAgainst} · ${spotlightHomeStanding.points} نقطة`, `Rank ${spotlightHomeStanding.rank} · ${spotlightHomeStanding.played} played · ${spotlightHomeStanding.won}W ${spotlightHomeStanding.drawn}D ${spotlightHomeStanding.lost}L · ${spotlightHomeStanding.goalsFor}:${spotlightHomeStanding.goalsAgainst} · ${spotlightHomeStanding.points} points`)
                      : ''}
                  </span>
                  <span className="text-left">
                    {spotlightAwayStanding
                      ? pick(locale, `المركز ${spotlightAwayStanding.rank} · ${spotlightAwayStanding.played} لعب · ${spotlightAwayStanding.won}ف ${spotlightAwayStanding.drawn}ت ${spotlightAwayStanding.lost}خ · ${spotlightAwayStanding.goalsFor}:${spotlightAwayStanding.goalsAgainst} · ${spotlightAwayStanding.points} نقطة`, `Rank ${spotlightAwayStanding.rank} · ${spotlightAwayStanding.played} played · ${spotlightAwayStanding.won}W ${spotlightAwayStanding.drawn}D ${spotlightAwayStanding.lost}L · ${spotlightAwayStanding.goalsFor}:${spotlightAwayStanding.goalsAgainst} · ${spotlightAwayStanding.points} points`)
                      : ''}
                  </span>
                </div>
              )}

              {spotlightH2h.length > 0 && (
                <div className="relative mt-4 rounded-2xl bg-black/20 px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-orange-300">{t('previous_meetings')}</span>
                    <span className="text-[10px] font-black tabular-nums text-emerald-50">
                      <span className="text-emerald-300">{spotlightH2hRecord.homeWins}{t('win_short')}</span>
                      <span className="mx-1.5 text-muted-foreground">{spotlightH2hRecord.draws}{t('draw_short')}</span>
                      <span className="text-orange-300">{spotlightH2hRecord.awayWins}{t('win_short')}</span>
                    </span>
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {spotlightH2h.map((meeting) => {
                      const homeWonMeeting = meeting.homeScore != null && meeting.awayScore != null && meeting.homeScore > meeting.awayScore;
                      const awayWonMeeting = meeting.homeScore != null && meeting.awayScore != null && meeting.awayScore > meeting.homeScore;
                      return (
                        <Link
                          key={meeting.id}
                          href={`/match/${meeting.id}`}
                          className="shrink-0 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[9px] font-semibold text-emerald-50 hover:border-orange-400/40"
                        >
                          <span className="block text-emerald-100/45">{format(meeting.kickoffAt, 'yyyy-MM-dd')}</span>
                          <span className="mt-0.5 block tabular-nums">
                            <span className={homeWonMeeting ? 'text-emerald-300' : awayWonMeeting ? 'text-white/40' : ''}>
                              {meeting.homeTeam.name} {meeting.homeScore ?? '–'}
                            </span>
                            –
                            <span className={awayWonMeeting ? 'text-orange-300' : homeWonMeeting ? 'text-white/40' : ''}>
                              {meeting.awayScore ?? '–'} {meeting.awayTeam.name}
                            </span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-emerald-100/60">
                  {spotlightMatch.venue && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-orange-500" />
                      {spotlightMatch.venue}
                      {spotlightMatch.venueCity ? ` · ${spotlightMatch.venueCity}` : ''}
                      {spotlightMatch.venueCapacity ? ` · ${t('seats', { count: spotlightMatch.venueCapacity.toLocaleString(locale) })}` : ''}
                    </span>
                  )}
                  {spotlightMatch.channels[0] && (
                    <span className="inline-flex items-center gap-1.5">
                      <Tv className="h-3.5 w-3.5 text-orange-500" />
                      {spotlightMatch.channels.map((channel) => channel.name).join(' · ')}
                    </span>
                  )}
                  {spotlightMatch.refereeName && (
                    <span className="inline-flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-orange-500" />
                      {t('referee', { name: spotlightMatch.refereeName })}
                    </span>
                  )}
                  {spotlightMatch.commentators.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-orange-500" />
                      {spotlightMatch.commentators.map((commentator) =>
                        [commentator.name, commentator.language].filter(Boolean).join(' · ')
                      ).join(' · ')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {showProgrammeSplit && programmeScope === 'major' && restScoped.length > 0 ? (
                    <Link
                      href="#rest"
                      className="inline-flex h-11 items-center rounded-xl border border-white/15 bg-black/20 px-4 text-[10px] font-bold text-emerald-100/80 transition-colors hover:border-orange-400/40 hover:text-white"
                    >
                      {pick(
                        locale,
                        `عرض ${restScoped.length} مباراة أخرى`,
                        `Show ${restScoped.length} more matches`
                      )}
                    </Link>
                  ) : null}
                  <MatchQuickActions
                    matchId={spotlightMatch.id}
                    title={t('versus', { home: spotlightMatch.homeTeam.name, away: spotlightMatch.awayTeam.name })}
                    kickoffAt={new Date(spotlightMatch.kickoffAt).toISOString()}
                    venue={spotlightMatch.venue}
                    isLoggedIn={Boolean(session?.user)}
                    initialReminder={Boolean(spotlightReminder)}
                  />
                  <Link
                    href={`/match/${spotlightMatch.id}`}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-orange-500 px-5 text-[10px] font-black text-primary-foreground transition-colors hover:bg-orange-400"
                  >
                    {pick(locale, 'فتح مركز المباراة', 'Open match center')}
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        ) : null}

        <div className="matchday-dock space-y-3 p-3 sm:p-4">
          <div className="flex items-stretch gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Link
              href={pageHref({ date: format(addDays(selectedDate, -1), 'yyyy-MM-dd') })}
              aria-label={pick(locale, 'اليوم السابق', 'Previous day')}
              className="flex w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-orange-400/40 hover:text-orange-500 dark:border-border dark:bg-muted dark:text-foreground/70"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
            {dates.map((date) => {
              const active = date.value === selectedDateStr;
              return (
                <Link
                  key={date.value}
                  href={pageHref({ date: date.value })}
                  className={`matchday-date-chip${active ? ' is-active' : ''}${date.live > 0 && !active ? ' is-live' : ''}`}
                >
                  {date.live > 0 && !active ? (
                    <span className="absolute left-2 top-2 h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                  ) : null}
                  <span className={`text-[8px] font-semibold ${active ? 'text-white/80' : 'opacity-55'}`}>
                    {date.dayName}
                  </span>
                  <span className="text-base font-black tabular-nums">{date.dayNumber}</span>
                  {date.fixtures > 0 ? (
                    <span className={`text-[8px] font-bold tabular-nums ${active ? 'text-white/80' : 'text-orange-500'}`}>
                      {date.fixtures}
                    </span>
                  ) : (
                    <span className="text-[8px] font-medium opacity-40">—</span>
                  )}
                </Link>
              );
            })}
            <Link
              href={pageHref({ date: format(addDays(selectedDate, 1), 'yyyy-MM-dd') })}
              aria-label={pick(locale, 'اليوم التالي', 'Next day')}
              className="flex w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-orange-400/40 hover:text-orange-500 dark:border-border dark:bg-muted dark:text-foreground/70"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-fit flex-wrap items-center gap-1 rounded-xl border border-border bg-card/90 p-1 dark:border-border dark:bg-muted">
              {statusFilters.map((filter) => {
                const active = filter.value === statusFilter;
                return (
                  <Link
                    key={filter.value}
                    href={pageHref({ status: filter.value })}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${active
                        ? filter.value === 'live'
                          ? 'bg-red-600 text-white shadow-sm'
                          : 'bg-foreground text-white shadow-sm dark:bg-card dark:text-foreground'
                        : filter.value === 'live' && filter.count > 0
                          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:hover:bg-muted dark:hover:text-foreground'
                      }`}
                  >
                    {filter.value === 'live' && filter.count > 0 ? (
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
                    ) : null}
                    {filter.label}
                    <span className={`text-[9px] tabular-nums ${active
                        ? filter.value === 'live' ? 'text-red-100' : 'text-orange-400'
                        : filter.value === 'live' && filter.count > 0 ? 'text-red-400' : 'text-muted-foreground dark:text-foreground'
                      }`}>
                      {filter.count}
                    </span>
                  </Link>
                );
              })}
              <span className="mx-1 h-5 w-px bg-[rgba(15,23,42,0.08)] dark:bg-muted/10" />
              <Link
                href={favoritesHref}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${favoritesOnly
                    ? 'bg-orange-500 text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-500/10'
                  }`}
              >
                <Heart className={`h-3.5 w-3.5 ${favoritesOnly ? 'fill-current' : ''}`} />
                {pick(locale, 'فرقي', 'My teams')}
              </Link>
              {hasProgrammeSplit ? (
                <>
                  <span className="mx-1 h-5 w-px bg-[rgba(15,23,42,0.08)] dark:bg-muted/10" />
                  <Link
                    href={pageHref({ scope: undefined })}
                    className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${programmeScope === 'major'
                        ? 'bg-foreground text-white shadow-sm dark:bg-card dark:text-foreground'
                        : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-muted'
                      }`}
                  >
                    {pick(locale, 'كبرى', 'Majors')}
                    <span className="ms-1.5 text-[9px] tabular-nums opacity-80">{majorScoped.length}</span>
                  </Link>
                  <Link
                    href={pageHref({ scope: 'all' })}
                    className={`rounded-lg px-3 py-2 text-[11px] font-semibold transition-all ${programmeScope === 'all'
                        ? 'bg-foreground text-white shadow-sm dark:bg-card dark:text-foreground'
                        : 'text-muted-foreground hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-muted'
                      }`}
                  >
                    {pick(locale, 'البرنامج كامل', 'Full programme')}
                    <span className="ms-1.5 text-[9px] tabular-nums opacity-80">{scopedMatches.length}</span>
                  </Link>
                </>
              ) : null}
            </div>

            <form className="relative w-full lg:w-80">
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                type="search"
                defaultValue={params.q}
                placeholder={pick(locale, 'ابحث عن فريق أو بطولة', 'Search for a team or league')}
                className="h-11 w-full rounded-xl border border-border bg-card pr-11 pl-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-orange-500/40 focus:ring-4 focus:ring-orange-500/5 dark:border-border dark:bg-muted dark:text-foreground"
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
        </div>

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            {leagueGroups.length > 0 ? (
              showProgrammeSplit ? (
                <>
                  <div id="desk" className="scroll-mt-[18rem] space-y-3">
                    <div className="flex items-end justify-between gap-3 px-1">
                      <div>
                        <div className="matchday-section-kicker">
                          <span className="matchday-folio-mark" aria-hidden>
                            02
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                            {pick(locale, 'مكتب التحرير', 'Editorial desk')}
                          </span>
                        </div>
                        <h2 className="mt-2 text-lg font-black text-foreground dark:text-foreground">
                          {pick(locale, 'البطولات الكبرى', 'Major competitions')}
                        </h2>
                      </div>
                      <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                        {deskGroups.reduce((total, group) => total + group.matches.length, 0)}
                      </span>
                    </div>
                    {deskGroups.map((group) => leagueBoard(group))}
                  </div>
                  {restGroups.length > 0 ? (
                    <div id="rest" className="scroll-mt-[18rem] space-y-3">
                      <div className="flex flex-wrap items-end justify-between gap-3 px-1">
                        <div>
                          <div className="matchday-section-kicker">
                            <span className="matchday-folio-mark" aria-hidden>
                              03
                            </span>
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                              {pick(locale, 'باقي اليوم', 'Rest of the day')}
                            </span>
                          </div>
                          <h2 className="mt-2 text-lg font-black text-foreground dark:text-foreground">
                            {pick(locale, 'باقي برنامج اليوم', "The rest of today's programme")}
                          </h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                            {restGroups.reduce((total, group) => total + group.matches.length, 0)}
                          </span>
                          {programmeScope === 'major' ? (
                            <Link
                              href={`${pageHref({ scope: 'all' })}#rest`}
                              className="rounded-full border border-emerald-900/10 bg-card px-3 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:border-orange-500/40 hover:text-orange-600 dark:border-border dark:bg-muted"
                            >
                              {pick(locale, 'بطاقات كاملة', 'Full cards')}
                            </Link>
                          ) : null}
                        </div>
                      </div>
                      {restGroups.map((group) => leagueBoard(group, programmeScope === 'major'))}
                    </div>
                  ) : null}
                </>
              ) : (
                leagueGroups.map((group) => leagueBoard(group))
              )
            ) : (
              <div className="rounded-[1.55rem] border border-dashed border-border bg-card/80 px-6 py-20 text-center dark:border-border dark:bg-muted">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted dark:bg-card/[0.04]">
                  <Clock3 className="h-6 w-6 text-muted-foreground dark:text-foreground" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-foreground dark:text-foreground">
                  {lensesActive
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
                  {lensesActive
                    ? pick(locale, 'امسح البطولة أو القناة أو الساعة لعرض برنامج اليوم كاملاً.', 'Clear the competition, channel or hour to show the full day.')
                    : statusFilter === 'all'
                      ? pick(locale, 'جرّب يوماً آخر أو امسح عبارة البحث لعرض جميع المباريات.', 'Try another day or clear the search to show all matches.')
                      : pick(locale, 'غيّر الفلتر أو اختر يوماً آخر من شريط التواريخ.', 'Change the filter or choose another day.')}
                </p>
                <Link
                  href={lensesActive ? pageHref({ league: undefined, channel: undefined, hour: undefined }) : '/matches'}
                  className="mt-6 inline-flex rounded-xl bg-foreground px-6 py-3 text-[11px] font-bold text-white transition-colors hover:bg-orange-500 dark:bg-card dark:text-foreground"
                >
                  {lensesActive
                    ? pick(locale, 'مسح العدسات', 'Clear lenses')
                    : pick(locale, 'العودة إلى مباريات اليوم', "Back to today's matches")}
                </Link>
              </div>
            )}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-64">
            {dayCensus.length > 0 ? (
              <section className="matchday-plate">
                <div className="matchday-section-kicker">
                  <span className="matchday-folio-mark" aria-hidden>
                    04
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                    {t('daily_tally')}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-bold text-foreground dark:text-foreground">
                  {pick(locale, 'حصيلة اليوم', "Today's tally")}
                </h2>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {dayCensus.map((stat) => (
                    <span
                      key={stat.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-orange-50/70 px-2.5 py-1 text-[10px] font-bold text-foreground dark:border-border dark:bg-card/[0.04] dark:text-orange-100"
                    >
                      <strong className="tabular-nums text-orange-500">{stat.value}</strong>
                      {stat.label}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="matchday-plate">
              <div className="matchday-section-kicker">
                <span className="matchday-folio-mark" aria-hidden>
                  05
                </span>
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

            {scorers.length > 0 ? (
              <section className="matchday-plate">
                <div className="matchday-section-kicker">
                  <span className="matchday-folio-mark" aria-hidden>
                    06
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-orange-500">
                    {pick(locale, 'سجل الأهداف', 'Scoresheet')}
                  </span>
                </div>
                <h2 className="mt-2 text-sm font-bold text-foreground dark:text-foreground">
                  {pick(locale, 'سجل أهداف اليوم', "Today's goals")}
                </h2>
                <ul className="mt-4 space-y-3">
                  {scorers.map((scorer) => (
                    <li key={scorer.id}>
                      <Link href={`/match/${scorer.matchId}`} className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <LeagueCrest name={scorer.teamName} logoUrl={scorer.teamLogo} className="h-7 w-7" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-bold text-foreground dark:text-foreground">{scorer.player}</p>
                          <p className="truncate text-[9px] font-medium text-muted-foreground">
                            {scorer.teamName} · {scorer.leagueName}
                            {scorer.type === 'PENALTY' ? ` · ${t('penalty')}` : scorer.type === 'OWN_GOAL' ? ` · ${t('own_goal')}` : ''}
                            {scorer.assist ? t('assist_by', { player: scorer.assist }) : ''}
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
              <section className="matchday-plate">
                <div className="matchday-section-kicker">
                  <span className="matchday-folio-mark" aria-hidden>
                    07
                  </span>
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

            <div className="matchday-plate">
              <TimezoneSelector />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
