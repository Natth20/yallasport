import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { listYoutubeShelf } from '@/lib/youtube/ingest';
import { displayChannelName, youtubeThumb } from '@/lib/youtube/channels';
import type { FrontClip } from './types';

function mapClips(
  rows: Array<{
    id: string;
    youtubeId: string;
    title: string;
    thumbnailUrl: string | null;
    channelId: string;
    channelTitle: string;
    publishedAt: Date;
  }>,
  locale: string,
): FrontClip[] {
  return rows.map((row) => ({
    id: row.id,
    youtubeId: row.youtubeId,
    title: row.title,
    thumbnailUrl: row.thumbnailUrl || youtubeThumb(row.youtubeId),
    channelTitle: displayChannelName(row.channelId, row.channelTitle, locale),
    publishedAt: new Date(row.publishedAt).toISOString(),
  }));
}

export async function loadFrontVideo(locale: string): Promise<{ videos: FrontClip[]; reels: FrontClip[] }> {
  const packed = await cachedJson(`front:youtube:${locale === 'en' ? 'en' : 'ar'}`, 180, async () => {
    const [videos, reels] = await Promise.all([
      listYoutubeShelf('VIDEO', 8, locale).catch(swallow('front.yt.video', [])),
      listYoutubeShelf('SHORT', 8, locale).catch(swallow('front.yt.reels', [])),
    ]);
    return { videos, reels };
  });
  return {
    videos: mapClips(packed.videos, locale),
    reels: mapClips(packed.reels, locale),
  };
}
