import { swallow } from '@/lib/ops/caught';
import { NextResponse } from 'next/server';
import { archiveOffFootballNews } from '@/lib/news/archive-off-football';
import { importFromRSS } from '@/lib/news/rss-service';
import { TRUSTED_RSS_FEEDS } from '@/lib/news/trusted-sources';
import { AlertSeverity, AlertType, logSystemAlert } from '@/lib/monitoring';
import { isAuthorizedCron } from '@/lib/security/cron';
import { prisma } from '@/lib/prisma';
import { alertRecentPublishedBreaking } from '@/lib/notifications/news-alerts';
import { revalidateAfterNewsIngest } from '@/lib/cache/revalidate-public';

/**
 * Hourly trusted news import used to wait for the desk. Trusted feeds now publish
 * on ingest so photos/news halls show the latest source copy, then the desk can still edit.
 * Auth: CRON_SECRET bearer (same as sports sync).
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    let imported = 0;
    for (const feed of TRUSTED_RSS_FEEDS) {
      const result = await importFromRSS(feed.url).catch(swallow("src/app/api/news/cron/route.ts:20", ({ imported: 0 })));
      imported += result.imported;
    }
    const archivedOffDesk = await archiveOffFootballNews().catch(swallow('src/app/api/news/cron/route.ts:archive', 0));

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

    const breakingPushed = await alertRecentPublishedBreaking();
    revalidateAfterNewsIngest();

    return NextResponse.json({
      success: true,
      imported,
      archivedOffDesk,
      pendingCount,
      breakingPending: breakingPending.length,
      breakingPushed,
      autoPublished: imported,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'News cron failed';
    await logSystemAlert(AlertType.CRON_FAILURE, AlertSeverity.HIGH, message, { route: '/api/news/cron' });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
