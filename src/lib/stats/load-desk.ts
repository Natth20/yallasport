import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { playerSlugFor } from '@/lib/players/search';

export const STAT_BOARDS = [
  { id: '39', ar: 'الدوري الإنجليزي الممتاز', en: 'Premier League' },
  { id: '140', ar: 'الليغا', en: 'La Liga' },
  { id: '135', ar: 'الدوري الإيطالي', en: 'Serie A' },
  { id: '78', ar: 'البوندسليغا', en: 'Bundesliga' },
  { id: '61', ar: 'الدوري الفرنسي', en: 'Ligue 1' },
  { id: '2', ar: 'دوري أبطال أوروبا', en: 'Champions League' },
  { id: '307', ar: 'دوري روشن', en: 'Saudi Pro League' },
  { id: '233', ar: 'الدوري المصري', en: 'Egyptian Premier League' },
] as const;

export type StatKind = 'goals' | 'assists' | 'yellow' | 'red';

type ApiBoard = {
  response?: Array<{
    player?: { id?: number; name?: string; photo?: string };
    statistics?: Array<{
      team?: { name?: string; logo?: string };
      goals?: { total?: number | null; assists?: number | null };
      cards?: { yellow?: number | null; red?: number | null };
    }>;
  }>;
};

export type StatRow = {
  rank: number;
  name: string;
  slug: string | null;
  photoUrl: string | null;
  teamName: string | null;
  teamLogo: string | null;
  value: number;
};

function pathFor(kind: StatKind, leagueId: string, season: number) {
  const q = `league=${encodeURIComponent(leagueId)}&season=${season}`;
  if (kind === 'assists') return `/players/topassists?${q}`;
  if (kind === 'yellow') return `/players/topyellowcards?${q}`;
  if (kind === 'red') return `/players/topredcards?${q}`;
  return `/players/topscorers?${q}`;
}

function readValue(kind: StatKind, stats: NonNullable<ApiBoard['response']>[number]['statistics']) {
  const block = stats?.[0];
  if (!block) return 0;
  if (kind === 'assists') return block.goals?.assists || 0;
  if (kind === 'yellow') return block.cards?.yellow || 0;
  if (kind === 'red') return block.cards?.red || 0;
  return block.goals?.total || 0;
}

export async function loadStatsDesk(leagueId: string, kind: StatKind) {
  const board = STAT_BOARDS.find((row) => row.id === leagueId) || STAT_BOARDS[0];
  const liveSeason = currentFootballSeason();
  let pack = await sportsData.getRaw<ApiBoard>(pathFor(kind, board.id, liveSeason));
  let usedSeason = liveSeason;
  if (!pack?.response?.length) {
    pack = await sportsData.getRaw<ApiBoard>(pathFor(kind, board.id, liveSeason - 1));
    usedSeason = liveSeason - 1;
  }

  const raw = (pack?.response || [])
    .map((row) => ({
      externalId: row.player?.id != null ? String(row.player.id) : '',
      name: row.player?.name?.trim() || '',
      photoUrl: row.player?.photo || null,
      teamName: row.statistics?.[0]?.team?.name || null,
      teamLogo: row.statistics?.[0]?.team?.logo || null,
      value: readValue(kind, row.statistics),
    }))
    .filter((row) => row.name && row.value > 0)
    .slice(0, 30);

  const ids = raw.map((row) => row.externalId).filter(Boolean);
  const players = ids.length
    ? await prisma.player.findMany({
        where: { externalId: { in: ids } },
        select: { externalId: true, slug: true, photoUrl: true, name: true },
      })
    : [];
  const byExt = new Map(players.map((row) => [row.externalId, row]));

  const missing = raw.filter((row) => row.externalId && !byExt.has(row.externalId));
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
            select: { id: true, externalId: true, slug: true, photoUrl: true, name: true },
          });
          const { rememberArabicDisplay } = await import('@/lib/sports-data/persistence');
          await rememberArabicDisplay('PLAYER', created.id, row.name);
          byExt.set(created.externalId, created);
        } catch {
          const found = await prisma.player.findUnique({
            where: { externalId: row.externalId },
            select: { externalId: true, slug: true, photoUrl: true, name: true },
          });
          if (found) byExt.set(found.externalId, found);
        }
      }),
    );
  }

  const rows: StatRow[] = raw.map((row, index) => {
    const hit = byExt.get(row.externalId);
    return {
      rank: index + 1,
      name: hit?.name || row.name,
      slug: hit?.slug || (row.externalId ? playerSlugFor(row.name, row.externalId) : null),
      photoUrl: hit?.photoUrl || row.photoUrl,
      teamName: row.teamName,
      teamLogo: row.teamLogo,
      value: row.value,
    };
  });

  return { board, season: usedSeason, liveSeason, previousSeason: usedSeason !== liveSeason, rows };
}
