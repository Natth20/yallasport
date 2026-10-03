import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { TeamDossier } from '@/components/teams/TeamDossier';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { findTeamRowBySlug, loadTeamDossier } from '@/lib/teams/load-dossier';
import { walkLocalizeNames, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { auth } from '@/lib/auth/auth';
import { SalonStage } from '@/components/salon/SalonStage';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { CalendarDays, Radio, Shield, Trophy } from 'lucide-react';

export const revalidate = 90;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const team = await findTeamRowBySlug(slug);
  if (!team) {
    return pageMetadata({
      locale,
      title: pick(locale, 'الفريق', 'Team'),
      description: pick(locale, 'ملف الفريق غير متاح.', 'This team profile is unavailable.'),
      path: `/team/${slug}`,
      noIndex: true,
    });
  }
  return pageMetadata({
    locale,
    title: localizePlainName(locale, team.name),
    description:
      team.bio?.slice(0, 160) ||
      pick(
        locale,
        `ملف ${team.name} في يلا سبورت: المباريات، اللاعبون، والأخبار المرتبطة من المصدر الحقيقي.`,
        `${team.name} on Yalla Sport: matches, squad, and linked news from the real source.`
      ),
    path: `/team/${slug}`,
    images: [team.logoUrl],
  });
}

export default function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <TeamPageBody params={params} />
    </Suspense>
  );
}

async function TeamPageBody({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadTeamDossier(slug);

  if (!dossier) notFound();
  walkLocalizeNames(locale, dossier);

  const session = await auth();
  const isFollowing = session?.user?.id
    ? Boolean(
      await prisma.userFavorite.findFirst({
        where: { userId: session.user.id, entityType: 'TEAM', entityId: dossier.team.id },
        select: { id: true },
      }),
    )
    : false;

  const teamSchema = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: dossier.team.name,
    logo: dossier.team.logoUrl,
    ...(dossier.team.coach?.name
      ? {
        coach: {
          '@type': 'Person',
          name: dossier.team.coach.name,
        },
      }
      : {}),
    ...(dossier.team.venue?.name
      ? {
        homeLocation: {
          '@type': 'Place',
          name: dossier.team.venue.name,
        },
      }
      : {}),
  };

  const serializedDossier = JSON.parse(JSON.stringify(dossier));

  return (
    <>
      <JsonLd data={teamSchema} />
      <SalonStage
        tone="vault"
        wide
        compact
        kicker={pick(locale, 'خزينة النادي', 'Club vault')}
        title={localizePlainName(locale, dossier.team.name)}
        lead={pick(
          locale,
          'ملف النادي من المصدر: المباريات والقائمة والترتيب دون أرقام مخترعة.',
          'Club file from the source: fixtures, squad, and table — no invented numbers.',
        )}
        aside={dossier.team.country ? localizePlainName(locale, dossier.team.country) : pick(locale, 'من المصدر', 'From source')}
        tools={
          <HallFoyer
            label={pick(locale, 'جناح النادي', 'Club suite')}
            items={[
              { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
              { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
              { href: `/team/${dossier.team.slug}`, label: localizePlainName(locale, dossier.team.name), icon: Shield, current: true },
            ]}
          />
        }
      >
        <TeamDossier
          locale={locale}
          now={new Date()}
          dossier={serializedDossier}
          loggedIn={Boolean(session?.user)}
          isFollowing={isFollowing}
        />
      </SalonStage>
    </>
  );
}
