import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontScorers } from '@/lib/front/load-scorers';
import { FrontMark } from '../FrontMark';
import { daysWindowLabel } from '../front-labels';
import type { FrontScorer } from '@/lib/front/types';
import shell from '../front-shell.module.css';
import styles from '../scorers.module.css';

function List({ rows, unit }: { rows: FrontScorer[]; unit: string }) {
  if (rows.length === 0) return null;
  return (
    <ol className={styles.list}>
      {rows.map((row, index) => {
        const inner = (
          <>
            <em className={styles.rank}>{String(index + 1).padStart(2, '0')}</em>
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photoUrl} alt="" />
            ) : (
              <span className={styles.fallback}>{row.name.charAt(0)}</span>
            )}
            <strong>{row.name}</strong>
            <b className={styles.value}>
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
  const { goals, assists, days } = await loadFrontScorers(locale);
  if (goals.length === 0 && assists.length === 0) return null;
  return (
    <section className={`${shell.band} ${styles.tone}`}>
      <div className={shell.inner}>
        <FrontMark
          num="02"
          title={t('ch04_title')}
          note={
            days > 0
              ? daysWindowLabel(days, locale)
              : locale === 'ar'
                ? 'من جداول الهدافين المخزّنة للموسم.'
                : 'From the stored season scoring tables.'
          }
          href="/stats"
          cta={t('ch04_cta')}
        />
        <div className={styles.split}>
          {goals.length > 0 ? (
            <div>
              <h3 className={styles.h3}>{t('ch04_goals')}</h3>
              <List rows={goals.slice(0, 5)} unit={t('ch04_goals')} />
            </div>
          ) : null}
          {assists.length > 0 ? (
            <div>
              <h3 className={styles.h3}>{t('ch04_assists')}</h3>
              <List rows={assists.slice(0, 5)} unit={t('ch04_assists')} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
