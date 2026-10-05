'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { DEFAULT_TIMEZONE, dateKeyInTimezone } from '@/lib/datetime/format';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import type { FrontMatch, FrontStory, FrontTapeGoal, FrontTransfer } from '@/lib/front/types';
import { Calendar, Radio, Zap, ArrowLeft, ArrowRight, Activity, ArrowUpRight, Flame, Trophy, Shield, Sparkles } from 'lucide-react';
import styles from './front-hero-live.module.css';

type DayId = 'today' | 'tomorrow' | 'after';
type StatusFilter = 'all' | 'live' | 'upcoming' | 'finished';

function keyForOffset(offset: number) {
  return dateKeyInTimezone(new Date(Date.now() + offset * 86_400_000), DEFAULT_TIMEZONE);
}

function inDay(match: FrontMatch, day: DayId, wanted: string) {
  if (day === 'today' && isLiveStatus(match.status)) return true;
  return dateKeyInTimezone(new Date(match.kickoffAt), DEFAULT_TIMEZONE) === wanted;
}

function applyStatusFilter(matches: FrontMatch[], filter: StatusFilter) {
  if (filter === 'live') return matches.filter((m) => isLiveStatus(m.status));
  if (filter === 'upcoming')
    return matches.filter(
      (m) => m.status === 'NOT_STARTED' || m.status === 'SCHEDULED' || m.status === 'TIMED'
    );
  if (filter === 'finished') return matches.filter((m) => m.status === 'FINISHED');
  return matches;
}

export function FrontArenaClient({
  locale,
  matches,
  latestStory,
  latestTransfer,
  latestGoal,
}: {
  locale: string;
  matches: FrontMatch[];
  latestStory: FrontStory | null;
  latestTransfer: FrontTransfer | null;
  latestGoal: FrontTapeGoal | null;
}) {
  const ar = locale === 'ar';
  const [day, setDay] = useState<DayId>('today');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const keys = useMemo(
    () => ({ today: keyForOffset(0), tomorrow: keyForOffset(1), after: keyForOffset(2) }),
    []
  );

  const liveMatches = matches.filter((match) => isLiveStatus(match.status));
  const dayMatches = matches.filter((match) => inDay(match, day, keys[day]));
  const shown = applyStatusFilter(dayMatches, statusFilter).slice(0, 6);

  const liveCount = dayMatches.filter((m) => isLiveStatus(m.status)).length;
  const upcomingCount = dayMatches.filter(
    (m) => m.status === 'NOT_STARTED' || m.status === 'SCHEDULED' || m.status === 'TIMED'
  ).length;
  const finishedCount = dayMatches.filter((m) => m.status === 'FINISHED').length;

  const ArrowIcon = ar ? ArrowLeft : ArrowRight;

  return (
    <div className={styles.dualArenaGrid} aria-label={ar ? 'مقصورة مباريات الجولة ورادار النبض' : 'Matchday Cockpit & Flash Radar'}>
      
      {/* ⚽ 1. مقصورة مباريات اليوم والجدول التفاعلي (Matchday Cockpit) */}
      <section className={styles.cockpitPanel}>
        <div className={styles.cockpitPanelHeader}>
          <div className={styles.cockpitTitleGroup}>
            <div className={styles.cockpitIconBadge}>
              <Calendar className="w-4 h-4" />
            </div>
            <h3 className={styles.cockpitTitleText}>
              {ar ? 'مقصورة المباريات' : 'Matchday Cockpit'}
            </h3>
          </div>

          <div className={styles.cockpitDateTabs}>
            {(
              [
                ['today', ar ? 'اليوم' : 'Today'],
                ['tomorrow', ar ? 'غدًا' : 'Tomorrow'],
                ['after', ar ? 'بعد غد' : 'Next'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`${styles.cockpitDateTabBtn} ${day === id ? styles.cockpitDateTabActive : ''}`}
                onClick={() => {
                  setDay(id);
                  setStatusFilter('all');
                }}
                aria-pressed={day === id}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* فلاتر الحالة المضيئة */}
        <div className={styles.cockpitFilterBar}>
          <button
            type="button"
            className={`${styles.cockpitFilterPill} ${statusFilter === 'all' ? styles.cockpitFilterPillActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            <span>{ar ? 'الكل' : 'All'}</span>
            <span className={styles.filterCountTag}>{dayMatches.length}</span>
          </button>
          
          {liveCount > 0 && (
            <button
              type="button"
              className={`${styles.cockpitFilterPill} ${styles.cockpitFilterPillLive} ${
                statusFilter === 'live' ? styles.cockpitFilterPillLiveActive : ''
              }`}
              onClick={() => setStatusFilter('live')}
            >
              <span className={styles.pulsingRadarDot} style={{ width: '0.4rem', height: '0.4rem' }} />
              <span>{ar ? 'مباشر' : 'Live'}</span>
              <span className={styles.filterCountTag}>{liveCount}</span>
            </button>
          )}

          {upcomingCount > 0 && (
            <button
              type="button"
              className={`${styles.cockpitFilterPill} ${statusFilter === 'upcoming' ? styles.cockpitFilterPillActive : ''}`}
              onClick={() => setStatusFilter('upcoming')}
            >
              <span>{ar ? 'القادمة' : 'Upcoming'}</span>
              <span className={styles.filterCountTag}>{upcomingCount}</span>
            </button>
          )}

          {finishedCount > 0 && (
            <button
              type="button"
              className={`${styles.cockpitFilterPill} ${statusFilter === 'finished' ? styles.cockpitFilterPillActive : ''}`}
              onClick={() => setStatusFilter('finished')}
            >
              <span>{ar ? 'المنتهية' : 'Finished'}</span>
              <span className={styles.filterCountTag}>{finishedCount}</span>
            </button>
          )}
        </div>

        {/* قائمة المباريات */}
        <div className={styles.cockpitMatchCardList}>
          {shown.length > 0 ? (
            shown.map((match) => {
              const live = isLiveStatus(match.status);
              const finished = match.status === 'FINISHED';
              return (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className={`${styles.cockpitMatchRow} ${live ? styles.cockpitMatchRowLive : ''}`}
                >
                  <div className={styles.matchDualTeamCol}>
                    <div className={styles.matchTeamSingle}>
                      <LeagueCrest
                        name={match.homeTeam.name}
                        logoUrl={match.homeTeam.logoUrl}
                        className="h-5 w-5 shrink-0"
                      />
                      <span className={styles.matchTeamNameLabel}>{match.homeTeam.name}</span>
                    </div>
                    <div className={styles.matchTeamSingle}>
                      <LeagueCrest
                        name={match.awayTeam.name}
                        logoUrl={match.awayTeam.logoUrl}
                        className="h-5 w-5 shrink-0"
                      />
                      <span className={styles.matchTeamNameLabel}>{match.awayTeam.name}</span>
                    </div>
                  </div>

                  <div className={styles.matchScoreArea}>
                    {live ? (
                      <>
                        <span className={`${styles.scoreDigitBadge} ${styles.scoreDigitBadgeLive}`}>
                          {match.homeScore ?? 0} – {match.awayScore ?? 0}
                        </span>
                        <span className={styles.miniStatusSubTagLive} style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                          <span className={styles.pulsingRadarDot} style={{ width: '0.35rem', height: '0.35rem' }} />
                          {match.minute != null ? `${match.minute}′` : ar ? 'مباشر' : 'LIVE'}
                        </span>
                      </>
                    ) : finished ? (
                      <>
                        <span className={styles.scoreDigitBadge}>
                          {match.homeScore ?? 0} – {match.awayScore ?? 0}
                        </span>
                        <span className={styles.leagueSmallTag}>{ar ? 'انتهت' : 'FT'}</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.kickoffTimeBadge}>
                          <ClientTime
                            value={match.kickoffAt}
                            options={{ hour: '2-digit', minute: '2-digit' }}
                          />
                        </span>
                        <span className={styles.leagueSmallTag}>{match.league.name}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#94a3b8', fontSize: '0.88rem' }}>
              <Calendar className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p>{ar ? 'لا توجد مباريات مسجلة في هذا التوقيت.' : 'No matches scheduled for this filter.'}</p>
            </div>
          )}
        </div>

        <Link href="/matches" className={styles.cockpitFooterLink}>
          <span>{ar ? 'تصفح جدول المباريات بالكامل' : 'View Full Fixtures & Tables'}</span>
          <ArrowIcon className="w-4 h-4" />
        </Link>
      </section>

      {/* 🔴 2. غرفة العمليات ورادار الأحداث الحية (Flash Live Radar) */}
      <section className={styles.cockpitPanel}>
        <div className={styles.cockpitPanelHeader}>
          <div className={styles.cockpitTitleGroup}>
            <div className={`${styles.cockpitIconBadge} ${styles.cockpitIconBadgeLive}`}>
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <h3 className={styles.cockpitTitleText}>
              {ar ? `رادار البث والنبض (${liveMatches.length})` : `Flash Live Radar (${liveMatches.length})`}
            </h3>
          </div>

          <span className={styles.vipLiveStatusPill}>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            {ar ? 'تحديث فوري' : 'Real-time'}
          </span>
        </div>

        <div className={styles.cockpitMatchCardList}>
          {liveMatches.length > 0 ? (
            liveMatches.slice(0, 2).map((match) => (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={`${styles.cockpitMatchRow} ${styles.cockpitMatchRowLive}`}
              >
                <div className={styles.matchDualTeamCol}>
                  <div className={styles.matchTeamSingle}>
                    <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5 shrink-0" />
                    <span className={styles.matchTeamNameLabel}>{match.homeTeam.name}</span>
                  </div>
                  <div className={styles.matchTeamSingle}>
                    <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5 shrink-0" />
                    <span className={styles.matchTeamNameLabel}>{match.awayTeam.name}</span>
                  </div>
                </div>
                <div className={styles.matchScoreArea}>
                  <span className={`${styles.scoreDigitBadge} ${styles.scoreDigitBadgeLive}`}>
                    {match.homeScore ?? 0} – {match.awayScore ?? 0}
                  </span>
                  <span className={styles.miniStatusSubTagLive} style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>
                    <span className={styles.pulsingRadarDot} style={{ width: '0.35rem', height: '0.35rem' }} />
                    {match.minute != null ? `${match.minute}′` : ar ? 'مباشر' : 'LIVE'}
                  </span>
                </div>
              </Link>
            ))
          ) : null}

          {/* ⚡ بطاقة أحدث هدف مسجل في الجولة */}
          {latestGoal ? (
            <Link href={`/match/${latestGoal.matchId}`} className={styles.radarFlashCard}>
              <div className={styles.radarFlashHeader}>
                <span className={styles.radarTagGoal}>
                  <Zap className="w-3.5 h-3.5" />
                  {ar ? 'هدف الجولة الأخير' : 'Latest Goal Wave'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 800 }}>
                  {latestGoal.minute}′
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  ⚽ {latestGoal.player || (ar ? 'هدف حاسم' : 'Goal')}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {latestGoal.home} × {latestGoal.away}
                </span>
              </div>
            </Link>
          ) : null}

          {/* 🔄 بطاقة رادار الانتقالات المعتمدة */}
          {latestTransfer ? (
            <Link href="/transfers" className={styles.radarFlashCard}>
              <div className={styles.radarFlashHeader}>
                <span className={styles.radarTagTransfer}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {ar ? 'رادار الصفقات المعتمدة' : 'Verified Transfer Radar'}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800 }}>
                  {latestTransfer.fee || (ar ? 'صفقة مؤكدة' : 'Confirmed')}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  {latestTransfer.playerName}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  {latestTransfer.fromTeam} ➔ {latestTransfer.toTeam}
                </span>
              </div>
            </Link>
          ) : null}
        </div>

        <Link href="/live" className={styles.cockpitFooterLink}>
          <span className="inline-flex items-center gap-1.5 text-amber-400">
            <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            <span>{ar ? 'دخول غرفة البث المباشر الكاملة' : 'Open Live Match Center'}</span>
          </span>
          <ArrowIcon className="w-4 h-4 text-amber-400" />
        </Link>
      </section>

    </div>
  );
}
