import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { ReportDesk } from '@/components/legal/ReportDesk';
import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo/site';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'إبلاغ عن محتوى', 'Report content'),
    description: pick(
      locale,
      'بلّغ يلا سبورت عن خطأ في نتيجة، خبر بلا مصدر، أو انتهاك حقوق. الرسالة تُحفظ في صندوق لوحة التحكم وتُرسل نسخة إلى بريد الموقع.',
      'Report a score error, unsourced news, or a rights issue. It is stored in the dashboard inbox and copied to the site email when mail is on.'
    ),
    path: '/report',
  });
}

export default function ReportPage() {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <ReportPageBody />
    </Suspense>
  );
}

async function ReportPageBody() {
  const locale = await getLocale();
  return <ReportDesk locale={locale} />;
}
