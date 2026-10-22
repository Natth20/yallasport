import { reportCaughtError } from '@/lib/ops/caught';
import { cache } from 'react';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { sportsData } from '@/lib/sports-data';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { NormalizedMatch } from '@/lib/sports-data/types';
import { enrichTeamDossier } from '@/lib/teams/enrich-dossier';

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
  league: { select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, country: true } },
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
  league: { id: string; externalId?: string; name: string; slug: string; logoUrl: string | null; country: string | null };
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
    league: { id: string; externalId?: string; name: string; slug: string; logoUrl: string | null; country: string | null };
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
  seasonSlice: SeasonSlice | null;
  tableWindow: Array<{
    rank: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    team: { id: string; name: string; slug: string; logoUrl: string | null };
    isUs: boolean;
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
  availableSeasons?: string[];
  selectedSeason?: string;
  selectedLeagueSlug?: string;
  sectionStatus?: {
    overview: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    fixtures: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    standings: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    stats: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    squad: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    transfers: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
    news: 'AVAILABLE' | 'UNAVAILABLE' | 'PENDING' | 'STALE' | 'ERROR';
  };
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

  const data = await soft(
    () => sportsData.getRaw<{
      response?: Array<{ player?: { id?: number; nationality?: string } }>;
    }>(`/players?team=${encodeURIComponent(teamExternalId)}&season=${season}&page=1`),
    null
  );

  for (const row of data?.response || []) {
    const id = row.player?.id != null ? String(row.player.id) : '';
    const nation = row.player?.nationality?.trim();
    if (id && nation) byExternal.set(id, nation);
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

  // Non-blocking background persistence
  Promise.resolve().then(async () => {
    for (const patch of patches.slice(0, 15)) {
      try {
        await prisma.player.update({
          where: { id: patch.id },
          data: { nationality: patch.nationality },
        });
      } catch { }
    }
  }).catch(() => null);

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
  Promise.resolve().then(async () => {
    try {
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
        } catch { }
      }
    } catch { }
  }).catch(() => null);
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

const teamRowSelect = {
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
      slug: true,
      name: true,
      photoUrl: true,
      nationality: true,
      bio: true,
      birthDate: true,
      careerHistory: true,
      trophies: {
        orderBy: { season: 'desc' as const },
        take: 8,
        select: { title: true, season: true, teamName: true },
      },
    },
  },
} as const;

export type TeamSelectedRow = {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  founded: number | null;
  bio: string | null;
  venue: {
    name: string;
    city: string | null;
    capacity: number | null;
  } | null;
  coach: {
    id: string;
    slug: string | null;
    name: string;
    photoUrl: string | null;
    nationality: string | null;
    bio: string | null;
    birthDate: Date | null;
    careerHistory: Prisma.JsonValue;
    trophies: Array<{
      title: string;
      season: string;
      teamName: string | null;
    }>;
  } | null;
};

export async function findTeamRowBySlug(slug: string): Promise<TeamSelectedRow | null> {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug).trim();
    } catch {
      return slug.trim();
    }
  })();
  if (!decoded) return null;

  const tail = decoded.match(/(\d{2,})$/)?.[1] ?? null;
  const nameGuess = decoded.replace(/-\d+$/, '').replace(/-/g, ' ').trim();

  const exact = await soft(
    () =>
      prisma.team.findFirst({
        where: {
          OR: [
            { slug: decoded },
            { slug },
            ...(tail ? [{ externalId: tail }, { slug: { endsWith: `-${tail}` } }] : []),
          ],
        },
        select: teamRowSelect,
      }),
    null
  );
  if (exact) return exact as unknown as TeamSelectedRow;

  const candidates = await soft(
    () =>
      prisma.team.findMany({
        where: {
          OR: [
            { slug: { startsWith: `${decoded}-`, mode: 'insensitive' } },
            { slug: { equals: decoded, mode: 'insensitive' } },
            { name: { equals: decoded, mode: 'insensitive' } },
            { name: { startsWith: decoded, mode: 'insensitive' } },
            ...(nameGuess.length >= 3 ? [
              { name: { contains: nameGuess, mode: 'insensitive' as const } },
              { slug: { startsWith: nameGuess.replace(/\s+/g, '-'), mode: 'insensitive' as const } },
            ] : []),
          ],
        },
        take: 12,
        select: teamRowSelect,
      }),
    []
  );
  if (candidates.length === 0) return null;
  const named = candidates.find((row) => row.name.toLowerCase() === decoded.toLowerCase() || (nameGuess && row.name.toLowerCase().includes(nameGuess.toLowerCase())));
  if (named) return named as unknown as TeamSelectedRow;
  const sorted = [...candidates].sort((a, b) => a.slug.length - b.slug.length);
  return (sorted[0] as unknown as TeamSelectedRow) ?? null;
}

type ApiSquadEntry = {
  id: number;
  name: string;
  age?: number;
  number?: number | null;
  position?: string;
  photo?: string;
};

async function hydrateSquadFromApi(teamId: string, teamExternalId: string): Promise<SquadPlayerRow[]> {
  const data = await soft(
    () => sportsData.getRaw<{
      response?: Array<{ players?: ApiSquadEntry[] }>;
    }>(`/players/squads?team=${encodeURIComponent(teamExternalId)}`),
    null
  );
  const list = data?.response?.[0]?.players ?? [];
  if (list.length === 0) return [];

  const rows: SquadPlayerRow[] = list.map((entry) => {
    const externalId = String(entry.id);
    const slug = `${slugifyName(entry.name) || 'player'}-${externalId}`;
    return {
      id: `${externalId}-${teamId}`,
      shirtNumber: entry.number ?? null,
      player: {
        id: `api-p-${externalId}`,
        externalId,
        name: entry.name,
        slug,
        photoUrl: apiSportsPlayerPhoto(externalId, entry.photo),
        position: entry.position ?? null,
        nationality: null,
        birthDate: null,
      },
    };
  });

  // Background non-blocking persistence
  Promise.resolve().then(async () => {
    for (const entry of list.slice(0, 20)) {
      try {
        const externalId = String(entry.id);
        const slug = `${slugifyName(entry.name) || 'player'}-${externalId}`;
        const p = await prisma.player.upsert({
          where: { externalId },
          create: {
            externalId,
            name: entry.name,
            slug,
            photoUrl: apiSportsPlayerPhoto(externalId, entry.photo),
            position: entry.position ?? null,
          },
          update: {},
          select: { id: true },
        });
        const existing = await prisma.playerTeam.findFirst({
          where: { playerId: p.id, teamId, to: null },
          select: { id: true },
        });
        if (!existing) {
          await prisma.playerTeam.create({
            data: { playerId: p.id, teamId, shirtNumber: entry.number ?? null },
          });
        }
      } catch { }
    }
  }).catch(() => null);

  return rows;
}

type ApiCoachRow = {
  id?: number;
  name?: string;
  photo?: string;
  nationality?: string;
  birth?: { date?: string };
  career?: Array<{ team?: { name?: string }; start?: string; end?: string }>;
};

async function fetchCoachFromApi(teamExternalId: string) {
  const data = await sportsData.getRaw<{ response?: ApiCoachRow[] }>(
    `/coachs?team=${encodeURIComponent(teamExternalId)}`
  );
  const row = data?.response?.[0];
  if (!row?.name) return null;
  const career = (row.career || [])
    .filter((stint) => stint.team?.name)
    .slice(0, 8)
    .map((stint) => ({
      club: stint.team!.name!,
      from: stint.start,
      to: stint.end || undefined,
    }));
  return {
    id: row.id != null ? String(row.id) : `api-${slugifyName(row.name)}`,
    slug: slugifyCoachName(row.name, row.id != null ? String(row.id) : 'api'),
    name: row.name,
    photoUrl: apiSportsCoachPhoto(row.id != null ? String(row.id) : null, row.photo),
    nationality: row.nationality ?? null,
    bio: null,
    birthDate: row.birth?.date ? new Date(row.birth.date) : null,
    trophies: [] as Array<{ title: string; season: string; teamName: string | null }>,
    career,
  };
}

export type SeasonSlice = {
  form?: string;
  cleanSheets?: number;
  failedToScore?: number;
  biggestWin?: string;
  biggestLoss?: string;
  formations: Array<{ formation: string; played: number }>;
};

async function fetchSeasonSlice(
  teamExternalId: string,
  leagueExternalId: string | undefined,
  season: string
): Promise<SeasonSlice | null> {
  if (!leagueExternalId) return null;
  const data = await sportsData.getRaw<{
    response?: {
      form?: string;
      fixtures?: { played?: { total?: number } };
      goals?: { for?: { total?: { total?: number } }; against?: { total?: { total?: number } } };
      clean_sheet?: { total?: number };
      failed_to_score?: { total?: number };
      biggest?: {
        wins?: { home?: string | null; away?: string | null };
        loses?: { home?: string | null; away?: string | null };
      };
      lineups?: Array<{ formation?: string; played?: number }>;
    };
  }>(
    `/teams/statistics?league=${encodeURIComponent(leagueExternalId)}&season=${encodeURIComponent(season)}&team=${encodeURIComponent(teamExternalId)}`
  );
  const row = data?.response;
  if (!row) return null;
  const wins = [row.biggest?.wins?.home, row.biggest?.wins?.away].filter(Boolean) as string[];
  const losses = [row.biggest?.loses?.home, row.biggest?.loses?.away].filter(Boolean) as string[];
  const formations = (row.lineups || [])
    .filter((item): item is { formation: string; played: number } => Boolean(item.formation && item.played))
    .sort((a, b) => b.played - a.played)
    .slice(0, 4);
  const hasAnything =
    Boolean(row.form) ||
    typeof row.clean_sheet?.total === 'number' ||
    typeof row.failed_to_score?.total === 'number' ||
    wins.length > 0 ||
    losses.length > 0 ||
    formations.length > 0;
  if (!hasAnything) return null;
  return {
    form: row.form || undefined,
    cleanSheets: row.clean_sheet?.total,
    failedToScore: row.failed_to_score?.total,
    biggestWin: wins[0],
    biggestLoss: losses[0],
    formations,
  };
}

type ApiTransferRow = {
  player?: { id?: number; name?: string };
  update?: string;
  transfers?: Array<{
    date?: string;
    type?: string;
    teams?: { in?: { name?: string }; out?: { name?: string } };
  }>;
};

async function fetchTransfersFromApi(teamExternalId: string) {
  const data = await sportsData.getRaw<{ response?: ApiTransferRow[] }>(
    `/transfers?team=${encodeURIComponent(teamExternalId)}`
  );
  const rows = data?.response ?? [];
  return rows
    .map((row, index) => {
      const move = row.transfers?.[0];
      if (!row.player?.name || !move?.date) return null;
      return {
        id: `api-${row.player.id ?? index}-${move.date}`,
        date: new Date(move.date),
        fee: move.type ?? null,
        fromTeam: move.teams?.out?.name ?? null,
        toTeam: move.teams?.in?.name ?? null,
        player: {
          name: row.player.name,
          slug: row.player.id ? `${slugifyName(row.player.name)}-${row.player.id}` : slugifyName(row.player.name),
          photoUrl: null,
        },
      };
    })
    .filter(Boolean)
    .slice(0, 8) as TeamDossierData['transfers'];
}

const teamDossierMemoryCache = new Map<string, { at: number; data: TeamDossierData }>();

export const loadTeamDossier = cache(async function loadTeamDossier(
  slug: string,
  options?: { season?: string; leagueSlug?: string }
): Promise<TeamDossierData | null> {
  const cacheKey = `${slug}:${options?.season || ''}:${options?.leagueSlug || ''}`;
  const cached = teamDossierMemoryCache.get(cacheKey);
  if (cached && Date.now() - cached.at < 15 * 60 * 1000) {
    return cached.data;
  }

  const teamRow = await findTeamRowBySlug(slug);

  if (!teamRow) return null;

  const teamId = teamRow.id;
  const now = new Date();

  const [matchSeasons, standingSeasons] = await Promise.all([
    soft(
      () =>
        prisma.match.findMany({
          where: { OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }] },
          select: { seasonId: true },
          distinct: ['seasonId'],
          orderBy: { seasonId: 'desc' },
          take: 10,
        }),
      []
    ),
    soft(
      () =>
        prisma.standing.findMany({
          where: { teamId },
          select: { seasonId: true },
          distinct: ['seasonId'],
          orderBy: { seasonId: 'desc' },
          take: 10,
        }),
      []
    ),
  ]);

  const seasonSet = new Set<string>();
  const currentFootballYear = footballSeason(now);
  seasonSet.add(String(currentFootballYear));
  seasonSet.add(String(currentFootballYear - 1));
  for (const s of matchSeasons) {
    if (s.seasonId) seasonSet.add(s.seasonId);
  }
  for (const s of standingSeasons) {
    if (s.seasonId) seasonSet.add(s.seasonId);
  }
  const availableSeasons = Array.from(seasonSet).sort((a, b) => b.localeCompare(a));
  const activeSeason = options?.season || availableSeasons[0] || String(currentFootballYear);

  const matchLeagueFilter = options?.leagueSlug ? { league: { slug: options.leagueSlug } } : {};
  const finishedMatchWhere = {
    OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    status: 'FINISHED' as const,
    ...(options?.season ? { seasonId: options.season } : {}),
    ...matchLeagueFilter,
  };
  const upcomingMatchWhere = {
    OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    status: 'NOT_STARTED' as const,
    kickoffAt: { gte: now },
    ...matchLeagueFilter,
  };
  const liveMatchWhere = {
    OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    status: { in: ['LIVE' as const, 'HALFTIME' as const] },
    kickoffAt: { gte: liveKickoffFloor() },
    ...matchLeagueFilter,
  };
  const standingWhere = {
    teamId,
    ...(options?.season ? { seasonId: options.season } : {}),
    ...matchLeagueFilter,
  };

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
              where: finishedMatchWhere,
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
              where: upcomingMatchWhere,
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
              where: liveMatchWhere,
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
              where: standingWhere,
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
                  select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, country: true },
                },
              },
            }),
          null
        ),
      () =>
        soft(
          async () => {
            const specific = await prisma.news.findMany({
              where: {
                status: 'PUBLISHED',
                OR: [
                  { title: { contains: teamRow.name, mode: 'insensitive' } },
                  { content: { contains: teamRow.name, mode: 'insensitive' } },
                  { tags: { has: teamRow.name } },
                  {
                    entityLinks: {
                      some: { entityType: 'TEAM', entityId: teamId },
                    },
                  },
                ],
              },
              orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
              take: 6,
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
            });
            if (specific.length >= 6) return specific;
            const fallback = await prisma.news.findMany({
              where: {
                status: 'PUBLISHED',
                id: { notIn: specific.map((s) => s.id) },
              },
              orderBy: [{ featured: 'desc' }, { publishedAt: 'desc' }],
              take: 6 - specific.length,
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
            });
            return [...specific, ...fallback];
          },
          []
        ),
      () =>
        soft(
          () =>
            prisma.matchEvent.findMany({
              where: {
                type: { in: ['GOAL', 'PENALTY', 'YELLOW_CARD', 'RED_CARD'] },
                teamId: teamRow.externalId,
              },
              take: 120,
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
      () =>
        Promise.race([
          soft(() => fetchTeamProfileFromApi(teamRow.externalId), null),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
        ]),
      () =>
        soft(
          () =>
            prisma.transfer.findMany({
              where: {
                OR: [
                  { toTeam: { contains: teamRow.name, mode: 'insensitive' } },
                  { fromTeam: { contains: teamRow.name, mode: 'insensitive' } },
                ],
              },
              orderBy: { date: 'desc' },
              take: 10,
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
              where: finishedMatchWhere,
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
              where: upcomingMatchWhere,
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
              where: liveMatchWhere,
              orderBy: { kickoffAt: 'asc' },
              take: 4,
              select: matchSelect,
            }),
          liveMatches
        ),
    ]);
  }

  if (isLiveSportsApi()) {
    const missingPhotos = (players as SquadPlayerRow[]).some((row) => !row.player.photoUrl);
    if (players.length === 0 || missingPhotos) {
      const apiSquad = await soft(() => hydrateSquadFromApi(teamId, teamRow.externalId), []);
      if (apiSquad.length > 0) {
        const byExternal = new Map(apiSquad.map((row) => [row.player.externalId, row]));
        if (players.length === 0) {
          players = apiSquad;
        } else {
          players = (players as SquadPlayerRow[]).map((row) => {
            const hit = byExternal.get(row.player.externalId);
            return {
              ...row,
              shirtNumber: row.shirtNumber ?? hit?.shirtNumber ?? null,
              player: {
                ...row.player,
                photoUrl: apiSportsPlayerPhoto(row.player.externalId, hit?.player.photoUrl || row.player.photoUrl),
                position: row.player.position || hit?.player.position || null,
              },
            };
          });
          for (const row of apiSquad) {
            if (!(players as SquadPlayerRow[]).some((item) => item.player.externalId === row.player.externalId)) {
              (players as SquadPlayerRow[]).push(row);
            }
          }
        }
      }
    }
  }

  players = (players as SquadPlayerRow[]).map((row) => ({
    ...row,
    player: {
      ...row.player,
      photoUrl: apiSportsPlayerPhoto(row.player.externalId, row.player.photoUrl),
    },
  }));

  players = await soft(
    () => hydrateSquadNationalities(teamRow.externalId, players as SquadPlayerRow[]),
    players as SquadPlayerRow[]
  );

  const leagueHint =
    standingRow?.league.externalId ||
    (finished[0] as DossierMatch | undefined)?.league.externalId ||
    (upcoming[0] as DossierMatch | undefined)?.league.externalId;
  const seasonHint = options?.season || standingRow?.seasonId || activeSeason;

  let apiStanding = standingRow;
  if (!apiStanding && leagueHint && isLiveSportsApi()) {
    const table = await soft(() => sportsData.getStandings(leagueHint, seasonHint), []);
    const hit = table.find((row) => row.team.externalId === teamRow.externalId || row.team.name === teamRow.name);
    if (hit) {
      apiStanding = {
        rank: hit.rank,
        played: hit.played,
        won: hit.won,
        drawn: hit.drawn,
        lost: hit.lost,
        goalsFor: hit.goalsFor,
        goalsAgainst: hit.goalsAgainst,
        points: hit.points,
        seasonId: seasonHint,
        league: standingRow?.league || {
          id: (finished[0] as DossierMatch | undefined)?.league.id || leagueHint,
          externalId: leagueHint,
          name: (finished[0] as DossierMatch | undefined)?.league.name || '',
          slug: (finished[0] as DossierMatch | undefined)?.league.slug || '',
          logoUrl: (finished[0] as DossierMatch | undefined)?.league.logoUrl || null,
          country: (finished[0] as DossierMatch | undefined)?.league.country || null,
        },
      };
    }
  }

  const [seasonSlice, apiTransfers, apiCoach] = isLiveSportsApi()
    ? await Promise.all([
      Promise.race([
        soft(() => fetchSeasonSlice(teamRow.externalId, leagueHint, seasonHint), null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]),
      transfers.length === 0
        ? Promise.race([
          soft(() => fetchTransfersFromApi(teamRow.externalId), []),
          new Promise<TeamDossierData['transfers']>((resolve) => setTimeout(() => resolve([]), 2000)),
        ])
        : Promise.resolve([]),
      Promise.race([
        soft(() => fetchCoachFromApi(teamRow.externalId), null),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 2000)),
      ]),
    ])
    : [null, [], null];

  if (transfers.length === 0 && apiTransfers.length > 0) {
    transfers = apiTransfers;
  }

  const neighborRows = standingRow
    ? await soft(
      () =>
        prisma.standing.findMany({
          where: { leagueId: standingRow.league.id, seasonId: standingRow.seasonId },
          orderBy: { rank: 'asc' },
          take: 40,
          select: {
            rank: true,
            points: true,
            played: true,
            won: true,
            drawn: true,
            lost: true,
            goalsFor: true,
            goalsAgainst: true,
            teamId: true,
            team: { select: { id: true, name: true, slug: true, logoUrl: true } },
          },
        }),
      []
    )
    : [];
  const focusRank = apiStanding?.rank;
  const tableWindow = neighborRows
    .filter((row) => {
      if (typeof focusRank !== 'number') return row.rank <= 8;
      return row.rank >= Math.max(1, focusRank - 2) && row.rank <= focusRank + 2;
    })
    .map((row) => ({
      rank: row.rank,
      points: row.points,
      played: row.played,
      won: row.won,
      drawn: row.drawn,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      team: row.team,
      isUs: row.teamId === teamId,
    }));

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

  const normStr = (s?: string | null) =>
    (s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

  const matchSquadPlayer = (rawName?: string | null) => {
    if (!rawName) return null;
    const target = normStr(rawName);
    if (!target) return null;
    for (const row of players as SquadPlayerRow[]) {
      const pNorm = normStr(row.player.name);
      if (pNorm === target || pNorm.includes(target) || target.includes(pNorm)) {
        return row.player;
      }
    }
    const parts = rawName.split(/\s+/).filter(Boolean);
    const last = normStr(parts[parts.length - 1]);
    if (last && last.length >= 3) {
      for (const row of players as SquadPlayerRow[]) {
        const pNorm = normStr(row.player.name);
        if (pNorm.includes(last)) return row.player;
      }
    }
    return null;
  };

  const scorerMap = new Map<string, Contributor>();
  const assistMap = new Map<string, Contributor>();
  const cardMap = new Map<string, Contributor>();
  let yellowTotal = 0;
  let redTotal = 0;

  for (const event of teamEvents) {
    if (event.type === 'GOAL' || event.type === 'PENALTY') {
      const name = event.player?.name || event.playerName;
      if (name) {
        const hit = matchSquadPlayer(name);
        const slug = event.player?.slug || hit?.slug || null;
        const photoUrl = event.player?.photoUrl || hit?.photoUrl || (hit?.externalId ? apiSportsPlayerPhoto(hit.externalId) : null);
        const resolvedName = hit?.name || event.player?.name || name;
        const key = event.playerId || slug || resolvedName;
        const current = scorerMap.get(key);
        if (current) current.goals = (current.goals || 0) + 1;
        else {
          scorerMap.set(key, {
            goals: 1,
            name: resolvedName,
            slug,
            photoUrl,
          });
        }
      }
      if (event.assistName) {
        const hit = matchSquadPlayer(event.assistName);
        const slug = hit?.slug || null;
        const photoUrl = hit?.photoUrl || (hit?.externalId ? apiSportsPlayerPhoto(hit.externalId) : null);
        const resolvedName = hit?.name || event.assistName;
        const key = slug || resolvedName;
        const current = assistMap.get(key);
        if (current) current.assists = (current.assists || 0) + 1;
        else {
          assistMap.set(key, {
            assists: 1,
            name: resolvedName,
            slug,
            photoUrl,
          });
        }
      }
    }
    if (event.type === 'YELLOW_CARD' || event.type === 'RED_CARD') {
      if (event.type === 'YELLOW_CARD') yellowTotal += 1;
      else redTotal += 1;
      const name = event.player?.name || event.playerName;
      if (!name) continue;
      const hit = matchSquadPlayer(name);
      const slug = event.player?.slug || hit?.slug || null;
      const photoUrl = event.player?.photoUrl || hit?.photoUrl || (hit?.externalId ? apiSportsPlayerPhoto(hit.externalId) : null);
      const resolvedName = hit?.name || event.player?.name || name;
      const key = event.playerId || slug || resolvedName;
      const current = cardMap.get(key) || {
        name: resolvedName,
        slug,
        photoUrl,
        yellow: 0,
        red: 0,
      };
      if (event.type === 'YELLOW_CARD') current.yellow = (current.yellow || 0) + 1;
      else current.red = (current.red || 0) + 1;
      cardMap.set(key, current);
    }
  }

  // Fallback DB lookup for any top scorer/assister still lacking photos
  const missingPhotoContributors = [...scorerMap.values(), ...assistMap.values()].filter(
    (c) => !c.photoUrl && c.name
  );
  if (missingPhotoContributors.length > 0) {
    const extraRows = await soft(
      () =>
        prisma.player.findMany({
          where: {
            OR: missingPhotoContributors.map((c) => {
              const lastToken = c.name.split(/\s+/).pop() || c.name;
              return { name: { contains: lastToken, mode: 'insensitive' } };
            }),
          },
          select: { name: true, slug: true, photoUrl: true, externalId: true },
          take: 12,
        }),
      []
    );
    for (const ep of extraRows) {
      const epNorm = normStr(ep.name);
      for (const item of [...scorerMap.values(), ...assistMap.values()]) {
        if (!item.photoUrl && item.name) {
          const itemNorm = normStr(item.name);
          if (itemNorm.includes(epNorm) || epNorm.includes(itemNorm)) {
            item.slug = item.slug || ep.slug;
            item.photoUrl = ep.photoUrl || (ep.externalId ? apiSportsPlayerPhoto(ep.externalId) : null);
          }
        }
      }
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

  const KNOWN_VENUE_DATA: Record<
    string,
    { name: string; image: string; surface: string; capacity: number; address: string; city: string }
  > = {
    '541': {
      name: 'Santiago Bernabéu',
      image: 'https://media.api-sports.io/football/venues/1456.png',
      surface: 'Grass (Hybrid)',
      capacity: 81044,
      address: 'Av. de Concha Espina, 1, 28036 Madrid',
      city: 'Madrid',
    },
    '529': {
      name: 'Spotify Camp Nou',
      image: 'https://media.api-sports.io/football/venues/1454.png',
      surface: 'Grass',
      capacity: 99354,
      address: "Carrer d'Aristides Maillol, 12, 08028 Barcelona",
      city: 'Barcelona',
    },
    '530': {
      name: 'Cívitas Metropolitano',
      image: 'https://media.api-sports.io/football/venues/1457.png',
      surface: 'Grass',
      capacity: 70460,
      address: 'Av. de Luis Aragonés, 4, 28022 Madrid',
      city: 'Madrid',
    },
    '50': {
      name: 'Etihad Stadium',
      image: 'https://media.api-sports.io/football/venues/555.png',
      surface: 'Grass',
      capacity: 53400,
      address: 'Ashton New Rd, Manchester M11 3FF',
      city: 'Manchester',
    },
    '40': {
      name: 'Anfield',
      image: 'https://media.api-sports.io/football/venues/550.png',
      surface: 'Grass',
      capacity: 61276,
      address: 'Anfield Rd, Liverpool L4 0TH',
      city: 'Liverpool',
    },
    '42': {
      name: 'Emirates Stadium',
      image: 'https://media.api-sports.io/football/venues/494.png',
      surface: 'Grass',
      capacity: 60704,
      address: 'Hornsey Rd, London N7 7AJ',
      city: 'London',
    },
    '33': {
      name: 'Old Trafford',
      image: 'https://media.api-sports.io/football/venues/556.png',
      surface: 'Grass',
      capacity: 74310,
      address: 'Sir Matt Busby Way, Old Trafford, Manchester M16 0RA',
      city: 'Manchester',
    },
    '49': {
      name: 'Stamford Bridge',
      image: 'https://media.api-sports.io/football/venues/519.png',
      surface: 'Grass',
      capacity: 40343,
      address: 'Fulham Rd., London SW6 1HS',
      city: 'London',
    },
    '157': {
      name: 'Allianz Arena',
      image: 'https://media.api-sports.io/football/venues/700.png',
      surface: 'Grass',
      capacity: 75024,
      address: 'Werner-Heisenberg-Allee 25, 80939 München',
      city: 'München',
    },
    '85': {
      name: 'Parc des Princes',
      image: 'https://media.api-sports.io/football/venues/671.png',
      surface: 'Grass',
      capacity: 47929,
      address: '24 Rue du Commandant Guilbaud, 75016 Paris',
      city: 'Paris',
    },
    '505': {
      name: 'San Siro (Giuseppe Meazza)',
      image: 'https://media.api-sports.io/football/venues/910.png',
      surface: 'Grass',
      capacity: 75817,
      address: 'Piazzale Angelo Moratti, 20151 Milano',
      city: 'Milano',
    },
    '489': {
      name: 'San Siro',
      image: 'https://media.api-sports.io/football/venues/910.png',
      surface: 'Grass',
      capacity: 75817,
      address: 'Piazzale Angelo Moratti, 20151 Milano',
      city: 'Milano',
    },
    '496': {
      name: 'Allianz Stadium',
      image: 'https://media.api-sports.io/football/venues/909.png',
      surface: 'Grass',
      capacity: 41507,
      address: 'Corso Gaetano Scirea, 50, 10151 Torino',
      city: 'Torino',
    },
    '2566': {
      name: 'Kingdom Arena',
      image: 'https://media.api-sports.io/football/venues/19894.png',
      surface: 'Grass',
      capacity: 30000,
      address: 'Hitteen, Riyadh 13516',
      city: 'Riyadh',
    },
    '2564': {
      name: 'Al-Awwal Park',
      image: 'https://media.api-sports.io/football/venues/19895.png',
      surface: 'Grass',
      capacity: 25000,
      address: 'King Saud University, Riyadh 12372',
      city: 'Riyadh',
    },
    '2565': {
      name: 'King Abdullah Sports City',
      image: 'https://media.api-sports.io/football/venues/1115.png',
      surface: 'Grass',
      capacity: 62241,
      address: 'King Abdullah Sports City, Jeddah 23737',
      city: 'Jeddah',
    },
  };

  function lookupVenueByName(name?: string | null) {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n.includes('bernabeu') || n.includes('برنابيو')) return KNOWN_VENUE_DATA['541'];
    if (n.includes('camp nou') || n.includes('كامب نو')) return KNOWN_VENUE_DATA['529'];
    if (n.includes('metropolitano') || n.includes('ميتروبوليتانو')) return KNOWN_VENUE_DATA['530'];
    if (n.includes('etihad') || n.includes('الاتحاد')) return KNOWN_VENUE_DATA['50'];
    if (n.includes('anfield') || n.includes('أنفيلد')) return KNOWN_VENUE_DATA['40'];
    if (n.includes('emirates') || n.includes('الإمارات')) return KNOWN_VENUE_DATA['42'];
    if (n.includes('old trafford') || n.includes('أولد ترافورد')) return KNOWN_VENUE_DATA['33'];
    if (n.includes('stamford') || n.includes('ستامفورد')) return KNOWN_VENUE_DATA['49'];
    if (n.includes('allianz arena') || n.includes('أليانز أرينا')) return KNOWN_VENUE_DATA['157'];
    if (n.includes('parc des princes') || n.includes('حديقة الأمراء')) return KNOWN_VENUE_DATA['85'];
    if (n.includes('san siro') || n.includes('meazza') || n.includes('سان سيرو')) return KNOWN_VENUE_DATA['505'];
    return null;
  }

  const knownVenue =
    KNOWN_VENUE_DATA[teamRow.externalId] ||
    lookupVenueByName(teamRow.venue?.name || apiProfile?.venue?.name);

  const venueName =
    teamRow.venue?.name ||
    apiProfile?.venue?.name ||
    knownVenue?.name ||
    (teamRow.name ? `ملعب ${teamRow.name} الدولي` : null);
  const venue = venueName
    ? {
      name: venueName,
      city: teamRow.venue?.city || apiProfile?.venue?.city || knownVenue?.city || null,
      capacity: teamRow.venue?.capacity || apiProfile?.venue?.capacity || knownVenue?.capacity || null,
      surface: apiProfile?.venue?.surface || knownVenue?.surface || 'Grass (Hybrid)',
      imageUrl: apiProfile?.venue?.image || knownVenue?.image || null,
      address: apiProfile?.venue?.address || knownVenue?.address || null,
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
        slug: teamRow.coach.slug || slugifyCoachName(teamRow.coach.name, apiCoach?.id || teamRow.coach.id),
        name: teamRow.coach.name,
        photoUrl: apiSportsCoachPhoto(
          apiCoach?.id || (teamRow.coach.slug ? teamRow.coach.slug.match(/(\d+)$/)?.[1] : null),
          apiCoach?.photoUrl || teamRow.coach.photoUrl
        ),
        nationality: teamRow.coach.nationality || apiCoach?.nationality || null,
        bio: teamRow.coach.bio,
        birthDate: teamRow.coach.birthDate || apiCoach?.birthDate || null,
        trophies: teamRow.coach.trophies,
        career: (parseCareer(teamRow.coach.careerHistory).length > 0
          ? parseCareer(teamRow.coach.careerHistory)
          : apiCoach?.career || []
        ).slice(0, 6),
      }
      : apiCoach,
  };

  const upcomingTyped = upcoming as DossierMatch[];
  const liveTyped = liveMatches as DossierMatch[];

  const sectionStatus: NonNullable<TeamDossierData['sectionStatus']> = {
    overview: 'AVAILABLE',
    fixtures: upcoming.length > 0 || finished.length > 0 ? 'AVAILABLE' : 'PENDING',
    standings: apiStanding ? 'AVAILABLE' : 'UNAVAILABLE',
    stats: stats.played > 0 ? 'AVAILABLE' : 'PENDING',
    squad: players.length > 0 ? 'AVAILABLE' : 'PENDING',
    transfers: transfers.length > 0 ? 'AVAILABLE' : 'UNAVAILABLE',
    news: news.length > 0 ? 'AVAILABLE' : 'PENDING',
  };

  const rawDossier: TeamDossierData = {
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
    standing: apiStanding,
    seasonSlice,
    tableWindow,
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
    availableSeasons,
    selectedSeason: options?.season || seasonHint,
    selectedLeagueSlug: options?.leagueSlug,
    sectionStatus,
  };

  const enriched = enrichTeamDossier(rawDossier);
  teamDossierMemoryCache.set(cacheKey, { at: Date.now(), data: enriched });
  if (teamDossierMemoryCache.size > 200) {
    const oldestKey = teamDossierMemoryCache.keys().next().value;
    if (typeof oldestKey === 'string') teamDossierMemoryCache.delete(oldestKey);
  }

  return enriched;
});
