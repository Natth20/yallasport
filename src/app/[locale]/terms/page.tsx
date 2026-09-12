import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { TermsDeed } from '@/components/legal/TermsDeed';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'شروط الاستخدام', 'Terms of Use'),
    description: pick(
      locale,
      'عقد استخدام يلا سبورت: النتائج من المصدر، الخبر المعتمد، البث المرخّص فقط، والتوقع ليس رهاناً.',
      'The Yalla Sport deed of use: scores from the source, approved news, licensed playback only, and predictions are not a wager.'
    ),
    path: '/terms',
  });
}

export default async function TermsPage() {
  const locale = await getLocale();
  return <TermsDeed locale={locale} />;
}
