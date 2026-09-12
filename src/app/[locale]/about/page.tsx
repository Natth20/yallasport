import { getLocale, getTranslations } from 'next-intl/server';
import { AboutHouse } from '@/components/about/AboutHouse';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('about');
  return pageMetadata({
    locale,
    title: t('title'),
    description: t('standfirst'),
    path: '/about',
  });
}

export default async function AboutPage() {
  return <AboutHouse />;
}
