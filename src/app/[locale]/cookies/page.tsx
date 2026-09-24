import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { CookieLedger } from '@/components/legal/CookieLedger';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';
import { gaMeasurementId } from '@/lib/analytics/config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'ملفات الارتباط', 'Cookies'),
    description: pick(
      locale,
      'سجل ملفات الارتباط في يلا سبورت بأسمائها الحقيقية: اللغة، المظهر، المنطقة الزمنية، الجلسة، والاستفتاء. تحليلات غوغل لا تُحمَّل إلا بعد الموافقة ومعرّف قياس حقيقي.',
      'The Yalla Sport cookie ledger by real name: language, theme, timezone, session, and poll. Google Analytics loads only after consent and with a real measurement ID.'
    ),
    path: '/cookies',
  });
}

export default function CookiesPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <CookiesPageBody />
    </Suspense>
  );
}

async function CookiesPageBody() {
  const locale = await getLocale();
  return <CookieLedger locale={locale} analyticsId={gaMeasurementId()} />;
}
