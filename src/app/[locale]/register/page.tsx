import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { Link } from '@/i18n/navigation';
import { AuthGate } from '@/components/auth/AuthGate';
import { AuthGoogleButton } from '@/components/auth/AuthGoogleButton';
import styles from '@/components/auth/auth-gate.module.css';
import { safeCallbackPath } from '@/lib/auth/next-path';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('auth');
  return pageMetadata({
    locale,
    title: t('register_title'),
    description: t('register_lead'),
    path: '/register',
    noIndex: true,
  });
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <RegisterPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function RegisterPageBody({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const t = await getTranslations('auth');
  const next = safeCallbackPath((await searchParams).callbackUrl);
  const loginHref = next === '/' ? '/login' : `/login?callbackUrl=${encodeURIComponent(next)}`;
  return (
    <AuthGate
      code={t('register_code')}
      kicker={t('register_kicker')}
      title={t('register_title')}
      lead={t('register_lead')}
      seals={[t('register_seal_1'), t('register_seal_2')]}
      gate="register"
    >
      <AuthGoogleButton intent="register" callbackUrl={next} />
      <p className={styles.note}>{t('google_note')}</p>
      <p className={styles.links}>
        <span className={styles.quiet}>
          {t('register_to_login')}{' '}
          <Link href={loginHref} className={styles.link}>
            {t('register_to_login_link')}
          </Link>
        </span>
      </p>
    </AuthGate>
  );
}
