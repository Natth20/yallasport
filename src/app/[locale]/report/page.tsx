import { Suspense } from 'react';
import { getLocale } from 'next-intl/server';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { pick } from '@/i18n/pick';
import { ReportDesk } from '@/components/legal/ReportDesk';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
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
  return (
    <SalonStage
      tone="deed"
      wide
      compact
      kicker={pick(locale, 'مكتب العمليات', 'Operations desk')}
      title={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      lead={pick(
        locale,
        'اكتب المشكلة بوضوح. البلاغ يصل لوحة العمليات. ما في أرقام وهمية هنا — رقم التتبع يظهر بعد الإرسال فقط.',
        'Describe the problem clearly. The report goes to the operations desk. No invented SLAs — a tracking id appears only after you submit.',
      )}
      aside="YS-DESK-01"
      tools={
        <HallFoyer
          label={pick(locale, 'جناح الوثائق', 'Legal suite')}
          items={[
            { href: '/about', label: pick(locale, 'من نحن', 'About') },
            { href: '/contact', label: pick(locale, 'تواصل', 'Contact') },
            { href: '/report', label: pick(locale, 'إبلاغ', 'Report'), current: true },
            { href: '/privacy', label: pick(locale, 'الخصوصية', 'Privacy') },
            { href: '/terms', label: pick(locale, 'الشروط', 'Terms') },
          ]}
        />
      }
    >
      <ReportDesk locale={locale} />
    </SalonStage>
  );
}
