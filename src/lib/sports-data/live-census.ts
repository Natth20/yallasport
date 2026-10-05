import { prisma } from '@/lib/prisma';
import { swallow, isUnreachableDatabase } from '@/lib/ops/caught';
import { isLiveStatus, liveKickoffFloor } from '@/lib/sports-data/match-window';
import { MATCH_LIST_INCLUDE, toNormalizedMatch } from '@/lib/sports-data/from-db';

/** Returns a fresh where-clause every call so kickoffAt is never stale. */
function liveMatchWhere() {
  return {
    status: { in: ['LIVE' as const, 'HALFTIME' as const] },
    kickoffAt: { gte: liveKickoffFloor() },
  };
}

/** Detects "Server has closed the connection" — transient DB connection hiccup. */
function isClosedConnection(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  return /server has closed the connection/i.test(msg);
}

/** Silently swallows transient DB connection errors, falls back to 0. */
export async function countLiveMatches(): Promise<number> {
  return prisma.match
    .count({ where: liveMatchWhere() })
    .catch((err: unknown) => {
      if (isClosedConnection(err) || isUnreachableDatabase(err)) return 0;
      return swallow('live.census', 0)(err);
    });
}

export async function listLiveMatches(take = 24) {
  const rows = await prisma.match
    .findMany({
      where: liveMatchWhere(),
      orderBy: { kickoffAt: 'desc' },
      take,
      include: MATCH_LIST_INCLUDE,
    })
    .catch((err: unknown): never[] => {
      if (isClosedConnection(err) || isUnreachableDatabase(err)) return [];
      return swallow('live.list', [] as never[])(err);
    });
  return rows.filter((row) => isLiveStatus(row.status)).map((row) => toNormalizedMatch(row));
}
