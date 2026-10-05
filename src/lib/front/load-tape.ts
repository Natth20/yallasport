import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { frontDayWindow } from './window';
import type { FrontTapeGoal } from './types';

export async function loadFrontTape(locale: string): Promise<FrontTapeGoal[]> {
  const { todayKey, start, end } = frontDayWindow();
  let rows = await cachedJson(`front:tape:${todayKey}:v2`, 25, () =>
    prisma.matchEvent
      .findMany({
        where: {
          type: { in: ['GOAL', 'PENALTY'] },
          match: { kickoffAt: { gte: start, lt: end } },
        },
        orderBy: [{ minute: 'desc' }],
        take: 12,
        select: {
          id: true,
          minute: true,
          type: true,
          playerName: true,
          player: { select: { name: true, slug: true } },
          match: {
            select: {
              id: true,
              homeTeam: { select: { name: true, logoUrl: true } },
              awayTeam: { select: { name: true, logoUrl: true } },
              league: { select: { name: true } },
            },
          },
        },
      })
      .catch(swallow('front.tape', [])),
  );

  // If no goals recorded in today's window yet, fetch most recent goals
  if (!rows || rows.length === 0) {
    rows = await cachedJson(`front:tape:recent:v2`, 60, () =>
      prisma.matchEvent
        .findMany({
          where: {
            type: { in: ['GOAL', 'PENALTY'] },
          },
          orderBy: [{ id: 'desc' }],
          take: 8,
          select: {
            id: true,
            minute: true,
            type: true,
            playerName: true,
            player: { select: { name: true, slug: true } },
            match: {
              select: {
                id: true,
                homeTeam: { select: { name: true, logoUrl: true } },
                awayTeam: { select: { name: true, logoUrl: true } },
                league: { select: { name: true } },
              },
            },
          },
        })
        .catch(swallow('front.tape.recent', [])),
    );
  }

  return (rows || []).map((row) => ({
    id: row.id,
    minute: row.minute,
    player: localizePlainName(locale, row.player?.name || row.playerName || ''),
    slug: row.player?.slug ?? null,
    matchId: row.match.id,
    home: localizePlainName(locale, row.match.homeTeam.name),
    away: localizePlainName(locale, row.match.awayTeam.name),
    homeLogo: row.match.homeTeam.logoUrl ?? null,
    awayLogo: row.match.awayTeam.logoUrl ?? null,
    leagueName: row.match.league?.name ? localizePlainName(locale, row.match.league.name) : null,
    type: row.type,
  }));
}
