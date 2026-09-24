import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { PlayerDossier } from '@/components/players/PlayerDossier';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { loadPlayerDossier } from '@/lib/players/load-dossier';
import { walkLocalizeNames, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { FrontSkeleton } from '@/components/front/FrontMark';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const player = await prisma.player.findUnique({
    where: { slug },
    select: { name: true, photoUrl: true, position: true, nationality: true },
  });
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
  const bits = [player.position, player.nationality]
    .filter(Boolean)
    .map((part) => localizePlainName(locale, String(part)))
    .join(' · ');
  return pageMetadata({
    locale,
    title: displayName,
    description: bits
      ? pick(
          locale,
          `${displayName} — ${bits}. ملف اللاعب في يلا سبورت من بيانات المباريات الحقيقية.`,
          `${displayName} — ${bits}. Player profile on Yalla Sport from real match data.`
        )
      : pick(
          locale,
          `ملف ${displayName} في يلا سبورت: الأهداف، البطاقات، والانتقالات المسجّلة.`,
          `${displayName} on Yalla Sport: goals, cards, and recorded transfers.`
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

  const playerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: dossier.player.name,
    jobTitle: dossier.player.position,
    nationality: dossier.player.nationality,
    image: dossier.player.photoUrl,
    ...(dossier.currentClub
      ? {
          memberOf: {
            '@type': 'SportsTeam',
            name: dossier.currentClub.name,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={playerSchema} />
      <PlayerDossier locale={locale} now={new Date()} dossier={dossier} />
    </>
  );
}
