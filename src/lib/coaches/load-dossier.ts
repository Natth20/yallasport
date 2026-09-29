import { cache } from 'react';
import { swallow } from '@/lib/ops/caught';
import { prisma } from '@/lib/prisma';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { sportsData } from '@/lib/sports-data';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';

export type CareerStint = {
  club: string;
  clubSlug?: string;
  clubLogo?: string | null;
  role?: string;
  from?: string;
  to?: string;
  matches?: number;
  winRate?: number;
};

export type CoachMatch = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  kickoffAt: Date;
  homeTeam: { name: string; logoUrl: string | null };
  awayTeam: { name: string; logoUrl: string | null };
  league: { name: string };
};

export type CoachTrophyRow = {
  id: string;
  title: string;
  season: string;
  teamName: string | null;
};

export type CoachSquadPlayer = {
  id: string;
  shirtNumber: number | null;
  player: {
    slug: string;
    name: string;
    photoUrl: string | null;
    position: string | null;
    age?: number | null;
  };
};

export type CoachDossierData = {
  coach: {
    id: string;
    slug: string;
    name: string;
    photoUrl: string | null;
    nationality: string | null;
    birthDate: Date | null;
    birthPlace?: string | null;
    height?: string | null;
    weight?: string | null;
    bio: string | null;
  };
  club: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    externalId?: string | null;
  } | null;
  squad: CoachSquadPlayer[];
  career: CareerStint[];
  trophies: CoachTrophyRow[];
  recentMatches: CoachMatch[];
  upcoming: CoachMatch[];
  news: Array<{
    id: string;
    slug: string;
    title: string;
    category: string;
    publishedAt: Date;
    sourceName?: string;
  }>;
};

function parseCareer(raw: unknown): CareerStint[] {
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
    .filter(Boolean) as CareerStint[];
}

type ApiCoach = {
  id?: number;
  name?: string;
  photo?: string;
  nationality?: string;
  birth?: { date?: string; place?: string; country?: string };
  team?: { id?: number; name?: string; logo?: string };
  height?: string;
  weight?: string;
  career?: Array<{ team?: { id?: number; name?: string; logo?: string }; start?: string; end?: string }>;
};

function apiIdFromSlug(slug: string) {
  return slug.match(/(\d{3,})$/)?.[1] ?? null;
}

function nameFromSlug(slug: string) {
  return slug
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .trim();
}

async function fetchCoachFromApi(apiId?: string | null, search?: string): Promise<ApiCoach | null> {
  if (!isLiveSportsApi()) return null;
  if (apiId) {
    const byId = await sportsData
      .getRaw<{ response?: ApiCoach[] }>(`/coachs?id=${encodeURIComponent(apiId)}`)
      .catch(swallow('src/lib/coaches/load-dossier.ts:coach-id', null));
    if (byId?.response?.[0]?.name) return byId.response[0];
  }
  if (search && search.length >= 3) {
    const bySearch = await sportsData
      .getRaw<{ response?: ApiCoach[] }>(`/coachs?search=${encodeURIComponent(search)}`)
      .catch(swallow('src/lib/coaches/load-dossier.ts:coach-search', null));
    const hit = bySearch?.response?.find((row) => row.name?.toLowerCase().includes(search.toLowerCase()));
    return hit || bySearch?.response?.[0] || null;
  }
  return null;
}

async function fetchTrophiesFromApi(apiId: string): Promise<CoachTrophyRow[]> {
  if (!isLiveSportsApi()) return [];
  const data = await sportsData
    .getRaw<{
      response?: Array<{ league?: string; country?: string; season?: string; place?: string }>;
    }>(`/trophies?coach=${encodeURIComponent(apiId)}`)
    .catch(swallow('src/lib/coaches/load-dossier.ts:trophies', null));
  return (data?.response || [])
    .filter((row) => row.league && row.season)
    .slice(0, 16)
    .map((row, index) => ({
      id: `api-${row.league}-${row.season}-${index}`,
      title: [row.league, row.place].filter(Boolean).join(' · '),
      season: row.season as string,
      teamName: row.country ?? null,
    }));
}

function careerFromApi(api: ApiCoach): CareerStint[] {
  return (api.career || [])
    .filter((stint) => stint.team?.name)
    .map((stint) => ({
      club: stint.team!.name!,
      clubLogo: stint.team?.logo ?? null,
      from: stint.start,
      to: stint.end || undefined,
    }));
}

const coachInclude = {
  currentTeam: { select: { id: true, name: true, slug: true, logoUrl: true, externalId: true } },
  team: { select: { id: true, name: true, slug: true, logoUrl: true, externalId: true } },
  trophies: { orderBy: { createdAt: 'desc' as const } },
} as const;

async function loadClubSquad(teamId: string, teamExternalId?: string | null): Promise<CoachSquadPlayer[]> {
  const rows = await prisma.playerTeam
    .findMany({
      where: { teamId, to: null },
      take: 48,
      orderBy: [{ shirtNumber: 'asc' }],
      select: {
        id: true,
        shirtNumber: true,
        player: {
          select: { slug: true, name: true, photoUrl: true, position: true, externalId: true, birthDate: true },
        },
      },
    })
    .catch(swallow('src/lib/coaches/load-dossier.ts:squad', []));

  if (rows.length > 0) {
    return rows.map((row) => ({
      id: row.id,
      shirtNumber: row.shirtNumber,
      player: {
        slug: row.player.slug,
        name: row.player.name,
        photoUrl: apiSportsPlayerPhoto(row.player.externalId, row.player.photoUrl),
        position: row.player.position,
        age: row.player.birthDate
          ? Math.floor((Date.now() - row.player.birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
      },
    }));
  }

  if (!teamExternalId || !isLiveSportsApi()) return [];
  const data = await sportsData
    .getRaw<{
      response?: Array<{
        players?: Array<{
          id?: number;
          name?: string;
          photo?: string;
          number?: number;
          position?: string;
          age?: number;
        }>;
      }>;
    }>(`/players/squads?team=${encodeURIComponent(teamExternalId)}`)
    .catch(swallow('src/lib/coaches/load-dossier.ts:squad-api', null));
  return (data?.response?.[0]?.players || []).slice(0, 48).map((entry, index) => {
    const externalId = entry.id != null ? String(entry.id) : null;
    return {
      id: `api-${externalId || index}`,
      shirtNumber: entry.number ?? null,
      player: {
        slug: `${(entry.name || 'player').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${externalId || index}`,
        name: entry.name || 'Player',
        photoUrl: apiSportsPlayerPhoto(externalId, entry.photo),
        position: entry.position ?? null,
        age: typeof entry.age === 'number' ? entry.age : null,
      },
    };
  });
}

export const loadCoachDossier = cache(async function loadCoachDossier(slug: string): Promise<CoachDossierData | null> {
  const decoded = (() => {
    try {
      return decodeURIComponent(slug).trim();
    } catch {
      return slug.trim();
    }
  })();
  if (!decoded) return null;

  const apiId = apiIdFromSlug(decoded);
  const guessedName = nameFromSlug(decoded);

  let row = await prisma.coach
    .findFirst({
      where: { OR: [{ slug: decoded }, { id: decoded }] },
      include: coachInclude,
    })
    .catch(swallow('src/lib/coaches/load-dossier.ts:find', null));

  if (!row && apiId) {
    row = await prisma.coach
      .findFirst({
        where: { slug: { endsWith: apiId } },
        include: coachInclude,
      })
      .catch(swallow('src/lib/coaches/load-dossier.ts:find-tail', null));
  }

  if (!row && guessedName.length >= 3) {
    const first = guessedName.split(/\s+/)[0];
    row = await prisma.coach
      .findFirst({
        where: { name: { contains: first, mode: 'insensitive' } },
        include: coachInclude,
      })
      .catch(swallow('src/lib/coaches/load-dossier.ts:find-name', null));
  }

  const api = await fetchCoachFromApi(apiId || (row ? apiIdFromSlug(row.slug || '') : null), guessedName || row?.name);
  if (!row && !api?.name) return null;

  const resolvedName = row?.name || api?.name || guessedName;
  const resolvedSlug = row?.slug || slugifyCoachName(resolvedName, apiId || row?.id || 'coach');
  const birthDate = row?.birthDate || (api?.birth?.date ? new Date(api.birth.date) : null);
  const birthPlace = [api?.birth?.place, api?.birth?.country].filter(Boolean).join(' · ') || null;
  const resolvedApiId = apiId || (api?.id != null ? String(api.id) : row ? apiIdFromSlug(row.slug || '') : null);
  const photoUrl = apiSportsCoachPhoto(resolvedApiId, row?.photoUrl || api?.photo || null);
  const nationality = row?.nationality || api?.nationality || null;
  const careerApi = api ? careerFromApi(api) : [];
  const careerDb = parseCareer(row?.careerHistory);
  const career = careerApi.length > 0 ? careerApi : careerDb;

  const clubName = row?.currentTeam?.name || row?.team?.name || api?.team?.name;
  let club = row?.currentTeam || row?.team || null;
  if (!club && clubName) {
    club = await prisma.team
      .findFirst({
        where: {
          OR: [
            { name: { equals: clubName, mode: 'insensitive' } },
            ...(api?.team?.id ? [{ externalId: String(api.team.id) }] : []),
          ],
        },
        select: { id: true, name: true, slug: true, logoUrl: true, externalId: true },
      })
      .catch(swallow('src/lib/coaches/load-dossier.ts:club', null));
  }

  if (!row && api?.name) {
    const created = await prisma.coach
      .create({
        data: {
          name: api.name,
          slug: slugifyCoachName(api.name, apiId || String(api.id || 'api')),
          photoUrl: apiSportsCoachPhoto(api.id != null ? String(api.id) : apiId, api.photo),
          nationality: api.nationality ?? null,
          birthDate,
          careerHistory: careerApi,
          currentTeamId: club?.id,
        },
        include: coachInclude,
      })
      .catch(swallow('src/lib/coaches/load-dossier.ts:create', null));
    if (created) row = created;
  } else if (row && api) {
    await prisma.coach
      .update({
        where: { id: row.id },
        data: {
          photoUrl: apiSportsCoachPhoto(resolvedApiId, row.photoUrl || api.photo) || undefined,
          nationality: row.nationality || api.nationality || undefined,
          birthDate: row.birthDate || birthDate || undefined,
          careerHistory: careerApi.length > 0 ? careerApi : undefined,
        },
      })
      .catch(swallow('src/lib/coaches/load-dossier.ts:patch', null));
  }

  const trophiesDb = (row?.trophies || []).map((trophy) => ({
    id: trophy.id,
    title: trophy.title,
    season: trophy.season,
    teamName: trophy.teamName,
  }));
  const trophiesApi = apiId ? await fetchTrophiesFromApi(apiId) : [];
  const trophies = trophiesDb.length > 0 ? trophiesDb : trophiesApi;

  const teamId = club?.id;
  const squad = teamId
    ? await loadClubSquad(teamId, club?.externalId || (api?.team?.id != null ? String(api.team.id) : null))
    : [];
  const [recentMatches, upcoming, news] = teamId
    ? await Promise.all([
      prisma.match
        .findMany({
          where: {
            OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
            status: 'FINISHED',
          },
          orderBy: { kickoffAt: 'desc' },
          take: 8,
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            kickoffAt: true,
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
            league: { select: { name: true } },
          },
        })
        .catch(swallow('src/lib/coaches/load-dossier.ts:recent', [])),
      prisma.match
        .findMany({
          where: {
            OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
            status: { in: ['NOT_STARTED', 'LIVE', 'HALFTIME'] },
            kickoffAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
          },
          orderBy: { kickoffAt: 'asc' },
          take: 4,
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            kickoffAt: true,
            homeTeam: { select: { name: true, logoUrl: true } },
            awayTeam: { select: { name: true, logoUrl: true } },
            league: { select: { name: true } },
          },
        })
        .catch(swallow('src/lib/coaches/load-dossier.ts:upcoming', [])),
      prisma.news
        .findMany({
          where: {
            status: 'PUBLISHED',
            OR: [{ title: { contains: resolvedName } }, { content: { contains: resolvedName } }],
          },
          orderBy: { publishedAt: 'desc' },
          take: 6,
          select: {
            id: true,
            slug: true,
            title: true,
            category: true,
            publishedAt: true,
            sourceName: true,
          },
        })
        .catch(swallow('src/lib/coaches/load-dossier.ts:news', [])),
    ])
    : [[], [], []];

  const publishedNews = news.filter((item): item is typeof item & { publishedAt: Date } => Boolean(item.publishedAt));

  return {
    coach: {
      id: row?.id || apiId || resolvedSlug,
      slug: row?.slug || resolvedSlug,
      name: resolvedName,
      photoUrl,
      nationality,
      birthDate,
      birthPlace,
      height: api?.height || null,
      weight: api?.weight || null,
      bio: row?.bio ?? null,
    },
    club,
    squad,
    career,
    trophies,
    recentMatches,
    upcoming,
    news: publishedNews.flatMap((item) => {
      if (!item.publishedAt) return [];
      return [
        {
          id: item.id,
          slug: item.slug,
          title: item.title,
          category: item.category,
          publishedAt: item.publishedAt,
          sourceName: item.sourceName ?? undefined,
        },
      ];
    }),
  };
});
