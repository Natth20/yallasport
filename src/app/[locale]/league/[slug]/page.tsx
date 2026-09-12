import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { JsonLd } from '@/components/seo/JsonLd';
import { LeagueDossier } from '@/components/leagues/LeagueDossier';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { loadLeagueDossier } from '@/lib/leagues/load-dossier';

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
    title: league.name,
    description: `${pick(locale, 'ملف', 'Profile for')} ${league.name}${league.country ? ` ${pick(locale, 'من', 'from')} ${league.country}` : ''} — ${pick(locale, 'الجدول، الترتيب، الأخبار والمباريات من مصدر البيانات الحقيقي.', 'schedule, standings, news and matches from the real data source.')}`,
    path: `/league/${slug}`,
    images: [league.logoUrl],
  });
}

export default async function LeaguePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const locale = await getLocale();
  const { slug } = await params;
  const { season } = await searchParams;
  const session = await auth();
  const dossier = await loadLeagueDossier(slug, { season });
  if (!dossier) notFound();

  const userFollow = session?.user?.id
    ? await prisma.userFavorite
        .findFirst({
          where: { userId: session.user.id, entityId: dossier.league.id, entityType: 'LEAGUE' },
          select: { id: true },
        })
        .catch(() => null)
    : null;

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
        isLoggedIn={Boolean(session?.user)}
        initialIsFollowing={Boolean(userFollow)}
      />
    </>
  );
}
