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
import {
  loadNewsDesk,
  loadNewsSidecars,
  EMPTY_NEWS_DESK_DATA,
  EMPTY_NEWS_SIDECARS,
  type NewsDeskData,
} from '@/lib/news/load-desk';
import { normalizeTimezone } from '@/lib/datetime/format';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { FrontTopMatchesShowcase } from '@/components/front/FrontTopMatchesShowcase';
import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { YoutubeFoyer } from '@/components/youtube/YoutubeFoyer';
import { NewsQuickNavHub } from '@/components/news/NewsQuickNavHub';
import { NewsVideosBand, NewsReelsBand, NewsPhotosBand } from '@/components/news/NewsMediaBands';
import { listYoutubeShelf } from '@/lib/youtube/ingest';
import { toYoutubeCards, type YoutubeCard } from '@/lib/youtube/present';
import { loadPhotoFrames } from '@/lib/photos/load-frames';
import type { PhotoFrame } from '@/components/photos/PhotoHall';
import { swallow } from '@/lib/ops/caught';

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
    <Suspense fallback={<FrontSkeleton kind="chapter" />}>
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

  const [data, side, rawVideos, rawReels, rawPhotos] = await Promise.all([
    loadNewsDesk({ locale, timezone, query, desk, source, page, day: day || undefined }).catch(
      swallow('news.page.desk', EMPTY_NEWS_DESK_DATA)
    ),
    loadNewsSidecars({ locale, timezone }).catch(
      swallow('news.page.sidecars', EMPTY_NEWS_SIDECARS)
    ),
    listYoutubeShelf('VIDEO', 8, locale).catch(swallow('news.videos', [])),
    listYoutubeShelf('SHORT', 8, locale).catch(swallow('news.reels', [])),
    loadPhotoFrames(locale).catch(swallow('news.photos', [])),
  ]);
  const deskData: NewsDeskData = {
    ...EMPTY_NEWS_DESK_DATA,
    ...data,
    ...side,
    stats: {
      ...EMPTY_NEWS_DESK_DATA.stats,
      ...(data?.stats ?? {}),
    },
  };

  // If lead is missing but we have items in subLeads, rest, or weekFile, pick one as lead to prevent empty desk
  if (!deskData.lead) {
    if (deskData.subLeads.length > 0) {
      deskData.lead = deskData.subLeads[0];
      deskData.subLeads = deskData.subLeads.slice(1);
    } else if (deskData.rest.length > 0) {
      deskData.lead = deskData.rest[0];
      deskData.rest = deskData.rest.slice(1);
    } else if (deskData.weekFile.length > 0) {
      const topStory = deskData.weekFile[0];
      deskData.lead = {
        ...topStory,
        excerpt: '',
        views: 0,
        tags: [],
        readingTime: 2,
        isPremium: false,
        featured: false,
        sourceUrl: null,
        author: { name: topStory.sourceName || 'Yalla Sport' },
      };
      deskData.weekFile = deskData.weekFile.slice(1);
    }
  }

  const videos = toYoutubeCards(rawVideos, locale);
  const reels = toYoutubeCards(rawReels, locale);
  const photos = rawPhotos.slice(0, 4);

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
            label={pick(locale, 'فهرس الغرفة والأقسام', 'Desk & sections index')}
            items={[
              { href: '/news', label: pick(locale, 'أهم العناوين', 'Top Headlines'), badge: pick(locale, 'معتمد', 'Approved'), current: true },
              { href: '/news#news-wall', label: pick(locale, 'مستجدات الساعة', 'Live Wire') },
              { href: '/news?desk=all#news-wall', label: pick(locale, 'الدوريات الكبرى', 'Major Leagues') },
              { href: '/matches', label: pick(locale, 'أبرز المباريات', 'Matches'), badge: 'LIVE' },
              { href: '/videos', label: pick(locale, 'الفيديوهات', 'Videos') },
              { href: '/videos/reels', label: pick(locale, 'الريلز', 'Reels'), badge: 'HOT' },
              { href: '/photos', label: pick(locale, 'الصور', 'Photos') },
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
        videos={videos}
        reels={reels}
        photos={photos}
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
  videos,
  reels,
  photos,
}: {
  locale: string;
  data: NewsDeskData;
  query: string;
  desk: string;
  source: string;
  hrefFor: (next: { q?: string; desk?: string; source?: string; page?: number; day?: string | null }) => string;
  videos: YoutubeCard[];
  reels: YoutubeCard[];
  photos: PhotoFrame[];
}) {
  // STRICT PAGE-WIDE DEDUPLICATION:
  // Every story ID that appears on the page is tracked in `taken`
  const taken = new Set<string>();
  if (data.lead?.id) taken.add(data.lead.id);

  // Programme (sub-leads)
  const candidateProgramme = [...data.subLeads, ...data.rest];
  const programme: typeof candidateProgramme = [];
  for (const story of candidateProgramme) {
    if (!taken.has(story.id) && programme.length < 4) {
      programme.push(story);
      taken.add(story.id);
    }
  }

  // News Wall (remaining stories)
  const wall: typeof data.rest = [];
  for (const story of data.rest) {
    if (!taken.has(story.id)) {
      wall.push(story);
      taken.add(story.id);
    }
  }

  // Same desk stories
  const sameDesk: typeof data.sameDesk = [];
  for (const story of data.sameDesk) {
    if (!taken.has(story.id) && sameDesk.length < 6) {
      sameDesk.push(story);
      taken.add(story.id);
    }
  }

  const folio = '01';
  const total = String(Math.max(1, data.total)).padStart(2, '0');
  const firstPage = data.page === 1;

  return (
    <div className={styles['nk-hall']}>
      <div className={styles['nk-inner']}>
        {/* أولاً: أعلى الصفحة */}
        {data.breaking ? (
          <BreakingStrip
            slug={data.breaking.slug}
            title={data.breaking.title}
            publishedAt={data.breaking.publishedAt}
            locale={locale}
          />
        ) : null}

        {/* الخبر الرئيسي وأهم العناوين والتقارير الرياضية */}
        {data.lead ? (
          <div className={styles['nk-console']}>
            <NewsInkCover story={data.lead} locale={locale} folio={folio} total={total} />
            <NewsInkQueue stories={programme} locale={locale} />
          </div>
        ) : (
          <EmptyDesk locale={locale} filtered={data.filtered} />
        )}

        {/* ⚽ أبرز مباريات اليوم والقمم الكروية */}
        {firstPage && !query ? (
          <div className="w-full my-3">
            <Suspense fallback={<FrontSkeleton kind="chapter" />}>
              <FrontTopMatchesShowcase locale={locale} />
            </Suspense>
          </div>
        ) : null}

        {data.pitch.length > 0 ? <EditionWire matches={data.pitch} locale={locale} /> : null}

        {/* ثانياً: مربع التنقل السريع */}
        <NewsQuickNavHub
          locale={locale}
          query={query}
          selectedDesk={desk}
          selectedSource={source}
          desks={data.deskChips}
          sources={data.sources}
        />

        {/* ثالثاً: أحدث الأخبار ومستجدات الساعة */}
        {wall.length > 0 ? (
          <section id="news-wall" className={styles['nk-wall']}>
            <header className={styles['nk-wall-head']}>
              <div>
                <p>{pick(locale, 'مستجدات الساعة', 'Live Wire')}</p>
                <h2>{pick(locale, 'أحدث التقارير والأخبار', 'Latest News & Reports')}</h2>
              </div>
              <p>
                {data.total} {pick(locale, 'تقرير معتمد', 'verified reports')}
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

        {/* أخبار كرة القدم والدوريات الكبرى */}
        {firstPage ? (
          <NewsInkLanes
            stories={data.weekFile}
            desks={data.deskChips}
            exclude={taken}
            locale={locale}
            hrefFor={hrefFor}
          />
        ) : null}

        {/* مركز المباريات والبث الحي وجدول القنوات الناقلة */}
        {firstPage && data.broadcasts.length > 0 ? (
          <BroadcastBand broadcasts={data.broadcasts} locale={locale} />
        ) : null}

        {/* أولاً: معرض صور وأحداث اليوم */}
        {firstPage && photos.length > 0 ? (
          <NewsPhotosBand photos={photos} locale={locale} />
        ) : null}

        {/* ثانياً: أحدث الفيديوهات وملخصات المباريات */}
        {firstPage && videos.length > 0 ? (
          <NewsVideosBand videos={videos} locale={locale} />
        ) : null}

        {/* ثالثاً: قسم الريلز واللقطات القصيرة */}
        {firstPage && reels.length > 0 ? (
          <NewsReelsBand reels={reels} locale={locale} />
        ) : null}

        {/* رابعاً: الأقسام الموجودة المحفوظة (الجداول، فرق في الأخبار) */}
        {firstPage ? (
          <div className={styles['nk-more']}>
            <TablesBand tables={data.tables} locale={locale} />
            <GoalsBand goals={data.goals} locale={locale} />
            {data.teamsInNews.length > 0 || sameDesk.length > 0 ? (
              <div className={styles['nk-context']}>
                <TeamsInNewsRail teams={data.teamsInNews} locale={locale} />
                {sameDesk.length > 0 && data.lead ? (
                  <SameDeskRail articles={sameDesk} category={data.lead.category} locale={locale} />
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        {/* خامساً: تطوير قسم الأكثر قراءة (6 أخبار وتبويبات اليوم/الأسبوع/الشهر) + إيقاع الأسبوع */}
        {firstPage ? (
          <div className={styles['nk-floor']}>
            <MostReadRail
              todayArticles={data.mostReadToday}
              weekArticles={data.mostReadWeek}
              monthArticles={data.mostReadMonth}
              locale={locale}
            />
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
