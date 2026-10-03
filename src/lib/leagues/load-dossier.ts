import { reportCaughtError } from '@/lib/ops/caught';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { sportsData } from '@/lib/sports-data';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';
import { persistLeagueStandings } from '@/lib/sports-data/standings-persist';
import { currentFootballSeason } from '@/lib/sports-data/season';

async function soft<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run();
  } catch (error) {
    reportCaughtError("src/lib/leagues/load-dossier.ts:10", error);
    return fallback;
  }
}

export function footballSeason(now = new Date()) {
  return currentFootballSeason(now);
}

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'entity';
}

function mapApiStatus(short: string): NormalizedMatch['status'] {
  const mapping: Record<string, NormalizedMatch['status']> = {
    TBD: 'NOT_STARTED',
    NS: 'NOT_STARTED',
    '1H': 'LIVE',
    HT: 'HALFTIME',
    '2H': 'LIVE',
    ET: 'LIVE',
    BT: 'LIVE',
    P: 'LIVE',
    LIVE: 'LIVE',
    FT: 'FINISHED',
    AET: 'FINISHED',
    PEN: 'FINISHED',
    PST: 'POSTPONED',
    CANC: 'CANCELLED',
    ABD: 'CANCELLED',
    AWD: 'FINISHED',
    WO: 'FINISHED',
  };
  return mapping[short] || 'NOT_STARTED';
}

type ApiFixtureRow = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue?: { name?: string | null; city?: string | null };
  };
  league: {
    id: number;
    name: string;
    country?: string;
    logo?: string;
    round?: string;
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
};

function mapApiFixture(row: ApiFixtureRow): NormalizedMatch {
  return {
    id: String(row.fixture.id),
    externalId: String(row.fixture.id),
    homeTeam: {
      id: String(row.teams.home.id),
      externalId: String(row.teams.home.id),
      name: row.teams.home.name,
      slug: slugifyName(row.teams.home.name),
      logoUrl: row.teams.home.logo,
    },
    awayTeam: {
      id: String(row.teams.away.id),
      externalId: String(row.teams.away.id),
      name: row.teams.away.name,
      slug: slugifyName(row.teams.away.name),
      logoUrl: row.teams.away.logo,
    },
    league: {
      id: String(row.league.id),
      externalId: String(row.league.id),
      name: row.league.name,
      slug: slugifyName(row.league.name),
      logoUrl: row.league.logo,
      country: row.league.country,
    },
    status: mapApiStatus(row.fixture.status.short),
    homeScore: row.goals.home ?? undefined,
    awayScore: row.goals.away ?? undefined,
    minute: row.fixture.status.elapsed ?? undefined,
    kickoffAt: new Date(row.fixture.date),
    venue: row.fixture.venue?.name || undefined,
    round: row.league.round,
  };
}

export type StandingZone = 'direct' | 'playoff' | 'out' | 'cl' | 'el' | 'rel' | null;

function zoneFromDescription(raw?: string | null): StandingZone | undefined {
  if (!raw) return undefined;
  const text = raw.toLowerCase();
  if (/play-?off|qualification|تصفية|ملحق/.test(text) && /champion|أبطال/.test(text)) return 'playoff';
  if (/champion league|champions league|أبطال/.test(text)) return /league phase|دور المجموعات|دور الدوري/.test(text) && /8|top 8|الأول/i.test(text) ? 'direct' : 'cl';
  if (/europa|conference|أوروبا|مؤتمرات/.test(text)) return 'el';
  if (/relegat|هبوط/.test(text)) return 'rel';
  if (/promotion - champions|تأهل.*أبطال/.test(text)) return 'direct';
  return undefined;
}

export function standingZone(
  rank: number,
  total: number,
  leagueName: string,
  description?: string | null,
): StandingZone {
  const fromSource = zoneFromDescription(description);
  if (fromSource) return fromSource;
  const ucl = /champions league/i.test(leagueName) || /دوري أبطال/i.test(leagueName);
  if (ucl && total >= 30) {
    if (rank <= 8) return 'direct';
    if (rank <= 24) return 'playoff';
    return 'out';
  }
  if (total >= 16) {
    if (rank <= 4) return 'cl';
    if (rank <= 6) return 'el';
    if (rank > total - 3) return 'rel';
  } else if (total >= 8) {
    if (rank === 1) return 'cl';
    if (rank > total - 2) return 'rel';
  } else if (rank === 1) {
    return 'cl';
  }
  return null;
}

function formLetter(
  homeScore: number | null,
  awayScore: number | null,
  isHome: boolean
): 'W' | 'D' | 'L' | null {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore === awayScore) return 'D';
  const won = isHome ? homeScore > awayScore : awayScore > homeScore;
  return won ? 'W' : 'L';
}

type PersonRef = {
  id: string;
  name: string;
  slug: string;
  photoUrl: string | null;
  position: string | null;
};

type TeamRef = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

type MatchSide = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type LeagueMatchCard = {
  id: string;
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: Date;
  round: string | null;
  venue: { name: string; city: string | null } | null;
  channels: Array<{ name: string }>;
  homeTeam: MatchSide;
  awayTeam: MatchSide;
};

export type LeagueDossierData = {
  league: {
    id: string;
    externalId: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    country: string | null;
    matchCount: number;
    standingCount: number;
  };
  seasonId: string | null;
  seasons: string[];
  liveMatches: LeagueMatchCard[];
  upcoming: LeagueMatchCard[];
  recent: LeagueMatchCard[];
  roundAgenda: {
    round: string;
    matches: LeagueMatchCard[];
  } | null;
  spotlight: LeagueMatchCard | null;
  tvGuide: Array<{
    matchId: string;
    kickoffAt: Date;
    home: string;
    away: string;
    channels: string[];
  }>;
  standings: Array<{
    id: string;
    rank: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    form: Array<'W' | 'D' | 'L'>;
    zone: StandingZone;
    team: TeamRef;
  }>;
  clubs: TeamRef[];
  topScorers: Array<{
    goals: number;
    assists: number | null;
    player: PersonRef;
    team: TeamRef;
  }>;
  topAssists: Array<{
    assists: number;
    player: PersonRef | null;
    name: string;
    team: TeamRef | null;
  }>;
  topCards: Array<{
    yellow: number;
    red: number;
    total: number;
    player: PersonRef;
    team: TeamRef;
  }>;
  news: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string | null;
    featuredImage: string | null;
    category: string;
    publishedAt: Date;
  }>;
  archiveSeasons: Array<{
    seasonId: string;
    start?: string;
    end?: string;
    current?: boolean;
    teams?: number;
  }>;
  lastSyncedAt: Date | null;
  provider: 'api-football' | 'database';
};

async function upsertTeamRow(input: {
  externalId: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
}) {
  const externalId = String(input.externalId);
  const slug = `${slugifyName(input.slug || input.name)}-${externalId}`;
  try {
    const row = await prisma.team.upsert({
      where: { externalId },
      update: { name: input.name, officialName: input.name, logoUrl: input.logoUrl ?? null },
      create: {
        externalId,
        name: input.name,
        officialName: input.name,
        slug,
        logoUrl: input.logoUrl ?? null,
      },
    });
    const { rememberArabicDisplay } = await import('@/lib/sports-data/persistence');
    await rememberArabicDisplay('TEAM', row.id, input.name);
    return row;
  } catch (error) {
    reportCaughtError("src/lib/leagues/load-dossier.ts:280", error);
    return prisma.team.findUnique({ where: { externalId } });
  }
}

async function upsertPlayerRow(input: {
  externalId: string;
  name: string;
  photoUrl?: string | null;
}) {
  const externalId = String(input.externalId);
  const slug = `${slugifyName(input.name)}-${externalId}`;
  try {
    const row = await prisma.player.upsert({
      where: { externalId },
      update: {
        name: input.name,
        officialName: input.name,
        ...(input.photoUrl ? { photoUrl: input.photoUrl } : {}),
      },
      create: {
        externalId,
        name: input.name,
        officialName: input.name,
        slug,
        photoUrl: input.photoUrl ?? null,
      },
    });
    const { rememberArabicDisplay } = await import('@/lib/sports-data/persistence');
    await rememberArabicDisplay('PLAYER', row.id, input.name);
    return row;
  } catch (error) {
    reportCaughtError("src/lib/leagues/load-dossier.ts:306", error);
    return prisma.player.findUnique({ where: { externalId } });
  }
}

async function persistStandings(
  leagueDbId: string,
  seasonId: string,
  rows: import('@/lib/sports-data/types').NormalizedStanding[],
) {
  await persistLeagueStandings(leagueDbId, seasonId, rows);
}

async function hydrateLeagueFixtures(leagueExternalId: string, season: string) {
  const seasonsToTry = [season, String(Number(season) - 1)].filter(
    (value, index, list) => list.indexOf(value) === index
  );
  let rows: ApiFixtureRow[] = [];
  for (const year of seasonsToTry) {
    const [lastData, nextData] = await Promise.all([
      sportsData.getRaw<{ response?: ApiFixtureRow[] }>(
        `/fixtures?league=${encodeURIComponent(leagueExternalId)}&season=${encodeURIComponent(year)}&last=20`
      ),
      sportsData.getRaw<{ response?: ApiFixtureRow[] }>(
        `/fixtures?league=${encodeURIComponent(leagueExternalId)}&season=${encodeURIComponent(year)}&next=15`
      ),
    ]);
    rows = [...(lastData?.response || []), ...(nextData?.response || [])];
    if (rows.length > 0) break;
  }
  if (rows.length === 0) return 0;
  const { persistNormalizedMatch } = await import('@/lib/sports-data/persistence');
  let saved = 0;
  for (const row of rows.slice(0, 28)) {
    try {
      await persistNormalizedMatch(mapApiFixture(row));
      saved += 1;
    } catch (error) {
      reportCaughtError("src/lib/leagues/load-dossier.ts:387", error);
      // keep going
    }
  }
  return saved;
}

type ApiTopScorerRow = {
  player: { id: number; name: string; photo?: string | null };
  statistics?: Array<{
    team?: { id: number; name: string; logo?: string | null };
    goals?: { total?: number | null; assists?: number | null };
  }>;
};

async function fetchApiTopScorers(leagueExternalId: string, season: string) {
  const data = await sportsData.getRaw<{ response?: ApiTopScorerRow[] }>(
    `/players/topscorers?league=${encodeURIComponent(leagueExternalId)}&season=${encodeURIComponent(season)}`
  );
  const response = data?.response || [];
  if (response.length === 0) return [] as LeagueDossierData['topScorers'];

  const out: LeagueDossierData['topScorers'] = [];
  for (const row of response.slice(0, 15)) {
    const goals = row.statistics?.[0]?.goals?.total;
    const assists = row.statistics?.[0]?.goals?.assists ?? null;
    const teamExt = row.statistics?.[0]?.team?.id;
    if (typeof goals !== 'number' || goals <= 0 || teamExt == null) continue;
    const player = await upsertPlayerRow({
      externalId: String(row.player.id),
      name: row.player.name,
      photoUrl: row.player.photo,
    });
    const team = await upsertTeamRow({
      externalId: String(teamExt),
      name: row.statistics?.[0]?.team?.name || 'Team',
      slug: slugifyName(row.statistics?.[0]?.team?.name || 'team'),
      logoUrl: row.statistics?.[0]?.team?.logo,
    });
    if (!player || !team) continue;
    out.push({
      goals,
      assists: typeof assists === 'number' ? assists : null,
      player: {
        id: player.id,
        name: player.name,
        slug: player.slug,
        photoUrl: player.photoUrl,
        position: player.position,
      },
      team: {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
      },
    });
  }
  return out;
}

const matchSelect = {
  id: true,
  status: true,
  minute: true,
  homeScore: true,
  awayScore: true,
  kickoffAt: true,
  round: true,
  seasonId: true,
  lastSyncedAt: true,
  venue: { select: { name: true, city: true } },
  channels: { take: 4, select: { channel: { select: { name: true } } } },
  homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
  awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
} as const;

function isBroadcastName(name?: string | null) {
  const value = (name || '').trim();
  if (!value) return false;
  return !/^(hd|sd|ys|n\/a|na|unknown|tbd|-)$/i.test(value);
}

function latestSeasonId(ids: string[]) {
  return [...new Set(ids.filter(Boolean))].sort((a, b) => b.localeCompare(a, 'en', { numeric: true }))[0] || null;
}

function mapMatchCard(match: {
  id: string;
  status: string;
  minute: number | null;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: Date;
  round: string | null;
  venue: { name: string; city: string | null } | null;
  channels: Array<{ channel: { name: string } }>;
  homeTeam: MatchSide;
  awayTeam: MatchSide;
}): LeagueMatchCard {
  return {
    id: match.id,
    status: match.status,
    minute: match.minute,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    kickoffAt: match.kickoffAt,
    round: match.round,
    venue: match.venue,
    channels: (match.channels ?? [])
      .map((entry) => entry.channel)
      .filter((channel) => isBroadcastName(channel.name)),
    homeTeam: match.homeTeam,
    awayTeam: match.awayTeam,
  };
}

const leagueSelect = {
  id: true,
  externalId: true,
  name: true,
  slug: true,
  logoUrl: true,
  country: true,
  _count: { select: { matches: true, standings: true } },
} as const;

async function findLeagueRowBySlug(slug: string) {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug).trim();
    } catch {
      return slug.trim();
    }
  })();
  if (!decoded) return null;
  const exact = await soft(
    () => prisma.league.findFirst({ where: { OR: [{ slug: decoded }, { slug }] }, select: leagueSelect }),
    null
  );
  if (exact) return exact;
  const candidates = await soft(
    () =>
      prisma.league.findMany({
        where: {
          OR: [
            { slug: { startsWith: `${decoded}-`, mode: 'insensitive' } },
            { slug: { equals: decoded, mode: 'insensitive' } },
            { name: { contains: decoded.replace(/-/g, ' '), mode: 'insensitive' } },
          ],
        },
        take: 8,
        select: leagueSelect,
      }),
    []
  );
  return [...candidates].sort((a, b) => a.slug.length - b.slug.length)[0] ?? null;
}

export const loadLeagueDossier = cache(async function loadLeagueDossier(
  slug: string,
  options?: { season?: string }
): Promise<LeagueDossierData | null> {
  const league = await findLeagueRowBySlug(slug);
  if (!league) return null;

  const now = new Date();
  const seasonHint = String(footballSeason(now));

  const seasonRows = await soft(
    () =>
      prisma.standing.findMany({
        where: { leagueId: league.id },
        distinct: ['seasonId'],
        orderBy: { seasonId: 'desc' },
        take: 12,
        select: { seasonId: true },
      }),
    []
  );
  const matchSeasonRows = await soft(
    () =>
      prisma.match.findMany({
        where: { leagueId: league.id },
        distinct: ['seasonId'],
        orderBy: { seasonId: 'desc' },
        take: 12,
        select: { seasonId: true },
      }),
    []
  );
  const knownSeasons = [...seasonRows, ...matchSeasonRows].map((row) => row.seasonId);
  let seasonId =
    (options?.season && knownSeasons.includes(options.season) ? options.season : null) ||
    latestSeasonId(knownSeasons) ||
    (options?.season ? options.season : null) ||
    seasonHint;

  const existingMatchCount = await soft(
    () => prisma.match.count({ where: { leagueId: league.id, seasonId } }),
    0
  );
  if (isLiveSportsApi() && league.externalId && existingMatchCount < 12) {
    await soft(() => hydrateLeagueFixtures(league.externalId, seasonId), 0);
  }

  if (isLiveSportsApi() && league.externalId) {
    const seasonsToTry = [options?.season, seasonId, seasonHint, String(Number(seasonHint) - 1)].filter(
      (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index,
    );
    for (const year of seasonsToTry) {
      const apiRows = await soft(() => sportsData.getStandings(league.externalId, year), []);
      if (apiRows.length > 0) {
        await persistStandings(league.id, year, apiRows);
        seasonId = year;
        break;
      }
    }
  }

  const [liveRaw, upcomingRaw, recentRaw, standingRows, newsRows, scorerGroups, yellowGroups, redGroups, assistGroups] =
    await Promise.all([
      soft(
        () =>
          prisma.match.findMany({
            where: { leagueId: league.id, seasonId, status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } },
            orderBy: { kickoffAt: 'asc' },
            take: 10,
            select: matchSelect,
          }),
        []
      ),
      soft(
        () =>
          prisma.match.findMany({
            where: { leagueId: league.id, seasonId, kickoffAt: { gte: now }, status: 'NOT_STARTED' },
            orderBy: { kickoffAt: 'asc' },
            take: 28,
            select: matchSelect,
          }),
        []
      ),
      soft(
        () =>
          prisma.match.findMany({
            where: { leagueId: league.id, seasonId, status: 'FINISHED' },
            orderBy: { kickoffAt: 'desc' },
            take: 28,
            select: matchSelect,
          }),
        []
      ),
      soft(
        () =>
          prisma.standing.findMany({
            where: { leagueId: league.id, seasonId },
            orderBy: { rank: 'asc' },
            select: {
              id: true,
              rank: true,
              played: true,
              won: true,
              drawn: true,
              lost: true,
              goalsFor: true,
              goalsAgainst: true,
              points: true,
              team: { select: { id: true, name: true, slug: true, logoUrl: true } },
            },
          }),
        []
      ),
      soft(
        () =>
          prisma.news.findMany({
            where: {
              status: 'PUBLISHED',
              publishedAt: { not: null },
              OR: [
                { entityLinks: { some: { entityType: 'LEAGUE', entityId: league.id } } },
                { title: { contains: league.name } },
                { tags: { has: league.name } },
              ],
            },
            orderBy: { publishedAt: 'desc' },
            take: 8,
            select: {
              id: true,
              slug: true,
              title: true,
              excerpt: true,
              featuredImage: true,
              category: true,
              publishedAt: true,
            },
          }),
        []
      ),
      soft(
        () =>
          prisma.matchEvent.groupBy({
            by: ['playerId', 'teamId'],
            where: {
              type: { in: ['GOAL', 'PENALTY'] },
              playerId: { not: null },
              match: { leagueId: league.id, seasonId },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 15,
          }),
        []
      ),
      soft(
        () =>
          prisma.matchEvent.groupBy({
            by: ['playerId', 'teamId'],
            where: {
              type: 'YELLOW_CARD',
              playerId: { not: null },
              match: { leagueId: league.id, seasonId },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 12,
          }),
        []
      ),
      soft(
        () =>
          prisma.matchEvent.groupBy({
            by: ['playerId', 'teamId'],
            where: {
              type: 'RED_CARD',
              playerId: { not: null },
              match: { leagueId: league.id, seasonId },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 12,
          }),
        []
      ),
      soft(
        () =>
          prisma.matchEvent.groupBy({
            by: ['assistName', 'teamId'],
            where: {
              type: { in: ['GOAL', 'PENALTY'] },
              assistName: { not: null },
              match: { leagueId: league.id, seasonId },
            },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 12,
          }),
        []
      ),
    ]);

  let standingsBase = standingRows;
  if (standingsBase.length === 0 && isLiveSportsApi() && league.externalId) {
    const apiRows = await soft(() => sportsData.getStandings(league.externalId, seasonId), []);
    if (apiRows.length > 0) {
      await persistStandings(league.id, seasonId, apiRows);
      standingsBase = apiRows.map((row, index) => ({
        id: `api-${row.team.externalId || index}`,
        rank: row.rank,
        played: row.played,
        won: row.won,
        drawn: row.drawn,
        lost: row.lost,
        goalsFor: row.goalsFor,
        goalsAgainst: row.goalsAgainst,
        points: row.points,
        description: row.description ?? null,
        team: {
          id: row.team.id,
          name: row.team.name,
          slug: row.team.slug,
          logoUrl: row.team.logoUrl || null,
        },
      }));
    }
  }

  const liveMatches = liveRaw.map(mapMatchCard);
  const upcoming = upcomingRaw.map(mapMatchCard);
  const recent = recentRaw.map(mapMatchCard);

  const formByTeam = new Map<string, Array<'W' | 'D' | 'L'>>();
  for (const match of recent) {
    const homeLetter = formLetter(match.homeScore, match.awayScore, true);
    const awayLetter = formLetter(match.homeScore, match.awayScore, false);
    if (homeLetter) {
      const list = formByTeam.get(match.homeTeam.id) || [];
      if (list.length < 5) {
        list.push(homeLetter);
        formByTeam.set(match.homeTeam.id, list);
      }
    }
    if (awayLetter) {
      const list = formByTeam.get(match.awayTeam.id) || [];
      if (list.length < 5) {
        list.push(awayLetter);
        formByTeam.set(match.awayTeam.id, list);
      }
    }
  }

  const totalTeams = standingsBase.length;
  const standings: LeagueDossierData['standings'] = standingsBase.map((row) => ({
    ...row,
    form: formByTeam.get(row.team.id) || [],
    zone: standingZone(row.rank, totalTeams, league.name, 'description' in row ? (row as { description?: string | null }).description : null),
  }));

  const playerIds = [
    ...new Set(
      [...scorerGroups, ...yellowGroups, ...redGroups]
        .map((row) => row.playerId)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const teamIds = [
    ...new Set(
      [...scorerGroups, ...yellowGroups, ...redGroups, ...assistGroups].map((row) => row.teamId)
    ),
  ];

  const [players, teams] = await Promise.all([
    playerIds.length
      ? soft(
        () =>
          prisma.player.findMany({
            where: { id: { in: playerIds } },
            select: { id: true, name: true, slug: true, photoUrl: true, position: true },
          }),
        []
      )
      : [],
    teamIds.length
      ? soft(
        () =>
          prisma.team.findMany({
            where: { id: { in: teamIds } },
            select: { id: true, name: true, slug: true, logoUrl: true },
          }),
        []
      )
      : [],
  ]);
  const playerMap = new Map(players.map((p) => [p.id, p]));
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  const standingTeamIds = new Set(standingsBase.map((row) => row.team.id));
  const mappedScorers = scorerGroups
    .map((row) => {
      if (!row.playerId) return null;
      const player = playerMap.get(row.playerId);
      const team = teamMap.get(row.teamId);
      if (!player || !team) return null;
      return { goals: row._count.id, assists: null as number | null, player, team };
    })
    .filter(Boolean) as LeagueDossierData['topScorers'];
  const scopedScorers = standingTeamIds.size > 0
    ? mappedScorers.filter((row) => standingTeamIds.has(row.team.id))
    : mappedScorers;
  let topScorers = scopedScorers.length >= 5 ? scopedScorers : mappedScorers;

  if (topScorers.length < 5 && league.externalId) {
    const apiScorers = await fetchApiTopScorers(league.externalId, seasonId);
    const allowed = new Set(standingsBase.map((row) => row.team.slug));
    const scoped =
      allowed.size > 0
        ? apiScorers.filter((row) => allowed.has(row.team.slug) || standingsBase.some((club) => club.team.name === row.team.name))
        : apiScorers;
    const pick = scoped.length >= 3 ? scoped : apiScorers;
    if (pick.length > topScorers.length) topScorers = pick;
  }

  const assistFromApi = topScorers
    .filter((row) => typeof row.assists === 'number' && (row.assists as number) > 0)
    .map((row) => ({
      assists: row.assists as number,
      player: row.player,
      name: row.player.name,
      team: row.team,
    }))
    .sort((a, b) => b.assists - a.assists);

  const assistFromEvents = assistGroups
    .map((row) => {
      if (!row.assistName) return null;
      return {
        assists: row._count.id,
        player: null as PersonRef | null,
        name: row.assistName,
        team: teamMap.get(row.teamId) || null,
      };
    })
    .filter(Boolean) as LeagueDossierData['topAssists'];

  const topAssists =
    assistFromApi.length > 0 ? assistFromApi.slice(0, 10) : assistFromEvents.slice(0, 10);

  const cardMap = new Map<
    string,
    { yellow: number; red: number; playerId: string; teamId: string }
  >();
  for (const row of yellowGroups) {
    if (!row.playerId) continue;
    const key = `${row.playerId}:${row.teamId}`;
    const current = cardMap.get(key) || { yellow: 0, red: 0, playerId: row.playerId, teamId: row.teamId };
    current.yellow = row._count.id;
    cardMap.set(key, current);
  }
  for (const row of redGroups) {
    if (!row.playerId) continue;
    const key = `${row.playerId}:${row.teamId}`;
    const current = cardMap.get(key) || { yellow: 0, red: 0, playerId: row.playerId, teamId: row.teamId };
    current.red = row._count.id;
    cardMap.set(key, current);
  }
  const topCards = [...cardMap.values()]
    .map((row) => {
      const player = playerMap.get(row.playerId);
      const team = teamMap.get(row.teamId);
      if (!player || !team) return null;
      return {
        yellow: row.yellow,
        red: row.red,
        total: row.yellow + row.red * 2,
        player,
        team,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.total - a!.total) || b!.red - a!.red)
    .slice(0, 10) as LeagueDossierData['topCards'];

  const news = newsRows
    .filter((row): row is typeof row & { publishedAt: Date } => Boolean(row.publishedAt))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      featuredImage: row.featuredImage,
      category: row.category,
      publishedAt: row.publishedAt,
    }));

  const seasons = [...new Set(seasonRows.map((row) => row.seasonId))];
  if (seasonId && !seasons.includes(seasonId)) seasons.unshift(seasonId);

  const archiveFromApi = league.externalId
    ? await soft(() => sportsData.getLeagueArchive(league.externalId), [])
    : [];
  const archiveSeasons: LeagueDossierData['archiveSeasons'] =
    archiveFromApi.length > 0
      ? archiveFromApi
        .slice()
        .sort((a, b) => b.year - a.year)
        .slice(0, 12)
        .map((row) => ({
          seasonId: String(row.year),
          start: row.start,
          end: row.end,
          current: row.current,
        }))
      : seasons.map((id, index) => ({
        seasonId: id,
        current: index === 0,
        teams: standings.length || undefined,
      }));

  const spotlight =
    liveMatches[0] ||
    upcoming.find((match) => match.channels.length > 0) ||
    upcoming[0] ||
    null;

  let roundAgenda: LeagueDossierData['roundAgenda'] = null;
  const focusRound = spotlight?.round || upcoming[0]?.round || recent[0]?.round || null;
  if (focusRound) {
    const pool = [...liveMatches, ...upcoming, ...recent].filter((match) => match.round === focusRound);
    if (pool.length > 0) {
      roundAgenda = {
        round: focusRound,
        matches: pool.slice(0, 10),
      };
    }
  }

  const tvGuide = upcoming
    .filter((match) => match.channels.length > 0)
    .slice(0, 8)
    .map((match) => ({
      matchId: match.id,
      kickoffAt: match.kickoffAt,
      home: match.homeTeam.name,
      away: match.awayTeam.name,
      channels: match.channels.map((channel) => channel.name),
    }));

  const clubs = standings.map((row) => row.team);

  const matchCount = await soft(
    () => prisma.match.count({ where: { leagueId: league.id, seasonId } }),
    league._count.matches
  );
  const lastSyncedAt = await soft(
    () =>
      prisma.match
        .findFirst({
          where: { leagueId: league.id, seasonId },
          orderBy: { lastSyncedAt: 'desc' },
          select: { lastSyncedAt: true },
        })
        .then((row) => row?.lastSyncedAt ?? null),
    null
  );

  return {
    league: {
      id: league.id,
      externalId: league.externalId,
      name: league.name,
      slug: league.slug,
      logoUrl: league.logoUrl,
      country: league.country,
      matchCount,
      standingCount: standings.length || league._count.standings,
    },
    seasonId,
    seasons,
    liveMatches,
    upcoming,
    recent,
    roundAgenda,
    spotlight,
    tvGuide,
    standings,
    clubs,
    topScorers,
    topAssists,
    topCards,
    news,
    archiveSeasons,
    lastSyncedAt,
    provider: isLiveSportsApi() ? 'api-football' : 'database',
  };
});
