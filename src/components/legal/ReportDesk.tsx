'use client';

import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { DeskComposer } from './DeskComposer';
import { LexChamber, LexSection, LexCheckList } from './LexChamber';
import styles from './lex.module.css';
import { Mail, Trophy, FileText, ShieldCheck, Flame } from 'lucide-react';

export function ReportDesk({ locale }: { locale: string }) {
  const rail = [
    { id: 'submit-form', label: pick(locale, 'إرسال بلاغ', 'Send a report') },
    { id: 'when-to-report', label: pick(locale, 'ماذا نراجع', 'What we review') },
    { id: 'workflow', label: pick(locale, 'بعد الإرسال', 'After you send') },
    { id: 'channels', label: pick(locale, 'البريد', 'Email') },
  ];

  const cats = [
    {
      icon: Trophy,
      title: pick(locale, 'نتيجة أو جدول', 'Score or table'),
      body: pick(locale, 'نتيجة، هداف، أو بطاقة ما تطابق المباراة.', 'A score, scorer, or card that does not match the match.'),
    },
    {
      icon: FileText,
      title: pick(locale, 'خبر بلا مصدر', 'Unsourced news'),
      body: pick(locale, 'خبر مضلل أو من غير مصدر ظاهر.', 'A misleading story or one with no visible source.'),
    },
    {
      icon: ShieldCheck,
      title: pick(locale, 'حقوق نشر', 'Copyright'),
      body: pick(locale, 'صورة أو نص تظنه يخصك.', 'An image or text you believe you own.'),
    },
    {
      icon: Flame,
      title: pick(locale, 'تعليق مسيء', 'Abuse'),
      body: pick(locale, 'سباب، تحريض، أو خطاب كراهية.', 'Insults, incitement, or hate speech.'),
    },
  ];

  return (
    <LexChamber
      locale={locale}
      path="/report"
      tone="desk"
      code="YS-DESK-01"
      instrument={pick(locale, 'بلاغات', 'Reports')}
      title={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      wordmark={pick(locale, 'إبلاغ عن محتوى', 'Report content')}
      eyebrow={pick(locale, 'مكتب العمليات', 'Operations desk')}
      lead={pick(
        locale,
        'اكتب المشكلة بوضوح. البلاغ يصل لوحة العمليات. ما في أرقام وهمية هنا — رقم التتبع يظهر بعد الإرسال فقط.',
        'Describe the problem clearly. The report goes to the operations desk. No invented SLAs — a tracking id appears only after you submit.',
      )}
      seals={[
        pick(locale, 'نموذج مباشر', 'Direct form'),
        pick(locale, 'مراجعة بشرية', 'Human review'),
        pick(locale, 'رقم بعد الإرسال', 'Id after send'),
      ]}
      rail={rail}
    >
      <LexSection
        id="submit-form"
        index="01"
        kicker={pick(locale, 'الخطوة الأولى', 'First step')}
        title={pick(locale, 'أرسل البلاغ', 'Send the report')}
      >
        <p className="mb-4">
          {pick(
            locale,
            'اختر النوع، اكتب التفاصيل (١٢ حرفاً على الأقل)، واترك بريداً إن بدك رد.',
            'Pick a type, write at least 12 characters, and leave an email if you want a reply.',
          )}
        </p>
        <DeskComposer locale={locale} channel="report" />
      </LexSection>

      <LexSection
        id="when-to-report"
        index="02"
        kicker={pick(locale, 'الفئات', 'Categories')}
        title={pick(locale, 'ماذا نراجع', 'What we review')}
      >
        <div className={styles['lex-report-cats']}>
          {cats.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.title} className={styles['lex-report-cat']}>
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--lex-accent)]" />
                <div>
                  <h4>{cat.title}</h4>
                  <p>{cat.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </LexSection>

      <LexSection
        id="workflow"
        index="03"
        kicker={pick(locale, 'المسار', 'Path')}
        title={pick(locale, 'بعد الإرسال', 'After you send')}
      >
        <LexCheckList
          items={[
            pick(locale, 'يُحفظ البلاغ ويظهر رقم تتبع إن نجح الإرسال.', 'The report is stored and a tracking id appears if the send succeeds.'),
            pick(locale, 'المكتب يطابق الواقعة مع المصدر أو الصفحة المذكورة.', 'The desk checks the claim against the source or the page you named.'),
            pick(locale, 'إن تركت بريداً، الرد يذهب عليه بعد المراجعة.', 'If you left an email, the reply goes there after review.'),
          ]}
        />
      </LexSection>

      <LexSection
        id="channels"
        index="04"
        kicker={pick(locale, 'بديل', 'Alternative')}
        title={pick(locale, 'البريد الرسمي', 'Official email')}
      >
        <a href={`mailto:${CONTACT_EMAIL}`} className={styles['lex-sidebar-btn']}>
          <Mail className="h-3.5 w-3.5" />
          <span>{CONTACT_EMAIL}</span>
        </a>
      </LexSection>
    </LexChamber>
  );
}
