import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { LeagueDossier } from '@/components/leagues/LeagueDossier';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { loadLeagueDossier } from '@/lib/leagues/load-dossier';
import { walkLocalizeNames, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { FrontSkeleton } from '@/components/front/FrontMark';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug },
    select: { name: true, country: true, logoUrl: true },
  });
  if (!league) {
    return pageMetadata({
      locale,
      title: pick(locale, 'البطولة', 'League'),
      description: pick(locale, 'ملف البطولة غير متاح.', 'This league profile is unavailable.'),
      path: `/league/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    locale,
    title: localizePlainName(locale, league.name),
    description: `${pick(locale, 'ملف', 'Profile for')} ${league.name}${league.country ? ` ${pick(locale, 'من', 'from')} ${league.country}` : ''} — ${pick(locale, 'الجدول، الترتيب، الأخبار والمباريات من مصدر البيانات الحقيقي.', 'schedule, standings, news and matches from the real data source.')}`,
    path: `/league/${slug}`,
    images: [league.logoUrl],
  });
}

export default function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LeaguePageBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LeaguePageBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const locale = await getLocale();
  const { slug } = await params;
  const { season } = await searchParams;
  const dossier = await loadLeagueDossier(slug, { season });
  if (!dossier) notFound();
  walkLocalizeNames(locale, dossier);

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SportsOrganization',
          name: dossier.league.name,
          logo: dossier.league.logoUrl,
          sport: 'Soccer',
        }}
      />
      <LeagueDossier
        locale={locale}
        now={new Date()}
        dossier={dossier}
        isLoggedIn={false}
        initialIsFollowing={false}
      />
    </>
  );
}
