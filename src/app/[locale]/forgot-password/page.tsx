import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuthGate } from '@/components/auth/AuthGate';
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

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <AuthGate
      code={t('recover_code')}
      kicker={t('recover_kicker')}
      title={t('recover_title')}
      lead={t('recover_lead')}
      seals={[t('recover_seal_1'), t('recover_seal_2')]}
    >
      <a
        href="https://accounts.google.com/signin/recovery"
        rel="noopener noreferrer"
        className="auth-google"
      >
        {t('recover_google')}
      </a>
      <p className="mt-5 text-[13px] leading-7 text-muted-foreground dark:text-foreground/45">{t('google_note')}</p>
      <Link href="/login" className="mt-8 inline-flex text-[12px] font-bold text-[#c26a3a] hover:underline">
        {t('recover_to_login')}
      </Link>
    </AuthGate>
  );
}
