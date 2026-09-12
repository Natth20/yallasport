import { NextResponse } from 'next/server';
import { sportsData } from '@/lib/sports-data';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { logSystemAlert, AlertType, AlertSeverity } from '@/lib/monitoring';
import { persistMatchDetail, persistNormalizedMatch } from '@/lib/sports-data/persistence';
import { sendWebPush } from '@/lib/notifications/web-push';
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
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const dateKey = (date: Date) => date.toISOString().slice(0, 10);
    const [liveMatches, todayMatches, tomorrowMatches] = await Promise.all([
      sportsData.getLiveMatches(),
      sportsData.getMatchesByDate(dateKey(today)),
      sportsData.getMatchesByDate(dateKey(tomorrow)),
    ]);

    const allFixtures = Array.from(
      new Map([...todayMatches, ...tomorrowMatches, ...liveMatches].map((match) => [String(match.externalId), match])).values()
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
      const detail = await sportsData.getMatchById(liveMatch.externalId).catch(() => null);
      if (!detail) continue;
      const dbMatch = await persistMatchDetail(detail);

      for (const goal of detail.events.filter((event) =>
        event.type === 'GOAL' || event.type === 'PENALTY' || event.type === 'OWN_GOAL'
      )) {
        const eventKey = `${goal.minute}-${goal.extraMinute ?? 0}-${goal.playerId ?? goal.player ?? 'goal'}`;
        const dedupKey = `notification:goal:${dbMatch.id}:${eventKey}`;
        const reserved = await redis.set(dedupKey, '1', { nx: true, ex: 172800 });
        if (!reserved) continue;

        const followers = await prisma.userFavorite.findMany({
          where: { entityType: 'MATCH', entityId: dbMatch.id },
          include: { user: { include: { pushSubscriptions: true } } },
        });
        for (const follower of followers) {
          const preferences = follower.user.notificationPrefs as { goal?: boolean } | null;
          if (preferences?.goal === false) continue;
          const payload = {
            title: `هدف${goal.player ? ` — ${goal.player}` : ''}`,
            body: `${detail.homeTeam.name} ${detail.homeScore ?? 0} - ${detail.awayScore ?? 0} ${detail.awayTeam.name}`,
            url: `/match/${dbMatch.id}`,
            tag: `goal-${dbMatch.id}-${eventKey}`,
            icon: '/images/logo.jpg',
          };
          const deliveries = await Promise.allSettled(
            follower.user.pushSubscriptions.map((subscription) => sendWebPush(subscription, payload))
          );
          if (deliveries.some((delivery) => delivery.status === 'fulfilled')) {
            await prisma.notification.create({
              data: {
                userId: follower.userId,
                matchId: dbMatch.id,
                type: 'GOAL',
                entityType: 'MATCH_EVENT',
                entityId: eventKey,
                payload,
              },
            });
          }
        }
      }
    }

    const finishedIds = persistedMatches
      .filter((match) => match.status === 'FINISHED')
      .map((match) => match.id);
    const settlement = finishedIds.length
      ? await settleFinishedPredictions(finishedIds).catch(() => ({ matches: 0, settled: 0, awarded: 0 }))
      : { matches: 0, settled: 0, awarded: 0 };

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
