import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontTape } from '@/lib/front/load-tape';
import { FrontMark } from './FrontMark';
import shell from './front-shell.module.css';
import styles from './home-salon.module.css';

export async function HomeTape() {
  const locale = await getLocale();
  const t = await getTranslations('front');
  const goals = await loadFrontTape(locale);
  if (goals.length === 0) return null;

  return (
    <section className={`${shell.band} ${styles.tapeBand}`}>
      <div className={shell.inner}>
        <FrontMark num="—" title={t('stat_goals')} note={t('ch01_note')} href="/matches" cta={t('ch01_cta')} />
        <ul className={styles.tape}>
          {goals.map((goal) => (
            <li key={goal.id}>
              <Link href={goal.slug ? `/player/${goal.slug}` : `/match/${goal.matchId}`}>
                <em>{goal.minute}′</em>
                <strong>{goal.player || t('stat_goals')}</strong>
                <span>
                  {goal.home} — {goal.away}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
