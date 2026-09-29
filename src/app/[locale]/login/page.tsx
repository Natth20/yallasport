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
    title: t('login_title'),
    description: t('login_lead'),
    path: '/login',
    noIndex: true,
  });
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LoginPageBody searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginPageBody({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const t = await getTranslations('auth');
  const next = safeCallbackPath((await searchParams).callbackUrl);
  const registerHref = next === '/' ? '/register' : `/register?callbackUrl=${encodeURIComponent(next)}`;
  return (
    <AuthGate
      code={t('login_code')}
      kicker={t('login_kicker')}
      title={t('login_title')}
      lead={t('login_lead')}
      seals={[t('login_seal_1'), t('login_seal_2')]}
      gate="login"
    >
      <AuthGoogleButton intent="login" callbackUrl={next} />
      <p className={styles.note}>{t('google_note')}</p>
      <div className={styles.links}>
        <Link href="/forgot-password" className={styles.link}>
          {t('forgot_link')}
        </Link>
        <p className={styles.quiet}>
          {t('login_to_register')}{' '}
          <Link href={registerHref} className={styles.link}>
            {t('login_to_register_link')}
          </Link>
        </p>
      </div>
    </AuthGate>
  );
}
