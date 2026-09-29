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
          '@type': 'SportsOrganization',
          name: dossier.league.name,
          logo: dossier.league.logoUrl,
          sport: 'Soccer',
        }}
      />
      <SalonStage
        tone="sash"
        wide
        compact
        kicker={pick(locale, 'وشاح البطولة', 'Competition sash')}
        title={localizePlainName(locale, dossier.league.name)}
        lead={pick(
          locale,
          'الشاشة للمباراة المختارة، والقائمة للجولة، والجدران للترتيب والأندية والأرقام من المصدر فقط.',
          'The screen holds the selected fixture, the programme holds the round, and the walls hold the table, clubs and numbers from the source only.',
        )}
        aside={dossier.seasonId || dossier.league.country || undefined}
        tools={
          <HallFoyer
            label={pick(locale, 'فصول البطولة', 'Competition chapters')}
            items={[
              { href: `/league/${dossier.league.slug}`, label: pick(locale, 'الملف', 'Hub'), icon: CalendarDays, current: true },
              { href: `/league/${dossier.league.slug}/fixtures`, label: pick(locale, 'الجدول', 'Fixtures'), icon: Calendar },
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
