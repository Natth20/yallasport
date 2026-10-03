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

  const playerSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: dossier.player.name,
    jobTitle: dossier.player.position,
    nationality: dossier.player.nationality,
    ...(dossier.player.birthDate ? { birthDate: dossier.player.birthDate.toISOString().slice(0, 10) } : {}),
    image: dossier.player.photoUrl,
    ...(dossier.currentClub
      ? {
        memberOf: {
          '@type': 'SportsTeam',
          name: dossier.currentClub.name,
          ...(dossier.currentClub.slug ? { url: `/team/${dossier.currentClub.slug}` } : {}),
        },
      }
      : {}),
  };

  return (
    <>
      <JsonLd data={playerSchema} />
      <SalonStage
        tone="podium"
        wide
        compact
        kicker={pick(locale, 'منصة اللاعب', 'Player podium')}
        title={localizePlainName(locale, dossier.player.name)}
        lead={pick(
          locale,
          'النادي الحالي، الإحصائيات، والانتقالات من مصدر البيانات فقط — بلا اختراع.',
          'Current club, stats, and transfers from the data source only — nothing invented.',
        )}
        aside={dossier.currentClub?.name || dossier.player.position || undefined}
        tools={
          <HallFoyer
            label={pick(locale, 'جناح اللاعب', 'Player suite')}
            items={[
              { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
              { href: '/transfers', label: pick(locale, 'الانتقالات', 'Transfers'), icon: ArrowLeftRight },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
              { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
              {
                href: dossier.currentClub?.slug ? `/team/${dossier.currentClub.slug}` : '/leagues',
                label: dossier.currentClub?.name
                  ? localizePlainName(locale, dossier.currentClub.name)
                  : pick(locale, 'النادي', 'Club'),
                icon: Shield,
              },
            ]}
          />
        }
      >
        <PlayerDossier locale={locale} dossier={dossier} />
      </SalonStage>
    </>
  );
}
