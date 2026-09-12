import { SearchHouse } from '@/components/search/SearchHouse';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';

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
      'ابحث في يلا سبورت عن المباريات، الفرق، اللاعبين، البطولات، والأخبار المعتمدة.',
      'Search Yalla Sport for matches, teams, players, leagues, and verified news.'
    ),
    path: '/search',
  });
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const params = await searchParams;
  return <SearchHouse q={params.q} kindParam={params.kind} />;
}
