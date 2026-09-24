import React from 'react';
import { getLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { FrontPage } from '@/components/front/FrontPage';
import { pageMetadata, defaultTitle, defaultDescription } from '@/lib/seo/site';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: defaultTitle(locale),
    description: defaultDescription(locale),
    path: '',
    absolute: true,
  });
}

export default function HomePage() {
  return <FrontPage />;
}
