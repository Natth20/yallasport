import { swallow, reportCaughtError } from '@/lib/ops/caught';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { JsonLd } from '@/components/seo/JsonLd';
import { NewsViewBeacon } from '@/components/news/NewsViewBeacon';
import { NewsReadingProgress } from '@/components/news/NewsReadingProgress';
import { StoryFolio } from '@/components/news/StoryFolio';
import { auth } from '@/lib/auth/auth';
import { PAYMENTS_ENABLED, canAccessPremiumContent } from '@/lib/auth/premium';
import { newsVisibleWhere, overlayNewsList, overlayNewsTranslation } from '@/lib/i18n/localized-content';
import { deskLabel } from '@/lib/news/desks';
import { deskAuthorLabel, formatNewsHtml } from '@/lib/news/format-body';
import { wordCount, resolveFullArticleBody } from '@/lib/news/fetch-article';
import { readingTimeMinutes } from '@/lib/news/reading-time';
import { isProtectedFullTextSource } from '@/lib/news/import-copy';
import { linkedEntitiesForNews } from '@/lib/news/entity-suggest';
import { linkContent } from '@/lib/news/linking';
import { displaySourceName } from '@/lib/news/trusted-sources';
import { galleryImageSrcSet, publicStoryImage, upgradeGalleryImageUrl, upgradeNewsImageUrl } from '@/lib/news/enrich-source';
import { prisma } from '@/lib/prisma';
import { hiddenCommentIdSet } from '@/lib/comments/visibility';
import { pageMetadata } from '@/lib/seo/site';
import { FrontSkeleton } from '@/components/front/FrontMark';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug: rawSlug } = await params;
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch (error) {
    reportCaughtError("src/app/[locale]/news/[slug]/page.tsx:45", error);
    /* fallback to raw */
  }

  const news = await prisma.news.findFirst({
    where: {
      AND: [
        newsVisibleWhere(locale),
        { OR: [{ slug: rawSlug }, { slug: decodedSlug }] },
      ],
    },
  });
  const missing = pageMetadata({
    locale,
    title: pick(locale, 'خبر غير موجود', 'Story not found'),
    description: pick(locale, 'هذا الخبر غير متاح في يلا سبورت.', 'This story is not available on Yalla Sport.'),
    path: `/news/${rawSlug}`,
    noIndex: true,
  });

  if (!news) return missing;

  const localized = await overlayNewsTranslation(news, locale);
  return pageMetadata({
    locale,
    title: localized.seoTitle || localized.title,
    description: localized.seoDescription || localized.excerpt || localized.title,
    path: `/news/${rawSlug}`,
    images: [news.ogImage, news.featuredImage],
    type: 'article',
    publishedTime: news.publishedAt?.toISOString(),
    modifiedTime: news.updatedAt?.toISOString(),
  });
}

export default function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <NewsDetailBody params={params} />
    </Suspense>
  );
}

async function NewsDetailBody({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug: rawSlug } = await params;
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch (error) {
    reportCaughtError("src/app/[locale]/news/[slug]/page.tsx:84", error);
    /* fallback to raw */
  }

  const session = await auth();

  const news = await prisma.news.findFirst({
    where: {
      AND: [
        newsVisibleWhere(locale),
        { OR: [{ slug: rawSlug }, { slug: decodedSlug }] },
      ],
    },
    include: {
      author: true,
      comments: {
        where: { parentId: null },
        orderBy: { createdAt: 'asc' },
        take: 80,
        include: { user: { select: { name: true, role: true } } },
      },
    },
  });

  if (!news) notFound();

  const hiddenIds = await hiddenCommentIdSet();
  const publicComments = news.comments.filter((comment) => !hiddenIds.has(comment.id));

  const localized = await overlayNewsTranslation(news, locale);
  const isPremium = PAYMENTS_ENABLED && localized.isPremium;
  const canAccess = canAccessPremiumContent({
    requiresPremium: isPremium,
    subscriptionStatus: session?.user?.subscriptionStatus,
    role: session?.user?.role,
  });

  const resolved = canAccess
    ? await resolveFullArticleBody({ content: localized.content, sourceUrl: news.sourceUrl })
    : { html: formatNewsHtml(localized.content || ''), image: null, enriched: false, words: wordCount(localized.content || '') };

  if (resolved.enriched && resolved.words > wordCount(news.content || '') + 30 && !isProtectedFullTextSource(news.sourceUrl)) {
    void prisma.news
      .update({
        where: { id: news.id },
        data: {
          content: resolved.html,
          readingTime: readingTimeMinutes(resolved.html),
        },
      })
      .catch(swallow('src/app/[locale]/news/[slug]/page.tsx:enrich', null));
  }

  const formattedBody = resolved.html;
  const linkedContent = await linkContent(formattedBody);
  const deskAuthor = deskAuthorLabel(news.author?.name, locale, pick);
  const sourceLabel = displaySourceName(news.sourceName, news.sourceUrl) || news.sourceName || pick(locale, 'مصدر موثوق', 'Trusted source');
  const publishedLabel = news.publishedAt
    ? format(new Date(news.publishedAt), 'dd MMMM yyyy — HH:mm', { locale: locale === 'ar' ? ar : enUS })
    : pick(locale, 'غير منشور', 'Unpublished');
  const rawHero =
    publicStoryImage({
      featuredImage: news.featuredImage,
      ogImage: news.ogImage || resolved.image,
    }) || (resolved.image ? upgradeNewsImageUrl(resolved.image) : null);
  const heroImage = rawHero ? upgradeGalleryImageUrl(rawHero) : null;
  const heroSrcSet = rawHero ? galleryImageSrcSet(rawHero) : undefined;

  const storyPick = {
    id: true,
    slug: true,
    title: true,
    excerpt: true,
    featuredImage: true,
    ogImage: true,
    category: true,
    publishedAt: true,
    readingTime: true,
    sourceName: true,
    sourceUrl: true,
    sourceLocale: true,
  } as const;

  const [relatedRaw, latestRaw, popularRaw, entityMap] = await Promise.all([
    prisma.news.findMany({
      where: {
        AND: [newsVisibleWhere(locale), { id: { not: news.id } }, { category: news.category }],
      },
      orderBy: [{ publishedAt: 'desc' }],
      take: 10,
      select: storyPick,
    }),
    prisma.news.findMany({
      where: { AND: [newsVisibleWhere(locale), { id: { not: news.id } }] },
      orderBy: [{ publishedAt: 'desc' }],
      take: 10,
      select: storyPick,
    }),
    prisma.news.findMany({
      where: { AND: [newsVisibleWhere(locale), { id: { not: news.id } }] },
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take: 8,
      select: storyPick,
    }),
    linkedEntitiesForNews([news.id], locale),
  ]);

  const [related, latest, popular] = await Promise.all([
    overlayNewsList(relatedRaw, locale),
    overlayNewsList(latestRaw, locale),
    overlayNewsList(popularRaw, locale),
  ]);

  const toCard = (story: (typeof related)[number]) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    image: publicStoryImage(story),
    sourceName: displaySourceName(story.sourceName, story.sourceUrl) || story.sourceName,
    publishedAt: story.publishedAt,
  });
  const entities = entityMap.get(news.id) ?? [];
  const words = resolved.words;
  const showExcerpt = excerptIsBodyLead(localized.excerpt, resolved.html) === false;
  const protectedSource = isProtectedFullTextSource(news.sourceUrl);
  const clippedCopy = protectedSource || words < 40;
  const readMins = readingTimeMinutes(resolved.html) || null;
  const newsSchema = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: localized.title,
    image: heroImage || '/images/logo.png',
    datePublished: news.publishedAt?.toISOString() || news.createdAt.toISOString(),
    dateModified: news.updatedAt.toISOString(),
    author: [
      {
        '@type': 'Organization',
        name: sourceLabel,
      },
      {
        '@type': 'Organization',
        name: deskAuthor,
      },
    ],
    publisher: {
      '@type': 'Organization',
      name: 'Yalla Sport',
    },
    isAccessibleForFree: !isPremium,
  };

  return (
    <>
      <JsonLd data={newsSchema} />
      <NewsViewBeacon newsId={news.id} />
      <NewsReadingProgress />
      <StoryFolio
        locale={locale}
        newsId={news.id}
        title={localized.title}
        excerpt={localized.excerpt}
        showExcerpt={showExcerpt}
        kicker={deskLabel(news.category, locale)}
        breaking={news.breaking}
        isPremium={isPremium}
        canAccess={canAccess}
        heroImage={heroImage}
        heroSrcSet={heroSrcSet}
        sourceLabel={sourceLabel}
        sourceUrl={news.sourceUrl}
        deskAuthor={deskAuthor}
        publishedLabel={publishedLabel}
        readMins={readMins}
        bodyHtml={linkedContent}
        clippedCopy={clippedCopy}
        protectedSource={protectedSource}
        tags={news.tags}
        entities={entities.map((entity) => ({ href: entity.href, name: entity.name }))}
        related={related.map(toCard)}
        latest={latest.map(toCard)}
        popular={popular.map(toCard)}
        comments={publicComments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
          user: { name: comment.user.name, role: comment.user.role },
        }))}
        isLoggedIn={Boolean(session?.user?.id)}
      />
    </>
  );
}

function excerptIsBodyLead(excerpt: string | null | undefined, html: string) {
  if (!excerpt?.trim()) return true;
  const body = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const lead = excerpt.replace(/\s+/g, ' ').trim();
  if (lead.length < 24) return true;
  return body.startsWith(lead.slice(0, Math.min(72, lead.length)));
}
