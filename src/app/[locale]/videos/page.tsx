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
    title: pick(locale, 'قاعة السينما', 'Cinema hall'),
    description: pick(
      locale,
      'سينما ملخصات من قنوات يوتيوب المسجّلة في الدفتر. اضغط الكليب فيُعرض على الشاشة. ليست بثاً مباشراً.',
      'A highlights cinema from YouTube channels on the desk roster. Tap a clip to put it on screen. This is not a live stream.',
    ),
    path: '/videos',
  });
}

export default function VideosPage(props: { searchParams: Promise<{ v?: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <VideosPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function VideosPageBody({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const locale = await getLocale();
  const { v } = await searchParams;
  const [clips, stats] = await Promise.all([
    listYoutubeShelf('VIDEO', 72, locale).catch(swallow('videos.shelf', [])),
    youtubeDeskStats().catch(swallow('videos.stats', emptyYoutubeDeskStats())),
  ]);

  return (
    <SalonStage
      tone="reel"
      wide
      compact
      kicker={pick(locale, 'قاعة السينما', 'Cinema hall')}
      title={pick(locale, 'الفيديو', 'Videos')}
      lead={pick(
        locale,
        'ملخصات يوتيوب من دفتر القنوات. اضغط الكليب فيُعرض على الشاشة.',
        'YouTube highlights from the channel roster. Tap a clip to put it on screen.',
      )}
      aside={pick(locale, `${stats.videos} عرض`, `${stats.videos} titles`)}
      tools={
        <YoutubeFoyer>
          <YoutubeClipNav locale={locale} current="videos" />
          <YoutubeBrief locale={locale} stats={stats} />
        </YoutubeFoyer>
      }
    >
      <YoutubeDesk
        variant="video"
        locale={locale}
        copy={youtubeCopy(locale)}
        initialId={v}
        clips={toYoutubeCards(pinThenRotate(clips, (clip) => clip.youtubeId === v), locale)}
        empty={pick(locale, 'لا فيديوهات على الرف بعد. الكرون يملأه من القنوات.', 'No clips on the shelf yet. The cron fills it from the channel roster.')}
        archiveHref="/videos/archive"
        archiveLabel={pick(locale, 'تذكرة الأرشيف', 'Archive ticket')}
      />
    </SalonStage>
  );
}
