import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { belongsOnTodayBoard, todayOrLiveWhere } from '@/lib/sports-data/match-window';
import { paintNormalizedMatches } from '@/lib/i18n/localized-content';
import { frontDayWindow } from './window';
import { frontMatchSelect, toFrontMatch } from './map-match';
import type { FrontMatch } from './types';

export async function loadFrontBoard(locale: string): Promise<FrontMatch[]> {
  const { todayKey, start, end, now } = frontDayWindow();
  const rows = await cachedJson(`front:board:${todayKey}`, 45, () =>
    prisma.match
      .findMany({
        where: todayOrLiveWhere(start, end, now),
        orderBy: { kickoffAt: 'asc' },
        take: 24,
        select: frontMatchSelect,
      })
      .catch(swallow('front.board', [])),
  );

  const board = rows.filter((row) => belongsOnTodayBoard(row, start, end, now));
  await paintNormalizedMatches(locale, board);
  const live = board.filter((row) => row.status === 'LIVE' || row.status === 'HALFTIME');
  const rest = board.filter((row) => row.status !== 'LIVE' && row.status !== 'HALFTIME');
  return [...live, ...rest].slice(0, 16).map(toFrontMatch);
}
