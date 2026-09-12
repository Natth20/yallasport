import React from 'react';
import type { NormalizedMatch, NormalizedMatchEvent } from '@/lib/sports-data/types';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { getLocale, getTranslations } from 'next-intl/server';
import { Heart } from 'lucide-react';

export type MatchCardEvent = Pick<NormalizedMatchEvent, 'type' | 'minute' | 'teamId'> & {
  extraMinute?: number;
  player?: string;
};

export type MatchCardTable = {
  rank: number;
  points?: number;
};

export type MatchCardH2h = {
  homeWins: number;
  draws: number;
  awayWins: number;
  lastScore?: string;
};

interface MatchCardProps {
  match: NormalizedMatch;
  events?: MatchCardEvent[];
  channel?: string;
  homeRank?: number;
  awayRank?: number;
  homeTable?: MatchCardTable;
  awayTable?: MatchCardTable;
  homeForm?: Array<'W' | 'D' | 'L'>;
  awayForm?: Array<'W' | 'D' | 'L'>;
  h2h?: MatchCardH2h;
  yellowCount?: number;
  redCount?: number;
  country?: string;
  homeFormation?: string;
  awayFormation?: string;
  homePossession?: number;
  awayPossession?: number;
  hasLicensedStream?: boolean;
  venueCity?: string;
  round?: string;
  followed?: boolean;
}

const goalTypes = new Set(['GOAL', 'OWN_GOAL', 'PENALTY']);

function FormPips({ letters }: { letters?: Array<'W' | 'D' | 'L'> }) {
  if (!letters?.length) return null;
  return (
    <span className="fixture-form">
      {letters.map((letter, index) => (
        <span key={`${letter}-${index}`} className={`fixture-form-pip is-${letter.toLowerCase()}`}>
          {letter}
        </span>
      ))}
    </span>
  );
}

export async function MatchCard({
  match,
  events = [],
  channel,
  homeRank,
  awayRank,
  homeTable,
  awayTable,
  homeForm,
  awayForm,
  h2h,
  yellowCount = 0,
  redCount = 0,
  country,
  homeFormation,
  awayFormation,
  homePossession,
  awayPossession,
  hasLicensedStream,
  venueCity,
  round,
  followed,
}: MatchCardProps) {
  const locale = await getLocale();
  const t = await getTranslations('sports');
  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
  const isHalftime = match.status === 'HALFTIME';
  const finished = match.status === 'FINISHED';
  const hasNumericScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
  const hasScore = hasNumericScore && (isLive || finished);
  const statusText =
    finished
      ? 'FT'
      : match.status === 'POSTPONED'
        ? t('postponed')
        : match.status === 'CANCELLED'
          ? t('cancelled')
          : null;
  const liveProgress =
    typeof match.minute === 'number' ? Math.min(100, Math.max(2, (match.minute / 90) * 100)) : null;
  const homeWon = hasScore && match.homeScore! > match.awayScore!;
  const awayWon = hasScore && match.awayScore! > match.homeScore!;
  const scorers = events.filter((event) => goalTypes.has(event.type));
  const isHomeEvent = (teamId: string) =>
    teamId === match.homeTeam.id || teamId === match.homeTeam.externalId;
  const homeScorers = scorers.filter((event) => isHomeEvent(event.teamId));
  const awayScorers = scorers.filter((event) => !isHomeEvent(event.teamId));
  const formatMinute = (event: MatchCardEvent) =>
    `${event.minute}${event.extraMinute ? `+${event.extraMinute}` : ''}`;
  const homePlace = homeTable ?? (homeRank ? { rank: homeRank } : undefined);
  const awayPlace = awayTable ?? (awayRank ? { rank: awayRank } : undefined);
  const showHomePoints = homeTable != null && typeof homeTable.points === 'number';
  const showAwayPoints = awayTable != null && typeof awayTable.points === 'number';

  const tone = isHalftime ? 'is-ht' : isLive ? 'is-live' : finished ? 'is-ft' : 'is-soon';

  return (
    <Link href={`/match/${match.id}`} className={`fixture-card group ${tone}`}>
      {followed ? (
        <span className="fixture-followed" title={t('followed')}>
          <Heart className="h-2.5 w-2.5 fill-current" />
        </span>
      ) : null}

      <div className="fixture-card-body">
        <div className="fixture-clock">
          {isLive ? (
            <>
              <em className={isHalftime ? 'is-ht' : undefined}>
                {isHalftime ? t('halftime') : t('live')}
              </em>
              {!isHalftime && match.minute != null ? <strong>{match.minute}′</strong> : null}
            </>
          ) : (
            <span className={statusText ? 'is-status' : undefined}>
              {statusText ?? <ClientTime value={match.kickoffAt} />}
            </span>
          )}
        </div>

        <div className="fixture-teams">
          <div className="fixture-team is-home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={match.homeTeam.logoUrl || '/placeholder-team.png'} alt="" />
            <div className="min-w-0">
              <strong className={homeWon ? 'is-winner' : awayWon ? 'is-muted' : undefined}>
                {match.homeTeam.name}
              </strong>
              {(homeForm?.length || homePlace) && (
                <div className="fixture-team-meta">
                  {homePlace ? (
                    <span>
                      #{homePlace.rank}
                      {showHomePoints ? ` · ${t('points_short', { points: homePlace.points as number })}` : ''}
                    </span>
                  ) : null}
                  <FormPips letters={homeForm} />
                </div>
              )}
            </div>
            {hasNumericScore ? (
              <b className={`fixture-score-n ${isLive ? 'is-live' : homeWon ? 'is-winner' : awayWon ? 'is-muted' : ''}`}>
                {match.homeScore}
              </b>
            ) : null}
          </div>

          <div className="fixture-team is-away">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={match.awayTeam.logoUrl || '/placeholder-team.png'} alt="" />
            <div className="min-w-0">
              <strong className={awayWon ? 'is-winner' : homeWon ? 'is-muted' : undefined}>
                {match.awayTeam.name}
              </strong>
              {(awayForm?.length || awayPlace) && (
                <div className="fixture-team-meta">
                  {awayPlace ? (
                    <span>
                      #{awayPlace.rank}
                      {showAwayPoints ? ` · ${t('points_short', { points: awayPlace.points as number })}` : ''}
                    </span>
                  ) : null}
                  <FormPips letters={awayForm} />
                </div>
              )}
            </div>
            {hasNumericScore ? (
              <b className={`fixture-score-n ${isLive ? 'is-live' : awayWon ? 'is-winner' : homeWon ? 'is-muted' : ''}`}>
                {match.awayScore}
              </b>
            ) : (
              <span className="fixture-vs">{isLive ? (isHalftime ? t('halftime') : t('live')) : 'VS'}</span>
            )}
          </div>
        </div>
      </div>

      {(scorers.length > 0 ||
        channel ||
        match.venue ||
        venueCity ||
        yellowCount > 0 ||
        redCount > 0 ||
        country ||
        homeFormation ||
        awayFormation ||
        homePossession != null ||
        awayPossession != null ||
        h2h ||
        round ||
        hasLicensedStream) && (
        <div className="fixture-card-foot">
          <div className="min-w-0 flex-1">
            {h2h && h2h.homeWins + h2h.draws + h2h.awayWins > 0 ? (
              <p>
                {t('head_to_head')}
                {' · '}
                <span className="text-emerald-600">{h2h.homeWins}{t('win_short')}</span>{' '}
                <span className="text-muted-foreground">{h2h.draws}{t('draw_short')}</span>{' '}
                <span className="text-orange-500">{h2h.awayWins}{t('win_short')}</span>
                {h2h.lastScore ? ` · ${h2h.lastScore}` : ''}
              </p>
            ) : null}
            {scorers.length > 0 ? (
              <p>
                {[
                  homeScorers
                    .map((event) => `${event.player ? `${event.player} ` : ''}${formatMinute(event)}'`)
                    .join(locale === 'ar' ? '، ' : ', '),
                  awayScorers
                    .map((event) => `${event.player ? `${event.player} ` : ''}${formatMinute(event)}'`)
                    .join(locale === 'ar' ? '، ' : ', '),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            ) : match.venue ? (
              <p>{[match.venue, venueCity].filter(Boolean).join(' · ')}</p>
            ) : country ? (
              <p>{country}</p>
            ) : null}
            {(round ||
              yellowCount > 0 ||
              redCount > 0 ||
              homeFormation ||
              awayFormation ||
              (homePossession != null && awayPossession != null)) && (
              <p>
                {[
                  round ? t('round_label', { round }) : '',
                  homeFormation || awayFormation
                    ? [homeFormation, awayFormation].filter(Boolean).join(' × ')
                    : '',
                  homePossession != null && awayPossession != null
                    ? `${homePossession}%–${awayPossession}%`
                    : '',
                  yellowCount > 0 ? t('yellow_cards', { count: yellowCount }) : '',
                  redCount > 0 ? t('red_cards', { count: redCount }) : '',
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>
          {hasLicensedStream ? (
            <span className="fixture-chip is-stream">{t('licensed_feed')}</span>
          ) : channel ? (
            <span className="fixture-chip">{channel}</span>
          ) : null}
        </div>
      )}

      {isLive && liveProgress != null ? (
        <span className="fixture-progress" aria-hidden>
          <i style={{ width: `${liveProgress}%` }} />
        </span>
      ) : null}
    </Link>
  );
}
