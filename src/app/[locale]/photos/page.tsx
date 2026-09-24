import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { galleryImageSrcSet, publicStoryImage, upgradeGalleryImageUrl } from '@/lib/news/enrich-source';
import { deskTick, rotateList } from '@/lib/sports-data/season';
import { SalonStage } from '@/components/salon/SalonStage';
import { PhotoHall, type PhotoFrame } from '@/components/photos/PhotoHall';
import { swallow } from '@/lib/ops/caught';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الصور', 'Photos'),
    description: pick(
      locale,
      'قاعة صور كرة القدم من التقارير المنشورة. الإطار يصعد إلى الحامل، والتقرير يفتح من اللوحة.',
      'A football print hall from published reports. Raise a frame onto the easel, then open the story from the plaque.',
    ),
    path: '/photos',
  });
}

export default function PhotosPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <PhotosPageBody />
    </Suspense>
  );
}

async function PhotosPageBody() {
  const locale = await getLocale();
  const raw = await prisma.news
    .findMany({
      where: {
        AND: [newsVisibleWhere(locale), { featuredImage: { not: null } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 72,
      select: {
        id: true,
        slug: true,
        title: true,
        featuredImage: true,
        ogImage: true,
        sourceName: true,
        sourceUrl: true,
        sourceLocale: true,
        publishedAt: true,
      },
    })
    .catch(swallow('photos.list', [] as Array<{
      id: string;
      slug: string;
      title: string;
      featuredImage: string | null;
      ogImage: string | null;
      sourceName: string | null;
      sourceUrl: string | null;
      sourceLocale: string;
      publishedAt: Date | null;
    }>));
  const stories = await overlayNewsList(raw, locale).catch(swallow('photos.overlay', raw));
  const unique: Array<(typeof stories)[number] & { featuredImage: string }> = [];
  const seen = new Set<string>();
  for (const story of stories) {
    const image = publicStoryImage(story);
    if (!image || seen.has(image)) continue;
    seen.add(image);
    unique.push({ ...story, featuredImage: image });
  }
  const rotated = rotateList(unique, deskTick(20));
  const frames: PhotoFrame[] = rotated.map((story) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    image: upgradeGalleryImageUrl(story.featuredImage || ''),
    srcSet: galleryImageSrcSet(story.featuredImage || ''),
    sourceName: story.sourceName,
    publishedAt: story.publishedAt?.toISOString() || '',
  }));

  return (
    <SalonStage
      tone="gallery"
      wide
      kicker={pick(locale, 'قاعة الصور', 'Photo hall')}
      title={pick(locale, 'الصور', 'Photos')}
      lead={pick(
        locale,
        'قاعة طباعة: الصورة تُعلَّق في إطار، وتصعد إلى الحامل إذا اخترتها. اضغط اللوحة لتقرأ التقرير كامل.',
        'A print hall: each photo sits in a frame, and rises to the easel when you choose it. Open the plaque to read the full report.',
      )}
      aside={pick(locale, `${frames.length} إطار`, `${frames.length} frames`)}
    >
      <PhotoHall
        locale={locale}
        frames={frames}
        emptyTitle={pick(locale, 'القاعة مظلمة الآن', 'The hall is dark for now')}
        emptyLead={pick(locale, 'ما في صور من تقارير منشورة حالياً.', 'No photos from published reports yet.')}
      />
    </SalonStage>
  );
}
