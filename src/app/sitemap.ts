import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { publishedNewsWhere } from '@/lib/i18n/localized-content';
import { SITE_URL } from '@/lib/seo/site';

const LOCALES = ['ar', 'en'] as const;

const STATIC_ROUTES: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
  priority: number;
}> = [
  { path: '', changeFrequency: 'hourly', priority: 1 },
  { path: '/matches', changeFrequency: 'always', priority: 0.95 },
  { path: '/live', changeFrequency: 'always', priority: 0.9 },
  { path: '/news', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/leagues', changeFrequency: 'daily', priority: 0.85 },
  { path: '/tv-guide', changeFrequency: 'hourly', priority: 0.75 },
  { path: '/search', changeFrequency: 'weekly', priority: 0.5 },
  { path: '/watch', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/vod', changeFrequency: 'weekly', priority: 0.55 },
  { path: '/leaderboard', changeFrequency: 'daily', priority: 0.4 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.35 },
  { path: '/compare', changeFrequency: 'weekly', priority: 0.4 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/terms', changeFrequency: 'yearly', priority: 0.2 },
  { path: '/copyright', changeFrequency: 'yearly', priority: 0.2 },
];

function localizedUrl(
  path: string,
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'],
  priority: number,
  lastModified: Date
): MetadataRoute.Sitemap {
  return LOCALES.map((locale) => ({
    url: `${SITE_URL}/${locale}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates: {
      languages: {
        ar: `${SITE_URL}/ar${path}`,
        en: `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}/ar${path}`,
      },
    },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries = STATIC_ROUTES.flatMap((route) =>
    localizedUrl(route.path, route.changeFrequency, route.priority, now)
  );

  try {
    const from = new Date(Date.now() - 2 * 86400000);
    const to = new Date(Date.now() + 8 * 86400000);

    const [news, leagues, matches] = await Promise.all([
      prisma.news.findMany({
        where: publishedNewsWhere(),
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
          sourceLocale: true,
          translations: {
            where: { status: 'APPROVED' },
            select: { locale: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
        take: 400,
      }),
      prisma.league.findMany({
        select: { slug: true },
        take: 300,
      }),
      prisma.match.findMany({
        where: { kickoffAt: { gte: from, lte: to } },
        select: { id: true, kickoffAt: true, updatedAt: true },
        take: 250,
      }),
    ]);

    for (const story of news) {
      const locales = new Set<string>([story.sourceLocale || 'ar']);
      for (const translation of story.translations) locales.add(translation.locale);
      const lastModified = story.updatedAt || story.publishedAt || now;
      const path = `/news/${story.slug}`;
      for (const locale of locales) {
        if (locale !== 'ar' && locale !== 'en') continue;
        entries.push({
          url: `${SITE_URL}/${locale}${path}`,
          lastModified,
          changeFrequency: 'hourly',
          priority: 0.7,
          alternates: {
            languages: {
              ar: `${SITE_URL}/ar${path}`,
              en: `${SITE_URL}/en${path}`,
            },
          },
        });
      }
    }

    for (const league of leagues) {
      entries.push(...localizedUrl(`/league/${league.slug}`, 'daily', 0.65, now));
    }

    for (const match of matches) {
      entries.push(
        ...localizedUrl(`/match/${match.id}`, 'hourly', 0.6, match.updatedAt || match.kickoffAt || now)
      );
    }
  } catch {
    // Sitemap must still ship static routes if the database is unreachable.
  }

  return entries;
}
