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
import { walkLocalizeNames } from '@/lib/i18n/sports-lexicon';
import { formatLeagueSeason, localizeCompetitionTitle } from '@/lib/i18n/competition-names';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { SalonStage } from '@/components/salon/SalonStage';
import { auth } from '@/lib/auth/auth';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { CalendarDays, Calendar, History, Target, Trophy } from 'lucide-react';

export const revalidate = 90;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadLeagueDossier(slug);
  if (!dossier) {
    return pageMetadata({
      locale,
      title: pick(locale, 'البطولة', 'League'),
      description: pick(locale, 'ملف البطولة غير متاح.', 'This league profile is unavailable.'),
      path: `/league/${slug}`,
      noIndex: true,
    });
  }
  const name = localizeCompetitionTitle(locale, dossier.league);
  const season = formatLeagueSeason(dossier.seasonId);
  const seasonBit = season ? ` ${season}` : '';
  return pageMetadata({
    locale,
    title: pick(
      locale,
      `${name}${seasonBit} | المباريات والترتيب والهدافون | يلا سبورت`,
      `${name}${seasonBit} | fixtures, table and scorers | Yalla Sport`
    ),
    description: pick(
      locale,
      `تابع ${name}${seasonBit}: مباريات البطولة، النتائج، جدول الترتيب، والهدافين عبر يلا سبورت من مصدر البيانات المعتمد.`,
      `Follow ${name}${seasonBit}: fixtures, results, the league table and top scorers on Yalla Sport from the official data source.`
    ),
    path: `/league/${slug}`,
    images: [dossier.league.logoUrl],
    absolute: true,
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
  const session = await auth();
  const isFollowing = session?.user?.id
    ? Boolean(
      await prisma.userFavorite.findFirst({
        where: { userId: session.user.id, entityType: 'LEAGUE', entityId: dossier.league.id },
        select: { id: true },
      }),
    )
    : false;

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'SportsOrganization',
              name: localizeCompetitionTitle(locale, dossier.league),
              logo: dossier.league.logoUrl,
              sport: 'Soccer',
            },
            ...(dossier.spotlight
              ? [
                {
                  '@type': 'SportsEvent',
                  name: `${dossier.spotlight.homeTeam.name} × ${dossier.spotlight.awayTeam.name}`,
                  startDate: dossier.spotlight.kickoffAt.toISOString(),
                  sport: 'Soccer',
                  competitor: [
                    { '@type': 'SportsTeam', name: dossier.spotlight.homeTeam.name },
                    { '@type': 'SportsTeam', name: dossier.spotlight.awayTeam.name },
                  ],
                },
              ]
              : []),
          ],
        }}
      />
      <SalonStage
        tone="sash"
        wide
        compact
        kicker={pick(locale, 'البطولة', 'Competition')}
        title={localizeCompetitionTitle(locale, dossier.league)}
        lead={pick(
          locale,
          'نظرة عامة على المباريات والترتيب والهدافين والأندية من المصدر فقط — بلا أرقام مخمّنة.',
          'Overview of matches, the table, scorers and clubs from the source only — no invented figures.',
        )}
        aside={formatLeagueSeason(dossier.seasonId) || undefined}
        tools={
          <HallFoyer
            label={pick(locale, 'أقسام البطولة', 'Competition sections')}
            items={[
              { href: `/league/${dossier.league.slug}`, label: pick(locale, 'نظرة عامة', 'Overview'), icon: CalendarDays, current: true },
              { href: `/league/${dossier.league.slug}/fixtures`, label: pick(locale, 'المباريات', 'Matches'), icon: Calendar },
              { href: `/league/${dossier.league.slug}/standings`, label: pick(locale, 'الترتيب', 'Table'), icon: Trophy },
              { href: `/league/${dossier.league.slug}/top-scorers`, label: pick(locale, 'الهدافون', 'Scorers'), icon: Target },
              { href: `/league/${dossier.league.slug}/archive`, label: pick(locale, 'الأرشيف', 'Archive'), icon: History },
            ]}
          />
        }
      >
        <LeagueDossier
          locale={locale}
          dossier={dossier}
          isLoggedIn={Boolean(session?.user)}
          initialIsFollowing={isFollowing}
        />
      </SalonStage>
    </>
  );
}
