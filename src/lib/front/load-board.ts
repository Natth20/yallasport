import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { liveKickoffFloor } from '@/lib/sports-data/match-window';
import { paintNormalizedMatches } from '@/lib/i18n/localized-content';
import { frontDayWindow } from './window';
import { frontMatchSelect, toFrontMatch } from './map-match';
import type { FrontMatch } from './types';

async function _loadFrontBoard(locale: string): Promise<FrontMatch[]> {
  try {
    const { todayKey, now } = frontDayWindow();
    const from = new Date(now.getTime() - 18 * 60 * 60 * 1000);
    const to = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const raw = await cachedJson(`front:board:${todayKey}:v4`, 20, () =>
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

    const rows = raw || [];
    await paintNormalizedMatches(locale, rows);
    const seen = new Set<string>();
    const unique = rows.filter((row) => {
      const kickoffMs = row.kickoffAt ? new Date(row.kickoffAt).getTime() : 0;
      const key = `${row.homeTeam.id}-${row.awayTeam.id}-${kickoffMs}`;
      if (seen.has(row.id) || seen.has(key)) return false;
      seen.add(row.id);
      seen.add(key);
      return true;
    });
    const live = unique.filter((row) => row.status === 'LIVE' || row.status === 'HALFTIME');
    const upcoming = unique.filter((row) => row.status === 'NOT_STARTED');
    const finished = unique.filter((row) => row.status === 'FINISHED');
    const other = unique.filter((row) => row.status === 'POSTPONED' || row.status === 'CANCELLED');
    return [...live, ...upcoming, ...finished, ...other].slice(0, 48).map((row) => toFrontMatch(row, locale));
  } catch {
    return [];
  }
}

const _getCachedFrontBoard = cache(_loadFrontBoard);

export async function loadFrontBoard(locale: string): Promise<FrontMatch[]> {
  return _getCachedFrontBoard(locale);
}
