import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import type { FrontMatch } from '@/lib/front/types';
import styles from './front-hall.module.css';

export function FrontScoreCard({
  match,
  liveLabel,
  ftLabel,
  openLabel,
}: {
  match: FrontMatch;
  liveLabel: string;
  ftLabel: string;
  openLabel: string;
}) {
  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  const showScore = live || finished;
  return (
    <Link href={`/match/${match.id}`} className={`${styles.score}${live ? ` ${styles.scoreLive}` : ''}`}>
      <span className={styles.scoreComp}>
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        {match.league.name}
        <em>
          {live ? (
            <>
              <i className={styles.liveDot} aria-hidden />
              {liveLabel}
              {match.minute != null ? ` ${match.minute}′` : ''}
            </>
          ) : finished ? (
            ftLabel
          ) : (
            <ClientTime value={match.kickoffAt} options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }} />
          )}
        </em>
      </span>
      <span className={styles.scoreDuel}>
        <span>
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-9 w-9" />
          <strong>{match.homeTeam.name}</strong>
        </span>
        <b>
          {showScore ? (
            <>
              {match.homeScore ?? '—'}
              <i>–</i>
              {match.awayScore ?? '—'}
            </>
          ) : (
            <ClientTime value={match.kickoffAt} options={{ hour: '2-digit', minute: '2-digit' }} />
          )}
        </b>
        <span>
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-9 w-9" />
          <strong>{match.awayTeam.name}</strong>
        </span>
      </span>
      <span className={styles.scoreCta}>{openLabel}</span>
    </Link>
  );
}
