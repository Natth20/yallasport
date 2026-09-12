import React from 'react';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ClientTime } from '@/components/datetime/ClientTime';
import { ArrowUpRight, ChevronLeft, Crown, Newspaper, Radio, Search, Trophy } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { DeskRule, EditionPlate, PhotoCorners } from '@/components/news/NewsOrnaments';
import { publicStoryImage } from '@/lib/news/enrich-source';
import { deskAuthorLabel } from '@/lib/news/format-body';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { linkedEntitiesForNews, type NewsEntityChip } from '@/lib/news/entity-suggest';
import { dateKeyInTimezone, dayBoundsInTimezone, normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الأخبار', 'News'),
    description: pick(
      locale,
      'غرفة أخبار يلا سبورت: تقارير من مصادر خارجية، تمر على التحرير، وتُنشر بعد الاعتماد فقط.',
      'Yalla Sport news desk: reports from external sources, reviewed by the desk, published only after approval.'
    ),
    path: '/news',
  });
}

const PAGE_SIZE = 12;

type Story = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  category: string;
  publishedAt: Date | null;
  isPremium: boolean;
  breaking: boolean;
  featured: boolean;
  readingTime: number;
  views: number;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceLocale: string;
  tags: string[];
  author: { name: string | null };
};

type PitchMatch = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date | null;
  homeTeam: { name: string; slug: string; logoUrl: string | null };
  awayTeam: { name: string; slug: string; logoUrl: string | null };
  league: { name: string; slug: string } | null;
};

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  const selectedCategory = params.category?.trim() ?? 'all';
  const page = Math.max(1, Number(params.page) || 1);
  const now = new Date();
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);
  const todayKey = dateKeyInTimezone(now, timezone);
  const { start, end } = dayBoundsInTimezone(todayKey, timezone);

  const where = {
    AND: [
      newsVisibleWhere(locale),
      ...(query
        ? [
            {
              OR: [
                { title: { contains: query } },
                { excerpt: { contains: query } },
                { tags: { has: query } },
                {
                  translations: {
                    some: {
                      locale,
                      status: 'APPROVED' as const,
                      OR: [{ title: { contains: query } }, { excerpt: { contains: query } }],
                    },
                  },
                },
              ],
            },
          ]
        : []),
      ...(selectedCategory !== 'all' ? [{ category: selectedCategory }] : []),
    ],
  };

  const storySelect = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    featuredImage: true,
    ogImage: true,
    category: true,
    publishedAt: true,
    isPremium: true,
    breaking: true,
    featured: true,
    readingTime: true,
    views: true,
    sourceName: true,
    sourceUrl: true,
    sourceLocale: true,
    tags: true,
    author: { select: { name: true } },
  } as const;

  const [articles, total, extras, pitchRows] = await Promise.all([
    prisma.news.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { breaking: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: storySelect,
    }),
    prisma.news.count({ where }),
    prisma.news.findMany({
      where: newsVisibleWhere(locale),
      orderBy: { publishedAt: 'desc' },
      take: 60,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        category: true,
        views: true,
        featuredImage: true,
        ogImage: true,
        breaking: true,
        publishedAt: true,
        sourceName: true,
        sourceLocale: true,
      },
    }),
    prisma.match
      .findMany({
        where: {
          OR: [
            { status: { in: ['LIVE', 'HALFTIME'] } },
            { kickoffAt: { gte: start, lt: end } },
          ],
        },
        orderBy: { kickoffAt: 'asc' },
        take: 8,
        select: {
          id: true,
          status: true,
          homeScore: true,
          awayScore: true,
          minute: true,
          kickoffAt: true,
          homeTeam: { select: { name: true, slug: true, logoUrl: true } },
          awayTeam: { select: { name: true, slug: true, logoUrl: true } },
          league: { select: { name: true, slug: true } },
        },
      })
      .catch(() => [] as PitchMatch[]),
  ]);

  const localizedArticles = (await overlayNewsList(articles, locale)) as Story[];
  const localizedExtras = await overlayNewsList(extras, locale);
  const entityMap = await linkedEntitiesForNews(
    localizedArticles.map((story) => story.id),
    locale
  );

  const categories = Array.from(
    new Set(localizedExtras.map((entry) => entry.category).filter(Boolean))
  ).sort((first, second) => first.localeCompare(second, locale));
  const mostRead = [...localizedExtras].sort((first, second) => second.views - first.views).slice(0, 5);
  const breaking = localizedExtras.find((article) => article.breaking) ?? null;
  const lead = page === 1 ? localizedArticles[0] ?? null : null;
  const rest = lead ? localizedArticles.slice(1) : localizedArticles;
  const fromDesk = lead
    ? localizedExtras.filter((article) => article.category === lead.category && article.id !== lead.id).slice(0, 4)
    : [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pitch = (pitchRows as PitchMatch[]).sort((first, second) => {
    const live = (status: string) => (status === 'LIVE' || status === 'HALFTIME' ? 0 : 1);
    return live(first.status) - live(second.status);
  });

  const hrefFor = (next: { q?: string; category?: string; page?: number }) => {
    const search = new URLSearchParams();
    const nextQuery = next.q ?? query;
    const nextCategory = next.category ?? selectedCategory;
    const nextPage = next.page ?? 1;
    if (nextQuery) search.set('q', nextQuery);
    if (nextCategory !== 'all') search.set('category', nextCategory);
    if (nextPage > 1) search.set('page', String(nextPage));
    const value = search.toString();
    return value ? `/news?${value}` : '/news';
  };

  const filtered = Boolean(query || selectedCategory !== 'all');
  const liveOnPitch = pitch.filter((match) => match.status === 'LIVE' || match.status === 'HALFTIME').length;

  return (
    <div className="news-edition min-h-screen pb-28">
      <div className="news-flood" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {pitch.length > 0 && <EditionWire matches={pitch} locale={locale} />}

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:px-6 lg:px-8">
        <header className="news-mast">
          <div className="news-mast-row">
            <div className="news-mast-brand">
              <EditionPlate year={now.getFullYear()} label={pick(locale, 'العدد', 'Issue')} />
              <div>
                <p className="news-mast-wordmark">
                  Yalla <span>Desk</span>
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.26em]">
                  <span className="inline-flex items-center gap-2 text-orange-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.9)]" />
                    {pick(locale, 'غرفة الأخبار', 'News desk')}
                  </span>
                  <span className="hidden h-px w-6 bg-orange-400/35 sm:block" />
                  <span className="text-muted-foreground dark:text-foreground/40">
                    <ClientTime value={now} options={{ weekday: 'long', day: 'numeric', month: 'long' }} />
                  </span>
                </div>
              </div>
            </div>
            <div className="max-w-sm sm:text-end">
              <TicketBarcode className="mb-2 ms-auto text-muted-foreground/50 dark:text-foreground/25" />
              <p className="text-[11px] font-medium leading-6 tracking-normal text-muted-foreground dark:text-foreground/40">
                {pick(
                  locale,
                  'من المصدر، بعد اعتماد التحرير فقط — بلا ضجيج ولا عناوين بلا أصل.',
                  'From the source, after desk approval only — no noise, no sourceless headlines.'
                )}
              </p>
            </div>
          </div>
          <DeskRule className="mt-3" />
        </header>

        {lead ? (
          <NewsCover story={lead} locale={locale} entities={entityMap.get(lead.id) ?? []} />
        ) : (
          <EmptyDesk locale={locale} filtered={filtered} />
        )}

        {breaking && breaking.id !== lead?.id && (
          <Link href={`/news/${breaking.slug}`} className="news-breaking mt-5">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.16em] text-red-500">
              {pick(locale, 'عاجل', 'Breaking')}
            </span>
            <strong className="min-w-0 truncate text-sm text-foreground dark:text-foreground">{breaking.title}</strong>
            <ChevronLeft className="ms-auto h-4 w-4 shrink-0 text-red-400 rtl:rotate-180" />
          </Link>
        )}

        <div className="news-desk-tools mt-6">
          <form method="get" className="news-desk-search">
            <button
              type="submit"
              className="absolute start-0 top-1/2 -translate-y-1/2 text-orange-500"
              aria-label={pick(locale, 'بحث', 'Search')}
            >
              <Search className="h-4 w-4" />
            </button>
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder={pick(
                locale,
                'ابحث في التقارير المعتمدة فقط…',
                'Search approved reports only…'
              )}
              className="dark:text-foreground"
            />
            {selectedCategory !== 'all' && <input type="hidden" name="category" value={selectedCategory} />}
          </form>
          <nav className="news-desk-desks no-scrollbar" aria-label={pick(locale, 'أبواب التغطية', 'Coverage desks')}>
            <Link
              href={hrefFor({ category: 'all', page: 1 })}
              className={`news-desk-chip ${selectedCategory === 'all' ? 'is-active' : ''}`}
            >
              {pick(locale, 'كل الأبواب', 'All desks')}
            </Link>
            {categories.map((category) => (
              <Link
                key={category}
                href={hrefFor({ category, page: 1 })}
                className={`news-desk-chip ${selectedCategory === category ? 'is-active' : ''}`}
              >
                {deskLabel(category, locale)}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      <main className="relative z-10 mx-auto mt-10 max-w-7xl px-5 sm:px-6 lg:px-8">
        <section className="grid items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {rest.length > 0 ? (
              <div>
                <div className="news-section-head">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-orange-500">
                      {pick(locale, 'السجل', 'The log')}
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground dark:text-foreground sm:text-3xl">
                      {pick(locale, 'أحدث التقارير المعتمدة', 'Latest approved reports')}
                    </h2>
                    <DeskRule className="news-section-ornament" />
                  </div>
                  <span className="rounded-full border border-border/80 px-3 py-1 text-[10px] font-semibold text-muted-foreground dark:border-border">
                    {total} {pick(locale, 'خبر', 'stories')}
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {rest.map((story, index) => (
                    <NewsTile
                      key={story.id}
                      story={story}
                      locale={locale}
                      index={index + (lead ? 2 : 1)}
                      entities={entityMap.get(story.id) ?? []}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {page > 1 && (
                      <Link
                        href={hrefFor({ page: page - 1 })}
                        className="rounded-xl border border-border px-4 py-2 text-[10px] font-bold text-muted-foreground dark:border-border"
                      >
                        {pick(locale, 'السابق', 'Previous')}
                      </Link>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {page} / {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link
                        href={hrefFor({ page: page + 1 })}
                        className="rounded-xl bg-foreground px-4 py-2 text-[10px] font-bold text-white dark:bg-card dark:text-foreground"
                      >
                        {pick(locale, 'التالي', 'Next')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EditionChapters locale={locale} liveCount={liveOnPitch} pitchCount={pitch.length} />
            )}
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <MostReadRail articles={mostRead} locale={locale} />
            <PitchPanel matches={pitch} locale={locale} />
            {fromDesk.length > 0 && lead && (
              <div className="news-same-desk">
                <div className="border-b border-border px-5 py-4 dark:border-border">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500">
                    {pick(locale, 'نفس الباب', 'Same desk')}
                  </p>
                  <h2 className="mt-1 text-base font-bold text-foreground dark:text-foreground">
                    {deskLabel(lead.category, locale)}
                  </h2>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-white/5">
                  {fromDesk.map((article) => (
                    <Link
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="block px-5 py-3.5 transition-colors hover:bg-orange-50/50 dark:hover:bg-card/[0.04]"
                    >
                      <strong className="block text-[13px] font-bold leading-6 text-foreground dark:text-foreground">
                        {article.title}
                      </strong>
                      {article.publishedAt && (
                        <ClientTime value={article.publishedAt} className="mt-1 block text-[10px] text-muted-foreground" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </section>

        <p aria-hidden="true" className="news-colophon-mark">
          DESK
        </p>
      </main>
    </div>
  );
}

function EditionWire({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  return (
    <div className="news-wire">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-2.5 sm:px-6 lg:px-8">
        <span className="shrink-0 rounded-full bg-orange-500 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.18em] text-primary-foreground">
          {pick(locale, 'سلك الملعب', 'Pitch wire')}
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-6 overflow-x-auto no-scrollbar">
          {matches.map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex shrink-0 items-center gap-2 text-[11px] font-semibold text-white/75 hover:text-orange-300"
              >
                <span className="max-w-[8rem] truncate">{match.homeTeam.name}</span>
                {live ? (
                  <span className="tabular-nums text-orange-400">
                    {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                      ? `${match.homeScore}–${match.awayScore}`
                      : '—'}
                  </span>
                ) : match.kickoffAt ? (
                  <ClientTime value={match.kickoffAt} className="tabular-nums text-orange-300" />
                ) : (
                  <span className="text-white/40">vs</span>
                )}
                <span className="max-w-[8rem] truncate">{match.awayTeam.name}</span>
                {live && <Radio className="h-3 w-3 text-red-400" />}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyDesk({ locale, filtered }: { locale: string; filtered: boolean }) {
  return (
    <div className="news-empty-desk">
      <span className="news-cover-folio" aria-hidden="true">
        YS
      </span>
      <PitchWatermark className="pointer-events-none absolute inset-0 m-auto h-[70%] w-[70%] text-white/[0.07]" />
      <div className="relative flex min-h-[inherit] flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <p className="news-cover-kicker">
          <span className="h-px w-5 bg-orange-400/80" />
          {pick(locale, 'غلاف المساء', 'Evening cover')}
        </p>
        <div className="max-w-xl">
          <h1 className="news-cover-title">
            {filtered
              ? pick(locale, 'لا تقرير مطابق في الغرفة.', 'No matching report in the desk.')
              : pick(locale, 'بانتظار أول تقرير معتمد.', 'Awaiting the first approved report.')}
          </h1>
          <p className="news-cover-excerpt mt-4">
            {filtered
              ? pick(
                  locale,
                  'غيّر البحث أو الباب — لا نعرض إلا ما مرّ على التحرير واعتمد للنشر.',
                  'Change the search or desk — only desk-approved copy reaches this page.'
                )
              : pick(
                  locale,
                  'الأخبار تصل من مصادر خارجية، تُراجع في الداشبورد، ثم تُنشر هنا بعد الاعتماد فقط.',
                  'Stories arrive from external sources, are reviewed in the dashboard, then appear here only after approval.'
                )}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <TicketBarcode className="text-white/30" />
            <div className="flex flex-wrap gap-2">
              {[
                pick(locale, 'من المصدر', 'From source'),
                pick(locale, 'مراجعة التحرير', 'Desk review'),
                pick(locale, 'معتمد للنشر', 'Approved to publish'),
              ].map((stamp) => (
                <span
                  key={stamp}
                  className="rounded-full border border-white/10 bg-card/[0.04] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/55"
                >
                  {stamp}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/matches"
              className="rounded-full bg-orange-500 px-4 py-2 text-[10px] font-bold text-primary-foreground hover:bg-orange-400"
            >
              {pick(locale, 'جدول المباريات', 'Match table')}
            </Link>
            <Link
              href="/live"
              className="rounded-full border border-white/15 px-4 py-2 text-[10px] font-bold text-white/80 hover:border-orange-400 hover:text-orange-300"
            >
              {pick(locale, 'البثوث', 'Broadcasts')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditionChapters({
  locale,
  liveCount,
  pitchCount,
}: {
  locale: string;
  liveCount: number;
  pitchCount: number;
}) {
  const chapters = [
    {
      href: '/matches',
      icon: Newspaper,
      kicker: pick(locale, 'اليوم', 'Today'),
      title: pick(locale, 'المباريات', 'Matches'),
      meta:
        pitchCount > 0
          ? `${pitchCount} ${pick(locale, 'على الملعب', 'on the pitch')}`
          : pick(locale, 'افتح الجدول', 'Open the table'),
    },
    {
      href: '/leagues',
      icon: Trophy,
      kicker: pick(locale, 'الأبواب', 'Desks'),
      title: pick(locale, 'البطولات', 'Leagues'),
      meta: pick(locale, 'الترتيب والأرشيف', 'Tables and archive'),
    },
    {
      href: '/live',
      icon: Radio,
      kicker: pick(locale, 'البث', 'Broadcast'),
      title: pick(locale, 'المباشر', 'Live'),
      meta:
        liveCount > 0
          ? `${liveCount} ${pick(locale, 'الآن', 'now')}`
          : pick(locale, 'غرفة البث', 'The booth'),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {chapters.map((chapter) => (
        <Link
          key={chapter.href}
          href={chapter.href}
          className="group rounded-2xl border border-border/80 bg-white/80 px-4 py-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 dark:border-border dark:bg-card/[0.03]"
        >
          <chapter.icon className="h-4 w-4 text-orange-500" />
          <span className="mt-4 block text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {chapter.kicker}
          </span>
          <strong className="mt-1 block text-lg font-bold text-foreground group-hover:text-orange-500 dark:text-foreground">
            {chapter.title}
          </strong>
          <span className="mt-1 block text-[11px] text-muted-foreground">{chapter.meta}</span>
        </Link>
      ))}
    </div>
  );
}

function MostReadRail({
  articles,
  locale,
}: {
  articles: { id: string; slug: string; title: string }[];
  locale: string;
}) {
  return (
    <div className="news-circulation">
      <div className="border-b border-white/10 px-5 py-4 ps-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-400">
          {pick(locale, 'التداول', 'Circulation')}
        </p>
        <h2 className="mt-1 text-base font-bold text-white">
          {pick(locale, 'الأكثر قراءة', 'Most read')}
        </h2>
      </div>
      {articles.length > 0 ? (
        <ol className="divide-y divide-white/5">
          {articles.map((article, index) => (
            <li key={article.id}>
              <Link href={`/news/${article.slug}`} className="flex gap-3 px-5 py-3.5 hover:bg-card/[0.04]">
                <span className="w-6 shrink-0 text-lg font-black tabular-nums text-orange-400/80">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <strong className="text-[13px] font-bold leading-6 text-white/90">{article.title}</strong>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <div className="news-ghost-line px-5 py-5">
          {['01', '02', '03', '04', '05'].map((folio) => (
            <div key={folio} className="flex items-center gap-3 py-2.5">
              <span className="w-6 text-sm text-white/20">{folio}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          ))}
          <p className="pt-2 text-[11px] text-white/35">
            {pick(locale, 'بانتظار التداول — لا تقارير معتمدة بعد.', 'Awaiting circulation — no approved reports yet.')}
          </p>
        </div>
      )}
    </div>
  );
}

function deskLabel(category: string, locale: string) {
  const lower = category.toLowerCase();
  if (/football|soccer|كرة/.test(lower)) return pick(locale, 'كرة القدم', 'Football');
  if (/transfer|انتقال/.test(lower)) return pick(locale, 'الانتقالات', 'Transfers');
  if (/international|منتخب/.test(lower)) return pick(locale, 'المنتخبات', 'Internationals');
  if (/sport/.test(lower) && !/football/.test(lower)) return pick(locale, 'رياضة', 'Sport');
  return category;
}

function NewsCover({
  story,
  locale,
  entities,
}: {
  story: Story;
  locale: string;
  entities: NewsEntityChip[];
}) {
  const cover = publicStoryImage(story);
  const desk = deskAuthorLabel(story.author.name, locale, pick);

  return (
    <Link href={`/news/${story.slug}`} className="news-cover group">
      <PhotoCorners />
      <span className="news-cover-folio" aria-hidden="true">
        01
      </span>
      <div className="news-cover-media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" />
        ) : (
          <div className="news-cover-stage">
            <PitchWatermark className="absolute inset-0 m-auto h-[58%] w-[58%] text-white/[0.09]" />
          </div>
        )}
        <div className="news-cover-wash" />
      </div>

      <div className="news-cover-body">
        <div className="flex flex-wrap items-center gap-2">
          <span className="news-cover-kicker">
            <span className="h-px w-5 bg-orange-400/80" />
            {deskLabel(story.category, locale)}
          </span>
          {story.breaking && (
            <span className="rounded-md bg-red-500 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
              {pick(locale, 'عاجل', 'Breaking')}
            </span>
          )}
          {story.featured && (
            <span className="rounded-md border border-white/25 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white/80">
              {pick(locale, 'الغلاف', 'Cover')}
            </span>
          )}
          {story.isPremium && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2.5 py-1 text-[9px] font-bold text-amber-200">
              <Crown className="h-3 w-3" />
              {pick(locale, 'حصري', 'Premium')}
            </span>
          )}
        </div>

        <h1 className="news-cover-title">{story.title}</h1>
        {story.excerpt && <p className="news-cover-excerpt line-clamp-3">{story.excerpt}</p>}

        <div className="news-cover-meta">
          <span>
            {pick(locale, 'المصدر', 'Source')}: {story.sourceName || pick(locale, 'موثوق', 'Trusted')}
          </span>
          <span>
            {pick(locale, 'التحرير', 'Desk')}: {desk}
          </span>
          {story.publishedAt && <ClientTime value={story.publishedAt} />}
          <span className="text-orange-300/90">
            {story.readingTime > 0
              ? `${story.readingTime} ${pick(locale, 'د', 'min')}`
              : pick(locale, 'قراءة سريعة', 'Quick read')}
          </span>
          {story.views > 0 ? (
            <span>
              {story.views} {pick(locale, 'مشاهدة', 'views')}
            </span>
          ) : null}
        </div>

        <span className="news-cover-cta self-start">
          {pick(locale, 'اقرأ التقرير', 'Read report')}
          <ArrowUpRight className="h-3.5 w-3.5 rtl:rotate-[-90deg]" />
        </span>

        {entities.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entities.map((entity) => (
              <span
                key={`${entity.type}-${entity.href}`}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-semibold text-white/80"
              >
                {entity.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function NewsTile({
  story,
  locale,
  index,
  entities,
}: {
  story: Story;
  locale: string;
  index: number;
  entities: NewsEntityChip[];
}) {
  const cover = publicStoryImage(story);
  const desk = deskAuthorLabel(story.author.name, locale, pick);

  return (
    <Link href={`/news/${story.slug}`} className="news-tile group">
      <div className="news-tile-media">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" />
        ) : (
          <div className="news-cover-stage flex h-full items-end justify-between p-4">
            <span className="text-[10px] font-bold tabular-nums tracking-[0.2em] text-white/35">
              {String(index).padStart(2, '0')}
            </span>
            <span className="text-4xl font-black text-white/10">YS</span>
          </div>
        )}
        <span className="news-tile-folio" aria-hidden>
          {String(index).padStart(2, '0')}
        </span>
        <span className="absolute start-3 top-3 rounded-md bg-white/92 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-orange-600 dark:bg-foreground/90 dark:text-orange-300">
          {deskLabel(story.category, locale)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-[9px] font-bold">
          <span className="tabular-nums text-muted-foreground dark:text-foreground/25">{String(index).padStart(2, '0')}</span>
          {story.breaking && <span className="text-red-500">{pick(locale, 'عاجل', 'Breaking')}</span>}
          {story.isPremium && <span className="text-amber-600">{pick(locale, 'حصري', 'Premium')}</span>}
          {story.publishedAt && <ClientTime value={story.publishedAt} className="font-medium text-muted-foreground" />}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-bold leading-snug text-foreground transition-colors group-hover:text-orange-500 dark:text-foreground">
          {story.title}
        </h3>
        {story.excerpt && (
          <p className="line-clamp-2 text-[12px] leading-6 text-muted-foreground dark:text-muted-foreground">{story.excerpt}</p>
        )}
        <div className="mt-auto space-y-1.5 pt-1 text-[10px] text-muted-foreground">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate font-semibold text-muted-foreground dark:text-foreground/55">
              {story.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source')}
            </span>
            <span className="shrink-0 text-orange-500">
              {story.readingTime > 0
                ? `${story.readingTime} ${pick(locale, 'د', 'min')}`
                : pick(locale, 'قراءة سريعة', 'Quick read')}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate">
              {pick(locale, 'التحرير', 'Desk')}: {desk}
            </span>
            {story.views > 0 ? (
              <span>
                {story.views} {pick(locale, 'مشاهدة', 'views')}
              </span>
            ) : null}
          </div>
        </div>
        {story.tags?.length ? (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {story.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border/80 px-2 py-0.5 text-[9px] font-semibold text-muted-foreground dark:border-border"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        {entities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {entities.slice(0, 2).map((entity) => (
              <span
                key={`${entity.type}-${entity.href}`}
                className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-semibold text-orange-700 dark:bg-card/[0.04] dark:text-foreground/50"
              >
                {entity.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function PitchPanel({ matches, locale }: { matches: PitchMatch[]; locale: string }) {
  return (
    <div className="news-pitch-panel">
      <PitchWatermark className="pointer-events-none absolute -end-6 top-10 h-28 w-44 text-orange-500/[0.08]" />
      <div className="relative flex items-center justify-between border-b border-border px-5 py-4 dark:border-border">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-orange-500">
            {pick(locale, 'الملعب', 'The pitch')}
          </p>
          <h2 className="mt-1 text-base font-bold text-foreground dark:text-foreground">
            {pick(locale, 'اليوم من المصدر', 'Today from the source')}
          </h2>
        </div>
        <Link href="/matches" className="text-[10px] font-bold text-orange-500 hover:underline">
          {pick(locale, 'الجدول', 'Fixtures')}
        </Link>
      </div>
      {matches.length > 0 ? (
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {matches.map((match) => {
            const live = match.status === 'LIVE' || match.status === 'HALFTIME';
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-orange-50/40 dark:hover:bg-card/[0.04]"
              >
                <TeamMark name={match.homeTeam.name} logo={match.homeTeam.logoUrl} />
                <div className="min-w-0 flex-1 text-center">
                  {live ? (
                    <span className="block text-[13px] font-bold tabular-nums text-foreground dark:text-foreground">
                      {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                        ? `${match.homeScore}–${match.awayScore}`
                        : '—'}
                    </span>
                  ) : match.kickoffAt ? (
                    <ClientTime
                      value={match.kickoffAt}
                      className="block text-[12px] font-bold tabular-nums text-orange-500"
                    />
                  ) : (
                    <span className="text-[11px] text-muted-foreground">—</span>
                  )}
                  <span className="mt-0.5 flex items-center justify-center gap-1 text-[8px] font-bold uppercase tracking-wider text-muted-foreground">
                    {live && <Radio className="h-2.5 w-2.5 text-red-500" />}
                    {live
                      ? `${pick(locale, 'مباشر', 'Live')}${match.minute ? ` ${match.minute}′` : ''}`
                      : match.league?.name ?? pick(locale, 'موعد', 'Kickoff')}
                  </span>
                </div>
                <TeamMark name={match.awayTeam.name} logo={match.awayTeam.logoUrl} />
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="px-5 py-10 text-center text-xs text-muted-foreground">
          {pick(locale, 'لا مباريات حية أو لليوم في المصدر.', 'No live or today’s matches in the source.')}
        </p>
      )}
    </div>
  );
}

function TeamMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <span className="flex w-[4.6rem] flex-col items-center gap-1">
      <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-muted dark:bg-card/[0.04]">
        {logo ? (
          <img src={logo} alt="" className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[9px] font-bold text-muted-foreground">{name.slice(0, 1)}</span>
        )}
      </span>
      <span className="w-full truncate text-center text-[9px] font-semibold text-foreground dark:text-muted-foreground">
        {name}
      </span>
    </span>
  );
}
