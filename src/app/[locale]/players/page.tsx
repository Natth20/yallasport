import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { User, Search, ArrowUpRight, Scale, Trophy, Activity } from 'lucide-react';
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

  const players = await prisma.player
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
      orderBy: { name: 'asc' },
      take: 60,
    })
    .catch(swallow('players.catalog', []));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <User className="h-4 w-4" />
          <span>{ar ? 'دليل اللاعبين والنجوم' : 'Players & Stars Directory'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'نجوم كرة القدم العالمية والعربية' : 'World Football Stars & Players'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تصفح ملفات اللاعبين، إحصائيات المواسم، تاريخ الانتقالات، والمقارنات المباشرة بين النجوم.'
            : 'Explore player dossiers, seasonal metrics, transfer history, and head-to-head comparisons between stars.'}
        </p>

        <form action={`/${locale}/players`} method="GET" className={styles.searchForm}>
          <Search className={styles.searchIcon} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={ar ? 'ابحث عن لاعب بالاسم أو الجنسية...' : 'Search player by name or nationality...'}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            {ar ? 'بحث' : 'Search'}
          </button>
        </form>
      </header>

      <section className={styles.grid}>
        {players.length === 0 ? (
          <div className={styles.empty}>
            <User className={styles.emptyIcon} />
            <p>{ar ? 'لم يتم العثور على لاعبين مطابقين للبحث' : 'No players found matching your search'}</p>
            {query && (
              <Link href="/players" className={styles.resetLink}>
                {ar ? 'عرض كافة اللاعبين' : 'View all players'}
              </Link>
            )}
          </div>
        ) : (
          players.map((player) => {
            const currentTeam = player.teams?.[0]?.team;
            const localizedName = localizePlainName(locale, player.name);
            return (
              <article key={player.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.avatarWrap}>
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={localizedName}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    ) : (
                      <User className={styles.avatarFallback} />
                    )}
                  </div>
                  <div className={styles.meta}>
                    <h2 className={styles.playerName}>
                      <Link href={`/player/${player.slug}`} className={styles.playerLink}>
                        {localizedName}
                      </Link>
                    </h2>
                    <div className={styles.tags}>
                      {player.position && (
                        <span className={styles.positionTag}>
                          <Activity className="h-3 w-3" />
                          <span>{player.position}</span>
                        </span>
                      )}
                      {player.nationality && (
                        <span className={styles.nationTag}>{player.nationality}</span>
                      )}
                    </div>
                    {currentTeam && (
                      <Link href={`/team/${currentTeam.slug}`} className={styles.teamTag}>
                        {currentTeam.logoUrl && (
                          <img
                            src={currentTeam.logoUrl}
                            alt={currentTeam.name}
                            className={styles.teamLogo}
                          />
                        )}
                        <span>{currentTeam.name}</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href={`/player/${player.slug}`} className={styles.primaryAction}>
                    <span>{ar ? 'ملف اللاعب' : 'Player Profile'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/compare-players?p1=${player.slug}`}
                    className={styles.secondaryAction}
                    title={ar ? 'مقارنة اللاعب' : 'Compare Player'}
                  >
                    <Scale className="h-4 w-4" />
                    <span>{ar ? 'مقارنة' : 'Compare'}</span>
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </main>
  );
}
