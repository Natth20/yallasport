import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { localizeTeamName, localizePlainName } from '@/lib/i18n/sports-lexicon';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { Shield, Search, ArrowUpRight, Scale, Trophy, Calendar, Users, Newspaper, Globe } from 'lucide-react';
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

export default async function TeamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; league?: string; country?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q, league, country } = await searchParams;
  const ar = locale === 'ar';
  const query = (q || '').trim();
  const selectedLeague = (league || '').trim();
  const selectedCountry = (country || '').trim();

  // Construct where filters
  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { slug: { contains: query, mode: 'insensitive' } },
    ];
  }

  if (selectedLeague) {
    whereClause.standings = {
      some: {
        league: {
          slug: selectedLeague,
        },
      },
    };
  } else if (selectedCountry) {
    whereClause.OR = [
      { venue: { city: { contains: selectedCountry, mode: 'insensitive' } } },
      { standings: { some: { league: { country: { contains: selectedCountry, mode: 'insensitive' } } } } },
    ];
  }

  // Fetch teams matching criteria
  const teams = await prisma.team
    .findMany({
      where: whereClause,
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
      orderBy: { name: 'asc' },
      take: 72,
    })
    .catch(swallow('teams.catalog', []));

  // Fetch top active leagues for filtering chips
  const activeLeagues = await prisma.league
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
      take: 12,
      orderBy: { name: 'asc' },
    })
    .catch(swallow('teams.activeLeagues', []));

  const popularCountries = [
    { key: 'england', label: ar ? 'إنجلترا' : 'England', value: 'England' },
    { key: 'spain', label: ar ? 'إسبانيا' : 'Spain', value: 'Spain' },
    { key: 'italy', label: ar ? 'إيطاليا' : 'Italy', value: 'Italy' },
    { key: 'germany', label: ar ? 'ألمانيا' : 'Germany', value: 'Germany' },
    { key: 'france', label: ar ? 'فرنسا' : 'France', value: 'France' },
    { key: 'saudi', label: ar ? 'السعودية' : 'Saudi Arabia', value: 'Saudi Arabia' },
    { key: 'egypt', label: ar ? 'مصر' : 'Egypt', value: 'Egypt' },
  ];

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

        {/* Search bar */}
        <form action={`/${locale}/teams`} method="GET" className={styles.searchForm}>
          <Search className={styles.searchIcon} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={ar ? 'ابحث عن نادٍ أو فريق بالاسم...' : 'Search for a club or team by name...'}
            className={styles.searchInput}
          />
          {selectedLeague && <input type="hidden" name="league" value={selectedLeague} />}
          {selectedCountry && <input type="hidden" name="country" value={selectedCountry} />}
          <button type="submit" className={styles.searchBtn}>
            {ar ? 'بحث' : 'Search'}
          </button>
        </form>

        {/* Filter Section: Leagues & Countries */}
        <div className={styles.filterSection}>
          {/* League Filters */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <Trophy className="inline h-3.5 w-3.5 text-amber-500 mr-1" />
              {ar ? 'البطولة:' : 'League:'}
            </span>
            <Link
              href={query ? `/teams?q=${encodeURIComponent(query)}` : '/teams'}
              className={`${styles.filterChip} ${!selectedLeague && !selectedCountry ? styles.filterChipActive : ''}`}
            >
              {ar ? 'كافة الفرق' : 'All Clubs'}
            </Link>
            {activeLeagues.map((lg) => {
              const active = selectedLeague === lg.slug;
              return (
                <Link
                  key={lg.id}
                  href={`/teams?league=${lg.slug}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                >
                  {localizePlainName(locale, lg.name)}
                </Link>
              );
            })}
          </div>

          {/* Country Filters */}
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>
              <Globe className="inline h-3.5 w-3.5 text-blue-400 mr-1" />
              {ar ? 'الدولة:' : 'Country:'}
            </span>
            {popularCountries.map((c) => {
              const active = selectedCountry.toLowerCase() === c.value.toLowerCase();
              return (
                <Link
                  key={c.key}
                  href={`/teams?country=${encodeURIComponent(c.value)}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
                  className={`${styles.filterChip} ${active ? styles.filterChipActive : ''}`}
                >
                  {c.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Grid of Teams */}
      <section className={styles.grid}>
        {teams.length === 0 ? (
          <div className={styles.empty}>
            <Shield className={styles.emptyIcon} />
            <p>{ar ? 'لم يتم العثور على أندية مطابقة للتصفية أو البحث' : 'No clubs found matching your search or filters'}</p>
            {(query || selectedLeague || selectedCountry) && (
              <Link href="/teams" className={styles.resetLink}>
                {ar ? 'إعادة ضبط التصفية وعرض كافة الفرق' : 'Reset filters and view all teams'}
              </Link>
            )}
          </div>
        ) : (
          teams.map((team) => {
            const localizedName = localizeTeamName(locale, team.name);
            const leagueObj = team.standings?.[0]?.league;
            const location = team.venue?.city || leagueObj?.country;

            return (
              <article key={team.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.crestWrap}>
                    {team.logoUrl ? (
                      <img
                        src={team.logoUrl}
                        alt={localizedName}
                        className={styles.crest}
                        loading="lazy"
                      />
                    ) : (
                      <Shield className={styles.crestFallback} />
                    )}
                  </div>
                  <div className={styles.meta}>
                    <h2 className={styles.teamName}>
                      <Link href={`/team/${team.slug}`} className={styles.teamLink}>
                        {localizedName}
                      </Link>
                    </h2>
                    {leagueObj && (
                      <Link href={`/league/${leagueObj.slug}`} className={styles.leagueTag}>
                        <Trophy className="h-3 w-3" />
                        <span>{localizePlainName(locale, leagueObj.name)}</span>
                      </Link>
                    )}
                    {location && (
                      <span className={styles.countryTag}>
                        {localizePlainName(locale, location)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Direct quick links to Matches, Squad/Players, News */}
                <div className={styles.subLinks}>
                  <Link
                    href={`/team/${team.slug}#fixtures`}
                    className={styles.subLink}
                    title={ar ? 'مواعيد ونتائج مباريات الفريق' : 'Team matches & schedule'}
                  >
                    <Calendar className="h-3 w-3 text-orange-500" />
                    <span>{ar ? 'المباريات' : 'Matches'}</span>
                  </Link>
                  <Link
                    href={`/team/${team.slug}#squad`}
                    className={styles.subLink}
                    title={ar ? 'قائمة وتشكيلة لاعبي الفريق' : 'Team squad & roster'}
                  >
                    <Users className="h-3 w-3 text-blue-400" />
                    <span>{ar ? 'اللاعبون' : 'Players'}</span>
                  </Link>
                  <Link
                    href={`/team/${team.slug}#news`}
                    className={styles.subLink}
                    title={ar ? 'أخبار وتقارير النادي' : 'Team news & reports'}
                  >
                    <Newspaper className="h-3 w-3 text-emerald-400" />
                    <span>{ar ? 'الأخبار' : 'News'}</span>
                  </Link>
                </div>

                <div className={styles.actions}>
                  <Link href={`/team/${team.slug}`} className={styles.primaryAction}>
                    <span>{ar ? 'ملف النادي' : 'Club Profile'}</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/compare?t1=${team.slug}`}
                    className={styles.secondaryAction}
                    title={ar ? 'مقارنة النادي' : 'Compare Club'}
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
