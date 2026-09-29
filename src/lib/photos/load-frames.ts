import { prisma } from '@/lib/prisma';
import { cache } from 'react';
import { rotateStart } from '@/lib/front/rotate-shelf';
import { newsVisibleWhere, overlayNewsList } from '@/lib/i18n/localized-content';
import { galleryImageSrcSet, publicStoryImage, upgradeGalleryImageUrl } from '@/lib/news/enrich-source';
import { swallow } from '@/lib/ops/caught';
import type { PhotoFrame } from '@/components/photos/PhotoHall';

export const loadPhotoFrames = cache(async function loadPhotoFrames(locale: string): Promise<PhotoFrame[]> {
  const raw = await prisma.news
    .findMany({
      where: {
        AND: [newsVisibleWhere(locale), { featuredImage: { not: null } }],
      },
      orderBy: { publishedAt: 'desc' },
      take: 96,
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
    .catch(
      swallow('photos.list', [] as Array<{
        id: string;
        slug: string;
        title: string;
        featuredImage: string | null;
        ogImage: string | null;
        sourceName: string | null;
        sourceUrl: string | null;
        sourceLocale: string;
        publishedAt: Date | null;
      }>),
    );
  const stories = await overlayNewsList(raw, locale).catch(swallow('photos.overlay', raw));
  const unique: Array<(typeof stories)[number] & { featuredImage: string }> = [];
  const seen = new Set<string>();
  for (const story of stories) {
    const image = publicStoryImage(story);
    if (!image || seen.has(image)) continue;
    seen.add(image);
    unique.push({ ...story, featuredImage: image });
  }
  return rotateStart(
    unique.map((story) => ({
      id: story.id,
      slug: story.slug,
      title: story.title,
      image: upgradeGalleryImageUrl(story.featuredImage || ''),
      srcSet: galleryImageSrcSet(story.featuredImage || ''),
      sourceName: story.sourceName,
      publishedAt: story.publishedAt?.toISOString() || '',
    })),
    6,
  );
});
