'use client';

import { pick } from '@/i18n/pick';
import { CONTACT_EMAIL } from '@/lib/seo/site';
import { DeskComposer } from './DeskComposer';
import {
  FileText,
  Flame,
  Mail,
  ShieldCheck,
  Trophy,
} from 'lucide-react';
import styles from './report-desk.module.css';

export function ReportDesk({ locale }: { locale: string }) {
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

  const steps = [
    {
      no: '01',
      title: pick(locale, 'يُحفظ البلاغ', 'It is filed'),
      body: pick(locale, 'رقم التتبع يظهر هنا فقط إن نجح الإرسال.', 'A tracking id appears here only if the send succeeds.'),
    },
    {
      no: '02',
      title: pick(locale, 'مراجعة المكتب', 'Desk review'),
      body: pick(locale, 'المكتب يطابق الواقعة مع المصدر أو الصفحة المذكورة.', 'The desk checks the claim against the source or the page you named.'),
    },
    {
      no: '03',
      title: pick(locale, 'الرد إن وُجد بريد', 'A reply if you left mail'),
      body: pick(locale, 'إن تركت بريداً، الرد يذهب عليه بعد المراجعة.', 'If you left an email, the reply goes there after review.'),
    },
  ];

  return (
    <div className={styles.desk}>
      <div className="salon-meters" aria-label={pick(locale, 'قواعد المكتب', 'Desk rules')}>
        <div className="salon-meter">
          <strong>01</strong>
          <em>{pick(locale, 'نموذج مباشر', 'Direct form')}</em>
        </div>
        <div className="salon-meter">
          <strong>02</strong>
          <em>{pick(locale, 'مراجعة بشرية', 'Human review')}</em>
        </div>
        <div className="salon-meter">
          <strong>03</strong>
          <em>{pick(locale, 'رقم بعد الإرسال', 'Id after send')}</em>
        </div>
        <div className="salon-meter">
          <strong>12</strong>
          <em>{pick(locale, 'حرف حد أدنى', 'Min. characters')}</em>
        </div>
      </div>

      <div className={styles.board}>
        <section className={styles.sheet} id="submit-form">
          <header className={styles.head}>
            <p className={styles.folio}>01 · {pick(locale, 'المكتب', 'Desk')}</p>
            <h2>{pick(locale, 'أرسل البلاغ', 'Send the report')}</h2>
            <p>
              {pick(
                locale,
                'اختر النوع، اكتب التفاصيل (١٢ حرفاً على الأقل)، واترك بريداً إن بدك رد. ما في مواعيد وهمية — الرقم يظهر بعد الإرسال فقط.',
                'Pick a type, write at least 12 characters, and leave an email if you want a reply. No invented SLAs — an id appears only after you submit.',
              )}
            </p>
          </header>
          <DeskComposer locale={locale} channel="report" />
        </section>

        <aside className={styles.rail}>
          <section className={styles.card} id="when-to-report">
            <header className={styles.head}>
              <p className={styles.folio}>02</p>
              <h2>{pick(locale, 'ماذا نراجع', 'What we review')}</h2>
            </header>
            <div className={styles.cats}>
              {cats.map((cat) => {
                const Icon = cat.icon;
                return (
                  <article key={cat.title} className={styles.cat}>
                    <i aria-hidden>
                      <Icon size={15} />
                    </i>
                    <div>
                      <h3>{cat.title}</h3>
                      <p>{cat.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className={styles.card} id="workflow">
            <header className={styles.head}>
              <p className={styles.folio}>03</p>
              <h2>{pick(locale, 'بعد الإرسال', 'After you send')}</h2>
            </header>
            <div className={styles.steps}>
              {steps.map((step) => (
                <article key={step.no} className={styles.step}>
                  <b>{step.no}</b>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className={styles.card} id="channels">
            <header className={styles.head}>
              <p className={styles.folio}>04</p>
              <h2>{pick(locale, 'البريد الرسمي', 'Official email')}</h2>
              <p>{pick(locale, 'بديل إن تعذّر النموذج.', 'An alternative if the form cannot send.')}</p>
            </header>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.mail}>
              <Mail size={14} />
              <span>{CONTACT_EMAIL}</span>
            </a>
          </section>
        </aside>
      </div>
    </div>
  );
}
