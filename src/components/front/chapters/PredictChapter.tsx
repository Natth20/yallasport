import { getTranslations } from 'next-intl/server';
import { loadFrontPredict } from '@/lib/front/load-predict';
import { FrontMark } from '../FrontMark';
import styles from '../front-hall.module.css';

export async function PredictChapter() {
  const t = await getTranslations('front');
  const stats = await loadFrontPredict();
  if (!stats) return null;
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch10')} title={t('ch10_title')} note={t('ch10_note')} href="/leaderboard" cta={t('ch10_cta')} />
      <ul className={styles.pulseInline}>
        <li>
          <strong>{stats.total}</strong>
          <span>{t('ch10_total')}</span>
        </li>
        {stats.settled > 0 ? (
          <li>
            <strong>{stats.settled}</strong>
            <span>{t('ch10_settled')}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

