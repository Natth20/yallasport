import { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { ContactHouse } from '@/components/contact/ContactHouse';
import { pageMetadata } from '@/lib/seo/site';
import { getLocale, getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('post');
  return pageMetadata({
    locale,
    title: t('title'),
    description: t('standfirst'),
    path: '/contact',
  });
}

export default function ContactPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ContactHouse />
    </Suspense>
  );
}
