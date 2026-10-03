import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { isLiveStatus, liveKickoffFloor } from '@/lib/sports-data/match-window';
import { MATCH_LIST_INCLUDE, toNormalizedMatch } from '@/lib/sports-data/from-db';

export const liveMatchWhere = {
  status: { in: ['LIVE' as const, 'HALFTIME' as const] },
  kickoffAt: { gte: liveKickoffFloor() },
};

export async function countLiveMatches() {
  return prisma.match.count({ where: liveMatchWhere }).catch(swallow('live.census', 0));
}

export async function listLiveMatches(take = 24) {
  const rows = await prisma.match
    .findMany({
      where: liveMatchWhere,
      orderBy: { kickoffAt: 'desc' },
      take,
      include: MATCH_LIST_INCLUDE,
    })
    .catch(swallow('live.list', []));
  return rows.filter((row) => isLiveStatus(row.status)).map((row) => toNormalizedMatch(row));
}
