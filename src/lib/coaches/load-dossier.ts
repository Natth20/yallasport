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

  const normCoachName = (resolvedName || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  const KNOWN_COACH_DATA: Record<
    string,
    {
      bio: string;
      trophies: Array<{ id: string; title: string; season: string; teamName: string }>;
    }
  > = {
    'jose mourinho': {
      bio: 'جوزيه مورينيو (The Special One)، أحد أعظم وأشهر المدربين التكتيكيين في تاريخ كرة القدم الحديثة. اشتهر بالانضباط التكتيكي الحديدي، والتحولات الهجومية الصاعقة، والصلابة الدفاعية الأسطورية. حقق الثلاثية التاريخية مع إنتر ميلان، وتوج بلقب دوري أبطال أوروبا مع بورتو وإنتر ميلان، وقاد ريال مدريد إلى لقب الدوري الإسباني التاريخي برصيد 100 نقطة و121 هدفاً في موسم 2011/2012.',
      trophies: [
        { id: 'jm-1', title: 'UEFA Champions League', season: '2009/10', teamName: 'Inter Milan' },
        { id: 'jm-2', title: 'UEFA Champions League', season: '2003/04', teamName: 'Porto' },
        { id: 'jm-3', title: 'UEFA Europa League', season: '2016/17', teamName: 'Manchester United' },
        { id: 'jm-4', title: 'UEFA Europa Conference League', season: '2021/22', teamName: 'Roma' },
        { id: 'jm-5', title: 'UEFA Cup', season: '2002/03', teamName: 'Porto' },
        { id: 'jm-6', title: 'La Liga', season: '2011/12', teamName: 'Real Madrid' },
        { id: 'jm-7', title: 'Copa del Rey', season: '2010/11', teamName: 'Real Madrid' },
        { id: 'jm-8', title: 'Supercopa de España', season: '2012', teamName: 'Real Madrid' },
        { id: 'jm-9', title: 'Premier League', season: '2014/15', teamName: 'Chelsea' },
        { id: 'jm-10', title: 'Premier League', season: '2005/06', teamName: 'Chelsea' },
        { id: 'jm-11', title: 'Premier League', season: '2004/05', teamName: 'Chelsea' },
        { id: 'jm-12', title: 'Serie A', season: '2009/10', teamName: 'Inter Milan' },
        { id: 'jm-13', title: 'Serie A', season: '2008/09', teamName: 'Inter Milan' },
        { id: 'jm-14', title: 'Coppa Italia', season: '2009/10', teamName: 'Inter Milan' },
        { id: 'jm-15', title: 'Primeira Liga', season: '2003/04', teamName: 'Porto' },
        { id: 'jm-16', title: 'Primeira Liga', season: '2002/03', teamName: 'Porto' },
      ],
    },
    'mikel arteta': {
      bio: 'ميكيل أرتيتا، المدير الفني الإسباني لنادي أرسنال، وأحد أبرز العقول التكتيكية الشابة في أوروبا. تتلمذ على يد بيب غوارديولا، وأعاد أرسنال إلى قمة المنافسة الأوروبية والدوري الإنجليزي الممتاز بأسلوب يعتمد على الاستحواذ العالي، والضغط المعاكس المنظم، والابتكار الهجومي المستمر.',
      trophies: [
        { id: 'ma-1', title: 'FA Cup', season: '2019/20', teamName: 'Arsenal' },
        { id: 'ma-2', title: 'FA Community Shield', season: '2023', teamName: 'Arsenal' },
        { id: 'ma-3', title: 'FA Community Shield', season: '2020', teamName: 'Arsenal' },
      ],
    },
    'carlo ancelotti': {
      bio: 'كارلو أنشيلوتي (Carletto)، المدرب الأكثر تتويجاً في تاريخ دوري أبطال أوروبا بخمسة ألقاب تاريخية، والمدرب الوحيد الذي حقق ألقاب الدوريات الخمسة الكبرى في أوروبا (إسبانيا، إنجلترا، إيطاليا، ألمانيا، فرنسا). يتميز بالحكمة التكتيكية الهادئة، وإدارة النجوم الفائقة، والمرونة العالية.',
      trophies: [
        { id: 'ca-1', title: 'UEFA Champions League', season: '2023/24', teamName: 'Real Madrid' },
        { id: 'ca-2', title: 'UEFA Champions League', season: '2021/22', teamName: 'Real Madrid' },
        { id: 'ca-3', title: 'UEFA Champions League', season: '2013/14', teamName: 'Real Madrid' },
        { id: 'ca-4', title: 'UEFA Champions League', season: '2006/07', teamName: 'AC Milan' },
        { id: 'ca-5', title: 'UEFA Champions League', season: '2002/03', teamName: 'AC Milan' },
        { id: 'ca-6', title: 'La Liga', season: '2023/24', teamName: 'Real Madrid' },
        { id: 'ca-7', title: 'La Liga', season: '2021/22', teamName: 'Real Madrid' },
        { id: 'ca-8', title: 'Premier League', season: '2009/10', teamName: 'Chelsea' },
        { id: 'ca-9', title: 'Serie A', season: '2003/04', teamName: 'AC Milan' },
        { id: 'ca-10', title: 'Bundesliga', season: '2016/17', teamName: 'Bayern Munich' },
        { id: 'ca-11', title: 'Ligue 1', season: '2012/13', teamName: 'Paris Saint-Germain' },
      ],
    },
    'pep guardiola': {
      bio: 'بيب غوارديولا، رائد كرة القدم الموضعية (Juego de Posición) وأحد أكثر المدربين تأثيراً في تاريخ اللعبة الحديثة. قاد برشلونة للسداسية التاريخية، وقاد مانشستر سيتي للثلاثية التاريخية في 2023، وهيمن على الدوري الإنجليزي الممتاز بأسلوب الاستحواذ المطلق والضغط العالي.',
      trophies: [
        { id: 'pg-1', title: 'UEFA Champions League', season: '2022/23', teamName: 'Manchester City' },
        { id: 'pg-2', title: 'UEFA Champions League', season: '2010/11', teamName: 'Barcelona' },
        { id: 'pg-3', title: 'UEFA Champions League', season: '2008/09', teamName: 'Barcelona' },
        { id: 'pg-4', title: 'Premier League', season: '2023/24', teamName: 'Manchester City' },
        { id: 'pg-5', title: 'Premier League', season: '2022/23', teamName: 'Manchester City' },
        { id: 'pg-6', title: 'Premier League', season: '2021/22', teamName: 'Manchester City' },
        { id: 'pg-7', title: 'Premier League', season: '2020/21', teamName: 'Manchester City' },
        { id: 'pg-8', title: 'Premier League', season: '2018/19', teamName: 'Manchester City' },
        { id: 'pg-9', title: 'Premier League', season: '2017/18', teamName: 'Manchester City' },
        { id: 'pg-10', title: 'Bundesliga', season: '2015/16', teamName: 'Bayern Munich' },
        { id: 'pg-11', title: 'La Liga', season: '2010/11', teamName: 'Barcelona' },
      ],
    },
  };

  const knownCoach = KNOWN_COACH_DATA[normCoachName];
  const trophiesKnown = knownCoach?.trophies || [];
  const trophies = trophiesDb.length > 0 ? trophiesDb : (trophiesApi.length > 0 ? trophiesApi : trophiesKnown);
  const bio = (row?.bio && row.bio.length > 35) ? row.bio : (knownCoach?.bio || row?.bio || null);

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
      bio: bio || row?.bio || null,
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
