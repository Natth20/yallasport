import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import { Bell, Shield, CheckCircle2, AlertCircle, ArrowUpRight, Star } from 'lucide-react';
import styles from './follow.module.css';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'تابع فريقك — إشعارات الأهداف والمباريات', 'Follow Your Team — Match Alerts'),
    description: pick(
      locale,
      'تابع فريقك المفضل في يلا سبورت: احصل على إشعارات الأهداف، مواعيد المباريات القادمة، وأخبار النادي أولاً بأول.',
      'Follow your favourite football club on Yalla Sport: get instant goal alerts, kickoff reminders, and club news.'
    ),
    path: '/follow',
  });
}

export default async function FollowTeamPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  const topTeams = await prisma.team
    .findMany({
      where: {
        logoUrl: { not: null },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        venue: {
          select: {
            city: true,
          },
        },
        standings: {
          select: {
            league: {
              select: {
                name: true,
                country: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
      take: 24,
    })
    .catch(swallow('follow.topTeams', []));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Bell className="h-4 w-4" />
          <span>{ar ? 'خدمة متابعة الفرق وتنبيهات المباريات' : 'Follow Your Team & Alerts'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'لا تفوّت أي لحظة لناديك المفضل' : 'Never Miss a Moment for Your Club'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'حدد فريقك المفضل لتصلك تنبيهات انطلاق المباريات، الأهداف اللحظية، والتشكيلة الرسمية فور صدورها.'
            : 'Select your club to receive kickoff reminders, live goal updates, and official lineups.'}
        </p>

        {/* Development status note */}
        <div className={styles.statusNotice}>
          <div className={styles.noticeIcon}>
            <AlertCircle className="h-5 w-5 text-amber-500" />
          </div>
          <div className={styles.noticeBody}>
            <h2 className={styles.noticeTitle}>
              {ar
                ? 'حالة الخدمة: تنبيهات المتصفح وتطبيق الويب مفعلة — الرسائل النصية قيد التفعيل'
                : 'Service Status: Web & PWA Push Alerts Active — SMS Rollout in Progress'}
            </h2>
            <p className={styles.noticeText}>
              {ar
                ? 'يمكنك حفظ ناديك في قائمة المفضلة الآن للوصول السريع لجدوله وأهدافه. تنبيهات الإشعارات الفورية تعمل عبر تطبيق الويب (PWA) ومتصفحك، وجارٍ استكمال خدمة الإشعارات التلقائية عبر البريد ورسائل الهاتف.'
                : 'Save your team to your Favorites now for quick schedule access. Instant push alerts work via PWA and browser notifications, with SMS alerts in development.'}
            </p>
          </div>
        </div>

        <div className={styles.quickLinks}>
          <Link href="/favorites" className={styles.favBtn}>
            <Star className="h-4 w-4 text-amber-400" />
            <span>{ar ? 'عرض أنديتي المفضلة حالياً' : 'View My Favorite Teams'}</span>
          </Link>
          <Link href="/settings" className={styles.settingsBtn}>
            <span>{ar ? 'إعدادات الإشعارات والمظهر' : 'Notification Settings'}</span>
          </Link>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {ar ? 'اختر ناديك لبدء المتابعة الفورية' : 'Pick a Club to Start Following'}
          </h2>
          <Link href="/teams" className={styles.allTeamsLink}>
            <span>{ar ? 'كافة الأندية' : 'All Clubs'}</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className={styles.grid}>
          {topTeams.map((team) => (
            <article key={team.id} className={styles.card}>
              <div className={styles.crestWrap}>
                {team.logoUrl ? (
                  <img src={team.logoUrl} alt={team.name} className={styles.crest} />
                ) : (
                  <Shield className={styles.fallbackCrest} />
                )}
              </div>
              <div className={styles.info}>
                <h3 className={styles.teamName}>{team.name}</h3>
                <span className={styles.leagueName}>
                  {team.standings[0]?.league?.name || team.venue?.city || (ar ? 'نادي رياضي' : 'Sports Club')}
                </span>
              </div>
              <Link href={`/team/${team.slug}`} className={styles.followBtn}>
                <Bell className="h-3.5 w-3.5" />
                <span>{ar ? 'متابعة' : 'Follow'}</span>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
