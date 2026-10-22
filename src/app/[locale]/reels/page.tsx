import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { SalonStage } from '@/components/salon/SalonStage';
import { ReelsDesk } from '@/components/reels/ReelsDesk';
import { YoutubeClipNav } from '@/components/youtube/YoutubeClipNav';
import { YoutubeBrief } from '@/components/youtube/YoutubeBrief';
import { YoutubeFoyer } from '@/components/youtube/YoutubeFoyer';
import { swallow } from '@/lib/ops/caught';
import { emptyYoutubeDeskStats, listYoutubeShelf, youtubeDeskStats } from '@/lib/youtube/ingest';
import { pinThenRotate } from '@/lib/front/rotate-shelf';
import { toYoutubeCards, youtubeCopy } from '@/lib/youtube/present';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'ريلز وشورتس كرة القدم | أحدث اللقطات السريعة', 'Football Reels & Shorts'),
    description: pick(
      locale,
      'أحدث المقاطع الرياضية العمودية القصيرة والمهارات والأهداف من قنوات يوتيوب الرسمية والمصادر المعتمدة.',
      'The latest vertical football clips, skills, and goal moments from official channels.',
    ),
    path: '/reels',
  });
}

export default function ReelsMainPage(props: { searchParams: Promise<{ v?: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ReelsMainPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ReelsMainPageBody({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const locale = await getLocale();
  const { v } = await searchParams;
  const [clips, stats] = await Promise.all([
    listYoutubeShelf('SHORT', 72, locale).catch(swallow('reels.shelf', [])),
    youtubeDeskStats().catch(swallow('reels.stats', emptyYoutubeDeskStats())),
  ]);

  const orderedClips = [...clips].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
  const displayClips = v
    ? [
        ...orderedClips.filter((c) => c.youtubeId === v),
        ...orderedClips.filter((c) => c.youtubeId !== v),
      ]
    : orderedClips;

  return (
    <SalonStage
      tone="gallery"
      wide
      kicker={pick(locale, 'ميديا ولقطات', 'Media & Shorts')}
      title={pick(locale, 'ريلز وشورتس كرة القدم', 'Football Reels & Shorts')}
      lead={pick(
        locale,
        'أحدث اللقطات السريعة والمهارات والأهداف الرائجة من مصادر الأندية والبطولات المعتمدة. تصفح المقاطع أو اضغط على أي ريل للتشغيل والمتابعة.',
        'The latest viral skills, fast moments, and official goal highlights. Browse clips or tap any reel to play.',
      )}
      aside={pick(locale, `${stats.reels} ريلز وشورتس`, `${stats.reels} reels & shorts`)}
      tools={
        <YoutubeFoyer>
          <YoutubeClipNav locale={locale} current="reels" />
          <YoutubeBrief locale={locale} stats={stats} />
        </YoutubeFoyer>
      }
    >
      <ReelsDesk
        locale={locale}
        clips={toYoutubeCards(displayClips, locale)}
        initialId={v}
        copy={youtubeCopy(locale)}
        empty={pick(
          locale,
          'لا ريلز على الرف بعد. الشورتس تُصنَّف تلقائياً من القنوات والمصادر الرسمية.',
          'No reels on the shelf yet. Shorts are automatically updated from official channels.',
        )}
      />
    </SalonStage>
  );
}
