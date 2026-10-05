import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBoard } from '@/lib/front/load-board';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import styles from './front-design.module.css';

export async function FrontResultsStrip() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const finished = (await loadFrontBoard(locale)).filter((match) => match.status === 'FINISHED').slice(0, 6);
  if (finished.length === 0) return null;

  return (
    <div className={`${styles.resultsBand} ${styles.level2}`}>
      <div className={styles.resultsHead}>
        <h4 className={styles.resultsTitle}>
          <span>🏁</span>
          {ar ? 'نتائج اليوم' : "Today's results"}
        </h4>
        <Link href="/matches?status=finished" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          {ar ? 'كل النتائج ←' : 'All results →'}
        </Link>
      </div>
      <div className={styles.resultsGrid}>
        {finished.map((match) => (
          <Link key={match.id} href={`/match/${match.id}`} className={styles.resultCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-4 w-4" />
              <span className={styles.resultTeamName}>{match.homeTeam.name}</span>
            </div>
            <span className={styles.resultScoreText}>
              {match.homeScore ?? 0} : {match.awayScore ?? 0}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className={styles.resultTeamName}>{match.awayTeam.name}</span>
              <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-4 w-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
