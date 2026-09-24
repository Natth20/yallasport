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
import { emptyYoutubeDeskStats, listYoutubeArchive, youtubeDeskStats } from '@/lib/youtube/ingest';
import { toYoutubeCards, youtubeCopy } from '@/lib/youtube/present';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'أرشيف الفيديو', 'Video archive'),
    description: pick(
      locale,
      'كليبات خرجت من الرف بعد أن نزلت أحدث منها على نفس القناة.',
      'Clips that left the shelf after a newer upload from the same channel.',
    ),
    path: '/videos/archive',
  });
}

export default function VideosArchivePage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <VideosArchivePageBody />
    </Suspense>
  );
}

async function VideosArchivePageBody() {
  const locale = await getLocale();
  const [clips, stats] = await Promise.all([
    listYoutubeArchive(48).catch(swallow('videos.archive', [])),
    youtubeDeskStats().catch(swallow('videos.archive.stats', emptyYoutubeDeskStats())),
  ]);

  return (
    <SalonStage
      tone="vault"
      wide
      kicker={pick(locale, 'المخزن', 'Store')}
      title={pick(locale, 'أرشيف الفيديو', 'Video archive')}
      lead={pick(
        locale,
        'هنا ما طلع من الرف: لكل قناة نُبقي أحدث الحلقات ظاهرة، والباقي يُحفظ في الأرشيف ولا يُحذف.',
        'Clips that left the shelf: each channel keeps its newest uploads visible; the rest are stored here, not deleted.',
      )}
      aside={pick(locale, `${stats.archived} مؤرشف`, `${stats.archived} archived`)}
      tools={
        <>
          <YoutubeClipNav locale={locale} current="archive" />
          <YoutubeBrief locale={locale} stats={stats} />
        </>
      }
    >
      <YoutubeDesk
        variant="video"
        locale={locale}
        copy={youtubeCopy(locale)}
        clips={toYoutubeCards(clips, locale)}
        empty={pick(locale, 'الأرشيف فارغ حتى يفيض الرف.', 'The archive is empty until the shelf overflows.')}
      />
    </SalonStage>
  );
}
