import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontTape } from '@/lib/front/load-tape';
import styles from './front-design.module.css';

export async function FrontGoalsTape() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const goals = (await loadFrontTape(locale)).slice(0, 6);
  if (goals.length === 0) return null;

  return (
    <section className={styles.midSection}>
      <div className={styles.sectionHeaderRow}>
        <h3 className={styles.sectionTitle}>
          <span>⚽</span>
          {ar ? 'آخر الأهداف' : 'Latest goals'}
        </h3>
        <Link href="/matches" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          {ar ? 'كل الأحداث ←' : 'All events →'}
        </Link>
      </div>
      <ol className={styles.goalsTape}>
        {goals.map((goal) => (
          <li key={goal.id}>
            <Link href={goal.slug ? `/player/${goal.slug}` : `/match/${goal.matchId}`}>
              <em>{goal.minute}′</em>
              <strong>⚽ {goal.player || (ar ? 'هدف' : 'Goal')}</strong>
              <span>
                {goal.home} × {goal.away}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
