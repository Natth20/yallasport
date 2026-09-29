import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { frontDayWindow } from './window';
import type { FrontTapeGoal } from './types';

export async function loadFrontTape(locale: string): Promise<FrontTapeGoal[]> {
  const { todayKey, start, end } = frontDayWindow();
  const rows = await cachedJson(`front:tape:${todayKey}:v1`, 25, () =>
    prisma.matchEvent
      .findMany({
        where: {
          type: { in: ['GOAL', 'PENALTY'] },
          match: { kickoffAt: { gte: start, lt: end } },
        },
        orderBy: [{ minute: 'desc' }],
        take: 10,
        select: {
          id: true,
          minute: true,
          playerName: true,
          player: { select: { name: true, slug: true } },
          match: {
            select: {
              id: true,
              homeTeam: { select: { name: true } },
              awayTeam: { select: { name: true } },
            },
          },
        },
      })
      .catch(swallow('front.tape', [])),
  );

  return rows.map((row) => ({
    id: row.id,
    minute: row.minute,
    player: localizePlainName(locale, row.player?.name || row.playerName || ''),
    slug: row.player?.slug ?? null,
    matchId: row.match.id,
    home: localizePlainName(locale, row.match.homeTeam.name),
    away: localizePlainName(locale, row.match.awayTeam.name),
  }));
}
