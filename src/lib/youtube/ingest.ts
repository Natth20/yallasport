import Parser from 'rss-parser';
import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import {
  FOOTBALL_YOUTUBE_CHANNELS,
  YOUTUBE_KEEP,
  channelById,
  displayChannelName,
  youtubeRssUrl,
  youtubeThumb,
} from './channels';

export { displayChannelName };

const parser = new Parser({
  customFields: {
    item: [
      ['yt:videoId', 'ytVideoId'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:description', 'mediaDescription'],
      ['media:group', 'mediaGroup'],
    ],
  },
});

type FeedItem = {
  id?: string;
  title?: string;
  link?: string;
  isoDate?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  ytVideoId?: string;
  mediaDescription?: string | { _?: string };
  mediaGroup?: { 'media:description'?: string | { _?: string } };
  mediaThumbnail?: { $?: { url?: string } } | Array<{ $?: { url?: string } }>;
};

function videoIdFromItem(item: FeedItem) {
  if (item.ytVideoId && /^[\w-]{11}$/.test(item.ytVideoId)) return item.ytVideoId;
  const fromId = item.id?.match(/:v=([\w-]{11})$/)?.[1] || item.id?.match(/yt:video:([\w-]{11})/)?.[1];
  if (fromId) return fromId;
  const fromLink = item.link?.match(/[?&]v=([\w-]{11})/)?.[1] || item.link?.match(/youtu\.be\/([\w-]{11})/)?.[1];
  return fromLink || null;
}

function thumbFromItem(item: FeedItem, videoId: string) {
  const raw = item.mediaThumbnail;
  const node = Array.isArray(raw) ? raw[0] : raw;
  return node?.$?.url || youtubeThumb(videoId);
}

function textOf(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && '_' in value && typeof (value as { _: string })._ === 'string') {
    return (value as { _: string })._;
  }
  return '';
}

function descriptionFromItem(item: FeedItem) {
  const raw =
    textOf(item.mediaDescription) ||
    textOf(item.mediaGroup?.['media:description']) ||
    item.contentSnippet ||
    item.content ||
    '';
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 420);
}

function looksShort(title: string, durationSec?: number | null) {
  if (typeof durationSec === 'number' && durationSec > 0 && durationSec <= 60) return true;
  return /#shorts?\b/i.test(title);
}

function parseIsoDuration(iso: string) {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  return Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

async function enrichDurations(ids: string[]) {
  const key = process.env.YOUTUBE_API_KEY?.trim();
  if (!key || ids.length === 0) return new Map<string, number>();
  const durations = new Map<string, number>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'contentDetails');
    url.searchParams.set('id', batch.join(','));
    url.searchParams.set('key', key);
    const res = await fetch(url).catch(swallow('youtube.videos.list', null));
    if (!res?.ok) continue;
    const json = (await res.json().catch(swallow('youtube.videos.json', null))) as {
      items?: Array<{ id: string; contentDetails?: { duration?: string } }>;
    } | null;
    for (const item of json?.items || []) {
      const sec = item.contentDetails?.duration ? parseIsoDuration(item.contentDetails.duration) : null;
      if (item.id && typeof sec === 'number') durations.set(item.id, sec);
    }
  }
  return durations;
}

async function archiveByChannel() {
  for (const channel of FOOTBALL_YOUTUBE_CHANNELS) {
    for (const kind of ['VIDEO', 'SHORT'] as const) {
      const keep = YOUTUBE_KEEP[kind];
      const keepRows = await prisma.youtubeClip.findMany({
        where: { channelId: channel.id, kind },
        orderBy: { publishedAt: 'desc' },
        take: keep,
        select: { id: true },
      });
      const keepIds = keepRows.map((row) => row.id);
      if (keepIds.length) {
        await prisma.youtubeClip.updateMany({
          where: { id: { in: keepIds } },
          data: { status: 'PUBLISHED' },
        });
      }
      await prisma.youtubeClip.updateMany({
        where: {
          channelId: channel.id,
          kind,
          ...(keepIds.length ? { id: { notIn: keepIds } } : {}),
        },
        data: { status: 'ARCHIVED' },
      });
    }
  }
}

export async function ingestYoutubeClips() {
  const seenIds: string[] = [];
  let upserted = 0;
  const failed: string[] = [];

  for (const channel of FOOTBALL_YOUTUBE_CHANNELS) {
    const feed = await parser.parseURL(youtubeRssUrl(channel.id)).catch(
      swallow(`youtube.rss.${channel.id}`, null),
    );
    if (!feed?.items?.length) {
      failed.push(channel.name);
      continue;
    }
    const channelTitle = feed.title?.replace(/\s*-\s*YouTube$/i, '').trim() || channel.name;

    for (const raw of feed.items as FeedItem[]) {
      const youtubeId = videoIdFromItem(raw);
      const title = raw.title?.trim();
      if (!youtubeId || !title) continue;
      seenIds.push(youtubeId);
      const publishedAt = raw.isoDate || raw.pubDate ? new Date(raw.isoDate || raw.pubDate || '') : new Date();
      if (Number.isNaN(publishedAt.getTime())) continue;

      await prisma.youtubeClip.upsert({
        where: { youtubeId },
        create: {
          youtubeId,
          title,
          channelId: channel.id,
          channelTitle,
          description: descriptionFromItem(raw) || null,
          lang: channel.lang,
          thumbnailUrl: thumbFromItem(raw, youtubeId),
          publishedAt,
          kind: looksShort(title) ? 'SHORT' : 'VIDEO',
          status: 'PUBLISHED',
          fetchedAt: new Date(),
        },
        update: {
          title,
          channelTitle,
          description: descriptionFromItem(raw) || null,
          lang: channel.lang,
          thumbnailUrl: thumbFromItem(raw, youtubeId),
          publishedAt,
          fetchedAt: new Date(),
        },
      });
      upserted += 1;
    }
  }

  const durations = await enrichDurations(seenIds);
  if (durations.size > 0) {
    for (const [youtubeId, durationSec] of durations) {
      const clip = await prisma.youtubeClip.findUnique({
        where: { youtubeId },
        select: { title: true },
      });
      if (!clip) continue;
      await prisma.youtubeClip.update({
        where: { youtubeId },
        data: {
          durationSec,
          kind: looksShort(clip.title, durationSec) ? 'SHORT' : 'VIDEO',
        },
      });
    }
  }

  await archiveByChannel();

  const dropped = await prisma.youtubeClip.deleteMany({
    where: { channelId: { notIn: FOOTBALL_YOUTUBE_CHANNELS.map((channel) => channel.id) } },
  });

  return { upserted, channels: FOOTBALL_YOUTUBE_CHANNELS.length, failed, dropped: dropped.count };
}

function orderedRoster(locale?: string) {
  const want = locale === 'en' ? 'en' : 'ar';
  const match = FOOTBALL_YOUTUBE_CHANNELS.filter((channel) => channel.lang === want);
  return match.length > 0 ? match : FOOTBALL_YOUTUBE_CHANNELS;
}

export const listYoutubeShelf = cache(async function listYoutubeShelf(
  kind: 'VIDEO' | 'SHORT',
  take: number,
  locale?: string,
) {
  const roster = orderedRoster(locale);
  const per = YOUTUBE_KEEP[kind];
  const ids = roster.map((channel) => channel.id);
  const rows = await prisma.youtubeClip.findMany({
    where: { status: 'PUBLISHED', kind, channelId: { in: ids } },
    orderBy: { publishedAt: 'desc' },
  });
  const buckets = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = buckets.get(row.channelId) ?? [];
    if (list.length >= per) continue;
    list.push(row);
    buckets.set(row.channelId, list);
  }
  const groups = roster.map((channel) => buckets.get(channel.id) ?? []);
  const mixed = [];
  const depth = Math.max(0, ...groups.map((group) => group.length));
  for (let index = 0; index < depth; index += 1) {
    for (const group of groups) {
      if (group[index]) mixed.push(group[index]);
    }
  }
  return mixed.slice(0, take);
});

export function listYoutubeArchive(take = 48) {
  return prisma.youtubeClip.findMany({
    where: { status: 'ARCHIVED' },
    orderBy: { publishedAt: 'desc' },
    take,
  });
}

export type YoutubeDeskStats = {
  channels: number;
  videos: number;
  reels: number;
  archived: number;
  arabic: number;
  fetchedAt: Date | null;
};

export function emptyYoutubeDeskStats(): YoutubeDeskStats {
  return {
    channels: FOOTBALL_YOUTUBE_CHANNELS.length,
    videos: 0,
    reels: 0,
    archived: 0,
    arabic: 0,
    fetchedAt: null,
  };
}

export async function youtubeDeskStats(): Promise<YoutubeDeskStats> {
  const [groups, lastFetch] = await Promise.all([
    prisma.youtubeClip.groupBy({
      by: ['status', 'kind', 'lang'],
      _count: { _all: true },
    }),
    prisma.youtubeClip.findFirst({ orderBy: { fetchedAt: 'desc' }, select: { fetchedAt: true } }),
  ]);

  let videos = 0;
  let reels = 0;
  let archived = 0;
  let arabic = 0;
  for (const row of groups) {
    const count = row._count._all;
    if (row.status === 'ARCHIVED') archived += count;
    if (row.status === 'PUBLISHED' && row.kind === 'VIDEO') videos += count;
    if (row.status === 'PUBLISHED' && row.kind === 'SHORT') reels += count;
    if (row.status === 'PUBLISHED' && row.lang === 'ar') arabic += count;
  }

  return {
    channels: FOOTBALL_YOUTUBE_CHANNELS.length,
    videos,
    reels,
    archived,
    arabic,
    fetchedAt: lastFetch?.fetchedAt ?? null,
  };
}

export function isArabicChannel(channelId: string) {
  return channelById(channelId)?.lang === 'ar';
}
