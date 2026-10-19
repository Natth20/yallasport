import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Briefcase, Trophy, Shield, Sparkles } from 'lucide-react';
import { CoachesDirectoryClient, CoachItem } from './CoachesDirectoryClient';
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

const STAR_COACH_KEYWORDS = [
  'Mourinho',
  'Guardiola',
  'Ancelotti',
  'Arteta',
  'Klopp',
  'Alonso',
  'Flick',
  'Inzaghi',
  'Ten Hag',
  'Conte',
  'Simeone',
];

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

  const rawCoaches = await prisma.coach
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
      take: 80,
    })
    .catch(swallow('coaches.catalog', []));

  // Sort so world-renowned coaches and managers with active clubs appear first
  const coaches: CoachItem[] = [...rawCoaches].sort((a, b) => {
    const aStar = STAR_COACH_KEYWORDS.some((kw) =>
      a.name.toLowerCase().includes(kw.toLowerCase())
    );
    const bStar = STAR_COACH_KEYWORDS.some((kw) =>
      b.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (aStar && !bStar) return -1;
    if (!aStar && bStar) return 1;

    const aHasClub = Boolean(a.currentTeam);
    const bHasClub = Boolean(b.currentTeam);
    if (aHasClub && !bHasClub) return -1;
    if (!aHasClub && bHasClub) return 1;

    return a.name.localeCompare(b.name);
  });

  const totalCoachesCount = await prisma.coach.count().catch(() => coaches.length);

  return (
    <main className={styles.page}>
      {/* Luxury Hero Banner */}
      <header className={styles.header}>
        <div className={styles.badge}>
          <Briefcase className="h-4 w-4" />
          <span>{ar ? 'دليل المدربين والمديرين الفنيين المعتمد' : 'Verified Managers Directory'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'قادة الدكة الفنية وكبار المدربين' : 'World Football Managers & Tacticians'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تصفح سجلات المدربين، الأندية الحالية، سجل الألقاب والبطولات، والتحليلات التكتيكية الحقيقية.'
            : 'Explore manager profiles, current clubs, silverware, and tactical records from the verified source.'}
        </p>

        {/* Dynamic Metric Chips */}
        <div className={styles.kpiRow}>
          <div className={styles.kpiChip}>
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <span>
              {totalCoachesCount.toLocaleString()} {ar ? 'مديراً فنياً مسجلاً' : 'Registered Managers'}
            </span>
          </div>
          <div className={styles.kpiChip}>
            <Trophy className="h-4 w-4 text-amber-400" />
            <span>{ar ? 'ألقاب وبطولات محلية وقارية' : 'Domestic & Continental Trophies'}</span>
          </div>
          <div className={styles.kpiChip}>
            <Shield className="h-4 w-4 text-blue-400" />
            <span>{ar ? 'سجلات تكتيكية موثقة' : 'Verified Tactical Records'}</span>
          </div>
        </div>
      </header>

      {/* Interactive Client Directory */}
      <CoachesDirectoryClient
        locale={locale}
        initialCoaches={coaches}
        initialQuery={query}
      />
    </main>
  );
}
