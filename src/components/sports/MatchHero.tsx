'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { MapPin, Radio, Shield } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { LiveScoreDigits } from '@/components/sports/LiveScoreDigits';
import { LiveDataStatus } from '@/components/sports/LiveDataStatus';
import { MatchCountdown } from '@/components/sports/MatchCountdown';
import { MatchQuickActions } from '@/components/sports/MatchQuickActions';
import { ShareButton } from '@/components/common/ShareButton';
import { FollowButton } from '@/components/common/FollowButton';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { useLocale, useTranslations } from 'next-intl';
import type { NormalizedMatchDetail } from '@/lib/sports-data/types';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import hall from '@/components/salon/entity-hall.module.css';
import styles from './match-dossier.module.css';

interface MatchHeroProps {
  match: NormalizedMatchDetail;
  isLoggedIn?: boolean;
  hasReminder?: boolean;
  hasLicensedStream?: boolean;
  userFollow?: boolean;
}

export function MatchHero({
  match,
  isLoggedIn = false,
  hasReminder = false,
  hasLicensedStream = false,
  userFollow = false,
}: MatchHeroProps) {
  const locale = useLocale();
  const t = useTranslations('sports');

  const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
  const isFinished = match.status === 'FINISHED';
  const isUpcoming = match.status === 'NOT_STARTED';

  const homeLineup = match.lineups?.find(
    (l) => l.teamId === match.homeTeam.id || l.teamId === match.homeTeam.externalId
  );
  const awayLineup = match.lineups?.find(
    (l) => l.teamId === match.awayTeam.id || l.teamId === match.awayTeam.externalId
  );

  return (
    <section id="hall-screen" className={hall.wideScreen}>
      <div className={hall.chassis}>
        <HallBezel
          label={pick(locale, 'مسرح المباراة', 'Match stage')}
          clock={isLive ? (match.minute ? `${match.minute}′` : 'LIVE') : isFinished ? 'FT' : 'HD'}
        />
        <div className={`${hall.frame} ${styles.hero}`}>
          <span className={styles.auroraLeft} aria-hidden />
          <span className={styles.auroraRight} aria-hidden />
          <span className={styles.heroPitchLines} aria-hidden />
          <div className={hall.crestWash} aria-hidden>
            {match.homeTeam.logoUrl ? <img src={match.homeTeam.logoUrl} alt="" /> : <span />}
            {match.awayTeam.logoUrl ? <img src={match.awayTeam.logoUrl} alt="" /> : <span />}
          </div>

          <div className={styles.heroContent}>
            {/* ---- Breadcrumb & Live Badge ---- */}
            <div className={styles.heroTop}>
              <div className={styles.breadcrumb}>
                <Link href="/matches" className={styles.breadcrumbLink}>
                  {pick(locale, 'المباريات', 'Matches')}
                </Link>
                <span className={styles.breadcrumbSeparator}>/</span>
                <Link href={`/league/${match.league.slug}`} className={styles.breadcrumbLink}>
                  {match.league.name}
                </Link>
                {match.round ? (
                  <>
                    <span className={styles.breadcrumbSeparator}>/</span>
                    <span>{t('round_label', { round: match.round })}</span>
                  </>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {isLive ? (
                  <span className={styles.liveBadge}>
                    <span className={styles.liveDot} />
                    {match.status === 'HALFTIME' ? t('halftime') : t('live')}
                  </span>
                ) : isFinished ? (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-white/80">
                    {t('finished')}
                  </span>
                ) : null}

                <FollowButton
                  entityType="MATCH"
                  entityId={match.id}
                  initialIsFollowing={userFollow}
                  isLoggedIn={isLoggedIn}
                  tone="stage"
                  className={styles.stageFollow}
                />
              </div>
            </div>

            {/* ---- Duel Stage ---- */}
            <div className={styles.duelStage}>
              {/* Home Team */}
              <div className={styles.teamSide}>
                <Link href={`/team/${match.homeTeam.slug}`} className={styles.crestStage}>
                  <LeagueCrest
                    name={match.homeTeam.name}
                    logoUrl={match.homeTeam.logoUrl}
                    className="h-full w-full object-contain"
                  />
                </Link>
                <Link href={`/team/${match.homeTeam.slug}`} className={styles.teamName}>
                  {match.homeTeam.name}
                </Link>
                <div className={styles.teamMeta}>
                  {homeLineup?.formation ? (
                    <span className={styles.formationBadge}>{homeLineup.formation}</span>
                  ) : null}
                  {homeLineup?.coach?.name ? (
                    <span>{homeLineup.coach.name}</span>
                  ) : null}
                </div>
              </div>

              {/* Center Scoreboard */}
              <div className={styles.scoreCenter}>
                {isUpcoming ? (
                  <div className="grid justify-items-center gap-2">
                    <ClientTime
                      value={match.kickoffAt}
                      className="text-2xl sm:text-3xl font-black tabular-nums text-white"
                    />
                    <MatchCountdown kickoffAt={new Date(match.kickoffAt)} tone="dark" />
                  </div>
                ) : (
                  <div className="grid justify-items-center gap-1.5">
                    <div className={isLive ? styles.scoreDigitsLive : styles.scoreDigits}>
                      <LiveScoreDigits home={match.homeScore} away={match.awayScore} />
                    </div>
                    {isLive && match.minute ? (
                      <span className={styles.minutePill}>
                        <span className={styles.liveDot} />
                        {match.minute}&prime;
                      </span>
                    ) : null}
                  </div>
                )}
                <span className={styles.statusText}>
                  {isFinished
                    ? pick(locale, 'نهاية المباراة', 'Full time')
                    : isLive
                      ? t('score_now')
                      : pick(locale, 'موعد الركلة', 'Kickoff')}
                </span>
              </div>

              {/* Away Team */}
              <div className={styles.teamSide}>
                <Link href={`/team/${match.awayTeam.slug}`} className={styles.crestStage}>
                  <LeagueCrest
                    name={match.awayTeam.name}
                    logoUrl={match.awayTeam.logoUrl}
                    className="h-full w-full object-contain"
                  />
                </Link>
                <Link href={`/team/${match.awayTeam.slug}`} className={styles.teamName}>
                  {match.awayTeam.name}
                </Link>
                <div className={styles.teamMeta}>
                  {awayLineup?.formation ? (
                    <span className={styles.formationBadge}>{awayLineup.formation}</span>
                  ) : null}
                  {awayLineup?.coach?.name ? (
                    <span>{awayLineup.coach.name}</span>
                  ) : null}
                </div>
              </div>
            </div>

            {/* ---- Metadata & Actions Footer ---- */}
            <div className={styles.heroFooter}>
              <div className={styles.metaItems}>
                {match.venue ? (
                  <span className={styles.metaItem}>
                    <MapPin className="h-3.5 w-3.5 text-orange-400" />
                    {match.venue}
                  </span>
                ) : null}

                {match.referee?.name ? (
                  <span className={styles.metaItem}>
                    <Shield className="h-3.5 w-3.5 text-orange-400" />
                    {match.referee.name}
                  </span>
                ) : null}

                {hasLicensedStream ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-bold text-orange-300">
                    <Radio className="h-3 w-3 animate-pulse" />
                    {t('licensed_feed')}
                  </span>
                ) : null}

                <LiveDataStatus />
              </div>

              <div className={styles.actionsGroup}>
                <MatchQuickActions
                  matchId={match.id}
                  title={`${match.homeTeam.name} × ${match.awayTeam.name}`}
                  kickoffAt={new Date(match.kickoffAt).toISOString()}
                  venue={match.venue}
                  isLoggedIn={isLoggedIn}
                  initialReminder={hasReminder}
                  tone="stage"
                />

                <ShareButton
                  title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
                  text={pick(
                    locale,
                    `تابع مباراة ${match.homeTeam.name} ضد ${match.awayTeam.name} على يلا سبورت`,
                    `Follow ${match.homeTeam.name} vs ${match.awayTeam.name} on Yalla Sport`
                  )}
                />
              </div>
            </div>
          </div>
          <HallBrackets />
        </div>
      </div>

      <div className={hall.program}>
        <div className={hall.chips}>
          <span className={hall.chipOn}>{match.league.name}</span>
          {match.round ? <span className={hall.chip}>{t('round_label', { round: match.round })}</span> : null}
          {match.venue ? <span className={hall.chip}>{match.venue}</span> : null}
          {homeLineup?.formation || awayLineup?.formation ? (
            <span className={hall.chip}>
              {[homeLineup?.formation, awayLineup?.formation].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </div>
        <h2 className={hall.programTitle}>
          {match.homeTeam.name} — {match.awayTeam.name}
        </h2>
        <div className={hall.acts}>
          <Link href={`/league/${match.league.slug}`} className={hall.ghost}>
            {pick(locale, 'قاعة البطولة', 'League hall')}
          </Link>
          <Link href={`/team/${match.homeTeam.slug}`} className={hall.ghost}>
            {match.homeTeam.name}
          </Link>
          <Link href={`/team/${match.awayTeam.slug}`} className={hall.ghost}>
            {match.awayTeam.name}
          </Link>
        </div>
      </div>
    </section>
  );
}
