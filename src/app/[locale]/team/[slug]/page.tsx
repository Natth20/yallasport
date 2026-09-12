import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { JsonLd } from '@/components/seo/JsonLd';
import { TeamDossier } from '@/components/teams/TeamDossier';
import { auth } from '@/lib/auth/auth';
import { pick } from '@/i18n/pick';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import { loadTeamDossier } from '@/lib/teams/load-dossier';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const team = await prisma.team.findUnique({
    where: { slug },
    select: { name: true, logoUrl: true, bio: true },
  });
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
    title: team.name,
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

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const session = await auth();
  const dossier = await loadTeamDossier(slug);

  if (!dossier) notFound();

  const userFollow = session?.user?.email
    ? await prisma.userFavorite
        .findFirst({
          where: {
            entityId: dossier.team.id,
            entityType: 'TEAM',
            user: { email: session.user.email },
          },
        })
        .catch(() => null)
    : null;

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

  return (
    <>
      <JsonLd data={teamSchema} />
      <TeamDossier
        locale={locale}
        now={new Date()}
        dossier={dossier}
        loggedIn={Boolean(session)}
        isFollowing={Boolean(userFollow)}
      />
    </>
  );
}
