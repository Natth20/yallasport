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
    <section className={styles.goalsSection} aria-label={ar ? 'آخر الأهداف المسجلة' : 'Latest goals'}>
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <div className={styles.ledgerIconBadge} aria-hidden>
            ⚽
          </div>
          <div>
            <h3 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.25rem' }}>
              {ar ? 'آخر الأهداف المسجلة' : 'Latest Goals Scored'}
            </h3>
            <p className={styles.sectionSubtitle} style={{ margin: '0.2rem 0 0', fontSize: '0.8rem' }}>
              {ar ? 'أحدث الأهداف واللحظات التهديفية في المباريات' : 'Recent goals and matchday scoring moments'}
            </p>
          </div>
        </div>
        <Link href="/matches" className={styles.arenaFooterLink} style={{ margin: 0, padding: '0.4rem 0.85rem' }}>
          {ar ? 'كل المباريات والأهداف ←' : 'All matches & goals →'}
        </Link>
      </div>

      <div className={styles.goalsGrid}>
        {goals.map((goal) => (
          <Link
            key={goal.id}
            href={`/match/${goal.matchId}`}
            className={styles.goalCard}
            title={`${goal.player} (${goal.minute}′) - ${goal.home} vs ${goal.away}`}
          >
            <div className={styles.goalCardHeader}>
              <span className={styles.goalMinuteBadge}>
                <span>⏱</span>
                <span>{goal.minute}′</span>
              </span>
              {goal.leagueName ? (
                <span className={styles.goalLeagueTag}>{goal.leagueName}</span>
              ) : (
                <span className={styles.goalLeagueTag}>{ar ? 'مباراة مباشرة' : 'Live match'}</span>
              )}
            </div>

            <div className={styles.goalScorerBlock}>
              <div className={styles.goalBallIcon} aria-hidden>
                ⚽
              </div>
              <div className={styles.goalScorerInfo}>
                <strong className={styles.goalScorerName}>
                  {goal.player || (ar ? 'هدف مسجل' : 'Goal Scored')}
                </strong>
                {goal.type === 'PENALTY' ? (
                  <span className={styles.goalPenaltyBadge}>{ar ? 'ضربة جزاء' : 'Penalty Kick'}</span>
                ) : null}
              </div>
            </div>

            <div className={styles.goalMatchRow}>
              <span className={styles.goalTeamHome} title={goal.home}>
                {goal.home}
              </span>
              <span className={styles.goalVsDivider}>×</span>
              <span className={styles.goalTeamAway} title={goal.away}>
                {goal.away}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
