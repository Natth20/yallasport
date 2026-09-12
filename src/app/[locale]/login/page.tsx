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
    title: t('login_title'),
    description: t('login_lead'),
    path: '/login',
    noIndex: true,
  });
}

export default async function LoginPage() {
  const t = await getTranslations('auth');
  return (
    <AuthGate
      code={t('login_code')}
      kicker={t('login_kicker')}
      title={t('login_title')}
      lead={t('login_lead')}
      seals={[t('login_seal_1'), t('login_seal_2')]}
    >
      <AuthGoogleButton intent="login" />
      <p className="mt-5 text-[13px] leading-7 text-muted-foreground dark:text-foreground/45">{t('google_note')}</p>
      <div className="mt-8 flex flex-col gap-3 text-[12px] font-bold sm:flex-row sm:items-center sm:justify-between">
        <Link href="/forgot-password" className="text-[#c26a3a] hover:underline">
          {t('forgot_link')}
        </Link>
        <p className="text-muted-foreground">
          {t('login_to_register')}{' '}
          <Link href="/register" className="text-[#c26a3a] hover:underline">
            {t('login_to_register_link')}
          </Link>
        </p>
      </div>
    </AuthGate>
  );
}
