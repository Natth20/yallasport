import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Newspaper, Radio, Camera, Clapperboard } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { pick } from '@/i18n/pick';
import { BreakingStrip } from '@/components/news/desk/DeskChrome';
import {
  NewsInkCard,
  NewsInkCover,
  NewsInkLanes,
  NewsInkMast,
  NewsInkPulse,
  NewsInkQueue,
  NewsInkTools,
} from '@/components/news/NewsInk';
import { BroadcastBand, GoalsBand, TablesBand } from '@/components/news/desk/DeskBands';
import { EditionWire } from '@/components/news/desk/DeskChrome';
import {
  MostReadRail,
  PitchPanel,
  SameDeskRail,
  TeamsInNewsRail,
} from '@/components/news/desk/DeskRails';
import { loadNewsDesk, loadNewsSidecars, type NewsDeskData } from '@/lib/news/load-desk';
import { normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { YoutubeFoyer } from '@/components/youtube/YoutubeFoyer';

import styles from '@/components/news/news-chamber.module.css';

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

  const [data, side] = await Promise.all([
    loadNewsDesk({ locale, timezone, query, desk, source, page, day: day || undefined }),
    loadNewsSidecars({ locale, timezone }),
  ]);
  const deskData = { ...data, ...side };

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
    <SalonStage
      tone="press"
      wide
      compact
      kicker={pick(locale, 'غرفة الأخبار', 'News desk')}
      title={pick(locale, 'الأخبار', 'News')}
      lead={pick(
        locale,
        'تقارير من المصدر، تمرّ على التحرير، وتُنشر بعد الاعتماد فقط. العنوان يفتح الطبعة كاملة.',
        'Reports from the source, reviewed by the desk, published only after approval. Open a title to read the edition.',
      )}
      aside={pick(locale, `${deskData.stats.stories} تقرير`, `${deskData.stats.stories} reports`)}
      tools={
        <YoutubeFoyer>
          <HallFoyer
            label={pick(locale, 'فهرس الغرفة', 'Desk index')}
            items={[
              { href: '/news', label: pick(locale, 'الأخبار', 'News'), badge: pick(locale, 'معتمد', 'Approved'), icon: Newspaper, current: true },
              { href: '/photos', label: pick(locale, 'الصور', 'Photos'), icon: Camera },
              { href: '/videos', label: pick(locale, 'الفيديو', 'Video'), icon: Clapperboard },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
            ]}
          />
          <NewsInkMast locale={locale} stats={deskData.stats} compact />
        </YoutubeFoyer>
      }
    >
      <NewsHall
        locale={locale}
        data={deskData}
        query={query}
        desk={desk}
        source={source}
        hrefFor={hrefFor}
      />
    </SalonStage>
  );
}

function NewsHall({
  locale,
  data,
  query,
  desk,
  source,
  hrefFor,
}: {
  locale: string;
  data: NewsDeskData;
  query: string;
  desk: string;
  source: string;
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number; day?: string | null }) => string;
}) {
  const programme = [...data.subLeads, ...data.rest].slice(0, 6);
  const taken = new Set([data.lead?.id, ...programme.map((story) => story.id)].filter(Boolean) as string[]);
  const wall = data.lead ? data.rest.filter((story) => !taken.has(story.id)) : data.rest;
  wall.forEach((story) => taken.add(story.id));
  const circulating = data.mostRead.filter((story) => story.views > 0 && !taken.has(story.id)).slice(0, 6);
  const sameDesk = data.sameDesk.filter((story) => !taken.has(story.id)).slice(0, 6);
  const folio = '01';
  const total = String(Math.max(1, data.total)).padStart(2, '0');
  const firstPage = data.page === 1;

  return (
    <div className={styles['nk-hall']}>
      <div className={styles['nk-inner']}>
        {data.pitch.length > 0 ? <EditionWire matches={data.pitch} locale={locale} /> : null}

        {data.breaking ? (
          <BreakingStrip
            slug={data.breaking.slug}
            title={data.breaking.title}
            publishedAt={data.breaking.publishedAt}
            locale={locale}
          />
        ) : null}

        {data.lead ? (
          <div className={styles['nk-console']}>
            <NewsInkCover story={data.lead} locale={locale} folio={folio} total={total} />
            <NewsInkQueue stories={programme} locale={locale} />
          </div>
        ) : (
          <EmptyDesk locale={locale} filtered={data.filtered} />
        )}

        <NewsInkTools
          locale={locale}
          query={query}
          selectedDesk={desk}
          selectedSource={source}
          desks={data.deskChips}
          sources={data.sources}
          hrefFor={hrefFor}
        />

        {wall.length > 0 ? (
          <section id="news-wall" className={styles['nk-wall']}>
            <header className={styles['nk-wall-head']}>
              <div>
                <p>{pick(locale, 'السجل', 'The log')}</p>
                <h2>{pick(locale, 'جدار التقارير', 'The report wall')}</h2>
              </div>
              <p>
                {data.total} {pick(locale, 'تقرير مطابق', 'matching reports')}
                {data.filtered ? (
                  <>
                    {' · '}
                    <Link href="/news">{pick(locale, 'امسح المرشّحات', 'Clear filters')}</Link>
                  </>
                ) : null}
              </p>
            </header>
            <div className={styles['nk-grid']}>
              {wall.map((story) => (
                <NewsInkCard key={story.id} story={story} locale={locale} />
              ))}
            </div>
            {data.totalPages > 1 ? (
              <nav className={styles['nk-pager']} aria-label={pick(locale, 'صفحات السجل', 'Log pages')}>
                {data.page > 1 ? (
                  <Link href={hrefFor({ page: data.page - 1 })}>{pick(locale, 'السابق', 'Previous')}</Link>
                ) : null}
                <span>
                  {data.page} / {data.totalPages}
                </span>
                {data.page < data.totalPages ? (
                  <Link href={hrefFor({ page: data.page + 1 })} className={styles['is-next']}>
                    {pick(locale, 'التالي', 'Next')}
                  </Link>
                ) : null}
              </nav>
            ) : null}
          </section>
        ) : null}

        {firstPage ? (
          <NewsInkLanes
            stories={data.weekFile}
            desks={data.deskChips}
            exclude={taken}
            locale={locale}
            hrefFor={hrefFor}
          />
        ) : null}

        {firstPage ? (
          <div className={styles['nk-more']}>
            {data.pitch.length > 0 || sameDesk.length > 0 || data.teamsInNews.length > 0 ? (
              <div className={styles['nk-context']}>
                {data.pitch.length > 0 ? <PitchPanel matches={data.pitch} locale={locale} /> : null}
                <div className={styles['nk-stack']}>
                  {sameDesk.length > 0 && data.lead ? (
                    <SameDeskRail articles={sameDesk} category={data.lead.category} locale={locale} />
                  ) : null}
                  <TeamsInNewsRail teams={data.teamsInNews} locale={locale} />
                </div>
              </div>
            ) : null}
            <TablesBand tables={data.tables} locale={locale} />
            <GoalsBand goals={data.goals} locale={locale} />
            <BroadcastBand broadcasts={data.broadcasts} locale={locale} />
          </div>
        ) : null}

        {circulating.length > 0 || data.archive.length > 0 ? (
          <div className={styles['nk-floor']}>
            {circulating.length > 0 ? <MostReadRail articles={circulating} locale={locale} /> : null}
            <NewsInkPulse archive={data.archive} locale={locale} hrefFor={hrefFor} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyDesk({ locale, filtered }: { locale: string; filtered: boolean }) {
  return (
    <div className={styles['nk-empty']}>
      <p>{pick(locale, 'غلاف المساء', 'Evening cover')}</p>
      <strong>
        {filtered
          ? pick(locale, 'لا تقرير مطابق في الغرفة.', 'No matching report in the desk.')
          : pick(locale, 'لا توجد أخبار حديثة متاحة حالياً.', 'No recent news is available right now.')}
      </strong>
      <em>
        {filtered
          ? pick(
            locale,
            'غيّر البحث أو الباب أو يوم الأرشيف — لا نعرض إلا ما مرّ على التحرير واعتمد للنشر.',
            'Change the search, desk, or archive day — only desk-approved copy reaches this page.',
          )
          : pick(
            locale,
            'عاجل وحديث يظهران هنا بعد الاعتماد. الأقدم في إيقاع الأسبوع أسفل الصفحة.',
            'Breaking and latest appear here after approval. Older filings sit in the week pulse below.',
          )}
      </em>
      <div>
        <Link href="/matches">{pick(locale, 'جدول المباريات', 'Match table')}</Link>
        <Link href="/live">{pick(locale, 'يلا سبورت مباشر', 'Yalla Sport Live')}</Link>
      </div>
    </div>
  );
}
