'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { DEFAULT_TIMEZONE, dateKeyInTimezone } from '@/lib/datetime/format';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import type { FrontMatch } from '@/lib/front/types';
import { pick } from '@/i18n/pick';
import { specialStatusLabel } from './front-labels';
import styles from './home-salon.module.css';

type DayId = 'today' | 'tomorrow' | 'after';

function keyForOffset(offset: number) {
  return dateKeyInTimezone(new Date(Date.now() + offset * 86_400_000), DEFAULT_TIMEZONE);
}

function inDay(match: FrontMatch, day: DayId, wanted: string) {
  const live = isLiveStatus(match.status);
  if (day === 'today' && live) return true;
  return dateKeyInTimezone(new Date(match.kickoffAt), DEFAULT_TIMEZONE) === wanted;
}

export function HomeDayTabs({
  matches,
  locale,
  labels,
  programmeKicker,
  programmeTitle,
  allLabel,
  empty,
  liveLabel,
  ftLabel,
}: {
  matches: FrontMatch[];
  locale: string;
  labels: { today: string; tomorrow: string; after: string };
  programmeKicker: string;
  programmeTitle: string;
  allLabel: string;
  empty: string;
  liveLabel: string;
  ftLabel: string;
}) {
  const [day, setDay] = useState<DayId>('today');
  const keys = useMemo(
    () => ({
      today: keyForOffset(0),
      tomorrow: keyForOffset(1),
      after: keyForOffset(2),
    }),
    [],
  );

  const counts = useMemo(
    () => ({
      today: matches.filter((match) => inDay(match, 'today', keys.today)).length,
      tomorrow: matches.filter((match) => inDay(match, 'tomorrow', keys.tomorrow)).length,
      after: matches.filter((match) => inDay(match, 'after', keys.after)).length,
    }),
    [keys, matches],
  );

  const shown = useMemo(
    () => matches.filter((match) => inDay(match, day, keys[day])),
    [day, keys, matches],
  );

  return (
    <div className={styles.stageCol}>
      <div className={styles.stripHead}>
        <div>
          <p>{programmeKicker}</p>
          <h3>{programmeTitle}</h3>
        </div>
        <Link href="/matches" className={styles.more}>
          {allLabel}
        </Link>
      </div>
      <div className={styles.days}>
        {(
          [
            ['today', labels.today],
            ['tomorrow', labels.tomorrow],
            ['after', labels.after],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`${styles.dayBtn}${day === id ? ` ${styles.dayOn}` : ''}`}
            onClick={() => setDay(id)}
            aria-pressed={day === id}
          >
            {label}
            <small>{counts[id]}</small>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className={styles.empty}>{empty}</p>
      ) : (
        <div className={styles.cards}>
          {shown.slice(0, 12).map((match) => {
            const live = isLiveStatus(match.status);
            const finished = match.status === 'FINISHED';
            const special = specialStatusLabel(match.status, locale);
            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={`${styles.card}${live ? ` ${styles.cardLive}` : ''}${isFriendlyLeague(match.league) ? ` ${styles.cardFriendly}` : ''}`}
              >
                <span className={styles.cardTop}>
                  <span>{isFriendlyLeague(match.league) ? pick(locale, 'لقاء ودي', 'Friendly') : match.league.name}</span>
                  {live ? (
                    <span className={styles.livePill}>
                      <i className={styles.dot} aria-hidden />
                      {liveLabel}
                      {match.minute != null ? ` ${match.minute}′` : ''}
                    </span>
                  ) : finished ? (
                    <span>{ftLabel}</span>
                  ) : special ? (
                    <span>{special}</span>
                  ) : (
                    <ClientTime value={match.kickoffAt} locale={locale} variant="clock" />
                  )}
                </span>
                <span className={styles.cardRow}>
                  <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
                  <strong>{match.homeTeam.name}</strong>
                  <b className={styles.cardMark}>{live || finished ? (match.homeScore ?? '–') : '\u00a0'}</b>
                </span>
                <span className={styles.cardRow}>
                  <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
                  <strong>{match.awayTeam.name}</strong>
                  <b className={styles.cardMark}>{live || finished ? (match.awayScore ?? '–') : '\u00a0'}</b>
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
