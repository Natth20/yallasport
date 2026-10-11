import React from 'react';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { FrontPage } from '@/components/front/FrontPage';
import { pageMetadata, defaultTitle, defaultDescription } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: defaultTitle(locale),
    description: defaultDescription(locale),
    path: '',
    absolute: true,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <FrontPage locale={locale} />;
}
