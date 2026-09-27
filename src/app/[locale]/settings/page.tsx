import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import type { Metadata } from 'next';
import { SettingsSalon } from './SettingsSalon';
import type { SettingsTab } from './SettingsDesk';

function readTab(value: string | undefined): SettingsTab {
  if (value === 'notifications' || value === 'appearance' || value === 'language') return value;
  return 'account';
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الإعدادات', 'Settings'),
    description: pick(
      locale,
      'الحساب، التنبيهات، ومفتاحا المظهر واللغة الموجودان في الترويسة.',
      'Account, alerts, and the theme and language switches already in the header.',
    ),
    path: '/settings',
    noIndex: true,
  });
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  return <SettingsSalon initialTab={readTab(tab)} />;
}
