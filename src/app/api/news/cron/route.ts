import { NextResponse } from 'next/server';
import { importFromRSS } from '@/lib/news/rss-service';
import { TRUSTED_RSS_FEEDS } from '@/lib/news/trusted-sources';
import { AlertSeverity, AlertType, logSystemAlert } from '@/lib/monitoring';
import { isAuthorizedCron } from '@/lib/security/cron';
import { prisma } from '@/lib/prisma';

/**
 * Hourly trusted news import + desk alerts.
 * Auth: CRON_SECRET bearer (same as sports sync).
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    let imported = 0;
    for (const feed of TRUSTED_RSS_FEEDS) {
      const result = await importFromRSS(feed.url).catch(() => ({ imported: 0 }));
      imported += result.imported;
    }

    const [pendingCount, breakingPending] = await Promise.all([
      prisma.news.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.news.findMany({
        where: {
          status: 'PENDING_REVIEW',
          OR: [
            { breaking: true },
            { title: { contains: 'breaking', mode: 'insensitive' } },
            { title: { contains: 'عاجل' } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, title: true, sourceName: true, createdAt: true },
      }),
    ]);

    if (imported > 0) {
      await logSystemAlert(
        AlertType.API_ERROR,
        AlertSeverity.MEDIUM,
        `[NEWS_DESK] Imported ${imported} trusted stories for desk review (${pendingCount} pending).`,
        { imported, pendingCount, kind: 'NEWS_DESK' }
      );
    }

    if (breakingPending.length > 0) {
      await logSystemAlert(
        AlertType.API_ERROR,
        AlertSeverity.HIGH,
        `[NEWS_DESK] Breaking / urgent desk queue: ${breakingPending.length} stories need review.`,
        { stories: breakingPending, kind: 'NEWS_DESK' }
      );
    }

    return NextResponse.json({
      success: true,
      imported,
      pendingCount,
      breakingPending: breakingPending.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'News cron failed';
    await logSystemAlert(AlertType.CRON_FAILURE, AlertSeverity.HIGH, message, { route: '/api/news/cron' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
