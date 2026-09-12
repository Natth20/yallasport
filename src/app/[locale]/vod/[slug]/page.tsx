import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { VodTitle } from '@/components/streaming/VodTitle';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const show = await prisma.show.findUnique({
    where: { slug },
    select: { title: true, description: true, slug: true },
  });
  if (!show) {
    return pageMetadata({
      locale,
      title: 'VOD',
      description: 'VOD',
      path: `/vod/${slug}`,
      noIndex: true,
    });
  }
  const t = await getTranslations('watch');
  return pageMetadata({
    locale,
    title: show.title,
    description: show.description || t('library'),
    path: `/vod/${show.slug}`,
  });
}

export default async function ShowDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocale();

  const show = await prisma.show.findUnique({
    where: { slug },
    include: {
      episodes: {
        orderBy: [{ seasonNumber: 'asc' }, { episodeNumber: 'asc' }],
        select: {
          id: true,
          seasonNumber: true,
          episodeNumber: true,
          title: true,
          description: true,
          duration: true,
        },
      },
    },
  });

  if (!show || show.status !== 'PUBLISHED') notFound();

  return (
    <VodTitle
      locale={locale}
      show={{
        title: show.title,
        slug: show.slug,
        description: show.description,
        posterUrl: show.posterUrl,
        backdropUrl: show.backdropUrl,
        type: show.type,
        releaseYear: show.releaseYear,
        rating: show.rating,
        categories: show.categories,
        episodes: show.episodes,
      }}
    />
  );
}
