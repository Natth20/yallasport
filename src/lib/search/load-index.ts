import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere } from '@/lib/i18n/localized-content';
import { swallow } from '@/lib/ops/caught';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';

const emptyChips: Array<{
  homeTeam: { name: string };
  awayTeam: { name: string };
  league: { name: string };
}> = [];

export interface SeekIndexData {
  deskNews: number;
  deskTeams: number;
  deskPlayers: number;
  deskLeagues: number;
  deskMatches: number;
  liveMatches: number;
  chipRows: Array<{
    homeTeam: { name: string };
    awayTeam: { name: string };
    league: { name: string };
  }>;
}

let cachedSeekIndex: { at: number; data: SeekIndexData } | null = {
  at: Date.now(),
  data: {
    deskNews: 140,
    deskTeams: 3288,
    deskPlayers: 2000,
    deskLeagues: 600,
    deskMatches: 80,
    liveMatches: 0,
    chipRows: emptyChips,
  },
};

let seekIndexLoading: Promise<SeekIndexData> | null = null;

export const loadSeekIndex = cache(async function loadSeekIndex(_locale: string): Promise<SeekIndexData> {
  const now = Date.now();
  if (cachedSeekIndex && now - cachedSeekIndex.at < 30 * 60 * 1000) {
    return cachedSeekIndex.data;
  }

  if (seekIndexLoading) {
    return cachedSeekIndex?.data || seekIndexLoading;
  }

  seekIndexLoading = (async () => {
    try {
      const [deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows] = await Promise.all([
        prisma.news.count({ where: { status: 'PUBLISHED' } }).catch(swallow('seek.news', 140)),
        prisma.team.count().catch(swallow('seek.teams', 3288)),
        prisma.player.count().catch(swallow('seek.players', 2000)),
        prisma.league.count().catch(swallow('seek.leagues', 600)),
        prisma.match.count().catch(swallow('seek.matches', 80)),
        prisma.match
          .count({
            where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } },
          })
          .catch(swallow('seek.live', 0)),
        prisma.match
          .findMany({
            orderBy: { kickoffAt: 'desc' },
            take: 24,
            select: {
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
              league: { select: { name: true } },
            },
          })
          .catch(swallow('seek.chips', emptyChips)),
      ]);

      const result = { deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows };
      cachedSeekIndex = { at: Date.now(), data: result };
      return result;
    } finally {
      seekIndexLoading = null;
    }
  })();

  return cachedSeekIndex?.data || seekIndexLoading;
});
