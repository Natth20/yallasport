import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { loadFrontFacts } from '@/lib/front/load-facts';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { pick } from '@/i18n/pick';
import { Flame, Trophy, Clock, Zap, ArrowLeft, ArrowRight, Activity, Sparkles, TrendingUp } from 'lucide-react';
import styles from './front-design.module.css';

export async function HomeFacts() {
  const locale = await getLocale();
  const ar = locale === 'ar';
  const t = await getTranslations('front');
  const { next, loud, podium, move, hours, census } = await loadFrontFacts(locale);
  if (!next && !loud && podium.length === 0 && !move && hours.length === 0) return null;

  const peak = Math.max(...hours.map((slot) => slot.count), 1);
  const glance = [
    { value: census.live, label: t('stat_live') || (ar ? 'مباشر' : 'Live'), kind: 'live' },
    { value: census.remaining, label: pick(locale, 'لم تُلعب', 'Upcoming'), kind: 'upcoming' },
    { value: census.finished, label: pick(locale, 'انتهت', 'Finished'), kind: 'finished' },
  ].filter((row) => row.value > 0);

  return (
    <section className={styles.ledgerSection}>
      {/* Header */}
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span className={styles.ledgerIconBadge}>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </span>
          <div>
            <h3 className={styles.sectionTitle}>
              {pick(locale, 'دفتر اليوم ومؤشرات المباريات', "Today's Matchday Ledger")}
            </h3>
            <p className={styles.ledgerSubtitle}>
              {pick(
                locale,
                'أقرب صافرة، أقوى النتائج، إيقاع الركلات، وهدافو اليوم لحظة بلحظة.',
                "Next kickoff, loudest scoreline, match rhythm, and today's top performers.",
              )}
            </p>
          </div>
        </div>
        <Link href="/stats" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          <span>{ar ? 'مركز الإحصائيات الكامل' : 'Full Stats Center'}</span>
          {ar ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
        </Link>
      </div>

      {/* Glance Live Census Strip */}
      {glance.length > 0 ? (
        <div className={styles.ledgerGlanceStrip}>
          {glance.map((row) => (
            <div
              key={row.label}
              className={`${styles.glancePill} ${
                row.kind === 'live'
                  ? styles.glancePillLive
                  : row.kind === 'finished'
                  ? styles.glancePillFinished
                  : styles.glancePillUpcoming
              }`}
            >
              <span className={styles.glanceDot} />
              <strong className={styles.glanceValue}>{row.value}</strong>
              <span className={styles.glanceLabel}>{row.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {/* 3-Col Key Highlights (Next Kickoff, Loudest Match, Kickoff Rhythm) */}
      <div className={styles.ledgerCoreGrid}>
        {/* Next Kickoff Card */}
        {next ? (
          <Link href={`/match/${next.id}`} className={`${styles.ledgerCard} ${styles.ledgerCardNext}`}>
            <div className={styles.ledgerCardTagRow}>
              <span className={styles.ledgerCardTagNext}>
                <Clock className="w-3.5 h-3.5 inline-block me-1" />
                {pick(locale, 'أقرب صافرة', 'Next Kickoff')}
              </span>
              <span className={styles.ledgerTimePulse}>
                <ClientTime value={next.kickoffAt} locale={locale} variant="clock" />
              </span>
            </div>

            <div className={styles.ledgerDuelRow}>
              <div className={styles.ledgerDuelTeam}>
                <LeagueCrest name={next.homeTeam.name} logoUrl={next.homeTeam.logoUrl} className="h-10 w-10 shrink-0" />
                <span className={styles.ledgerDuelTeamName}>{next.homeTeam.name}</span>
              </div>
              <span className={styles.ledgerDuelVs}>VS</span>
              <div className={`${styles.ledgerDuelTeam} ${styles.ledgerDuelTeamAway}`}>
                <LeagueCrest name={next.awayTeam.name} logoUrl={next.awayTeam.logoUrl} className="h-10 w-10 shrink-0" />
                <span className={styles.ledgerDuelTeamName}>{next.awayTeam.name}</span>
              </div>
            </div>

            <div className={styles.ledgerCardFooter}>
              <span>{[next.league.name, next.venue, next.city].filter(Boolean).join(' · ')}</span>
            </div>
          </Link>
        ) : null}

        {/* Loudest / Key Match Card */}
        {loud ? (
          <Link href={`/match/${loud.id}`} className={`${styles.ledgerCard} ${styles.ledgerCardLoud}`}>
            <div className={styles.ledgerCardTagRow}>
              <span className={styles.ledgerCardTagLoud}>
                <Flame className="w-3.5 h-3.5 inline-block me-1 text-amber-400" />
                {isLiveStatus(loud.status)
                  ? (ar ? 'مباراة مشتعلة الآن' : 'Hot Match Right Now')
                  : pick(locale, 'أغزر نتيجة اليوم', "Today's Loudest Match")}
              </span>
              <span className={styles.ledgerGoalsCountPill}>
                {loud.goals} {t('stat_goals') || (ar ? 'أهداف' : 'Goals')}
              </span>
            </div>

            <div className={styles.ledgerLoudBody}>
              <div className={styles.ledgerLoudScoreBox} dir="ltr">
                <span className={styles.ledgerLoudScore}>{loud.homeScore ?? 0}</span>
                <span className={styles.ledgerLoudScoreDivider}>:</span>
                <span className={styles.ledgerLoudScore}>{loud.awayScore ?? 0}</span>
              </div>
              <div className={styles.ledgerLoudTeams}>
                <strong>{loud.homeTeam.name}</strong>
                <span>×</span>
                <strong>{loud.awayTeam.name}</strong>
              </div>
            </div>

            <div className={styles.ledgerCardFooter}>
              <span>{loud.league.name ? loud.league.name : (ar ? 'مباراة اليوم' : "Today's Match")}</span>
            </div>
          </Link>
        ) : null}

        {/* Kickoff Rhythm Chart */}
        {hours.length > 0 ? (
          <div className={`${styles.ledgerCard} ${styles.ledgerCardHours}`}>
            <div className={styles.ledgerCardTagRow}>
              <span className={styles.ledgerCardTagHours}>
                <Activity className="w-3.5 h-3.5 inline-block me-1 text-sky-400" />
                {pick(locale, 'إيقاع الركلات (توزيع الساعات)', 'Kickoff Rhythm (Hours)')}
              </span>
            </div>

            <div className={styles.hoursChartRow}>
              {hours.map((slot) => {
                const pct = Math.max(16, Math.min(100, (slot.count / peak) * 100));
                return (
                  <div key={slot.hour} className={styles.hourBarCol}>
                    <span className={styles.hourBarCount}>{slot.count}</span>
                    <div className={styles.hourBarTrack}>
                      <div className={styles.hourBarFill} style={{ height: `${pct}%` }} />
                    </div>
                    <span className={styles.hourBarLabel}>{String(slot.hour).padStart(2, '0')}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.ledgerCardFooter}>
              <span>{ar ? 'توزيع انطلاق المباريات بتوقيت مكة' : 'Kickoff distribution in local timezone'}</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Top Scorers Podium & Featured Move */}
      <div className={styles.ledgerBottomSplit}>
        {/* Podium (Top Performers) */}
        {podium.length > 0 ? (
          <div className={styles.podiumBlock}>
            <div className={styles.podiumHeader}>
              <Trophy className="w-4 h-4 text-amber-400" />
              <h4>{ar ? 'هدافو اليوم الأبرز' : "Today's Top Scorers"}</h4>
            </div>
            <div className={styles.podiumCardsRow}>
              {podium.map((row, index) => {
                const rank = index + 1;
                const rankCls = rank === 1 ? styles.podiumRank1 : rank === 2 ? styles.podiumRank2 : styles.podiumRank3;
                const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
                return (
                  <Link
                    key={`${row.slug || row.name}-${rank}`}
                    href={row.slug ? `/player/${row.slug}` : '/stats'}
                    className={`${styles.podiumCard} ${rankCls}`}
                  >
                    <div className={styles.podiumMedalBadge}>{medalEmoji} #{rank}</div>
                    <div className={styles.podiumAvatarWrap}>
                      {row.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.photoUrl} alt={row.name} className={styles.podiumAvatar} />
                      ) : (
                        <span className={styles.podiumAvatarFallback}>{row.name.charAt(0)}</span>
                      )}
                    </div>
                    <strong className={styles.podiumPlayerName}>{row.name}</strong>
                    <span className={styles.podiumGoalsPill}>
                      ⚽ {row.value} {t('ch04_goals') || (ar ? 'أهداف' : 'Goals')}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Featured Transfer Move */}
        {move ? (
          <div className={styles.featuredMoveBlock}>
            <div className={styles.podiumHeader}>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h4>{ar ? 'أبرز صفقات اليوم' : 'Featured Transfer'}</h4>
            </div>
            <Link href={`/player/${move.playerSlug}`} className={styles.moveBannerCard}>
              <div className={styles.moveAvatarWrap}>
                {move.playerPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={move.playerPhoto} alt={move.playerName} className={styles.moveAvatar} />
                ) : (
                  <span className={styles.moveAvatarFallback}>{move.playerName.charAt(0)}</span>
                )}
              </div>
              <div className={styles.moveDetails}>
                <div className={styles.moveBadgeRow}>
                  <span className={styles.moveOfficialPill}>{ar ? 'رسمي' : 'Official'}</span>
                  {move.fee ? <span className={styles.moveFeePill}>{move.fee}</span> : null}
                </div>
                <strong className={styles.movePlayerTitle}>{move.playerName}</strong>
                <div className={styles.movePathRow}>
                  <span>{move.fromTeam || '—'}</span>
                  <span className="text-amber-400 font-bold">{ar ? '←' : '→'}</span>
                  <span className="font-bold text-white">{move.toTeam || '—'}</span>
                </div>
              </div>
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}

