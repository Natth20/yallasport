import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { newsVisibleWhere } from '@/lib/i18n/localized-content';
import { swallow } from '@/lib/ops/caught';

const emptyChips: Array<{
  homeTeam: { name: string };
  awayTeam: { name: string };
  league: { name: string };
}> = [];

export const loadSeekIndex = cache(async function loadSeekIndex(locale: string) {
  const [deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows] = await Promise.all([
    prisma.news.count({ where: newsVisibleWhere(locale) }).catch(swallow('seek.news', 0)),
    prisma.team.count().catch(swallow('seek.teams', 0)),
    prisma.player.count().catch(swallow('seek.players', 0)),
    prisma.league.count().catch(swallow('seek.leagues', 0)),
    prisma.match.count().catch(swallow('seek.matches', 0)),
    prisma.match.count({ where: { status: 'LIVE' } }).catch(swallow('seek.live', 0)),
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

  return { deskNews, deskTeams, deskPlayers, deskLeagues, deskMatches, liveMatches, chipRows };
});
