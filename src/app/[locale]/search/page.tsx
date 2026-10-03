import { Suspense } from 'react';
import { SearchFallback, SearchHouse } from '@/components/search/SearchHouse';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const query = (await searchParams).q?.trim().slice(0, 80);
  return pageMetadata({
    locale,
    title: query
      ? pick(locale, `بحث: ${query}`, `Search: ${query}`)
      : pick(locale, 'بحث', 'Search'),
    description: pick(
      locale,
      'ابحث في يلا سبورت عن الفرق واللاعبين والمدربين والبطولات والمباريات والأخبار.',
      'Search Yalla Sport for teams, players, coaches, leagues, matches, and news.',
    ),
    path: '/search',
    noIndex: Boolean(query),
  });
}

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; page?: string }>;
}) {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchPageBody({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number.parseInt(params.page || '1', 10);
  return <SearchHouse q={params.q} kindParam={params.kind} page={Number.isFinite(page) ? page : 1} />;
}
