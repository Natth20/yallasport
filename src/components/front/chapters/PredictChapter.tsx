import { getTranslations } from 'next-intl/server';
import { loadFrontPredict } from '@/lib/front/load-predict';
import { FrontMark } from '../FrontMark';
import shell from '../front-shell.module.css';
import styles from '../predict.module.css';

export async function PredictChapter() {
  const t = await getTranslations('front');
  const stats = await loadFrontPredict();
  if (!stats) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark num={t('ch10')} title={t('ch10_title')} note={t('ch10_note')} href="/leaderboard" cta={t('ch10_cta')} />
        <ul className={styles.stats}>
          <li>
            <strong>{stats.total}</strong>
            <span>{t('ch10_total')}</span>
          </li>
          {stats.settled > 0 ? (
            <li className={styles.settled}>
              <strong>{stats.settled}</strong>
              <span>{t('ch10_settled')}</span>
            </li>
          ) : null}
        </ul>
        {stats.leaders.length > 0 ? (
          <div>
            <h3 className={styles.h3}>{t('ch10_leaders')}</h3>
            <ol className={styles.list}>
              {stats.leaders.map((row, index) => (
                <li key={`${row.name}-${index}`}>
                  <div>
                    <em className={styles.rank}>{String(index + 1).padStart(2, '0')}</em>
                    <strong>{row.name || '—'}</strong>
                    <b>{row.points}</b>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </section>
  );
}
