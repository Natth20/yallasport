import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';
import { paintNormalizedMatches } from '@/lib/i18n/localized-content';
import { frontDayWindow } from './window';
import { frontMatchSelect, toFrontMatch } from './map-match';
import type { FrontMatch } from './types';

export async function loadFrontBoard(locale: string): Promise<FrontMatch[]> {
  const { todayKey, now } = frontDayWindow();
  const from = new Date(now.getTime() - 18 * 60 * 60 * 1000);
  const to = new Date(now.getTime() + 72 * 60 * 60 * 1000);
  const rows = await cachedJson(`front:board:${todayKey}:v4`, 20, () =>
    prisma.match
      .findMany({
        where: {
          OR: [
            { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor(now) } },
            { kickoffAt: { gte: from, lt: to } },
          ],
        },
        orderBy: { kickoffAt: 'asc' },
        take: 80,
        select: frontMatchSelect,
      })
      .catch(swallow('front.board', [])),
  );

  await paintNormalizedMatches(locale, rows);
  const seen = new Set<string>();
  const unique = rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
  const live = unique.filter((row) => row.status === 'LIVE' || row.status === 'HALFTIME');
  const rest = unique.filter((row) => row.status !== 'LIVE' && row.status !== 'HALFTIME');
  return [...live, ...rest].slice(0, 48).map((row) => toFrontMatch(row, locale));
}
