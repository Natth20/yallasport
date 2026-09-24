import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeRedisGet } from '@/lib/redis';
import { sportsData } from '@/lib/sports-data';
import { MATCH_LIST_INCLUDE, toNormalizedMatch } from '@/lib/sports-data/from-db';
import { isLiveStatus, liveKickoffFloor } from '@/lib/sports-data/match-window';
import type { LiveMatchesPayload } from '@/lib/sports-data/types';

export const dynamic = 'force-dynamic';

const emptyPayload = (): LiveMatchesPayload => ({
  matches: [],
  freshness: {
    syncedAt: new Date().toISOString(),
    source: 'EMPTY',
    staleAfterSeconds: 120,
  },
});

let memoryCache: { at: number; payload: LiveMatchesPayload } | null = null;
let inflight: Promise<LiveMatchesPayload> | null = null;

async function loadLiveMatches(): Promise<LiveMatchesPayload> {
  const floor = liveKickoffFloor().getTime();
  const keepLive = (payload: LiveMatchesPayload): LiveMatchesPayload => ({
    ...payload,
    matches: payload.matches.filter(
      (match) => isLiveStatus(match.status) && new Date(match.kickoffAt).getTime() >= floor,
    ),
  });

  const cached = await safeRedisGet<LiveMatchesPayload>('sports:live:all');
  if (cached) return keepLive(cached);

  try {
    const dbMatches = await prisma.match.findMany({
      where: { status: { in: ['LIVE', 'HALFTIME'] }, kickoffAt: { gte: liveKickoffFloor() } },
      orderBy: { kickoffAt: 'asc' },
      take: 40,
      include: MATCH_LIST_INCLUDE,
    });
    const matches = dbMatches.map(toNormalizedMatch);
    void sportsData.getLiveMatches().catch(swallow("src/app/api/sports/live/route.ts:43", undefined));
    return {
      matches,
      freshness: {
        syncedAt: new Date().toISOString(),
        source: matches.length > 0 ? 'CACHE' : 'EMPTY',
        staleAfterSeconds: 120,
      },
    };
  } catch (error) {
    console.error('[LIVE_MATCHES_DB]', error);
    return emptyPayload();
  }
}

export async function GET() {
  if (memoryCache && Date.now() - memoryCache.at < 8000) {
    return NextResponse.json(memoryCache.payload, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (!inflight) {
    inflight = loadLiveMatches().finally(() => {
      inflight = null;
    });
  }

  const payload = await inflight;
  memoryCache = { at: Date.now(), payload };
  return NextResponse.json(payload, { headers: { 'Cache-Control': 'no-store' } });
}
