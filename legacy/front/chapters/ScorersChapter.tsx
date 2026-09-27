import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontScorers } from '@/lib/front/load-scorers';
import { FrontMark } from '../FrontMark';
import type { FrontScorer } from '@/lib/front/types';
import styles from '../front-hall.module.css';

function List({ rows, unit }: { rows: FrontScorer[]; unit: string }) {
  if (rows.length === 0) return null;
  return (
    <ol className={styles.scorers}>
      {rows.map((row, index) => {
        const inner = (
          <>
            <em>{String(index + 1).padStart(2, '0')}</em>
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photoUrl} alt="" />
            ) : (
              <span>{row.name.charAt(0)}</span>
            )}
            <strong>{row.name}</strong>
            <b>
              {row.value} {unit}
            </b>
          </>
        );
        return (
          <li key={`${row.slug || row.name}-${index}`}>
            {row.slug ? <Link href={`/player/${row.slug}`}>{inner}</Link> : <div>{inner}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export async function ScorersChapter() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const { goals, assists } = await loadFrontScorers(locale);
  if (goals.length === 0 && assists.length === 0) return null;
  return (
    <section className={styles.chapter}>
      <FrontMark num={t('ch04')} title={t('ch04_title')} note={t('ch04_note')} href="/stats" cta={t('ch04_cta')} />
      <div className={styles.split}>
        {goals.length > 0 ? (
          <div>
            <h3 className={styles.chapterH3}>{t('ch04_goals')}</h3>
            <List rows={goals} unit={t('ch04_goals')} />
          </div>
        ) : null}
        {assists.length > 0 ? (
          <div>
            <h3 className={styles.chapterH3}>{t('ch04_assists')}</h3>
            <List rows={assists} unit={t('ch04_assists')} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
