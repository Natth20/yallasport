import { loadFrontPulse } from '@/lib/front/load-pulse';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import styles from './front-design.module.css';

export async function FrontPulseCounter() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const pulse = await loadFrontPulse();

  return (
    <div className={styles.counterRibbon} aria-label={ar ? 'إحصائيات اليوم السريعة' : 'Quick stats'}>
      <Link href="/matches" className={styles.counterItem}>
        <span className={styles.counterLabel}>{ar ? 'مباريات اليوم' : "Today's matches"}</span>
        <span className={styles.counterValue}>{pulse.matches}</span>
      </Link>
      <Link href="/live" className={styles.counterItem}>
        <span className={styles.counterLabel}>{ar ? 'مباشر الآن' : 'Live now'}</span>
        <span className={`${styles.counterValue} ${styles.counterValueLive}`}>
          {pulse.live > 0 ? <i className={styles.liveDotGlow} /> : null}
          {pulse.live}
        </span>
      </Link>
      <Link href="/stats" className={styles.counterItem}>
        <span className={styles.counterLabel}>{ar ? 'أهداف' : 'Goals'}</span>
        <span className={styles.counterValue}>{pulse.goals}</span>
      </Link>
      <Link href="/stats" className={styles.counterItem}>
        <span className={styles.counterLabel}>{ar ? 'صفراء' : 'Yellows'}</span>
        <span className={styles.counterValue}>{pulse.yellow}</span>
      </Link>
    </div>
  );
}
