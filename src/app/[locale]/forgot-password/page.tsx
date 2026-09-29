import { Suspense } from 'react';
import { getLocale, getTranslations } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { Link } from '@/i18n/navigation';
import { AuthGate } from '@/components/auth/AuthGate';
import styles from '@/components/auth/auth-gate.module.css';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations('auth');
  return pageMetadata({
    locale,
    title: t('recover_title'),
    description: t('recover_lead'),
    path: '/forgot-password',
    noIndex: true,
  });
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ForgotPasswordPageBody />
    </Suspense>
  );
}

async function ForgotPasswordPageBody() {
  const t = await getTranslations('auth');
  return (
    <AuthGate
      code={t('recover_code')}
      kicker={t('recover_kicker')}
      title={t('recover_title')}
      lead={t('recover_lead')}
      seals={[t('recover_seal_1'), t('recover_seal_2')]}
      gate="forgot"
    >
      <a
        href="https://accounts.google.com/signin/recovery"
        rel="noopener noreferrer"
        className={styles.google}
      >
        {t('recover_google')}
      </a>
      <p className={styles.note}>{t('google_note')}</p>
      <p className={styles.links}>
        <Link href="/login" className={styles.link}>
          {t('recover_to_login')}
        </Link>
      </p>
    </AuthGate>
  );
}
