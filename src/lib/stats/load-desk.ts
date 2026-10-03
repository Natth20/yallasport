import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { sportsData } from '@/lib/sports-data';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { playerSlugFor } from '@/lib/players/search';
import { safeRedisGet, safeRedisSet } from '@/lib/redis';

export const STAT_BOARDS = [
  { id: '39', slug: 'premier-league', ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League' },
  { id: '140', slug: 'la-liga', ar: 'الليغا', en: 'La Liga' },
  { id: '135', slug: 'serie-a', ar: 'الدوري الإيطالي', en: 'Serie A' },
  { id: '78', slug: 'bundesliga', ar: 'البوندسليغا', en: 'Bundesliga' },
  { id: '61', slug: 'ligue-1', ar: 'الدوري الفرنسي', en: 'Ligue 1' },
  { id: '2', slug: 'ucl', ar: 'دوري أبطال أوروبا', en: 'Champions League' },
  { id: '307', slug: 'spl', ar: 'دوري روشن', en: 'Saudi Pro League' },
  { id: '233', slug: 'epl-egypt', ar: 'الدوري المصري', en: 'Egyptian Premier League' },
] as const;

export function resolveStatBoard(raw?: string | null) {
  if (!raw) return STAT_BOARDS[0];
  return STAT_BOARDS.find((row) => row.id === raw || row.slug === raw) || STAT_BOARDS[0];
}

export function statBoardLabel(locale: string, externalId: string | null | undefined, fallback: string) {
  const board = STAT_BOARDS.find((row) => row.id === externalId);
  if (board) return locale === 'ar' ? board.ar : board.en;
  return fallback;
}

export type StatKind =
  | 'goals'
  | 'assists'
  | 'combined'
  | 'shots'
  | 'shotsOn'
  | 'keyPasses'
  | 'dribbles'
  | 'duels'
  | 'penaltiesScored'
  | 'foulsDrawn'
  | 'tackles'
  | 'interceptions'
  | 'yellow'
  | 'red'
  | 'saves'
  | 'conceded'
  // Advanced metrics — only render when the source actually returns them.
  | 'rating'
  | 'xg';

export type StatSort = 'value' | 'apps' | 'minutes' | 'name';

type StatBlock = {
  team?: { id?: number; name?: string; logo?: string };
  games?: { appearences?: number | null; minutes?: number | null; position?: string | null; rating?: string | number | null };
  goals?: { total?: number | null; assists?: number | null; saves?: number | null; conceded?: number | null };
  shots?: { total?: number | null; on?: number | null };
  passes?: { key?: number | null; total?: number | null };
  tackles?: { total?: number | null; interceptions?: number | null };
  dribbles?: { success?: number | null };
  duels?: { won?: number | null };
  fouls?: { drawn?: number | null; committed?: number | null };
  penalty?: { scored?: number | null; missed?: number | null };
  cards?: { yellow?: number | null; red?: number | null };
  // Advanced metrics the current provider usually omits. Read when present.
  expected?: { goals?: number | null; xg?: number | null };
  xg?: number | null;
};

type ApiBoard = {
  response?: Array<{
    player?: { id?: number; name?: string; photo?: string };
    statistics?: StatBlock[];
  }>;
};

export type StatRow = {
  rank: number;
  name: string;
  slug: string | null;
  photoUrl: string | null;
  teamName: string | null;
  teamLogo: string | null;
  teamSlug: string | null;
  value: number;
  secondary: number | null;
  appearances: number | null;
  minutes: number | null;
  position: string | null;
};

export type TeamStatRow = {
  name: string;
  slug: string;
  logoUrl: string | null;
  goalsFor: number;
  goalsAgainst: number;
  won: number;
  drawn: number;
  lost: number;
  points: number;
  played: number;
};

function pathFor(kind: StatKind, leagueId: string, season: number) {
  const q = `league=${encodeURIComponent(leagueId)}&season=${season}`;
  if (kind === 'assists') return `/players/topassists?${q}`;
  if (kind === 'yellow') return `/players/topyellowcards?${q}`;
  if (kind === 'red') return `/players/topredcards?${q}`;
  // Advanced and per-90 style metrics need the full player statistics feed.
  if (
    kind === 'saves' ||
    kind === 'conceded' ||
    kind === 'dribbles' ||
    kind === 'duels' ||
    kind === 'penaltiesScored' ||
    kind === 'foulsDrawn' ||
    kind === 'rating' ||
    kind === 'xg'
  ) {
    return `/players?${q}&page=1`;
  }
  return `/players/topscorers?${q}`;
}

function usesPlayerFeed(kind: StatKind) {
  return (
    kind === 'saves' ||
    kind === 'conceded' ||
    kind === 'dribbles' ||
    kind === 'duels' ||
    kind === 'penaltiesScored' ||
    kind === 'foulsDrawn' ||
    kind === 'rating' ||
    kind === 'xg'
  );
}

function pickNum(...values: Array<number | null | undefined>) {
  for (const value of values) {
    if (value != null && Number.isFinite(value)) return value;
  }
  return null;
}

function readValue(kind: StatKind, stats: StatBlock[] | undefined): number | null {
  const block = stats?.[0];
  if (!block) return null;
  if (kind === 'assists') return pickNum(block.goals?.assists);
  if (kind === 'yellow') return pickNum(block.cards?.yellow);
  if (kind === 'red') return pickNum(block.cards?.red);
  if (kind === 'shots') return pickNum(block.shots?.total);
  if (kind === 'shotsOn') return pickNum(block.shots?.on);
  if (kind === 'keyPasses') return pickNum(block.passes?.key);
  if (kind === 'tackles') return pickNum(block.tackles?.total);
  if (kind === 'interceptions') return pickNum(block.tackles?.interceptions);
  if (kind === 'saves') return pickNum(block.goals?.saves);
  if (kind === 'conceded') return pickNum(block.goals?.conceded);
  if (kind === 'dribbles') return pickNum(block.dribbles?.success);
  if (kind === 'duels') return pickNum(block.duels?.won);
  if (kind === 'penaltiesScored') return pickNum(block.penalty?.scored);
  if (kind === 'foulsDrawn') return pickNum(block.fouls?.drawn);
  if (kind === 'rating') {
    const raw = block.games?.rating;
    const num = typeof raw === 'string' ? Number.parseFloat(raw) : raw;
    return num != null && Number.isFinite(num) ? Math.round(num * 100) / 100 : null;
  }
  if (kind === 'xg') return pickNum(block.expected?.xg, block.expected?.goals, block.xg);
  if (kind === 'combined') {
    const goals = pickNum(block.goals?.total);
    const assists = pickNum(block.goals?.assists);
    if (goals == null || assists == null) return null;
    return goals + assists;
  }
  return pickNum(block.goals?.total);
}

function readSecondary(kind: StatKind, stats: StatBlock[] | undefined): number | null {
  const block = stats?.[0];
  if (!block || kind !== 'combined') return null;
  return pickNum(block.goals?.assists);
}

function minAppsFor(kind: StatKind) {
  // Non-cumulative or rate-style metrics need a floor so a single match
  // does not top the board. Pure tallies (goals, cards) stay at 0.
  if (
    kind === 'shots' ||
    kind === 'shotsOn' ||
    kind === 'keyPasses' ||
    kind === 'tackles' ||
    kind === 'interceptions' ||
    kind === 'saves' ||
    kind === 'conceded' ||
    kind === 'dribbles' ||
    kind === 'duels' ||
    kind === 'foulsDrawn' ||
    kind === 'rating' ||
    kind === 'xg'
  ) {
    return 3;
  }
  return 0;
}

export const ALL_STAT_KINDS: StatKind[] = [
  'goals',
  'assists',
  'combined',
  'shots',
  'shotsOn',
  'keyPasses',
  'dribbles',
  'duels',
  'penaltiesScored',
  'foulsDrawn',
  'tackles',
  'interceptions',
  'yellow',
  'red',
  'saves',
  'conceded',
  'rating',
  'xg',
];

export const loadStatsDesk = cache(async function loadStatsDesk(
  leagueId: string,
  kind: StatKind,
  seasonYear?: number,
  options?: { q?: string; sort?: StatSort },
) {
  const board = resolveStatBoard(leagueId);
  const liveSeason = currentFootballSeason();
  const pinned = Number.isFinite(seasonYear);
  let pack: ApiBoard | null = null;
  let usedSeason = pinned ? seasonYear! : liveSeason;
  const years = pinned ? [seasonYear!] : [liveSeason, liveSeason - 1, liveSeason - 2];
  let usedPath = '';
  for (const year of years) {
    const path = pathFor(kind, board.id, year);
    const next = await sportsData.getRaw<ApiBoard>(path);
    let extra: ApiBoard['response'] = [];
    if (usesPlayerFeed(kind) && next?.response?.length) {
      const page2 = await sportsData.getRaw<ApiBoard>(`/players?league=${board.id}&season=${year}&page=2`);
      extra = page2?.response || [];
    }
    const merged = [...(next?.response || []), ...extra];
    if (merged.length) {
      pack = { response: merged };
      usedSeason = year;
      usedPath = path;
      break;
    }
  }

  const minApps = minAppsFor(kind);
  const raw = (pack?.response || [])
    .map((row) => {
      const block = row.statistics?.[0];
      const appearances = pickNum(block?.games?.appearences);
      const minutes = pickNum(block?.games?.minutes);
      const position = block?.games?.position?.trim() || null;
      if (kind === 'saves' || kind === 'conceded') {
        if (position && !/goal/i.test(position)) return null;
      }
      if (minApps > 0 && (appearances == null || appearances < minApps)) return null;
      return {
        externalId: row.player?.id != null ? String(row.player.id) : '',
        name: row.player?.name?.trim() || '',
        photoUrl: row.player?.photo || null,
        teamId: block?.team?.id != null ? String(block.team.id) : '',
        teamName: block?.team?.name || null,
        teamLogo: block?.team?.logo || null,
        value: readValue(kind, row.statistics),
        secondary: readSecondary(kind, row.statistics),
        appearances,
        minutes,
        position,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row?.name && row.value != null));

  raw.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
  const sliced = raw.slice(0, 40);

  const ids = sliced.map((row) => row.externalId).filter(Boolean);
  const players = ids.length
    ? await prisma.player.findMany({
      where: { externalId: { in: ids } },
      select: { externalId: true, slug: true, photoUrl: true, name: true, officialName: true },
    })
    : [];
  const byExt = new Map(players.map((row) => [row.externalId, row]));
  const teamIds = [...new Set(sliced.map((row) => row.teamId).filter(Boolean))];
  const teamNames = [...new Set(sliced.map((row) => row.teamName).filter((name): name is string => Boolean(name)))];
  const teams = teamIds.length || teamNames.length
    ? await prisma.team.findMany({
      where: {
        OR: [
          ...(teamIds.length ? [{ externalId: { in: teamIds } }] : []),
          ...(teamNames.length ? [{ name: { in: teamNames } }] : []),
        ],
      },
      select: { name: true, slug: true, logoUrl: true, externalId: true },
    })
    : [];
  const teamById = new Map(teams.map((row) => [row.externalId, row]));
  const teamByName = new Map(teams.map((row) => [row.name, row]));
  const leagueRow = await prisma.league.findFirst({
    where: { externalId: board.id },
    select: { slug: true },
  });

  const missing = sliced.filter((row) => row.externalId && !byExt.has(row.externalId));
  if (missing.length > 0) {
    await Promise.all(
      missing.map(async (row) => {
        try {
          const created = await prisma.player.create({
            data: {
              externalId: row.externalId,
              name: row.name,
              officialName: row.name,
              slug: playerSlugFor(row.name, row.externalId),
              photoUrl: row.photoUrl,
            },
            select: { id: true, externalId: true, slug: true, photoUrl: true, name: true, officialName: true },
          });
          const { rememberArabicDisplay } = await import('@/lib/sports-data/persistence');
          await rememberArabicDisplay('PLAYER', created.id, row.name);
          byExt.set(created.externalId, created);
        } catch {
          const found = await prisma.player.findUnique({
            where: { externalId: row.externalId },
            select: { externalId: true, slug: true, photoUrl: true, name: true, officialName: true },
          });
          if (found) byExt.set(found.externalId, found);
        }
      }),
    );
  }

  let rows: StatRow[] = sliced.map((row, index) => {
    const hit = byExt.get(row.externalId);
    const club = (row.teamId && teamById.get(row.teamId)) || (row.teamName ? teamByName.get(row.teamName) : null);
    const arabicName = hit?.officialName && /[\u0600-\u06FF]/.test(hit.officialName)
      ? hit.officialName
      : hit?.name && /[\u0600-\u06FF]/.test(hit.name)
        ? hit.name
        : hit?.officialName || hit?.name || row.name;
    return {
      rank: index + 1,
      name: arabicName,
      slug: hit?.slug || (row.externalId ? playerSlugFor(row.name, row.externalId) : null),
      photoUrl: hit?.photoUrl || row.photoUrl,
      teamName: row.teamName,
      teamLogo: club?.logoUrl || row.teamLogo,
      teamSlug: club?.slug ?? null,
      value: row.value as number,
      secondary: row.secondary,
      appearances: row.appearances,
      minutes: row.minutes,
      position: row.position,
    };
  });

  const q = options?.q?.trim().toLowerCase();
  if (q) {
    rows = rows.filter((row) =>
      [row.name, row.teamName].some((value) => value && value.toLowerCase().includes(q)),
    );
  }
  const sort = options?.sort || 'value';
  rows = [...rows].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'ar');
    if (sort === 'apps') return (b.appearances ?? -1) - (a.appearances ?? -1);
    if (sort === 'minutes') return (b.minutes ?? -1) - (a.minutes ?? -1);
    return b.value - a.value;
  }).map((row, index) => ({ ...row, rank: index + 1 }));

  const standings = await prisma.standing.findMany({
    where: { league: { externalId: board.id }, seasonId: String(usedSeason) },
    select: {
      goalsFor: true,
      goalsAgainst: true,
      won: true,
      drawn: true,
      lost: true,
      points: true,
      played: true,
      team: { select: { name: true, slug: true, logoUrl: true } },
    },
    orderBy: { rank: 'asc' },
  });
  const teamRows: TeamStatRow[] = standings.map((row) => ({
    name: row.team.name,
    slug: row.team.slug,
    logoUrl: row.team.logoUrl,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    points: row.points,
    played: row.played,
  }));

  const leagueTotals = teamRows.length
    ? {
      matches: Math.round(teamRows.reduce((sum, row) => sum + row.played, 0) / 2),
      goals: teamRows.reduce((sum, row) => sum + row.goalsFor, 0),
      wins: teamRows.reduce((sum, row) => sum + row.won, 0),
    }
    : null;

  const meta = usedPath ? await safeRedisGet<{ syncedAt?: string }>(`sports:raw:meta:${usedPath}`) : null;

  if (usedPath && !meta?.syncedAt) {
    const stamp = new Date().toISOString();
    await safeRedisSet(`sports:raw:meta:${usedPath}`, { syncedAt: stamp }, { ex: 3600 });
  }

  return {
    board,
    season: usedSeason,
    liveSeason,
    previousSeason: usedSeason !== liveSeason,
    rows,
    teamRows,
    leagueTotals,
    leagueSlug: leagueRow?.slug ?? null,
    fetchedAt: meta?.syncedAt ? new Date(meta.syncedAt) : null,
    seasons: [liveSeason, liveSeason - 1, liveSeason - 2],
    minApps,
  };
});
