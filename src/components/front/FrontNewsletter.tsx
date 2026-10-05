import { FooterBrief } from '@/components/layout/FooterBrief';
import styles from './front-design.module.css';

export function FrontNewsletter({ locale }: { locale: string }) {
  const ar = locale === 'ar';
  return (
    <section className={styles.newsletterBand}>
      <div>
        <p className={styles.newsletterKicker}>{ar ? 'النشرة' : 'Briefing'}</p>
        <h3 className={styles.newsletterTitle}>{ar ? 'نشرة يلا سبورت' : 'Yalla Sport newsletter'}</h3>
        <p className={styles.newsletterDesc}>
          {ar ? 'أهم الأخبار والنتائج يوميًا على بريدك.' : 'Daily news and results in your inbox.'}
        </p>
      </div>
      <FooterBrief locale={locale} />
    </section>
  );
}
