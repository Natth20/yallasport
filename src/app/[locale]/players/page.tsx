import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { User, Sparkles, Trophy, Shield } from 'lucide-react';
import { PlayersDirectoryClient, PlayerItem } from './PlayersDirectoryClient';
import styles from './players.module.css';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'دليل اللاعبين والنجوم', 'Football Players Directory'),
    description: pick(
      locale,
      'دليل نجوم ولاعبي كرة القدم في يلا سبورت: تصفح أرقام اللاعبين، الأندية، إحصائيات الأهداف والمشاركات، ومقارنة النجوم.',
      'Comprehensive football player directory on Yalla Sport: browse player stats, clubs, goals, assists, and head-to-head comparisons.'
    ),
    path: '/players',
  });
}

const STAR_PLAYER_KEYWORDS = [
  'Yamal',
  'Haaland',
  'Mbappe',
  'Bellingham',
  'Salah',
  'Rodri',
  'Kane',
  'Vinicius',
  'Messi',
  'Ronaldo',
  'Modric',
  'De Bruyne',
  'Lewandowski',
  'Griezmann',
  'Pedri',
  'Raphinha',
  'Alvarez',
];

export default async function PlayersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const ar = locale === 'ar';
  const query = (q || '').trim();

  const whereClause: any = {
    photoUrl: { not: null },
  };

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
      { nationality: { contains: query, mode: 'insensitive' } },
    ];
  }

  const rawPlayers = await prisma.player
    .findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        slug: true,
        photoUrl: true,
        position: true,
        nationality: true,
        teams: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
          take: 1,
        },
      },
      take: 120,
    })
    .catch(swallow('players.catalog', []));

  // Sort so verified star players and players with affiliated clubs appear first
  const players: PlayerItem[] = [...rawPlayers].sort((a, b) => {
    const aStar = STAR_PLAYER_KEYWORDS.some((kw) =>
      a.name.toLowerCase().includes(kw.toLowerCase())
    );
    const bStar = STAR_PLAYER_KEYWORDS.some((kw) =>
      b.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (aStar && !bStar) return -1;
    if (!aStar && bStar) return 1;

    const aHasTeam = (a.teams?.length || 0) > 0;
    const bHasTeam = (b.teams?.length || 0) > 0;
    if (aHasTeam && !bHasTeam) return -1;
    if (!aHasTeam && bHasTeam) return 1;

    return a.name.localeCompare(b.name);
  });

  const totalPlayersCount = await prisma.player.count().catch(() => players.length);

  return (
    <main className={styles.page}>
      {/* Luxury Hero Banner */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <User className="h-4 w-4" />
          <span>{ar ? 'دليل اللاعبين والنجوم المعتمد' : 'Verified Football Stars Directory'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'نجوم كرة القدم العالمية والعربية' : 'World Football Stars & Players'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تصفح ملفات كبار نجوم الساحرة المستديرة، إحصائيات المراكز، الأندية الحالية، وتاريخ المشاركات الموثق.'
            : 'Explore verified dossiers, positional stats, current clubs, and seasonal metrics for world football stars.'}
        </p>

        {/* Dynamic Metric Chips */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiChip}>
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>
              {totalPlayersCount.toLocaleString()} {ar ? 'لاعب مسجل' : 'Registered Players'}
            </span>
          </div>
          <div className={styles.kpiChip}>
            <Trophy className="h-4 w-4 text-emerald-400" />
            <span>{ar ? 'البطولات الخمس الكبرى' : 'Top 5 Leagues'}</span>
          </div>
          <div className={styles.kpiChip}>
            <Shield className="h-4 w-4 text-blue-400" />
            <span>{ar ? 'بيانات حقيقية 100%' : '100% Verified Data'}</span>
          </div>
        </div>
      </header>

      {/* Interactive Client Directory (Search, Position Pills, Luxury Grid) */}
      <PlayersDirectoryClient
        locale={locale}
        initialPlayers={players}
        initialQuery={query}
      />
    </main>
  );
}
