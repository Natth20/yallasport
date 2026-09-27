import React from 'react';
import {Link} from '@/i18n/navigation';
import { prisma } from '@/lib/prisma';
import { ClientTime } from '@/components/datetime/ClientTime';
import {getLocale} from 'next-intl/server';
import {pick} from '@/i18n/pick';

export default async function AdminPage() {
  const locale = await getLocale();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [newsCount, todayMatches, pendingCount, pendingNews, upcomingMatches, unreadDesk] = await Promise.all([
    prisma.news.count(),
    prisma.match.count({
      where: { kickoffAt: { gte: startOfDay, lte: endOfDay } },
    }),
    prisma.news.count({ where: { status: 'DRAFT' } }),
    prisma.news.findMany({
      where: { status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: { id: true, slug: true, title: true, sourceName: true, updatedAt: true },
    }),
    prisma.match.findMany({
      where: { kickoffAt: { gte: now }, status: 'NOT_STARTED' },
      orderBy: { kickoffAt: 'asc' },
      take: 5,
      select: {
        id: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
      },
    }),
    prisma.deskMessage.count({ where: { status: 'NEW' } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border-r-4 border-orange-500 bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="text-sm font-medium text-muted-foreground">{pick(locale, 'إجمالي الأخبار', 'Total news')}</h3>
          <p className="mt-2 text-3xl font-bold">{newsCount}</p>
        </div>
        <div className="rounded-lg border-r-4 border-green-500 bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="text-sm font-medium text-muted-foreground">{pick(locale, 'مباريات اليوم', "Today's matches")}</h3>
          <p className="mt-2 text-3xl font-bold">{todayMatches}</p>
        </div>
        <div className="rounded-lg border-r-4 border-blue-500 bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="text-sm font-medium text-muted-foreground">{pick(locale, 'بانتظار المراجعة', 'Awaiting review')}</h3>
          <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
        </div>
        <Link href="/admin/inbox" className="rounded-lg border-r-4 border-orange-400 bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="text-sm font-medium text-muted-foreground">{pick(locale, 'صندوق المكتب', 'Desk inbox')}</h3>
          <p className="mt-2 text-3xl font-bold">{unreadDesk}</p>
          <p className="mt-1 text-xs text-muted-foreground">{pick(locale, 'رسائل غير مقروءة', 'Unread messages')}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="mb-4 text-lg font-bold">{pick(locale, 'آخر الأخبار بانتظار المراجعة', 'Latest news awaiting review')}</h3>
          {pendingNews.length > 0 ? (
            <div className="space-y-4">
              {pendingNews.map((article) => (
                <Link
                  key={article.id}
                  href="/admin/news"
                  className="flex items-center justify-between border-b border-border p-3 last:border-0 dark:border-gray-700"
                >
                  <div>
                    <h4 className="text-sm font-medium">{article.title}</h4>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {article.sourceName || pick(locale, 'غرفة التحرير', 'Newsroom')} — <ClientTime value={article.updatedAt} />
                    </p>
                  </div>
                  <span className="text-xs font-bold text-blue-500">{pick(locale, 'مراجعة', 'Review')}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{pick(locale, 'لا توجد مسودات بانتظار المراجعة', 'No drafts awaiting review')}</p>
          )}
        </div>

        <div className="rounded-lg bg-card p-6 shadow-md dark:bg-muted">
          <h3 className="mb-4 text-lg font-bold">{pick(locale, 'المباريات القادمة', 'Upcoming matches')}</h3>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="flex items-center justify-between border-b border-border p-3 last:border-0 dark:border-gray-700"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {match.homeTeam.logoUrl && (
                      <img src={match.homeTeam.logoUrl} alt="" className="h-8 w-8 object-contain" />
                    )}
                    <span className="truncate text-sm">
                      {match.homeTeam.name} vs {match.awayTeam.name}
                    </span>
                  </div>
                  <ClientTime value={match.kickoffAt} className="shrink-0 text-xs text-muted-foreground" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">{pick(locale, 'لا توجد مباريات قادمة مسجّلة', 'No upcoming matches recorded')}</p>
          )}
        </div>
      </div>
    </div>
  );
}
