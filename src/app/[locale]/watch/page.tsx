import { getLocale, getTranslations } from 'next-intl/server';
import { WatchHouse } from '@/components/streaming/WatchHouse';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('watch');
  return pageMetadata({
    locale,
    title: t('title'),
    description: t('kicker'),
    path: '/watch',
  });
}

export default async function WatchIndexPage() {
  const locale = await getLocale();
  return <WatchHouse locale={locale} />;
}
