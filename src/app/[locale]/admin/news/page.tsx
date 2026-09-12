import React from 'react';
import { NewsDeskEditor, EnrichNewsImagesButton } from './components/NewsDeskEditor';
import { NewsLinksReview } from './NewsLinksReview';
import { prisma } from '@/lib/prisma';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { TRUSTED_RSS_FEEDS } from '@/lib/news/trusted-sources';
import { ImportTrustedNewsButton } from './components/ImportTrustedNewsButton';
import { Link } from '@/i18n/navigation';
import { AlertTriangle, Radio } from 'lucide-react';
import type { Prisma } from '@/generated/prisma';

const newsDeskSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  content: true,
  category: true,
  tags: true,
  sourceName: true,
  sourceUrl: true,
  featuredImage: true,
  ogImage: true,
  status: true,
  featured: true,
  breaking: true,
  isPremium: true,
  createdAt: true,
  publishedAt: true,
} as const;

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; source?: string; image?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q?.trim() || '';
  const status = params.status?.trim() || 'PENDING_REVIEW';
  const source = params.source?.trim() || 'all';
  const imageFilter = params.image?.trim() || 'all';

  const allowedStatuses = ['PENDING_REVIEW', 'PUBLISHED', 'DRAFT', 'ARCHIVED', 'all'] as const;
  const statusFilter = allowedStatuses.includes(status as (typeof allowedStatuses)[number])
    ? status
    : 'PENDING_REVIEW';

  const where: Prisma.NewsWhereInput = {
    AND: [
      ...(statusFilter !== 'all' ? [{ status: statusFilter as 'PENDING_REVIEW' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED' }] : []),
      ...(query
        ? [
            {
              OR: [
                { title: { contains: query } },
                { excerpt: { contains: query } },
                { sourceName: { contains: query } },
                { sourceUrl: { contains: query } },
              ],
            },
          ]
        : []),
      ...(source !== 'all' ? [{ sourceName: { contains: source } }] : []),
      ...(imageFilter === 'missing'
        ? [
            {
              AND: [
                { OR: [{ featuredImage: null }, { featuredImage: '' }] },
                { OR: [{ ogImage: null }, { ogImage: '' }] },
              ],
            },
          ]
        : []),
      ...(imageFilter === 'has'
        ? [
            {
              OR: [{ featuredImage: { not: null } }, { ogImage: { not: null } }],
            },
          ]
        : []),
    ],
  };

  const [rows, suggestedLinks, deskAlerts, pendingBreaking, sources] = await Promise.all([
    prisma.news
      .findMany({
        where,
        orderBy: [{ breaking: 'desc' }, { createdAt: 'desc' }],
        take: 50,
        select: newsDeskSelect,
      })
      .catch(() => []),
    prisma.newsEntityLink
      .findMany({
        where: { suggested: true },
        include: { news: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 30,
      })
      .catch(() => []),
    prisma.systemAlert
      .findMany({
        where: {
          isResolved: false,
          message: { startsWith: '[NEWS_DESK]' },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      })
      .catch(() => []),
    prisma.news
      .count({
        where: {
          status: 'PENDING_REVIEW',
          OR: [{ breaking: true }, { title: { contains: 'عاجل' } }, { title: { contains: 'breaking', mode: 'insensitive' } }],
        },
      })
      .catch(() => 0),
    prisma.news
      .findMany({
        where: { sourceName: { not: null } },
        distinct: ['sourceName'],
        select: { sourceName: true },
        take: 40,
      })
      .catch(() => []),
  ]);

  const missingImages = rows.filter((row) => !(row.featuredImage || row.ogImage)).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-black text-brand-green dark:text-foreground">
            {pick(locale, 'إدارة الأخبار', 'Manage news')}
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {pick(
              locale,
              'استيراد تلقائي كل ساعة + مراجعة يدوية: محتوى كامل، صور، معاينة، واعتماد قبل الظهور العام.',
              'Hourly auto-import + manual review: full copy, images, preview, then approve before public publish.'
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <EnrichNewsImagesButton />
          <ImportTrustedNewsButton />
        </div>
      </div>

      {(pendingBreaking > 0 || deskAlerts.length > 0) && (
        <div className="rounded-2xl border border-red-300/50 bg-red-50/80 px-4 py-3 dark:border-red-500/30 dark:bg-red-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="space-y-1 text-sm text-red-800 dark:text-red-100">
              {pendingBreaking > 0 ? (
                <p className="font-bold">
                  {pick(
                    locale,
                    `${pendingBreaking} خبر عاجل بانتظار المراجعة.`,
                    `${pendingBreaking} breaking stories awaiting review.`
                  )}
                </p>
              ) : null}
              {deskAlerts.slice(0, 3).map((alert) => (
                <p key={alert.id} className="text-xs leading-5 opacity-90">
                  {alert.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-orange-200/70 bg-orange-50/60 px-4 py-3 text-xs leading-6 text-orange-900 dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-orange-100">
        <p className="inline-flex items-center gap-2 font-semibold">
          <Radio className="h-3.5 w-3.5" />
          {pick(locale, 'كرون الاستيراد:', 'Import cron:')}{' '}
          <span className="font-normal">/api/news/cron · {pick(locale, 'كل ساعة', 'hourly')}</span>
        </p>
        <p className="mt-1">
          {pick(locale, 'المصادر المسموحة:', 'Allowed sources:')}{' '}
          {TRUSTED_RSS_FEEDS.map((feed) => feed.name)
            .filter((name, index, arr) => arr.indexOf(name) === index)
            .join(' · ')}
        </p>
        {missingImages > 0 ? (
          <p className="mt-1 font-semibold">
            {pick(
              locale,
              `${missingImages} في هذه القائمة بلا صورة.`,
              `${missingImages} in this list are missing images.`
            )}
          </p>
        ) : null}
      </div>

      <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 dark:border-border dark:bg-background sm:grid-cols-2 lg:grid-cols-5">
        <label className="grid gap-1 text-[11px] font-bold text-muted-foreground lg:col-span-2">
          {pick(locale, 'بحث', 'Search')}
          <input
            name="q"
            defaultValue={query}
            placeholder={pick(locale, 'عنوان، مصدر، رابط…', 'Title, source, URL…')}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
          />
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
          {pick(locale, 'الحالة', 'Status')}
          <select
            name="status"
            defaultValue={status}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
          >
            <option value="PENDING_REVIEW">{pick(locale, 'بانتظار المراجعة', 'Pending review')}</option>
            <option value="PUBLISHED">{pick(locale, 'منشور', 'Published')}</option>
            <option value="DRAFT">{pick(locale, 'مسودة', 'Draft')}</option>
            <option value="ARCHIVED">{pick(locale, 'مؤرشف', 'Archived')}</option>
            <option value="all">{pick(locale, 'الكل', 'All')}</option>
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
          {pick(locale, 'المصدر', 'Source')}
          <select
            name="source"
            defaultValue={source}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
          >
            <option value="all">{pick(locale, 'كل المصادر', 'All sources')}</option>
            {sources
              .map((row) => row.sourceName)
              .filter(Boolean)
              .map((name) => (
                <option key={name!} value={name!}>
                  {name}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-1 text-[11px] font-bold text-muted-foreground">
          {pick(locale, 'الصورة', 'Image')}
          <select
            name="image"
            defaultValue={imageFilter}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm dark:border-border dark:bg-foreground dark:text-foreground"
          >
            <option value="all">{pick(locale, 'الكل', 'All')}</option>
            <option value="missing">{pick(locale, 'بلا صورة', 'Missing image')}</option>
            <option value="has">{pick(locale, 'فيها صورة', 'Has image')}</option>
          </select>
        </label>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button
            type="submit"
            className="rounded-lg bg-background px-4 py-2 text-sm font-bold text-white dark:bg-card dark:text-foreground"
          >
            {pick(locale, 'تطبيق الفلاتر', 'Apply filters')}
          </button>
          <Link href="/admin/news" className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-muted-foreground dark:border-border">
            {pick(locale, 'إعادة ضبط', 'Reset')}
          </Link>
        </div>
      </form>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
          {pick(locale, 'قائمة المكتب', 'Desk queue')}
          <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            {rows.length}
          </span>
        </h2>
        <NewsDeskEditor
          items={rows}
          mode={statusFilter === 'PUBLISHED' ? 'published' : 'pending'}
        />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold">
          {pick(locale, 'روابط الكيانات المقترحة', 'Suggested entity links')}
        </h2>
        <NewsLinksReview items={suggestedLinks} />
      </section>
    </div>
  );
}
