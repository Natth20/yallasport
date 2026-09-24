import { requireLicensedStreaming } from '@/lib/streaming/public-door';
import { WatchHouse } from '@/components/streaming/WatchHouse';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('watch');
  return pageMetadata({
    locale,
    title: t('library_title'),
    description: t('library_kicker'),
    path: '/vod',
    noIndex: true,
  });
}

export default async function VODPage() {
  await requireLicensedStreaming();
  const locale = await getLocale();
  return <WatchHouse locale={locale} mode="library" />;
}
