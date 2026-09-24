import { swallow, reportCaughtError } from '@/lib/ops/caught';
import type { NormalizedMatchDetail } from './types';
import { cache } from 'react';
import { sportsData } from './index';
import { persistMatchDetail } from './persistence';
import { getDirectPrisma, prisma } from '@/lib/prisma';
import { MATCH_DETAIL_INCLUDE, mapStoredMatchToDetail } from './from-db';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isReachabilityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /can't reach database server|timed out fetching a new connection|connection pool|p1001|p2024/i.test(message);
}

const loadStoredMatch = cache(async function loadStoredMatch(publicId: string) {
  const where = { OR: [{ id: publicId }, { externalId: publicId }] };
  const query = (client: typeof prisma) =>
    client.match.findFirst({
      where,
      include: MATCH_DETAIL_INCLUDE,
    });

  try {
    return await query(prisma);
  } catch (error) {
    if (!isReachabilityError(error)) throw error;
    await sleep(700);
    try {
      return await query(prisma);
    } catch (retryError) {
      const direct = getDirectPrisma();
      if (direct) {
        try {
          return await query(direct);
        } catch (error) {
          reportCaughtError("src/lib/sports-data/match-resolver.ts:38", error);
          throw retryError;
        }
      }
      throw retryError;
    }
  }
});

function isDetailSparse(stored: {
  events: unknown[];
  statistics: unknown[];
  lineups: unknown[];
}) {
  return stored.events.length === 0 && stored.statistics.length === 0 && stored.lineups.length === 0;
}

export async function getResolvedMatchDetail(
  publicId: string,
  options?: { refresh?: boolean }
): Promise<NormalizedMatchDetail | null> {
  let stored;
  try {
    stored = await loadStoredMatch(publicId);
  } catch (error) {
    if (!isReachabilityError(error)) throw error;
    try {
      return await sportsData.getMatchById(publicId);
    } catch (error) {
      reportCaughtError("src/lib/sports-data/match-resolver.ts:66", error);
      throw error;
    }
  }

  const needsRemote =
    !stored ||
    Boolean(options?.refresh) ||
    ((stored.status === 'FINISHED' || stored.status === 'LIVE' || stored.status === 'HALFTIME') &&
      isDetailSparse(stored));

  if (stored && !needsRemote) {
    return mapStoredMatchToDetail(stored);
  }

  try {
    const detail = await sportsData.getMatchById(stored?.externalId ?? publicId);
    const persisted = await persistMatchDetail(detail).catch(swallow("src/lib/sports-data/match-resolver.ts:82", null));
    if (persisted) {
      const refreshed = await prisma.match.findUnique({
        where: { id: persisted.id },
        include: MATCH_DETAIL_INCLUDE,
      }).catch(swallow("src/lib/sports-data/match-resolver.ts:87", null));
      if (refreshed) return mapStoredMatchToDetail(refreshed);
    }
    return detail;
  } catch (error) {
    if (stored) return mapStoredMatchToDetail(stored);
    console.warn('[MATCH_DETAIL_RESOLVE]', publicId, error instanceof Error ? error.message : error);
    return null;
  }
}
