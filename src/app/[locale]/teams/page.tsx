import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Shield } from 'lucide-react';
import { TeamsDirectoryClient, DirectoryTeam, ActiveLeague } from './TeamsDirectoryClient';
import styles from './teams.module.css';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'دليل الفرق والأندية — تصنيف الدوريات والدول', 'Football Clubs Directory — Leagues & Countries'),
    description: pick(
      locale,
      'دليل الأندية والفرق الرياضية في يلا سبورت: تصفح أندية الدوريات الكبرى والدول، التشكيلات، المباريات القادمة، وآخر الأخبار.',
      'Comprehensive football club directory on Yalla Sport: browse major league teams, countries, squads, upcoming fixtures, and news.'
    ),
    path: '/teams',
  });
}

const STAR_CLUBS_PRIORITY: Record<string, number> = {
  'real-madrid': 100,
  'barcelona': 99,
  'manchester-city-50': 98,
  'arsenal-42': 97,
  'liverpool-40': 96,
  'bayern-munich-157': 95,
  'paris-saint-germain-85': 94,
  'al-hilal-saudi-fc-1002': 93,
  'al-nassr-2939': 92,
  'al-ahly-1025': 91,
  'zamalek-sc-1026': 90,
  'chelsea-49': 89,
  'manchester-united-33': 88,
  'inter-505': 87,
  'juventus-496': 86,
  'ac-milan-489': 85,
  'atletico-madrid-530': 84,
  'borussia-dortmund-165': 83,
  'tottenham-hotspur-47': 82,
  'al-ittihad-saudi-fc-1003': 81,
};

export default async function TeamsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  // Fetch top 120 active teams with league & venue relations from Prisma
  const rawTeams = await prisma.team
    .findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        founded: true,
        venue: {
          select: {
            name: true,
            city: true,
          },
        },
        standings: {
          select: {
            league: {
              select: {
                id: true,
                name: true,
                slug: true,
                country: true,
              },
            },
          },
          take: 1,
        },
      },
      take: 160,
    })
    .catch(swallow('teams.catalog', []));

  // Transform and sort teams with star clubs first
  const teams: DirectoryTeam[] = rawTeams
    .map((team) => {
      const lg = team.standings?.[0]?.league;
      return {
        id: team.id,
        name: team.name,
        slug: team.slug,
        logoUrl: team.logoUrl,
        founded: team.founded,
        venueName: team.venue?.name,
        venueCity: team.venue?.city,
        leagueName: lg?.name,
        leagueSlug: lg?.slug,
        country: lg?.country || team.venue?.city,
      };
    })
    .sort((a, b) => {
      const priorityA = STAR_CLUBS_PRIORITY[a.slug] || (a.logoUrl ? 10 : 0);
      const priorityB = STAR_CLUBS_PRIORITY[b.slug] || (b.logoUrl ? 10 : 0);
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
      return a.name.localeCompare(b.name);
    });

  // Fetch active leagues for filtering chips
  const activeLeagues: ActiveLeague[] = await prisma.league
    .findMany({
      where: {
        standings: { some: {} },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
      },
      take: 16,
      orderBy: { name: 'asc' },
    })
    .catch(swallow('teams.activeLeagues', []));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Shield className="h-4 w-4" />
          <span>{ar ? 'دليل الأندية والفرق الرسمية' : 'Official Clubs & Teams Directory'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'أندية كرة القدم العالمية والعربية' : 'World & Regional Football Clubs'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تصفح ملفات الفرق، جداول المباريات، قوائم اللاعبين، وآخر الأخبار المعتمدة لكل نادٍ.'
            : 'Explore team dossiers, match fixtures, squads, and verified news updates for every club.'}
        </p>
      </header>

      <TeamsDirectoryClient teams={teams} leagues={activeLeagues} locale={locale} />
    </main>
  );
}
