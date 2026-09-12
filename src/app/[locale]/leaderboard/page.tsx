import { getLocale, getTranslations } from 'next-intl/server';
import { PredictionsHouse } from '@/components/predictions/PredictionsHouse';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('board');
  return pageMetadata({
    locale,
    title: t('title'),
    description: t('standfirst'),
    path: '/leaderboard',
  });
}

export default async function LeaderboardPage() {
  return <PredictionsHouse />;
}
