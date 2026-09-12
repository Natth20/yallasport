import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { LegalClause, LegalDesk } from '@/components/legal/LegalDesk';
import { ReportComposer } from '@/components/legal/ReportComposer';
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

export default async function ReportPage() {
  const locale = await getLocale();
  const toc = [
    { id: 'when', label: pick(locale, 'متى تبلّغ', 'When to report') },
    { id: 'need', label: pick(locale, 'ماذا نحتاج', 'What we need') },
    { id: 'send', label: pick(locale, 'الإرسال', 'Send') },
    { id: 'after', label: pick(locale, 'بعد الإرسال', 'After you send') },
  ];

  return (
    <LegalDesk
      locale={locale}
      path="/report"
      code="YS-L04"
      gate={pick(locale, 'البوابة 04', 'Gate 04')}
      title={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      kicker={pick(locale, 'خط المكتب · صندوق واحد', 'Desk line · one inbox')}
      updated={pick(locale, 'نسخة الملعب · سبتمبر 2026', 'Pitch edition · September 2026')}
      summary={pick(
        locale,
        'إن رأيت رقماً لا يطابق المصدر، أو خبراً بلا اعتماد، أو علامة ليست لنا، اكتب للمكتب. الإرسال يحفظ الرسالة في لوحة التحكم ويرسل نسخة إلى بريد الموقع إن كانت خدمة البريد مفعّلة.',
        'If a figure does not match the source, a story is unapproved, or a mark is not ours, write to the desk. Submit stores it in the dashboard and copies the site email when mail is configured.'
      )}
      seals={[
        pick(locale, 'صندوق اللوحة', 'Dashboard inbox'),
        pick(locale, 'نسخة للبريد', 'Mail copy'),
        pick(locale, 'المصدر أولاً', 'Source first'),
      ]}
      toc={toc}
    >
      <LegalClause id="when" index="01" title={pick(locale, 'متى تبلّغ', 'When to report')}>
        <ul>
          <li>{pick(locale, 'نتيجة أو دقيقة أو جدول يختلف عما في المصدر الرياضي.', 'A score, minute or table that differs from the sports source.')}</li>
          <li>{pick(locale, 'خبر منشور يبدو بلا مصدر أو يخلط رأياً بخبر معتمد.', 'A published story that looks unsourced or mixes opinion with approved news.')}</li>
          <li>{pick(locale, 'شعار أو مقطع أو نص تظن أنه يُعرض بلا حق.', 'A crest, clip or text you believe is shown without right.')}</li>
          <li>{pick(locale, 'تعليق مسيء، أو بث يظهر رغم أن الترخيص غير قائم.', 'An abusive comment, or a stream showing when no licence stands.')}</li>
        </ul>
      </LegalClause>

      <LegalClause id="need" index="02" title={pick(locale, 'ماذا نحتاج', 'What we need')}>
        <p>
          {pick(
            locale,
            'رابط الصفحة، الوقت التقريبي، وما يظهر عندك، وما تراه في المصدر إن وُجد. كلّما كان البلاغ محدداً، كان الردّ أسرع. بلاغ بلا رابط قد يُهمل.',
            'The page URL, the approximate time, what you see, and what the source shows if you have it. The more specific the notice, the faster the reply. A notice without a link may be set aside.'
          )}
        </p>
      </LegalClause>

      <LegalClause id="send" index="03" title={pick(locale, 'الإرسال', 'Send')}>
        <ReportComposer locale={locale} channel="report" />
      </LegalClause>

      <LegalClause id="after" index="04" title={pick(locale, 'بعد الإرسال', 'After you send')}>
        <p>
          {pick(
            locale,
            'الرسائل الجدية تظهر في صندوق المكتب بلوحة التحكم، ونسخة إلى contact@yallasport.com عندما تكون خدمة البريد مفعّلة. مرجع المكتب الذي يظهر بعد الإرسال هو رقم السجل الحقيقي، لا تذكرة وهمية بمهلة ساعة. إن لزم تصحيح رقم رياضي ننتظر المصدر.',
            'Genuine notices appear in the dashboard desk inbox, with a copy to contact@yallasport.com when mail is configured. The desk reference after submit is the real record id, not a fake one-hour ticket. If a sports figure must change, we wait for the source.'
          )}
        </p>
      </LegalClause>
    </LegalDesk>
  );
}
