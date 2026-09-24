import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Newspaper, Radio, Trophy } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { PitchWatermark, TicketBarcode } from '@/components/decor/CraftMarks';
import { BreakingStrip, EditionWire } from '@/components/news/desk/DeskChrome';
import {
  NewsInkCard,
  NewsInkDesks,
  NewsInkFresh,
  NewsInkLead,
  NewsInkLedger,
  NewsInkMast,
  NewsInkPulse,
  NewsInkTools,
} from '@/components/news/NewsInk';
import {
  MostReadRail,
  SameDeskRail,
  SourceLedger,
  TeamsInNewsRail,
} from '@/components/news/desk/DeskRails';
import { BandHead, BroadcastBand, GoalsBand, TablesBand } from '@/components/news/desk/DeskBands';
import { loadNewsDesk, loadNewsSidecars } from '@/lib/news/load-desk';
import { normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';

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

export default function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desk?: string; category?: string; source?: string; page?: string; day?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <NewsPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function NewsPageBody({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; desk?: string; category?: string; source?: string; page?: string; day?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const query = params.q?.trim() ?? '';
  // `category` is the old param name; keep honouring it so existing links live.
  const desk = (params.desk ?? params.category)?.trim() || 'all';
  const source = params.source?.trim() || 'all';
  const page = Math.max(1, Number(params.page) || 1);
  const day = params.day?.trim() || '';
  const timezone = normalizeTimezone((await cookies()).get('yalla-tz')?.value);

  const data = await loadNewsDesk({ locale, timezone, query, desk, source, page, day: day || undefined });

  const hrefFor = (next: { q?: string; desk?: string; source?: string; page?: number; day?: string | null }) => {
    const search = new URLSearchParams();
    const nextQuery = next.q ?? query;
    const nextDesk = next.desk ?? desk;
    const nextSource = next.source ?? source;
    const nextPage = next.page ?? 1;
    const nextDay = next.day === null ? '' : (next.day ?? day);
    if (nextQuery) search.set('q', nextQuery);
    if (nextDesk !== 'all') search.set('desk', nextDesk);
    if (nextSource !== 'all') search.set('source', nextSource);
    if (nextDay) search.set('day', nextDay);
    if (nextPage > 1) search.set('page', String(nextPage));
    const value = search.toString();
    return value ? `/news?${value}` : '/news';
  };

  return (
    <div className="nk-hall">
      <span className="nk-aura" aria-hidden />
      <span className="nk-grain" aria-hidden />

      <Suspense fallback={<FrontSkeleton kind="pulse" />}>
        <NewsWire timezone={timezone} locale={locale} />
      </Suspense>

      <div className="nk-inner">
        <NewsInkMast locale={locale} stats={data.stats} />

        <div className="nk-board">
          <div className="min-w-0">
            {data.lead ? (
              <div className="nk-stage">
                <NewsInkLead story={data.lead} locale={locale} />
                {data.subLeads.length > 0 ? (
                  <div className="nk-side">
                    {data.subLeads.slice(0, 3).map((story) => (
                      <NewsInkCard key={story.id} story={story} locale={locale} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyDesk locale={locale} filtered={data.filtered} />
            )}

            <NewsInkFresh
              stories={data.freshest.filter((story) => story.id !== data.lead?.id).slice(0, 3)}
              locale={locale}
            />

            {data.breaking ? (
              <div className="mt-4">
                <BreakingStrip
                  slug={data.breaking.slug}
                  title={data.breaking.title}
                  publishedAt={data.breaking.publishedAt}
                  locale={locale}
                />
              </div>
            ) : null}

            <NewsInkTools
              locale={locale}
              query={query}
              selectedDesk={desk}
              selectedSource={source}
              desks={data.deskChips}
              sources={data.sources}
              hrefFor={hrefFor}
            />

            {data.rest.length > 0 ? (
              <div className="nk-folio">
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

                <div className="nk-log">
                  {data.rest.map((story) => (
                    <NewsInkCard key={story.id} story={story} locale={locale} />
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
              <div className="mt-6">
                <EditionChapters locale={locale} liveCount={data.liveCount} pitchCount={data.pitch.length} />
              </div>
            )}
          </div>

          <aside className="nk-rail">
            <MostReadRail articles={data.mostRead} locale={locale} />
            <SourceLedger sources={data.sources} locale={locale} selected={source} hrefFor={hrefFor} />
            {data.lead && (
              <SameDeskRail articles={data.sameDesk} category={data.lead.category} locale={locale} />
            )}
            <Suspense fallback={<FrontSkeleton kind="chapter" />}>
              <NewsTeamsRail timezone={timezone} locale={locale} />
            </Suspense>
          </aside>
        </div>

        <Suspense fallback={<FrontSkeleton kind="chapter" />}>
          <NewsSportBands timezone={timezone} locale={locale} />
        </Suspense>

        <div className="nk-close">
          <NewsInkPulse archive={data.archive} locale={locale} hrefFor={hrefFor} />
          <div className="nk-atlas">
            <NewsInkDesks desks={data.deskChips} locale={locale} selected={desk} hrefFor={hrefFor} />
            <NewsInkLedger sources={data.sources} locale={locale} />
          </div>
        </div>

        <p aria-hidden="true" className="news-colophon-mark">
          DESK
        </p>
      </div>
    </div>
  );
}

async function NewsWire({ timezone, locale }: { timezone: string; locale: string }) {
  const side = await loadNewsSidecars({ locale, timezone });
  if (side.pitch.length === 0) return null;
  return <EditionWire matches={side.pitch} locale={locale} />;
}

async function NewsTeamsRail({ timezone, locale }: { timezone: string; locale: string }) {
  const side = await loadNewsSidecars({ locale, timezone });
  return <TeamsInNewsRail teams={side.teamsInNews} locale={locale} />;
}

async function NewsSportBands({ timezone, locale }: { timezone: string; locale: string }) {
  const side = await loadNewsSidecars({ locale, timezone });
  return (
    <>
      <TablesBand tables={side.tables} locale={locale} />
      <GoalsBand goals={side.goals} locale={locale} />
      <BroadcastBand broadcasts={side.broadcasts} locale={locale} />
    </>
  );
}

function EmptyDesk({ locale, filtered }: { locale: string; filtered: boolean }) {
  return (
    <div className="news-empty-desk">
      <PitchWatermark className="pointer-events-none absolute inset-0 m-auto h-[70%] w-[70%] text-foreground/10" />
      <div className="relative flex min-h-[inherit] flex-col justify-between gap-8 px-6 py-8 sm:px-10 sm:py-10">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-primary">
          {pick(locale, 'غلاف المساء', 'Evening cover')}
        </p>
        <div className="max-w-xl">
          <h1 className="text-[clamp(1.25rem,2.4vw,1.7rem)] font-black tracking-tight text-foreground">
            {filtered
              ? pick(locale, 'لا تقرير مطابق في الغرفة.', 'No matching report in the desk.')
              : pick(locale, 'لا توجد أخبار حديثة متاحة حالياً.', 'No recent news is available right now.')}
          </h1>
          <p className="mt-4 text-[0.92rem] leading-7 text-muted-foreground">
            {filtered
              ? pick(
                locale,
                'غيّر البحث أو الباب أو يوم الأرشيف — لا نعرض إلا ما مرّ على التحرير واعتمد للنشر.',
                'Change the search, desk, or archive day — only desk-approved copy reaches this page.'
              )
              : pick(
                locale,
                'عاجل وحديث يُعرضان فقط إن نُشر الخبر خلال 48 ساعة. الأقدم في شريط الأرشيف أسفل الصفحة.',
                'Breaking and latest only include stories published in the last 48 hours. Older filings sit in the archive strip below.'
              )}
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <TicketBarcode className="text-muted-foreground/50" />
            <div className="flex flex-wrap gap-2">
              {[
                pick(locale, 'من المصدر', 'From source'),
                pick(locale, 'مراجعة التحرير', 'Desk review'),
                pick(locale, 'معتمد للنشر', 'Approved to publish'),
              ].map((stamp) => (
                <span
                  key={stamp}
                  className="rounded-full border border-border bg-card/70 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
                >
                  {stamp}
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/matches"
              className="rounded-full bg-primary px-4 py-2 text-[10px] font-bold text-primary-foreground"
            >
              {pick(locale, 'جدول المباريات', 'Match table')}
            </Link>
            <Link
              href="/live"
              className="rounded-full border border-border px-4 py-2 text-[10px] font-bold text-foreground"
            >
              {pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live')}
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
      title: pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live'),
      meta: liveCount > 0 ? `${liveCount} ${pick(locale, 'الآن', 'now')}` : pick(locale, 'غرفة البث', 'The booth'),
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {chapters.map((chapter) => (
        <Link
          key={chapter.href}
          href={chapter.href}
          className="group rounded-2xl border border-border/80 bg-card/80 px-4 py-5 transition-colors hover:border-orange-300 dark:bg-card/[0.03]"
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
