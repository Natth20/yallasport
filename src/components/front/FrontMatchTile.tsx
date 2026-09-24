import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import type { FrontMatch } from '@/lib/front/types';
import styles from './front-hall.module.css';

export function FrontMatchTile({ match, liveLabel, ftLabel, vsLabel }: { match: FrontMatch; liveLabel: string; ftLabel: string; vsLabel: string }) {
  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  return (
    <Link href={`/match/${match.id}`} className={`${styles.match}${live ? ` ${styles.matchLive}` : ''}`}>
      <span className={styles.matchComp}>
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        {match.league.name}
      </span>
      <div className={styles.matchDuel}>
        <span>
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-6 w-6" />
          <strong>{match.homeTeam.name}</strong>
        </span>
        <i>
          {live || finished ? (
            <>
              {match.homeScore ?? '—'}–{match.awayScore ?? '—'}
            </>
          ) : (
            vsLabel
          )}
        </i>
        <span>
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-6 w-6" />
          <strong>{match.awayTeam.name}</strong>
        </span>
      </div>
      <em>
        {live ? (
          <>
            {liveLabel}
            {match.minute ? ` · ${match.minute}′` : ''}
          </>
        ) : finished ? (
          ftLabel
        ) : (
          <ClientTime
            value={match.kickoffAt}
            options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
          />
        )}
      </em>
    </Link>
  );
}
