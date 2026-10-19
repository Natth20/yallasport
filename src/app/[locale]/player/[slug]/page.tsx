import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { PlayerDossier } from '@/components/players/PlayerDossier';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { loadPlayerDossier } from '@/lib/players/load-dossier';
import { walkLocalizeNames, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { ArrowLeftRight, CalendarDays, Radio, Shield, Trophy } from 'lucide-react';

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadPlayerDossier(slug);
  const player = dossier?.player;
  if (!player) {
    return pageMetadata({
      locale,
      title: pick(locale, 'اللاعب', 'Player'),
      description: pick(locale, 'ملف اللاعب غير متاح.', 'This player profile is unavailable.'),
      path: `/player/${slug}`,
      noIndex: true,
    });
  }
  const displayName = localizePlainName(locale, player.name);
  const latinName = player.name;
  const title =
    locale === 'ar' && displayName !== latinName
      ? `${latinName} | ${displayName} — ${pick(locale, 'الإحصائيات والانتقالات | يلا سبورت', 'stats and transfers | Yalla Sport')}`
      : `${displayName} — ${pick(locale, 'الإحصائيات والانتقالات | يلا سبورت', 'stats and transfers | Yalla Sport')}`;
  return pageMetadata({
    locale,
    title,
    absolute: true,
    description: pick(
      locale,
      `تعرف على ${displayName}${player.position ? `، ${localizePlainName(locale, player.position)}` : ''}، إحصائياته، الأندية التي لعب لها، وسجل انتقالاته مع أحدث البيانات المتاحة من مصدر البيانات الرياضي.`,
      `See ${displayName}${player.position ? `, ${player.position}` : ''}, stats, clubs, and the transfer record from the sports data source.`,
    ),
    path: `/player/${slug}`,
    images: [player.photoUrl],
  });
}

export default function PlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <PlayerPageBody params={params} />
    </Suspense>
  );
}

async function PlayerPageBody({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadPlayerDossier(slug);
  if (!dossier) notFound();
  walkLocalizeNames(locale, dossier);

  const displayName = localizePlainName(locale, dossier.player.name);
  const latinName = dossier.player.name;

  const playerSchema = {
    '@context': 'https://schema.org',
    '@type': ['Person', 'Athlete'],
    name: displayName,
    alternateName: latinName !== displayName ? latinName : undefined,
    jobTitle: dossier.player.position || 'Professional Footballer',
    nationality: dossier.player.nationality,
    ...(dossier.player.birthDate ? { birthDate: dossier.player.birthDate.toISOString().slice(0, 10) } : {}),
    ...(dossier.player.birthPlace ? { birthPlace: { '@type': 'Place', name: dossier.player.birthPlace } } : {}),
    ...(dossier.player.height ? { height: dossier.player.height } : {}),
    ...(dossier.player.weight ? { weight: dossier.player.weight } : {}),
    image: dossier.player.photoUrl,
    ...(dossier.currentClub
      ? {
        memberOf: {
          '@type': 'SportsTeam',
          name: dossier.currentClub.name,
          ...(dossier.currentClub.slug ? { url: `https://yallasport.com/${locale}/team/${dossier.currentClub.slug}` } : {}),
        },
      }
      : {}),
    ...(dossier.trophies?.length
      ? { award: dossier.trophies.slice(0, 10).map((t) => `${t.league} (${t.season})`) }
      : {}),
  };

  const breadcrumbsSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: pick(locale, 'الرئيسية', 'Home'),
        item: `https://yallasport.com/${locale}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: pick(locale, 'اللاعبون', 'Players'),
        item: `https://yallasport.com/${locale}/players`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayName,
        item: `https://yallasport.com/${locale}/player/${slug}`,
      },
    ],
  };

  const serializedDossier = JSON.parse(JSON.stringify(dossier));

  return (
    <>
      <JsonLd data={playerSchema} />
      <JsonLd data={breadcrumbsSchema} />
      <PlayerDossier locale={locale} dossier={serializedDossier} />
    </>
  );
}
