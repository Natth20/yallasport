import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';
import { isLiveSportsApi } from '@/lib/sports-data/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cached = await redis.get<{
    syncedAt: string;
    matchCount: number;
    fixtureCount: number;
    durationMs: number;
    source: 'LIVE' | 'EMPTY' | 'MOCK';
  }>('sports:meta:live');

  if (cached) {
    const ageSeconds = Math.floor((Date.now() - new Date(cached.syncedAt).getTime()) / 1000);
    return NextResponse.json(
      { ...cached, ageSeconds, stale: ageSeconds > 120 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const latest = await prisma.match.aggregate({ _max: { lastSyncedAt: true } });
  const syncedAt = latest._max.lastSyncedAt?.toISOString() ?? null;
  const ageSeconds = syncedAt ? Math.floor((Date.now() - new Date(syncedAt).getTime()) / 1000) : null;
  return NextResponse.json(
    {
      syncedAt,
      matchCount: 0,
      fixtureCount: 0,
      source: isLiveSportsApi() ? 'LIVE' : 'EMPTY',
      ageSeconds,
      stale: ageSeconds === null || ageSeconds > 120,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
