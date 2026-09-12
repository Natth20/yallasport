import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { PrivacyVault } from '@/components/legal/PrivacyVault';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'سياسة الخصوصية', 'Privacy Policy'),
    description: pick(
      locale,
      'خزنة خصوصية يلا سبورت: جرد ما نجمعه، ملفات الارتباط بأسمائها، التخزين المحلي، المعالجون، وحقوقك. لا بيع للبيانات.',
      'The Yalla Sport privacy vault: an inventory of what we collect, cookies by name, local storage, processors, and your rights. We do not sell data.'
    ),
    path: '/privacy',
  });
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  return <PrivacyVault locale={locale} />;
}
