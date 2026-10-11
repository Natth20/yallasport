'use client';

import React from 'react';
import { Link } from '@/i18n/navigation';
import { Crown, Flame, Calendar, Trophy, ArrowUpRight, Shield, Award } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { localizeRoundName } from '@/lib/i18n/competition-names';
import type { LeagueDossierData, LeagueMatchCard } from '@/lib/leagues/load-dossier';
import styles from './league-luxury.module.css';

interface LeagueClimaxSectionProps {
  locale: string;
  league: {
    id: string;
    slug: string;
    name: string;
    logoUrl: string | null;
  };
  standings: LeagueDossierData['standings'];
  upcoming: LeagueDossierData['upcoming'];
  liveMatches: LeagueDossierData['liveMatches'];
}

export function LeagueClimaxSection({
  locale,
  league,
  standings,
  upcoming,
  liveMatches,
}: LeagueClimaxSectionProps) {
  const leader = standings[0];
  const chaser = standings[1];
  const third = standings[2];

  // Pick up to 4 upcoming or live matches
  const nextMatches: LeagueMatchCard[] = [
    ...liveMatches,
    ...upcoming.filter((m) => !liveMatches.some((lm) => lm.id === m.id)),
  ].slice(0, 4);

  if (!leader && nextMatches.length === 0) {
    return null;
  }

  const gap = leader && chaser ? leader.points - chaser.points : 0;
  const leaderGd = leader ? leader.goalsFor - leader.goalsAgainst : 0;
  const chaserGd = chaser ? chaser.goalsFor - chaser.goalsAgainst : 0;

  return (
    <div className={styles.climaxShowcase}>
      {/* ---------------- صراع الصدارة (TITLE RACE CLIMAX) ---------------- */}
      {leader && chaser ? (
        <section className={styles.luxuryCard} aria-label={pick(locale, 'صراع الصدارة', 'Title Race')}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={styles.cardIconBox}>
                <Crown size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>{pick(locale, 'صراع الصدارة واللقب', 'Title Race Summit')}</h3>
                <p className={styles.cardSubtitle}>
                  {gap === 0
                    ? pick(locale, 'تعادل تام في النقاط — الصراع مشتعل بالأهداف!', 'Level on points — title race decided by goal diff!')
                    : pick(locale, `فارق ${gap} نقاط يفصل بين المتصدر والملاحق المباشر`, `${gap} points separating the leader and chaser`)}
                </p>
              </div>
            </div>
            <span className={styles.cardBadge}>
              <Trophy size={13} />
              <span>{pick(locale, 'المركز 1 ضد 2', '#1 vs #2')}</span>
            </span>
          </div>

          <div className={styles.raceDuelGrid}>
            {/* المتصدر (1ST PLACE) */}
            <Link
              href={leader.team.slug ? `/team/${leader.team.slug}` : `/league/${league.slug}/standings`}
              className={styles.raceContender}
            >
              <span className={`${styles.contenderRankBadge} ${styles.rankLeader}`}>
                <Crown size={12} />
                <span>#1 {pick(locale, 'المتصدر', 'Leader')}</span>
              </span>
              <div className={styles.contenderCrestWrap}>
                <LeagueCrest name={leader.team.name} logoUrl={leader.team.logoUrl} className="h-12 w-12" />
              </div>
              <strong className={styles.contenderName}>{localizeTeamName(locale, leader.team.name)}</strong>
              <div className={styles.contenderPoints}>
                <strong>{leader.points}</strong>
                <span>{pick(locale, 'نقطة', 'pts')}</span>
              </div>
            </Link>

            {/* الفارق / الجسر (GAP BRIDGE) */}
            <div className={styles.raceBridge}>
              <div className={styles.gapPill}>
                <span className={styles.gapDiffNumber}>
                  {gap === 0 ? '=' : `+${gap}`}
                </span>
                <span className={styles.gapLabel}>
                  {gap === 0 ? pick(locale, 'تساوي', 'Tied') : pick(locale, 'فارق نقطي', 'Pts Gap')}
                </span>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8' }}>
                {pick(locale, 'ضد', 'VS')}
              </span>
            </div>

            {/* الملاحق (2ND PLACE) */}
            <Link
              href={chaser.team.slug ? `/team/${chaser.team.slug}` : `/league/${league.slug}/standings`}
              className={styles.raceContender}
            >
              <span className={`${styles.contenderRankBadge} ${styles.rankChaser}`}>
                <Award size={12} />
                <span>#2 {pick(locale, 'الملاحق', 'Chaser')}</span>
              </span>
              <div className={styles.contenderCrestWrap}>
                <LeagueCrest name={chaser.team.name} logoUrl={chaser.team.logoUrl} className="h-12 w-12" />
              </div>
              <strong className={styles.contenderName}>{localizeTeamName(locale, chaser.team.name)}</strong>
              <div className={styles.contenderPoints}>
                <strong>{chaser.points}</strong>
                <span>{pick(locale, 'نقطة', 'pts')}</span>
              </div>
            </Link>
          </div>

          <div className={styles.raceFormMeta}>
            <div className={styles.metaStatBox}>
              <span>{pick(locale, 'فارق الأهداف للمتصدر', 'Leader GD')}</span>
              <strong>{leaderGd > 0 ? `+${leaderGd}` : leaderGd}</strong>
            </div>
            <div className={styles.metaStatBox}>
              <span>{pick(locale, 'فارق الأهداف للملاحق', 'Chaser GD')}</span>
              <strong>{chaserGd > 0 ? `+${chaserGd}` : chaserGd}</strong>
            </div>
          </div>

          {third ? (
            <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ color: '#fb923c', fontWeight: 800 }}>#3</span>
                <span>{localizeTeamName(locale, third.team.name)}:</span>
                <strong style={{ color: '#f8fafc' }}>{third.points} {pick(locale, 'نقطة', 'pts')}</strong>
              </span>
              <Link href={`/league/${league.slug}/standings`} style={{ color: '#fbbf24', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                <span>{pick(locale, 'عرض الترتيب الكامل', 'Full Table')}</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ---------------- أقرب المباريات (UPCOMING KEY FIXTURES) ---------------- */}
      {nextMatches.length > 0 ? (
        <section className={styles.luxuryCard} aria-label={pick(locale, 'أقرب المباريات', 'Upcoming Fixtures')}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <div className={`${styles.cardIconBox} ${styles.cardIconBoxGreen}`}>
                <Calendar size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>{pick(locale, 'أقرب المباريات القادمة', 'Upcoming Matches')}</h3>
                <p className={styles.cardSubtitle}>
                  {pick(locale, 'المواجهات القادمة المقررة في البطولة بتوقيتك المحلي', 'Upcoming clashes in your local kickoff time')}
                </p>
              </div>
            </div>
            <Link
              href={`/league/${league.slug}/fixtures`}
              className={styles.cardBadge}
              style={{ textDecoration: 'none' }}
            >
              <span>{pick(locale, 'الجدول الكامل', 'All')}</span>
              <ArrowUpRight size={12} />
            </Link>
          </div>

          <div className={styles.fixturesList}>
            {nextMatches.map((match) => {
              const isLive = match.status === 'LIVE' || match.status === 'HALFTIME';
              return (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className={styles.fixtureTicket}
                >
                  <div className={styles.ticketTeams}>
                    <div className={styles.ticketTeamRow}>
                      <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5" />
                      <span>{localizeTeamName(locale, match.homeTeam.name)}</span>
                      {match.homeScore != null ? (
                        <b style={{ marginInlineStart: 'auto', color: '#fbbf24' }}>{match.homeScore}</b>
                      ) : null}
                    </div>
                    <div className={styles.ticketTeamRow}>
                      <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5" />
                      <span>{localizeTeamName(locale, match.awayTeam.name)}</span>
                      {match.awayScore != null ? (
                        <b style={{ marginInlineStart: 'auto', color: '#fbbf24' }}>{match.awayScore}</b>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.ticketMeta}>
                    <span className={styles.ticketRound}>
                      {localizeRoundName(locale, match.round) || pick(locale, 'مباراة', 'Match')}
                    </span>
                    <span className={styles.ticketTime}>
                      {isLive ? (
                        <span style={{ color: '#ef4444', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
                          {match.minute ? `${match.minute}'` : pick(locale, 'مباشر', 'Live')}
                        </span>
                      ) : (
                        <ClientTime
                          value={match.kickoffAt}
                          locale={locale}
                          options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }}
                        />
                      )}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
