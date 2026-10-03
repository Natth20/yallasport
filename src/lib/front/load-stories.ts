import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { publicStoryImage } from '@/lib/news/enrich-source';
import { rotateStart } from './rotate-shelf';
import type { FrontStory } from './types';

const newsSelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  featuredImage: true,
  ogImage: true,
  category: true,
  publishedAt: true,
  sourceName: true,
  sourceLocale: true,
} as const;

function toStory(row: {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImage: string | null;
  ogImage: string | null;
  category: string;
  publishedAt: Date | string | null;
  sourceName: string | null;
}): FrontStory {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    image: publicStoryImage(row),
    category: row.category,
    publishedAt: row.publishedAt ? new Date(row.publishedAt).toISOString() : new Date(0).toISOString(),
    sourceName: row.sourceName,
  };
}

export async function loadFrontStories(locale: string): Promise<{
  lead: FrontStory | null;
  rest: FrontStory[];
  latest: FrontStory[];
  photos: FrontStory[];
}> {
  const raw = await cachedJson(`front:news:${locale === 'en' ? 'en' : 'ar'}:v7`, 40, () =>
    prisma.news
      .findMany({
        where: newsVisibleWhere(locale),
        orderBy: { publishedAt: 'desc' },
        take: 48,
        select: newsSelect,
      })
      .catch(swallow('front.news', [])),
  );

  const localized = await overlayNewsList(raw, locale);
  const chronological = localized.map(toStory);
  const stories = rotateStart(chronological, 3);
  const featuredIds = new Set([stories[0]?.id, ...stories.slice(1, 6).map((row) => row.id)].filter(Boolean));
  const photos = rotateStart(
    stories.filter((item) => item.image),
    4,
  ).slice(0, 16);
  return {
    lead: stories[0] ?? null,
    rest: stories.slice(1, 16),
    latest: chronological.filter((row) => !featuredIds.has(row.id)).slice(0, 5),
    photos,
  };
}
