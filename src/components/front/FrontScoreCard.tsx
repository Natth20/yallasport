import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import type { FrontMatch } from '@/lib/front/types';
import { specialStatusLabel } from './front-labels';
import shell from './front-shell.module.css';
import styles from './board.module.css';

export function FrontScoreCard({
  match,
  liveLabel,
  ftLabel,
  openLabel,
  locale,
  featured = false,
}: {
  match: FrontMatch;
  liveLabel: string;
  ftLabel: string;
  openLabel: string;
  locale: string;
  featured?: boolean;
}) {
  const live = isLiveStatus(match.status);
  const finished = match.status === 'FINISHED';
  const showScore = live || finished;
  const special = specialStatusLabel(match.status, locale);
  const className = [styles.score, featured ? styles.scoreFeatured : ''].filter(Boolean).join(' ');
  return (
    <Link href={`/match/${match.id}`} className={className}>
      <span className={styles.comp}>
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        <span className={styles.compText}>
          <strong>{match.league.name}</strong>
          {match.league.country ? <small className={shell.meta}>{match.league.country}</small> : null}
        </span>
        <em>
          {live ? (
            <span className={styles.liveBadge}>
              <i className={styles.liveDot} aria-hidden />
              {liveLabel}
              {match.minute != null ? ` ${match.minute}′` : ''}
            </span>
          ) : finished ? (
            ftLabel
          ) : special ? (
            special
          ) : (
            <ClientTime value={match.kickoffAt} options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }} />
          )}
        </em>
      </span>
      <span className={styles.duel}>
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
      <span className={styles.open}>{openLabel}</span>
    </Link>
  );
}
