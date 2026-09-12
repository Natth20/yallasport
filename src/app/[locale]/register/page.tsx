import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuthGate } from '@/components/auth/AuthGate';
import { AuthGoogleButton } from '@/components/auth/AuthGoogleButton';
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

export default async function RegisterPage() {
  const t = await getTranslations('auth');
  return (
    <AuthGate
      code={t('register_code')}
      kicker={t('register_kicker')}
      title={t('register_title')}
      lead={t('register_lead')}
      seals={[t('register_seal_1'), t('register_seal_2')]}
    >
      <AuthGoogleButton intent="register" />
      <p className="mt-5 text-[13px] leading-7 text-muted-foreground dark:text-foreground/45">{t('google_note')}</p>
      <p className="mt-8 text-[12px] font-bold text-muted-foreground">
        {t('register_to_login')}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t('register_to_login_link')}
        </Link>
      </p>
    </AuthGate>
  );
}
