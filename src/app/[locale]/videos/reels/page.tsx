import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { SalonStage } from '@/components/salon/SalonStage';
import { YoutubeDesk } from '@/components/youtube/YoutubeDesk';
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
    title: pick(locale, 'ريلز وشورتس رياضية | أحدث المقاطع الرياضية', 'Sports reels and shorts'),
    description: pick(
      locale,
      'أحدث المقاطع الرياضية العمودية القصيرة من قنوات يوتيوب الرسمية والمصادر المعتمدة.',
      'The latest vertical football clips from official YouTube channels and approved sources.',
    ),
    path: '/videos/reels',
  });
}

export default function ReelsPage(props: { searchParams: Promise<{ v?: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ReelsPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function ReelsPageBody({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const locale = await getLocale();
  const { v } = await searchParams;
  const [clips, stats] = await Promise.all([
    listYoutubeShelf('SHORT', 36, locale).catch(swallow('reels.shelf', [])),
    youtubeDeskStats().catch(swallow('reels.stats', emptyYoutubeDeskStats())),
  ]);

  return (
    <SalonStage
      tone="gallery"
      wide
      kicker={pick(locale, 'عمودي', 'Vertical')}
      title={pick(locale, 'ريلز وشورتس', 'Reels & Shorts')}
      lead={pick(
        locale,
        'أحدث المقاطع الرياضية العمودية القصيرة من قنوات يوتيوب الرسمية. يعرض القسم أحدث مقطعين من كل قناة، وبقية المقاطع في الأرشيف.',
        'The latest vertical sports clips from official YouTube channels. The page shows the two newest clips per channel; the rest live in the archive.',
      )}
      aside={pick(locale, `${stats.reels} ريلز وشورتس`, `${stats.reels} reels & shorts`)}
      tools={
        <YoutubeFoyer>
          <YoutubeClipNav locale={locale} current="reels" />
          <YoutubeBrief locale={locale} stats={stats} />
        </YoutubeFoyer>
      }
    >
      <YoutubeDesk
        variant="reel"
        locale={locale}
        copy={youtubeCopy(locale)}
        initialId={v}
        clips={toYoutubeCards(pinThenRotate(clips, (clip) => clip.youtubeId === v), locale)}
        empty={pick(locale, 'لا ريلز على الرف بعد. الشورتس تُصنَّف من العنوان أو من مدة الفيديو إن وُجد مفتاح يوتيوب.', 'No reels on the shelf yet. Shorts are classified from the title, or from duration when a YouTube API key is set.')}
        archiveHref="/videos/archive"
        archiveLabel={pick(locale, 'أرشيف الريلز والشورتس', 'Reels & shorts archive')}
      />
    </SalonStage>
  );
}
