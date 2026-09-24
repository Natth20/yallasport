import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { newsFreshSince } from '@/lib/news/freshness';
import { publicStoryImage } from '@/lib/news/enrich-source';
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

export async function loadFrontStories(locale: string): Promise<{ lead: FrontStory | null; rest: FrontStory[]; photos: FrontStory[] }> {
  const raw = await cachedJson('front:news:v1', 90, () =>
    prisma.news
      .findMany({
        where: {
          AND: [newsVisibleWhere(locale), { publishedAt: { gte: newsFreshSince() } }],
        },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        select: newsSelect,
      })
      .catch(swallow('front.news', [])),
  );

  const localized = await overlayNewsList(raw, locale);
  const stories = localized.map(toStory);
  const photos = stories.filter((item) => item.image).slice(0, 8);
  return {
    lead: stories[0] ?? null,
    rest: stories.slice(1, 9),
    photos,
  };
}
