import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { liveKickoffFloor, todayOrLiveWhere } from '@/lib/sports-data/match-window';
import { frontDayWindow } from './window';
import type { FrontPulse } from './types';

async function _loadFrontPulse(): Promise<FrontPulse> {
  const { todayKey, start, end, now } = frontDayWindow();
  return cachedJson(`front:pulse:${todayKey}:v2`, 20, async () => {
    const [matches, live, groups] = await Promise.all([
      prisma.match.count({ where: todayOrLiveWhere(start, end, now) }).catch(swallow('front.pulse.matches', 0)),
      prisma.match
        .count({ where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor(now) } } })
        .catch(swallow('front.pulse.live', 0)),
      prisma.matchEvent
        .groupBy({
          by: ['type'],
          where: { match: { kickoffAt: { gte: start, lt: end } } },
          _count: { id: true },
        })
        .catch(swallow('front.pulse.events', [] as Array<{ type: string; _count: { id: number } }>)),
    ]);
    const tally = (types: string[]) =>
      groups.filter((row) => types.includes(row.type)).reduce((sum, row) => sum + row._count.id, 0);
    return {
      matches,
      live,
      goals: tally(['GOAL', 'PENALTY', 'OWN_GOAL']),
      yellow: tally(['YELLOW_CARD', 'YELLOW']),
      red: tally(['RED_CARD', 'RED']),
      todayKey,
    };
  });
}

const _getCachedFrontPulse = cache(_loadFrontPulse);

export async function loadFrontPulse(): Promise<FrontPulse> {
  return _getCachedFrontPulse();
}
