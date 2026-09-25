import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { sportsData } from '@/lib/sports-data';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logSystemAlert, AlertType, AlertSeverity } from '@/lib/monitoring';
import { persistMatchDetail, persistNormalizedMatch } from '@/lib/sports-data/persistence';
import { cronFixtureDateKeys, liveKickoffFloor } from '@/lib/sports-data/match-window';
import { alertMatchFans } from '@/lib/notifications/match-alerts';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { isAuthorizedCron } from '@/lib/security/cron';
import { settleFinishedPredictions } from '@/lib/predictions/settle';

/**
 * API Route: /api/sports/sync
 * Purpose: Centralized Cron Job to sync live match data from API-Football to DB & Cache.
 * Schedule: Every minute (via vercel.json).
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const startedAt = Date.now();
    const dateKeys = cronFixtureDateKeys();
    const [liveMatches, ...datedBatches] = await Promise.all([
      sportsData.getLiveMatches(),
      ...dateKeys.map((date) => sportsData.getMatchesByDate(date)),
    ]);
    const allFixtures = Array.from(
      new Map(
        [...datedBatches.flat(), ...liveMatches].map((match) => [String(match.externalId), match]),
      ).values(),
    );
    const persistedMatches = [];
    for (const match of allFixtures) {
      try {
        persistedMatches.push(await persistNormalizedMatch(match));
      } catch (error) {
        console.warn('[SYNC] skip fixture', match.externalId, error);
      }
    }

    for (const liveMatch of liveMatches) {
      const detail = await sportsData.getMatchById(liveMatch.externalId).catch(swallow("src/app/api/sports/sync/route.ts:45", null));
      if (!detail) continue;
      const dbMatch = await persistMatchDetail(detail);

      if (dbMatch.status === 'LIVE' || dbMatch.status === 'HALFTIME') {
        await alertMatchFans(dbMatch, 'MATCH_START', {
          title: 'بدأت المباراة',
          body: `${dbMatch.homeTeam.name} ضد ${dbMatch.awayTeam.name}`,
          tag: `match-start-${dbMatch.id}`,
          entityId: 'live',
        });
      }

      if (dbMatch.status === 'FINISHED') {
        await alertMatchFans(dbMatch, 'MATCH_END', {
          title: 'انتهت المباراة',
          body: `${dbMatch.homeTeam.name} ${dbMatch.homeScore ?? 0} - ${dbMatch.awayScore ?? 0} ${dbMatch.awayTeam.name}`,
          tag: `match-end-${dbMatch.id}`,
          entityId: 'finished',
        });
      }

      for (const goal of detail.events.filter((event) =>
        event.type === 'GOAL' || event.type === 'PENALTY' || event.type === 'OWN_GOAL'
      )) {
        const eventKey = `${goal.minute}-${goal.extraMinute ?? 0}-${goal.playerId ?? goal.player ?? 'goal'}`;
        await alertMatchFans(dbMatch, 'GOAL', {
          title: `هدف${goal.player ? ` — ${goal.player}` : ''}`,
          body: `${detail.homeTeam.name} ${detail.homeScore ?? 0} - ${detail.awayScore ?? 0} ${detail.awayTeam.name}`,
          tag: `goal-${dbMatch.id}-${eventKey}`,
          entityId: eventKey,
        });
      }
    }

    const finishedIds = persistedMatches
      .filter((match) => match.status === 'FINISHED')
      .map((match) => match.id);
    const settlement = finishedIds.length
      ? await settleFinishedPredictions(finishedIds).catch(swallow("src/app/api/sports/sync/route.ts:94", ({ matches: 0, settled: 0, awarded: 0 })))
      : { matches: 0, settled: 0, awarded: 0 };

    const staleLive = await prisma.match.updateMany({
      where: {
        status: { in: ['LIVE', 'HALFTIME'] },
        kickoffAt: { lt: liveKickoffFloor() },
      },
      data: { status: 'FINISHED' },
    });

    const syncedAt = new Date().toISOString();
    const source = isLiveSportsApi() ? 'LIVE' : 'EMPTY';
    await Promise.all([
      redis.set('sports:live:all', {
        matches: liveMatches,
        freshness: { syncedAt, cachedAt: syncedAt, source, staleAfterSeconds: 120 },
      }, { ex: 120 }),
      redis.set('sports:meta:live', {
        syncedAt,
        matchCount: liveMatches.length,
        fixtureCount: allFixtures.length,
        durationMs: Date.now() - startedAt,
        source,
        predictionsSettled: settlement.settled,
      }, { ex: 300 }),
      redis.set('live_matches', liveMatches, { ex: 30 }),
    ]);

    return NextResponse.json({
      success: true,
      syncedCount: persistedMatches.length,
      liveCount: liveMatches.length,
      staleLiveClosed: staleLive.count,
      predictionsSettled: settlement.settled,
      pointsAwarded: settlement.awarded,
      timestamp: syncedAt,
    });

  } catch (error: unknown) {
    console.error('[SYNC_ERROR]:', error);
    const message = error instanceof Error ? error.message : 'Unknown sync error';
    const stack = error instanceof Error ? error.stack : undefined;

    // Log Critical Alert
    await logSystemAlert(
      AlertType.CRON_FAILURE,
      AlertSeverity.HIGH,
      `Sync Cron Failed: ${message}`,
      { error: stack }
    );

    return NextResponse.json({
      success: false,
      error: message
    }, { status: 500 });
  }
}
