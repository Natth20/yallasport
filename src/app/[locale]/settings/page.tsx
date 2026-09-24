import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import type { Metadata } from 'next';
import NotificationSettingsPage from './notifications/page';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'الإعدادات', 'Settings'),
    description: pick(locale, 'إعدادات التنبيهات والحساب.', 'Notification and account settings.'),
    path: '/settings',
    noIndex: true,
  });
}

export default NotificationSettingsPage;
