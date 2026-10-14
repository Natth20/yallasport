import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { Briefcase, Search, ArrowUpRight, Trophy, Shield, User } from 'lucide-react';
import styles from './coaches.module.css';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'دليل المدربين والمديرين الفنيين', 'Football Coaches & Managers'),
    description: pick(
      locale,
      'دليل المدربين والمديرين الفنيين في يلا سبورت: تصفح سجلات المدربين، الأندية الحالية، الألقاب، ومسيرات كبار المدربين.',
      'Comprehensive football coaches and managers directory on Yalla Sport: career history, current clubs, trophies, and tactical dossiers.'
    ),
    path: '/coaches',
  });
}

export default async function CoachesPage({
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

  const whereClause: any = {};
  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { nationality: { contains: query, mode: 'insensitive' } },
    ];
  }

  const coaches = await prisma.coach
    .findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        photoUrl: true,
        nationality: true,
        bio: true,
        currentTeam: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        trophies: {
          select: {
            id: true,
            title: true,
            season: true,
          },
          take: 3,
        },
      },
      orderBy: { name: 'asc' },
      take: 60,
    })
    .catch(swallow('coaches.catalog', []));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Briefcase className="h-4 w-4" />
          <span>{ar ? 'دليل المدربين والمديرين الفنيين' : 'Coaches & Managers Directory'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'قادة الدكة الفنية وكبار المدربين' : 'World Football Managers & Tacticians'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تصفح سجلات المدربين، الأندية، البطولات والألقاب، والنتائج التكتيكية من المصدر الحقيقي.'
            : 'Explore manager profiles, current clubs, silverware, and tactical records from the verified source.'}
        </p>

        <form action={`/${locale}/coaches`} method="GET" className={styles.searchForm}>
          <Search className={styles.searchIcon} />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={ar ? 'ابحث عن مدرب بالاسم أو الجنسية...' : 'Search manager by name or nationality...'}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            {ar ? 'بحث' : 'Search'}
          </button>
        </form>
      </header>

      <section className={styles.grid}>
        {coaches.length === 0 ? (
          <div className={styles.empty}>
            <Briefcase className={styles.emptyIcon} />
            <p>{ar ? 'لم يتم العثور على مدربين مطابقين للبحث' : 'No managers found matching your search'}</p>
            {query && (
              <Link href="/coaches" className={styles.resetLink}>
                {ar ? 'عرض كافة المدربين' : 'View all coaches'}
              </Link>
            )}
          </div>
        ) : (
          coaches.map((coach) => {
            const localizedName = localizePlainName(locale, coach.name);
            const coachSlug = slugifyCoachName(coach.name, coach.id);
            return (
              <article key={coach.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <div className={styles.avatarWrap}>
                    {coach.photoUrl ? (
                      <img
                        src={coach.photoUrl}
                        alt={localizedName}
                        className={styles.avatar}
                        loading="lazy"
                      />
                    ) : (
                      <User className={styles.avatarFallback} />
                    )}
                  </div>
                  <div className={styles.meta}>
                    <h2 className={styles.coachName}>
                      <Link href={`/coach/${coachSlug}`} className={styles.coachLink}>
                        {localizedName}
                      </Link>
                    </h2>
                    <div className={styles.tags}>
                      {coach.nationality && (
                        <span className={styles.nationTag}>{coach.nationality}</span>
                      )}
                      {coach.trophies.length > 0 && (
                        <span className={styles.trophyTag}>
                          <Trophy className="h-3 w-3" />
                          <span>
                            {coach.trophies.length} {ar ? 'ألقاب' : 'Trophies'}
                          </span>
                        </span>
                      )}
                    </div>
                    {coach.currentTeam && (
                      <Link href={`/team/${coach.currentTeam.slug}`} className={styles.teamTag}>
                        {coach.currentTeam.logoUrl ? (
                          <img
                            src={coach.currentTeam.logoUrl}
                            alt={coach.currentTeam.name}
                            className={styles.teamLogo}
                          />
                        ) : (
                          <Shield className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span>{coach.currentTeam.name}</span>
                      </Link>
                    )}
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href={`/coach/${coachSlug}`} className={styles.primaryAction}>
                    <span>{ar ? 'ملف المدرب' : 'Coach Profile'}</span>
                    <ArrowUpRight className="h-4 w-4" />
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
