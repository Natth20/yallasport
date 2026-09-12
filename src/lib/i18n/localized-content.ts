import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma';
import { hostFromUrl, isTrustedNewsHost, TRUSTED_NEWS_HOSTS } from '@/lib/news/trusted-sources';

function trustedSourceUrlClause(): Prisma.NewsWhereInput {
  return {
    OR: TRUSTED_NEWS_HOSTS.flatMap((host) => [
      { sourceUrl: { contains: `://${host}/` } },
      { sourceUrl: { contains: `://www.${host}/` } },
    ]),
  };
}

/** Drop interactive / quiz fluff that sometimes rides trusted sports feeds. */
function editorialTitleClause(): Prisma.NewsWhereInput {
  return {
    NOT: {
      OR: [
        { title: { contains: 'Who am I', mode: 'insensitive' } },
        { title: { contains: 'من أنا' } },
        { title: { contains: 'quiz', mode: 'insensitive' } },
        { title: { contains: 'Crossword', mode: 'insensitive' } },
        { title: { contains: 'اختبر معرفتك' } },
        { title: { contains: 'خمّن' } },
        { title: { contains: 'Guess the', mode: 'insensitive' } },
        { title: { contains: 'Fantasy', mode: 'insensitive' } },
      ],
    },
  };
}

/** Published + dated + real URL from an allowlisted news host. */
export function publishedNewsWhere(): Prisma.NewsWhereInput {
  return {
    status: 'PUBLISHED',
    publishedAt: { not: null, lte: new Date() },
    sourceUrl: { not: null },
    AND: [trustedSourceUrlClause(), editorialTitleClause()],
  };
}

export function newsVisibleWhere(locale: string): Prisma.NewsWhereInput {
  return {
    ...publishedNewsWhere(),
    OR: [
      { sourceLocale: locale },
      { translations: { some: { locale, status: 'APPROVED' } } },
    ],
  };
}

export function isPublicTrustedStory(story: { sourceUrl?: string | null }) {
  return isTrustedNewsHost(hostFromUrl(story.sourceUrl));
}

export async function overlayNewsTranslation<
  T extends {
    id: string;
    title: string;
    excerpt?: string | null;
    content?: string;
    seoTitle?: string | null;
    seoDescription?: string | null;
    sourceLocale?: string | null;
  }
>(record: T, locale: string): Promise<T> {
  const sourceLocale = record.sourceLocale || 'ar';
  if (locale === sourceLocale) return record;

  const translation = await prisma.newsTranslation.findUnique({
    where: { newsId_locale: { newsId: record.id, locale } },
  });
  if (!translation || translation.status !== 'APPROVED') return record;

  return {
    ...record,
    title: translation.title,
    excerpt: translation.excerpt ?? record.excerpt,
    content: translation.content ?? record.content,
    seoTitle: translation.seoTitle ?? record.seoTitle,
    seoDescription: translation.seoDescription ?? record.seoDescription,
  };
}

export async function overlayNewsList<
  T extends { id: string; title: string; excerpt?: string | null; sourceLocale?: string | null }
>(records: T[], locale: string) {
  if (records.length === 0) return records;
  const translations = await prisma.newsTranslation.findMany({
    where: {
      newsId: { in: records.map((item) => item.id) },
      locale,
      status: 'APPROVED',
    },
  });
  const byNews = new Map(translations.map((item) => [item.newsId, item]));
  return records.map((record) => {
    if ((record.sourceLocale || 'ar') === locale) return record;
    const translation = byNews.get(record.id);
    if (!translation) return record;
    return {
      ...record,
      title: translation.title,
      excerpt: translation.excerpt ?? record.excerpt,
    };
  });
}

export async function localizeEntityMap(
  entities: Array<{ entityType: string; entityId: string; fallback: string }>,
  locale: string
) {
  const map = new Map<string, string>();
  if (entities.length === 0) return map;
  const rows = await prisma.entityTranslation.findMany({
    where: {
      status: 'APPROVED',
      locale,
      OR: entities.map((entity) => ({
        entityType: entity.entityType,
        entityId: entity.entityId,
      })),
    },
  });
  const approved = new Map(rows.map((row) => [`${row.entityType}:${row.entityId}`, row.name]));
  for (const entity of entities) {
    const key = `${entity.entityType}:${entity.entityId}`;
    map.set(key, approved.get(key) || entity.fallback);
  }
  return map;
}
