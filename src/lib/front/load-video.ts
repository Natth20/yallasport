import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { listYoutubeShelf } from '@/lib/youtube/ingest';
import { displayChannelName, youtubeThumb } from '@/lib/youtube/channels';
import { rotateStart } from './rotate-shelf';
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
  const packed = await cachedJson(`front:youtube:${locale === 'en' ? 'en' : 'ar'}:v6`, 40, async () => {
    const [videos, reels] = await Promise.all([
      listYoutubeShelf('VIDEO', 36, locale).catch(swallow('front.yt.video', [])),
      listYoutubeShelf('SHORT', 24, locale).catch(swallow('front.yt.reels', [])),
    ]);
    return { videos, reels };
  });
  return {
    videos: rotateStart(mapClips(packed.videos, locale), 5),
    reels: rotateStart(mapClips(packed.reels, locale), 7),
  };
}
