import { pick } from '@/i18n/pick';
import { FooterBrief } from '@/components/layout/FooterBrief';
import shell from './front-shell.module.css';

export function HomeBrief({ locale }: { locale: string }) {
  return (
    <section className={shell.band}>
      <div className={shell.inner}>
        <h2>{pick(locale, 'نشرة يلا سبورت', 'Yalla Sport briefing')}</h2>
        <p>{pick(locale, 'أهم الأخبار والنتائج يوميًا على بريدك.', 'The day’s news and results to your inbox.')}</p>
        <FooterBrief locale={locale} />
      </div>
    </section>
  );
}
