import React from 'react';
import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { Link } from '@/i18n/navigation';
import {
  Share2,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import styles from './social.module.css';
import { getPublishedSocialFeed, getSocialAccounts } from '@/lib/social/service';
import { SocialPlatform, PLATFORM_SPECS } from '@/lib/social/types';
import { SocialHubClient } from './SocialHubClient';

export const revalidate = 60; // Refresh live feed every 60 seconds

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata({
    locale,
    title: pick(locale, 'مركز التواصل الاجتماعي والمجتمع الرياضي | يلا سبورت', 'Social Hub & Community | Yalla Sport'),
    description: pick(
      locale,
      'تابع التغطية الرياضية اللحظية والمنشورات الرسمية لمنصة يلا سبورت عبر تيليجرام، إكس، يوتيوب، وواتساب.',
      'Follow breaking sports coverage and official feeds of Yalla Sport across Telegram, X, YouTube, and WhatsApp.'
    ),
    path: '/social',
  });
}

export default async function SocialHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ platform?: string }>;
}) {
  const { locale } = await params;
  const search = await searchParams;
  setRequestLocale(locale);
  const ar = locale === 'ar';

  const rawPlatform = search?.platform;
  const validPlatform = rawPlatform && Object.keys(PLATFORM_SPECS).includes(rawPlatform)
    ? (rawPlatform as SocialPlatform)
    : undefined;

  const [accounts, feedPosts] = await Promise.all([
    getSocialAccounts(),
    getPublishedSocialFeed(validPlatform, 35),
  ]);

  const cleanAccounts = JSON.parse(JSON.stringify(accounts));
  const cleanPosts = JSON.parse(JSON.stringify(feedPosts));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.badge}>
          <Share2 className="h-4 w-4" />
          <span>{ar ? 'مركز التواصل الاجتماعي الرسمي المعتمد' : 'Official Social Hub'}</span>
        </div>
        <h1 className={styles.title}>
          {ar ? 'قنوات يلا سبورت والمنشورات الرياضية الحية' : 'Official Yalla Sport Channels & Live Feeds'}
        </h1>
        <p className={styles.subtitle}>
          {ar
            ? 'تغطية تفاعلية مباشرة على مدار الساعة لأحدث المستجدات، ملخصات الأهداف، وتصريحات النجوم الصادرة عبر قنواتنا الموثقة.'
            : 'Explore breaking sports news, video clips, and tactical analysis from our verified official media.'}
        </p>
      </header>

      {/* Interactive Client Feed Hub */}
      <SocialHubClient
        locale={locale}
        initialAccounts={cleanAccounts}
        initialFeedPosts={cleanPosts}
        initialPlatform={validPlatform}
      />

      {/* Community Guidelines */}
      <section className={styles.guidelines}>
        <div className={styles.guideHead}>
          <ShieldAlert className="h-5 w-5 text-amber-500" />
          <h2 className={styles.guideTitle}>
            {ar ? 'ميثاق النشر والمجتمع الرياضي في يلا سبورت' : 'Community & Moderation Guidelines'}
          </h2>
        </div>
        <ul className={styles.guideList}>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'الاعتماد الحصري على البيانات والمصادر الرسمية الموثقة للأندية والاتحادات الكروية.'
                : 'Strict reliance on verified sports sources and official confederation data.'}
            </span>
          </li>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'نبذ التعصب الرياضي والإساءة؛ جميع منصاتنا تخضع للتدقيق التحريري المستمر.'
                : 'Zero tolerance for abusive conduct; all platforms are under continuous editorial moderation.'}
            </span>
          </li>
          <li>
            <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-1" />
            <span>
              {ar
                ? 'يمكنك الإبلاغ عن أي انتهاك لحقوق النشر أو مخالفة عبر صفحة الإبلاغ المعتمدة.'
                : 'Report any violations or copyright claims directly through our official portal.'}
            </span>
          </li>
        </ul>
        <div className={styles.reportActionRow}>
          <Link href="/report" className={styles.reportBtn}>
            {ar ? 'تقديم إبلاغ عن محتوى أو مخالفة' : 'File a Content Report'}
          </Link>
        </div>
      </section>
    </main>
  );
}
