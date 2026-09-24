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
import { swallow } from '@/lib/ops/caught';
import { emptyYoutubeDeskStats, listYoutubeShelf, youtubeDeskStats } from '@/lib/youtube/ingest';
import { toYoutubeCards, youtubeCopy } from '@/lib/youtube/present';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'قاعة الفيديو', 'Video hall'),
    description: pick(
      locale,
      'قاعة عرض لملخصات كرة القدم من قنوات يوتيوب عربية وعالمية. اضغط الكليب فيُعرض على الشاشة.',
      'A cinema hall of football highlights from Arabic and international YouTube channels. Tap a clip to put it on screen.',
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
    listYoutubeShelf('VIDEO', 48, locale).catch(swallow('videos.shelf', [])),
    youtubeDeskStats().catch(swallow('videos.stats', emptyYoutubeDeskStats())),
  ]);

  return (
    <SalonStage
      tone="booth"
      wide
      kicker={pick(locale, 'قاعة السينما', 'Cinema hall')}
      title={pick(locale, 'الفيديو', 'Videos')}
      lead={pick(
        locale,
        'شاشة كبيرة في الوسط، ورفّ ملخصات من قنوات كورة: عربية أولاً ثم عالمية. اضغط أي كليب فيصعد إلى الشاشة. كل قناة تُبقي أحدث حلقاتها؛ الجديدة تطرد القديمة إلى الأرشيف.',
        'A wide screen at the center, and a highlights shelf from football channels: Arabic first, then international. Tap a clip and it takes the stage. Each channel keeps only its newest uploads; new ones send the rest to the archive.',
      )}
      aside={pick(locale, `${stats.videos} عرض`, `${stats.videos} titles`)}
      tools={
        <>
          <YoutubeClipNav locale={locale} current="videos" />
          <YoutubeBrief locale={locale} stats={stats} />
        </>
      }
    >
      <YoutubeDesk
        variant="video"
        locale={locale}
        copy={youtubeCopy(locale)}
        initialId={v}
        clips={toYoutubeCards(clips, locale)}
        empty={pick(locale, 'لا فيديوهات على الرف بعد. الكرون يملأه من القنوات.', 'No clips on the shelf yet. The cron fills it from the channel roster.')}
        archiveHref="/videos/archive"
        archiveLabel={pick(locale, 'تذكرة الأرشيف', 'Archive ticket')}
      />
    </SalonStage>
  );
}
