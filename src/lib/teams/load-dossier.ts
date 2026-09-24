import { reportCaughtError } from '@/lib/ops/caught';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { sportsData } from '@/lib/sports-data';
import type { NormalizedMatch } from '@/lib/sports-data/types';

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
      console.warn('[team-dossier] query failed, using fallback', message.slice(0, 180));
    }
  }
  return fallback;
}

async function wave<T extends readonly unknown[]>(
  tasks: [...{ [K in keyof T]: () => Promise<T[K]> }]
): Promise<{ [K in keyof T]: T[K] }> {
  const out = await Promise.all(tasks.map((task) => task()));
  return out as { [K in keyof T]: T[K] };
}

const matchSelect = {
  id: true,
  status: true,
  minute: true,
  round: true,
  kickoffAt: true,
  homeScore: true,
  awayScore: true,
  homeTeamId: true,
  awayTeamId: true,
  homeTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
  awayTeam: { select: { id: true, name: true, slug: true, logoUrl: true } },
  league: { select: { id: true, name: true, slug: true, logoUrl: true, country: true } },
  venue: { select: { name: true, city: true } },
} as const;

export type DossierCrest = {
  id?: string;
  name: string;
  slug?: string;
  logoUrl: string | null;
};

export type DossierMatch = {
  id: string;
  status: string;
  minute: number | null;
  round: string | null;
  kickoffAt: Date;
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam: DossierCrest;
  awayTeam: DossierCrest;
  league: { id: string; name: string; slug: string; logoUrl: string | null; country: string | null };
  venue: { name: string; city: string | null } | null;
};

export type FormLetter = 'W' | 'D' | 'L';

export type SquadGroupKey = 'GK' | 'DF' | 'MF' | 'FW' | 'OTHER';

export type DossierPlayer = {
  id: string;
  shirtNumber: number | null;
  player: {
    id: string;
    name: string;
    slug: string;
    photoUrl: string | null;
    position: string | null;
    nationality: string | null;
    birthDate: Date | null;
    age: number | null;
  };
};

export type FormEntry = {
  letter: FormLetter;
  matchId: string;
  opponent: DossierCrest;
  homeScore: number;
  awayScore: number;
  isHome: boolean;
  kickoffAt: Date;
};

export type SplitStats = {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
};

export type Contributor = {
  goals?: number;
  assists?: number;
  yellow?: number;
  red?: number;
  name: string;
  slug: string | null;
  photoUrl: string | null;
};

export type TeamDossierData = {
  team: {
    id: string;
    externalId: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    code: string | null;
    founded: number | null;
    country: string | null;
    bio: string | null;
    venue: {
      name: string;
      city: string | null;
      capacity: number | null;
      surface: string | null;
      imageUrl: string | null;
      address: string | null;
    } | null;
    coach: {
      id: string;
      slug: string | null;
      name: string;
      photoUrl: string | null;
      nationality: string | null;
      bio: string | null;
      birthDate: Date | null;
      trophies: Array<{ title: string; season: string; teamName: string | null }>;
      career: Array<{ club: string; role?: string; from?: string; to?: string; matches?: number; winRate?: number }>;
    } | null;
  };
  squad: Record<SquadGroupKey, DossierPlayer[]>;
  squadCount: number;
  squadAges: { min: number; max: number; avg: number } | null;
  squadComposition: Array<{ key: SquadGroupKey; count: number }>;
  nationalities: Array<{ name: string; count: number; pct: number }>;
  liveMatches: DossierMatch[];
  upcoming: DossierMatch[];
  recentResults: DossierMatch[];
  nextMatch: DossierMatch | null;
  form: FormLetter[];
  formTrail: FormEntry[];
  standing: {
    rank: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    seasonId: string;
    league: { id: string; name: string; slug: string; logoUrl: string | null; country: string | null };
  } | null;
  stats: SplitStats & { goalDiff: number; winPct: number | null };
  homeStats: SplitStats;
  awayStats: SplitStats;
  competitions: Array<{ id: string; name: string; slug: string; logoUrl: string | null; country: string | null; matches: number }>;
  scorers: Contributor[];
  assisters: Contributor[];
  discipline: {
    yellow: number;
    red: number;
    players: Contributor[];
  };
  transfers: Array<{
    id: string;
    date: Date;
    fee: string | null;
    fromTeam: string | null;
    toTeam: string | null;
    player: { name: string; slug: string; photoUrl: string | null };
  }>;
  news: Array<{
    id: string;
    slug: string;
    title: string;
    shortTitle?: string;
    excerpt?: string;
    featuredImage?: string;
    category: string;
    publishedAt: Date;
    isPremium?: boolean;
    featured?: boolean;
    breaking?: boolean;
    readingTime?: number;
    views?: number;
    sourceName?: string;
  }>;
};

function classifyPosition(position: string | null | undefined): SquadGroupKey {
  const p = (position || '').toLowerCase();
  if (!p) return 'OTHER';
  if (p.includes('goal') || p === 'gk' || p.includes('حارس')) return 'GK';
  if (
    p.includes('def') ||
    p.includes('back') ||
    p === 'df' ||
    p.includes('دفاع') ||
    p.includes('ظهير') ||
    p.includes('قلب')
  ) {
    return 'DF';
  }
  if (
    p.includes('mid') ||
    p === 'mf' ||
    p.includes('وسط') ||
    p.includes('محور') ||
    p.includes('wing')
  ) {
    return 'MF';
  }
  if (
    p.includes('att') ||
    p.includes('forw') ||
    p.includes('striker') ||
    p === 'fw' ||
    p.includes('هجوم') ||
    p.includes('مهاجم')
  ) {
    return 'FW';
  }
  return 'OTHER';
}

function resultLetter(
  match: { homeTeamId: string; awayTeamId: string; homeScore: number | null; awayScore: number | null },
  teamId: string
): FormLetter | null {
  if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') return null;
  const isHome = match.homeTeamId === teamId;
  const forGoals = isHome ? match.homeScore : match.awayScore;
  const againstGoals = isHome ? match.awayScore : match.homeScore;
  if (forGoals > againstGoals) return 'W';
  if (forGoals < againstGoals) return 'L';
  return 'D';
}

function emptySquad(): Record<SquadGroupKey, DossierPlayer[]> {
  return { GK: [], DF: [], MF: [], FW: [], OTHER: [] };
}

function emptySplit(): SplitStats {
  return { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 };
}

function applyResult(bucket: SplitStats, gf: number, ga: number) {
  bucket.played += 1;
  bucket.goalsFor += gf;
  bucket.goalsAgainst += ga;
  if (gf > ga) bucket.won += 1;
  else if (gf < ga) bucket.lost += 1;
  else bucket.drawn += 1;
}

function ageFromBirth(birthDate: Date | null, now: Date): number | null {
  if (!birthDate) return null;
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age -= 1;
  return age >= 14 && age <= 55 ? age : null;
}

type ApiTeamProfile = {
  logoUrl?: string;
  founded?: number;
  country?: string;
  code?: string;
  venue?: {
    name: string;
    city?: string;
    capacity?: number;
    surface?: string;
    image?: string;
    address?: string;
  };
};

type ApiFixtureRow = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed?: number };
    venue?: { name?: string; city?: string };
  };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  league: { id: number; name: string; country?: string; logo?: string; round?: string; season?: number };
  goals: { home: number | null; away: number | null };
};

function footballSeason(now = new Date()) {
  const year = now.getFullYear();
  const month = now.getMonth();
  return month >= 6 ? year : year - 1;
}

type SquadPlayerRow = {
  id: string;
  shirtNumber: number | null;
  player: {
    id: string;
    externalId: string;
    name: string;
    slug: string;
    photoUrl: string | null;
    position: string | null;
    nationality: string | null;
    birthDate: Date | null;
  };
};

/** Fill missing squad nationalities from API Football players endpoint (real data only). */
async function hydrateSquadNationalities(
  teamExternalId: string,
  players: SquadPlayerRow[]
): Promise<SquadPlayerRow[]> {
  if (!isLiveSportsApi() || players.length === 0) return players;
  const missing = players.filter((row) => !row.player.nationality?.trim());
  if (missing.length === 0) return players;

  const season = footballSeason();
  const byExternal = new Map<string, string>();

  for (let page = 1; page <= 3; page += 1) {
    const data = await sportsData.getRaw<{
      paging?: { current?: number; total?: number };
      response?: Array<{
        player?: { id?: number; nationality?: string };
      }>;
    }>(`/players?team=${encodeURIComponent(teamExternalId)}&season=${season}&page=${page}`);

    for (const row of data?.response || []) {
      const id = row.player?.id != null ? String(row.player.id) : '';
      const nation = row.player?.nationality?.trim();
      if (id && nation) byExternal.set(id, nation);
    }

    const total = data?.paging?.total ?? 1;
    if (page >= total || !data?.response?.length) break;
  }

  if (byExternal.size === 0) return players;

  const patches: Array<{ id: string; nationality: string }> = [];
  const next = players.map((row) => {
    if (row.player.nationality?.trim()) return row;
    const nation = byExternal.get(row.player.externalId);
    if (!nation) return row;
    patches.push({ id: row.player.id, nationality: nation });
    return {
      ...row,
      player: { ...row.player, nationality: nation },
    };
  });

  for (const patch of patches.slice(0, 40)) {
    await soft(
      () =>
        prisma.player.update({
          where: { id: patch.id },
          data: { nationality: patch.nationality },
        }),
      null
    );
  }

  return next;
}

async function isUsableVenueImage(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const response = await fetch(url, {
      cache: 'force-cache',
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 2500) return null;
    // Skip API-Sports generic crest placeholders (tiny square icons).
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      if (width <= 160 && height <= 160) return null;
    }
    return url;
  } catch (error) {
    reportCaughtError("src/lib/teams/load-dossier.ts:414", error);
    return null;
  }
}

async function fetchTeamProfileFromApi(externalId: string): Promise<ApiTeamProfile | null> {
  const data = await sportsData.getRaw<{
    response?: Array<{
      team?: { logo?: string; founded?: number; country?: string; code?: string };
      venue?: {
        id?: number;
        name?: string;
        city?: string;
        capacity?: number;
        surface?: string;
        image?: string;
        address?: string;
      };
    }>;
  }>(`/teams?id=${encodeURIComponent(externalId)}`);
  const row = data?.response?.[0];
  if (!row?.team) return null;
  const rawImage =
    row.venue?.image ||
    (row.venue?.id ? `https://media.api-sports.io/football/venues/${row.venue.id}.png` : undefined);
  const venueImage = await isUsableVenueImage(rawImage);
  return {
    logoUrl: row.team.logo,
    founded: row.team.founded,
    country: row.team.country,
    code: row.team.code,
    venue: row.venue?.name
      ? {
        name: row.venue.name,
        city: row.venue.city,
        capacity: row.venue.capacity,
        surface: row.venue.surface,
        image: venueImage || undefined,
        address: row.venue.address,
      }
      : undefined,
  };
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

function slugifyName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

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
    minute: row.fixture.status.elapsed,
    kickoffAt: new Date(row.fixture.date),
    venue: row.fixture.venue?.name,
    round: row.league.round,
  };
}

async function hydrateTeamFixtures(externalId: string) {
  const [lastData, nextData] = await Promise.all([
    sportsData.getRaw<{ response?: ApiFixtureRow[] }>(`/fixtures?team=${encodeURIComponent(externalId)}&last=8`),
    sportsData.getRaw<{ response?: ApiFixtureRow[] }>(`/fixtures?team=${encodeURIComponent(externalId)}&next=5`),
  ]);
  const rows = [...(lastData?.response || []), ...(nextData?.response || [])];
  if (rows.length === 0) return;
  const { persistNormalizedMatch } = await import('@/lib/sports-data/persistence');
  for (const row of rows.slice(0, 10)) {
    try {
      await persistNormalizedMatch(mapApiFixture(row));
    } catch (error) {
      reportCaughtError("src/lib/teams/load-dossier.ts:535", error);
      // one fixture must not break the dossier
    }
  }
}

function parseCareer(raw: unknown): Array<{
  club: string;
  role?: string;
  from?: string;
  to?: string;
  matches?: number;
  winRate?: number;
}> {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const club = typeof row.club === 'string' ? row.club : typeof row.team === 'string' ? row.team : null;
      if (!club) return null;
      return {
        club,
        role: typeof row.role === 'string' ? row.role : undefined,
        from: typeof row.from === 'string' ? row.from : undefined,
        to: typeof row.to === 'string' ? row.to : undefined,
        matches: typeof row.matches === 'number' ? row.matches : undefined,
        winRate: typeof row.winRate === 'number' ? row.winRate : undefined,
      };
    })
    .filter(Boolean) as Array<{
      club: string;
      role?: string;
      from?: string;
      to?: string;
      matches?: number;
      winRate?: number;
    }>;
}

export const loadTeamDossier = cache(async function loadTeamDossier(slug: string): Promise<TeamDossierData | null> {
  const teamRow = await soft(
    () =>
      prisma.team.findUnique({
        where: { slug },
        select: {
          id: true,
          externalId: true,
          name: true,
          slug: true,
          logoUrl: true,
          founded: true,
          bio: true,
          venue: { select: { name: true, city: true, capacity: true } },
          coach: {
            select: {
              id: true,
              name: true,
              photoUrl: true,
              nationality: true,
              bio: true,
              birthDate: true,
              careerHistory: true,
              trophies: {
                orderBy: { season: 'desc' },
                take: 8,
                select: { title: true, season: true, teamName: true },
              },
            },
          },
        },
      }),
    null
  );

  if (!teamRow) return null;

  const teamId = teamRow.id;
  const now = new Date();

  // eslint-disable-next-line prefer-const
  let [players, finished, upcoming, liveMatches, standingRow, newsRows, teamEvents, apiProfile, transfers] =
    await wave([
      () =>
        soft(
          () =>
            prisma.playerTeam.findMany({
              where: { teamId, to: null },
              orderBy: [{ shirtNumber: 'asc' }, { player: { name: 'asc' } }],
              select: {
                id: true,
                shirtNumber: true,
                player: {
                  select: {
                    id: true,
                    externalId: true,
                    name: true,
                    slug: true,
                    photoUrl: true,
                    position: true,
                    nationality: true,
                    birthDate: true,
                  },
                },
              },
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: 'FINISHED',
              },
              orderBy: { kickoffAt: 'desc' },
              take: 50,
              select: matchSelect,
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: 'NOT_STARTED',
                kickoffAt: { gte: now },
              },
              orderBy: { kickoffAt: 'asc' },
              take: 8,
              select: matchSelect,
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: { in: ['LIVE', 'HALFTIME'] },
              },
              orderBy: { kickoffAt: 'asc' },
              take: 4,
              select: matchSelect,
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.standing.findFirst({
              where: { teamId },
              orderBy: { seasonId: 'desc' },
              select: {
                rank: true,
                played: true,
                won: true,
                drawn: true,
                lost: true,
                goalsFor: true,
                goalsAgainst: true,
                points: true,
                seasonId: true,
                league: {
                  select: { id: true, name: true, slug: true, logoUrl: true, country: true },
                },
              },
            }),
          null
        ),
      () =>
        soft(
          () =>
            prisma.news.findMany({
              where: {
                status: 'PUBLISHED',
                OR: [
                  { title: { contains: teamRow.name } },
                  { content: { contains: teamRow.name } },
                  { tags: { has: teamRow.name } },
                  {
                    entityLinks: {
                      some: { entityType: 'TEAM', entityId: teamId },
                    },
                  },
                ],
              },
              orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
              take: 8,
              select: {
                id: true,
                slug: true,
                title: true,
                shortTitle: true,
                excerpt: true,
                featuredImage: true,
                category: true,
                publishedAt: true,
                isPremium: true,
                featured: true,
                breaking: true,
                readingTime: true,
                views: true,
                sourceName: true,
              },
            }),
          []
        ),
      () =>
        soft(
          () =>
            prisma.matchEvent.findMany({
              where: {
                type: { in: ['GOAL', 'PENALTY', 'YELLOW_CARD', 'RED_CARD'] },
                teamId: teamRow.externalId,
                match: {
                  OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                },
              },
              take: 500,
              select: {
                type: true,
                playerId: true,
                playerName: true,
                assistName: true,
                player: { select: { name: true, slug: true, photoUrl: true } },
              },
            }),
          []
        ),
      () => soft(() => fetchTeamProfileFromApi(teamRow.externalId), null),
      () =>
        soft(
          () =>
            prisma.transfer.findMany({
              where: {
                OR: [
                  { toTeam: { contains: teamRow.name, mode: 'insensitive' } },
                  { fromTeam: { contains: teamRow.name, mode: 'insensitive' } },
                  { player: { teams: { some: { teamId } } } },
                ],
              },
              orderBy: { date: 'desc' },
              take: 6,
              select: {
                id: true,
                date: true,
                fee: true,
                fromTeam: true,
                toTeam: true,
                player: { select: { name: true, slug: true, photoUrl: true } },
              },
            }),
          []
        ),
    ]);

  if (isLiveSportsApi() && (finished.length < 3 || upcoming.length < 1)) {
    await soft(async () => {
      await hydrateTeamFixtures(teamRow.externalId);
      return true;
    }, false);
    [finished, upcoming, liveMatches] = await wave([
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: 'FINISHED',
              },
              orderBy: { kickoffAt: 'desc' },
              take: 50,
              select: matchSelect,
            }),
          finished
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: 'NOT_STARTED',
                kickoffAt: { gte: now },
              },
              orderBy: { kickoffAt: 'asc' },
              take: 8,
              select: matchSelect,
            }),
          upcoming
        ),
      () =>
        soft(
          () =>
            prisma.match.findMany({
              where: {
                OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
                status: { in: ['LIVE', 'HALFTIME'] },
              },
              orderBy: { kickoffAt: 'asc' },
              take: 4,
              select: matchSelect,
            }),
          liveMatches
        ),
    ]);
  }

  players = await soft(
    () => hydrateSquadNationalities(teamRow.externalId, players as SquadPlayerRow[]),
    players as SquadPlayerRow[]
  );

  const squad = emptySquad();
  const ages: number[] = [];
  const nationalityMap = new Map<string, number>();
  let knownNationalities = 0;
  for (const row of players) {
    const age = ageFromBirth(row.player.birthDate, now);
    if (age != null) ages.push(age);
    const group = classifyPosition(row.player.position);
    const { externalId: _unused, ...playerPublic } = row.player;
    squad[group].push({
      id: row.id,
      shirtNumber: row.shirtNumber,
      player: {
        ...playerPublic,
        age,
      },
    });
    const nation = row.player.nationality?.trim();
    if (nation) {
      knownNationalities += 1;
      nationalityMap.set(nation, (nationalityMap.get(nation) || 0) + 1);
    }
  }

  const squadAges =
    ages.length > 0
      ? {
        min: Math.min(...ages),
        max: Math.max(...ages),
        avg: Math.round(ages.reduce((a, b) => a + b, 0) / ages.length),
      }
      : null;

  const squadComposition = (['GK', 'DF', 'MF', 'FW', 'OTHER'] as SquadGroupKey[])
    .map((key) => ({ key, count: squad[key].length }))
    .filter((row) => row.count > 0);

  const nationBase = knownNationalities > 0 ? knownNationalities : players.length;
  const nationalities = [...nationalityMap.entries()]
    .map(([name, count]) => ({
      name,
      count,
      pct: nationBase > 0 ? Math.round((count / nationBase) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));


  const recentResults = finished.slice(0, 12) as DossierMatch[];
  const form: FormLetter[] = [];
  const formTrail: FormEntry[] = [];
  for (const match of finished) {
    if (form.length >= 5) break;
    if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') continue;
    const letter = resultLetter(match, teamId);
    if (!letter) continue;
    const isHome = match.homeTeamId === teamId;
    const opponent = isHome ? match.awayTeam : match.homeTeam;
    form.push(letter);
    formTrail.push({
      letter,
      matchId: match.id,
      opponent,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      isHome,
      kickoffAt: match.kickoffAt,
    });
  }

  const stats = emptySplit();
  const homeStats = emptySplit();
  const awayStats = emptySplit();
  const competitionMap = new Map<
    string,
    { id: string; name: string; slug: string; logoUrl: string | null; country: string | null; matches: number }
  >();

  for (const match of finished) {
    if (typeof match.homeScore !== 'number' || typeof match.awayScore !== 'number') continue;
    const isHome = match.homeTeamId === teamId;
    const gf = isHome ? match.homeScore : match.awayScore;
    const ga = isHome ? match.awayScore : match.homeScore;
    applyResult(stats, gf, ga);
    applyResult(isHome ? homeStats : awayStats, gf, ga);

    const existing = competitionMap.get(match.league.id);
    if (existing) existing.matches += 1;
    else {
      competitionMap.set(match.league.id, {
        id: match.league.id,
        name: match.league.name,
        slug: match.league.slug,
        logoUrl: match.league.logoUrl,
        country: match.league.country,
        matches: 1,
      });
    }
  }

  for (const match of [...upcoming, ...liveMatches]) {
    const existing = competitionMap.get(match.league.id);
    if (existing) existing.matches += 1;
    else {
      competitionMap.set(match.league.id, {
        id: match.league.id,
        name: match.league.name,
        slug: match.league.slug,
        logoUrl: match.league.logoUrl,
        country: match.league.country,
        matches: 1,
      });
    }
  }

  const competitions = [...competitionMap.values()].sort((a, b) => b.matches - a.matches);

  const scorerMap = new Map<string, Contributor>();
  const assistMap = new Map<string, Contributor>();
  const cardMap = new Map<string, Contributor>();
  let yellowTotal = 0;
  let redTotal = 0;

  for (const event of teamEvents) {
    if (event.type === 'GOAL' || event.type === 'PENALTY') {
      const name = event.player?.name || event.playerName;
      if (name) {
        const key = event.playerId || event.player?.slug || name;
        const current = scorerMap.get(key);
        if (current) current.goals = (current.goals || 0) + 1;
        else {
          scorerMap.set(key, {
            goals: 1,
            name,
            slug: event.player?.slug ?? null,
            photoUrl: event.player?.photoUrl ?? null,
          });
        }
      }
      if (event.assistName) {
        const key = event.assistName;
        const current = assistMap.get(key);
        if (current) current.assists = (current.assists || 0) + 1;
        else {
          assistMap.set(key, {
            assists: 1,
            name: event.assistName,
            slug: null,
            photoUrl: null,
          });
        }
      }
    }
    if (event.type === 'YELLOW_CARD' || event.type === 'RED_CARD') {
      if (event.type === 'YELLOW_CARD') yellowTotal += 1;
      else redTotal += 1;
      const name = event.player?.name || event.playerName;
      if (!name) continue;
      const key = event.playerId || event.player?.slug || name;
      const current = cardMap.get(key) || {
        name,
        slug: event.player?.slug ?? null,
        photoUrl: event.player?.photoUrl ?? null,
        yellow: 0,
        red: 0,
      };
      if (event.type === 'YELLOW_CARD') current.yellow = (current.yellow || 0) + 1;
      else current.red = (current.red || 0) + 1;
      cardMap.set(key, current);
    }
  }

  const scorers = [...scorerMap.values()].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 8);
  const assisters = [...assistMap.values()].sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 6);
  const disciplinePlayers = [...cardMap.values()]
    .sort((a, b) => (b.yellow || 0) + (b.red || 0) * 2 - ((a.yellow || 0) + (a.red || 0) * 2))
    .slice(0, 6);

  const news = newsRows
    .filter((row): row is typeof row & { publishedAt: Date } => Boolean(row.publishedAt))
    .map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      shortTitle: row.shortTitle ?? undefined,
      excerpt: row.excerpt ?? undefined,
      featuredImage: row.featuredImage ?? undefined,
      category: row.category,
      publishedAt: row.publishedAt,
      isPremium: row.isPremium,
      featured: row.featured,
      breaking: row.breaking,
      readingTime: row.readingTime || undefined,
      views: row.views || undefined,
      sourceName: row.sourceName ?? undefined,
    }));

  const venueName = teamRow.venue?.name || apiProfile?.venue?.name;
  const venue = venueName
    ? {
      name: venueName,
      city: teamRow.venue?.city || apiProfile?.venue?.city || null,
      capacity: teamRow.venue?.capacity || apiProfile?.venue?.capacity || null,
      surface: apiProfile?.venue?.surface || null,
      imageUrl: apiProfile?.venue?.image || null,
      address: apiProfile?.venue?.address || null,
    }
    : null;

  const team = {
    id: teamRow.id,
    externalId: teamRow.externalId,
    name: teamRow.name,
    slug: teamRow.slug,
    logoUrl: teamRow.logoUrl || apiProfile?.logoUrl || null,
    code: apiProfile?.code || null,
    founded: teamRow.founded || apiProfile?.founded || null,
    country: apiProfile?.country || standingRow?.league.country || competitions[0]?.country || null,
    bio: teamRow.bio,
    venue,
    coach: teamRow.coach
      ? {
        id: teamRow.coach.id,
        slug: slugifyCoachName(teamRow.coach.name, teamRow.coach.id),
        name: teamRow.coach.name,
        photoUrl: teamRow.coach.photoUrl,
        nationality: teamRow.coach.nationality,
        bio: teamRow.coach.bio,
        birthDate: teamRow.coach.birthDate,
        trophies: teamRow.coach.trophies,
        career: parseCareer(teamRow.coach.careerHistory).slice(0, 6),
      }
      : null,
  };

  const upcomingTyped = upcoming as DossierMatch[];
  const liveTyped = liveMatches as DossierMatch[];

  return {
    team,
    squad,
    squadCount: players.length,
    squadAges,
    squadComposition,
    nationalities,
    liveMatches: liveTyped,
    upcoming: upcomingTyped,
    recentResults,
    nextMatch: liveTyped[0] || upcomingTyped[0] || null,
    form,
    formTrail,
    standing: standingRow,
    stats: {
      ...stats,
      goalDiff: stats.goalsFor - stats.goalsAgainst,
      winPct: stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : null,
    },
    homeStats,
    awayStats,
    competitions,
    scorers,
    assisters,
    discipline: {
      yellow: yellowTotal,
      red: redTotal,
      players: disciplinePlayers,
    },
    transfers,
    news,
  };
});
