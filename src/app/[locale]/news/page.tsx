import React from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Newspaper, Radio, Trophy } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import {
  BreakingStrip,
  DeskTools,
  EditionMast,
  EditionWire,
} from '@/components/news/desk/DeskChrome';
import { NewsCover, NewsSubLead, NewsTile } from '@/components/news/desk/DeskStories';
import {
  MostReadRail,
  PitchPanel,
  SameDeskRail,
  SourceLedger,
  TeamsInNewsRail,
} from '@/components/news/desk/DeskRails';
import { ArchiveStrip, BandHead, BroadcastBand, GoalsBand, TablesBand } from '@/components/news/desk/DeskBands';
import { TransferRumorsHub } from '@/components/news/TransferRumorsHub';
import { linkedEntitiesForNews } from '@/lib/news/entity-suggest';
import { loadNewsDesk } from '@/lib/news/load-desk';
import { normalizeTimezone } from '@/lib/datetime/format';
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

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desk?: string; category?: string; source?: string; page?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  // `category` is the old param name; keep honouring it so existing links live.
  const desk = (params.desk ?? params.category)?.trim() || 'all';
  const source = params.source?.trim() || 'all';
  const page = Math.max(1, Number(params.page) || 1);
  const now = new Date();
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);

  const data = await loadNewsDesk({ locale, timezone, query, desk, source, page });
  const entityMap = await linkedEntitiesForNews(
    [data.lead, ...data.subLeads, ...data.rest].filter(Boolean).map((story) => story!.id),
    locale
  );

  const hrefFor = (next: { q?: string; desk?: string; source?: string; page?: number }) => {
    const search = new URLSearchParams();
    const nextQuery = next.q ?? query;
    const nextDesk = next.desk ?? desk;
    const nextSource = next.source ?? source;
    const nextPage = next.page ?? 1;
    if (nextQuery) search.set('q', nextQuery);
    if (nextDesk !== 'all') search.set('desk', nextDesk);
    if (nextSource !== 'all') search.set('source', nextSource);
    if (nextPage > 1) search.set('page', String(nextPage));
    const value = search.toString();
    return value ? `/news?${value}` : '/news';
  };

  return (
    <div className="news-edition min-h-screen pb-28">
      <div className="news-flood" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      {data.pitch.length > 0 && <EditionWire matches={data.pitch} locale={locale} />}

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:px-6 lg:px-8">
        <EditionMast locale={locale} year={now.getFullYear()} now={now} stats={data.stats} />

        {data.lead ? (
          <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
              <NewsCover story={data.lead} locale={locale} entities={entityMap.get(data.lead.id) ?? []} />
            </div>
            {data.subLeads.length > 0 && (
              <div className="flex flex-col gap-4 lg:col-span-5 xl:col-span-4 justify-between">
                {data.subLeads.slice(0, 3).map((story, index) => (
                  <NewsSubLead key={story.id} story={story} locale={locale} index={index + 2} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <EmptyDesk locale={locale} filtered={data.filtered} />
        )}

        {(data.breaking || data.freshest[0]) && (
          <BreakingStrip
            slug={(data.breaking || data.freshest[0])!.slug}
            title={(data.breaking || data.freshest[0])!.title}
            publishedAt={(data.breaking || data.freshest[0])!.publishedAt}
            locale={locale}
          />
        )}

        <DeskTools
          locale={locale}
          query={query}
          selectedDesk={desk}
          selectedSource={source}
          deskChips={data.deskChips}
          sources={data.sources}
          hrefFor={hrefFor}
        />
      </div>

      <main className="relative z-10 mx-auto mt-10 max-w-7xl px-5 sm:px-6 lg:px-8">
        <section className="grid items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {data.rest.length > 0 ? (
              <div>
                <BandHead
                  locale={locale}
                  kicker={pick(locale, 'السجل', 'The log')}
                  title={pick(locale, 'أحدث التقارير المعتمدة', 'Latest approved reports')}
                />
                <div className="-mt-2 mb-5 text-[11px] font-semibold text-muted-foreground">
                  {data.total} {pick(locale, 'تقرير مطابق', 'matching reports')}
                  {data.filtered && (
                    <>
                      {' · '}
                      <Link href="/news" className="text-orange-500 hover:underline">
                        {pick(locale, 'امسح المرشّحات', 'Clear filters')}
                      </Link>
                    </>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {data.rest.map((story, index) => (
                    <NewsTile
                      key={story.id}
                      story={story}
                      locale={locale}
                      index={index + (data.page - 1) * 12 + (data.lead ? 4 : 1)}
                      entities={entityMap.get(story.id) ?? []}
                    />
                  ))}
                </div>

                {data.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {data.page > 1 && (
                      <Link
                        href={hrefFor({ page: data.page - 1 })}
                        className="rounded-xl border border-border px-4 py-2 text-[10px] font-bold text-muted-foreground"
                      >
                        {pick(locale, 'السابق', 'Previous')}
                      </Link>
                    )}
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {data.page} / {data.totalPages}
                    </span>
                    {data.page < data.totalPages && (
                      <Link
                        href={hrefFor({ page: data.page + 1 })}
                        className="rounded-xl bg-foreground px-4 py-2 text-[10px] font-bold text-white dark:bg-card dark:text-foreground"
                      >
                        {pick(locale, 'التالي', 'Next')}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <EditionChapters locale={locale} liveCount={data.liveCount} pitchCount={data.pitch.length} />
            )}
          </div>

          <aside className="space-y-5 lg:col-span-4">
            <MostReadRail articles={data.mostRead} locale={locale} />
            <PitchPanel matches={data.pitch} locale={locale} />
            <SourceLedger sources={data.sources} locale={locale} selected={source} hrefFor={hrefFor} />
            <TeamsInNewsRail teams={data.teamsInNews} locale={locale} />
            {data.lead && (
              <SameDeskRail articles={data.sameDesk} category={data.lead.category} locale={locale} />
            )}
          </aside>
        </section>

        <TablesBand tables={data.tables} locale={locale} />
        <GoalsBand goals={data.goals} locale={locale} />
        <BroadcastBand broadcasts={data.broadcasts} locale={locale} />
        <TransferRumorsHub locale={locale} />
        <ArchiveStrip archive={data.archive} locale={locale} hrefFor={hrefFor} />

        <p aria-hidden="true" className="news-colophon-mark">
          DESK
        </p>
      </main>
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
      meta: liveCount > 0 ? `${liveCount} ${pick(locale, 'الآن', 'now')}` : pick(locale, 'غرفة البث', 'The booth'),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {chapters.map((chapter) => (
        <Link
          key={chapter.href}
          href={chapter.href}
          className="group rounded-2xl border border-border/80 bg-card/80 px-4 py-5 transition-all hover:-translate-y-0.5 hover:border-orange-300 dark:bg-card/[0.03]"
        >
          <chapter.icon className="h-4 w-4 text-orange-500" />
          <span className="mt-4 block text-[8px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {chapter.kicker}
          </span>
          <strong className="mt-1 block text-lg font-bold text-foreground group-hover:text-orange-500">
            {chapter.title}
          </strong>
          <span className="mt-1 block text-[11px] text-muted-foreground">{chapter.meta}</span>
        </Link>
      ))}
    </div>
  );
}
