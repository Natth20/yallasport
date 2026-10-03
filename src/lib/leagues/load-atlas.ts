import { reportCaughtError } from '@/lib/ops/caught';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { persistNormalizedMatch } from '@/lib/sports-data/persistence';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';

const GOAL_TYPES = ['GOAL', 'PENALTY', 'OWN_GOAL'] as const;

const leagueLite = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  country: true,
  externalId: true,
} as const;

const standingLite = {
  id: true,
  rank: true,
  points: true,
  played: true,
  won: true,
  drawn: true,
  lost: true,
  goalsFor: true,
  goalsAgainst: true,
  seasonId: true,
  leagueId: true,
  league: { select: { id: true, name: true, slug: true, externalId: true } },
  team: { select: { name: true, logoUrl: true, slug: true } },
} as const;

async function soft<T>(run: () => Promise<T>, fallback: T, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
      }
    }
  }
  if (process.env.NODE_ENV !== 'production' && lastError) {
    const message = lastError instanceof Error ? lastError.message : String(lastError);
    if (!message.includes('max clients') && !message.includes('EMAXCONNSESSION')) {
      console.warn('[leagues-atlas] query failed, using fallback', message.slice(0, 180));
    }
  }
  return fallback;
}

async function wave<T extends readonly unknown[]>(
  tasks: [...{ [K in keyof T]: () => Promise<T[K]> }]
): Promise<{ [K in keyof T]: T[K] }> {
  const out: unknown[] = [];
  for (const task of tasks) {
    out.push(await task());
  }
  return out as { [K in keyof T]: T[K] };
}

export const loadLeaguesAtlasData = cache(async function loadLeaguesAtlasData(input: {
  now: Date;
  dayStart: Date;
  dayEnd: Date;
  userId?: string | null;
}) {
  const { now, dayStart, dayEnd, userId } = input;

  // eslint-disable-next-line prefer-const
  let [leagueRows, liveMatchesDb, standingCounts, followedLeagueIds] = await wave([
    () =>
      soft(
        () =>
          prisma.league.findMany({
            orderBy: { name: 'asc' },
            select: leagueLite,
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.match.findMany({
            where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor(now) } },
            orderBy: { kickoffAt: 'asc' },
            select: {
              id: true,
              status: true,
              minute: true,
              round: true,
              homeScore: true,
              awayScore: true,
              lastSyncedAt: true,
              seasonId: true,
              venue: { select: { name: true, city: true } },
              homeTeam: { select: { name: true, logoUrl: true } },
              awayTeam: { select: { name: true, logoUrl: true } },
              league: { select: leagueLite },
              channels: { take: 2, select: { channel: { select: { name: true } } } },
            },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.standing.groupBy({
            by: ['leagueId', 'seasonId'],
            _count: { _all: true },
          }),
        []
      ),
    () =>
      userId
        ? soft(
          () =>
            prisma.userFavorite.findMany({
              where: { userId, entityType: 'LEAGUE' },
              select: { entityId: true },
            }),
          []
        )
        : Promise.resolve([] as { entityId: string }[]),
  ]);

  let liveMatches = liveMatchesDb;

  // If the DB live board is empty/unavailable, pull live fixtures from the sports API and persist.
  if (liveMatches.length === 0 && isLiveSportsApi()) {
    const apiLive = await soft(() => sportsData.getLiveMatches(), []);
    if (apiLive.length > 0) {
      for (const match of apiLive.slice(0, 12)) {
        try {
          await persistNormalizedMatch(match);
        } catch (error) {
          reportCaughtError("src/lib/leagues/load-atlas.ts:113", error);
          // keep going — one fixture failure must not empty the board
        }
      }
      liveMatches = await soft(
        () =>
          prisma.match.findMany({
            where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor(now) } },
            orderBy: { kickoffAt: 'asc' },
            select: {
              id: true,
              status: true,
              minute: true,
              round: true,
              homeScore: true,
              awayScore: true,
              lastSyncedAt: true,
              seasonId: true,
              venue: { select: { name: true, city: true } },
              homeTeam: { select: { name: true, logoUrl: true } },
              awayTeam: { select: { name: true, logoUrl: true } },
              league: { select: leagueLite },
              channels: { take: 2, select: { channel: { select: { name: true } } } },
            },
          }),
        liveMatches
      );
      leagueRows = await soft(
        () =>
          prisma.league.findMany({
            orderBy: { name: 'asc' },
            select: leagueLite,
          }),
        leagueRows
      );
    }
  }

  const [matchCensus, nextKickoffs, lastKickoffs, todayMatchCount] = await wave([
    () =>
      soft(
        () =>
          prisma.match.groupBy({
            by: ['leagueId', 'status', 'seasonId'],
            _count: { _all: true },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.match.groupBy({
            by: ['leagueId'],
            where: { kickoffAt: { gte: now }, status: 'NOT_STARTED' },
            _min: { kickoffAt: true },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.match.groupBy({
            by: ['leagueId'],
            where: { status: 'FINISHED' },
            _max: { kickoffAt: true },
          }),
        []
      ),
    () =>
      soft(
        () =>
          prisma.match.count({
            where: { kickoffAt: { gte: dayStart, lt: dayEnd } },
          }),
        0
      ),
  ]);

  const nextPairs = nextKickoffs.flatMap((row) =>
    row._min.kickoffAt ? [{ leagueId: row.leagueId, kickoffAt: row._min.kickoffAt }] : []
  );
  const lastPairs = lastKickoffs.flatMap((row) =>
    row._max.kickoffAt ? [{ leagueId: row.leagueId, kickoffAt: row._max.kickoffAt }] : []
  );

  const [upcomingRows, finishedRows, tableRows] = await wave([
    () =>
      nextPairs.length
        ? soft(
          () =>
            prisma.match.findMany({
              where: {
                status: 'NOT_STARTED',
                OR: nextPairs.map((row) => ({ leagueId: row.leagueId, kickoffAt: row.kickoffAt })),
              },
              select: {
                id: true,
                leagueId: true,
                kickoffAt: true,
                lastSyncedAt: true,
                seasonId: true,
                round: true,
                venue: { select: { name: true, city: true } },
                homeTeam: { select: { name: true, logoUrl: true } },
                awayTeam: { select: { name: true, logoUrl: true } },
                league: { select: { name: true, slug: true, logoUrl: true, country: true, externalId: true } },
              },
            }),
          []
        )
        : Promise.resolve([]),
    () =>
      lastPairs.length
        ? soft(
          () =>
            prisma.match.findMany({
              where: {
                status: 'FINISHED',
                OR: lastPairs.map((row) => ({ leagueId: row.leagueId, kickoffAt: row.kickoffAt })),
              },
              select: {
                id: true,
                leagueId: true,
                kickoffAt: true,
                lastSyncedAt: true,
                seasonId: true,
                round: true,
                homeScore: true,
                awayScore: true,
                homeTeam: { select: { name: true, logoUrl: true } },
                awayTeam: { select: { name: true, logoUrl: true } },
                league: { select: { name: true, slug: true, country: true, externalId: true } },
              },
            }),
          []
        )
        : Promise.resolve([]),
    () =>
      soft(
        () =>
          prisma.standing.findMany({
            where: { rank: { in: [1, 2] } },
            orderBy: [{ seasonId: 'desc' }, { rank: 'asc' }],
            select: standingLite,
          }),
        []
      ),
  ]);

  const liveMatchIds = liveMatches.map((match) => match.id);
  const scorersSince = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [liveGoals, topScorersRaw] = await wave([
    () =>
      liveMatchIds.length
        ? soft(
          () =>
            prisma.matchEvent.findMany({
              where: { matchId: { in: liveMatchIds }, type: { in: [...GOAL_TYPES] } },
              orderBy: [{ minute: 'desc' }, { extraMinute: 'desc' }],
              take: 48,
              select: {
                id: true,
                matchId: true,
                minute: true,
                extraMinute: true,
                playerName: true,
                player: { select: { name: true } },
              },
            }),
          []
        )
        : Promise.resolve([]),
    () =>
      soft(
        () =>
          prisma.matchEvent.groupBy({
            by: ['playerId'],
            where: {
              type: { in: ['GOAL', 'PENALTY'] },
              playerId: { not: null },
              match: { kickoffAt: { gte: scorersSince } },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 6,
          }),
        []
      ),
  ]);

  const scorerPlayerIds = topScorersRaw
    .map((row) => row.playerId)
    .filter((id): id is string => Boolean(id));

  const [scorerPlayers, scorerLeagueRows] = await wave([
    () =>
      scorerPlayerIds.length
        ? soft(
          () =>
            prisma.player.findMany({
              where: { id: { in: scorerPlayerIds } },
              select: {
                id: true,
                name: true,
                slug: true,
                photoUrl: true,
                teams: {
                  where: { to: null },
                  take: 1,
                  select: { team: { select: { name: true } } },
                },
              },
            }),
          []
        )
        : Promise.resolve([]),
    () =>
      scorerPlayerIds.length
        ? soft(
          () =>
            prisma.matchEvent.findMany({
              where: {
                playerId: { in: scorerPlayerIds },
                type: { in: ['GOAL', 'PENALTY'] },
                match: { kickoffAt: { gte: scorersSince } },
              },
              orderBy: { id: 'desc' },
              take: 80,
              select: {
                playerId: true,
                match: { select: { league: { select: { name: true, slug: true } } } },
              },
            }),
          []
        )
        : Promise.resolve([]),
  ]);

  return {
    leagueRows,
    liveMatches,
    matchCensus,
    standingCounts,
    followedLeagueIds,
    nextKickoffs,
    lastKickoffs,
    todayMatchCount,
    upcomingRows,
    finishedRows,
    tableRows,
    liveGoals,
    topScorersRaw,
    scorerPlayers,
    scorerLeagueRows,
  };
});

export async function loadSpotlightPodium(leagueId: string) {
  return soft(
    () =>
      prisma.standing.findMany({
        where: { leagueId },
        orderBy: [{ seasonId: 'desc' }, { rank: 'asc' }],
        take: 4,
        select: standingLite,
      }),
    []
  );
}
