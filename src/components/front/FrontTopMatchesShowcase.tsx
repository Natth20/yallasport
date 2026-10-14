import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { loadFrontBoard } from '@/lib/front/load-board';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ClientTime } from '@/components/datetime/ClientTime';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { Trophy, Radio, Flame, Sparkles, ChevronLeft, ArrowLeft, ArrowRight } from 'lucide-react';
import styles from './front-design.module.css';

interface FrontTopMatchesShowcaseProps {
  locale?: string;
  limit?: number;
  className?: string;
}

export async function FrontTopMatchesShowcase({
  locale: propLocale,
  limit = 6,
  className,
}: FrontTopMatchesShowcaseProps = {}) {
  const locale = propLocale || (await getLocale());
  const ar = locale === 'ar';
  const board = await loadFrontBoard(locale);

  if (board.length === 0) return null;

  // Show top most relevant matches (Live first, then upcoming, then finished)
  const topMatches = board.slice(0, limit);
  const liveMatches = board.filter((m) => isLiveStatus(m.status));

  return (
    <section
      className={`${styles.featuredMatchesSection} ${className || ''}`}
      aria-label={ar ? 'أبرز المباريات' : 'Featured Matches'}
    >
      {/* Header */}
      <div className={styles.sectionHeaderRow}>
        <div className={styles.ledgerHeaderTitleGroup}>
          <span
            className={styles.ledgerIconBadge}
            style={{
              background: 'rgba(245, 158, 11, 0.12)',
              borderColor: 'rgba(245, 158, 11, 0.35)',
              borderRadius: '9999px',
            }}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={styles.sectionTitle}>
                {ar ? 'أبرز مباريات اليوم والقمم الكروية' : 'Top Matches & Clash of the Day'}
              </h3>
              {liveMatches.length > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.7rem] font-black bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse">
                  <Radio size={12} className="text-red-500" />
                  {ar ? `${liveMatches.length} مباشر` : `${liveMatches.length} Live`}
                </span>
              ) : null}
            </div>
            <p className={styles.ledgerSubtitle}>
              {ar
                ? 'متابعة حية للنتائج، التشكيلات، وأوقات انطلاق أهم مواجهات الدوريات العالمية والعربية.'
                : 'Live scores, starting lineups, and kickoff countdown for top leagues.'}
            </p>
          </div>
        </div>
        <Link href="/matches" className={styles.arenaFooterLink} style={{ margin: 0, padding: 0, border: 'none' }}>
          <span>{ar ? 'جدول المباريات الكامل ←' : 'Full Fixture Center →'}</span>
        </Link>
      </div>

      {/* Matches Grid */}
      <div className={styles.featuredMatchesGrid}>
        {topMatches.map((match) => {
          const live = isLiveStatus(match.status);
          const finished = match.status === 'FINISHED';

          return (
            <Link
              key={match.id}
              href={`/match/${match.id}`}
              className={`${styles.featuredMatchCard} ${live ? styles.featuredMatchCardLive : ''}`}
            >
              {/* Card Header: League and Kickoff Badge */}
              <div className={styles.matchCardTopRow}>
                <span className={styles.matchCardLeagueName}>
                  {match.league?.name || (ar ? 'مباراة ودية' : 'Fixture')}
                </span>
                {live ? (
                  <span className={styles.liveMinuteBadge}>
                    <span className={styles.livePulseDot} />
                    {match.minute != null ? `${match.minute}′` : ar ? 'مباشر' : 'LIVE'}
                  </span>
                ) : (
                  <span className={styles.kickoffBadge}>
                    <ClientTime
                      value={match.kickoffAt}
                      options={{
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      }}
                    />
                  </span>
                )}
              </div>

              {/* Teams & Score Row */}
              <div className={styles.matchCardVersusBox}>
                {/* Home Team */}
                <div className={styles.matchTeamColumn}>
                  <div className={styles.teamLogoWrapper}>
                    <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-8 w-8" />
                  </div>
                  <span className={styles.teamNameText}>{match.homeTeam.name}</span>
                </div>

                {/* Score / Center Indicator */}
                <div className={styles.matchScoreColumn}>
                  {live || finished ? (
                    <div className={styles.scoreNumberDisplay}>
                      <span className={live ? styles.liveScoreNum : ''}>{match.homeScore ?? 0}</span>
                      <span className={styles.scoreSeparator}>:</span>
                      <span className={live ? styles.liveScoreNum : ''}>{match.awayScore ?? 0}</span>
                    </div>
                  ) : (
                    <div className={styles.versusBadgePill}>
                      <span>VS</span>
                    </div>
                  )}
                  <span className={styles.matchSubActionText}>
                    {live
                      ? ar
                        ? 'جارية الآن'
                        : 'In play'
                      : finished
                      ? ar
                        ? 'النتيجة النهائية'
                        : 'Full time'
                      : ar
                      ? 'توقع النتيجة'
                      : 'Predict'}
                  </span>
                </div>

                {/* Away Team */}
                <div className={styles.matchTeamColumn}>
                  <div className={styles.teamLogoWrapper}>
                    <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-8 w-8" />
                  </div>
                  <span className={styles.teamNameText}>{match.awayTeam.name}</span>
                </div>
              </div>

              {/* Card Footer Link */}
              <div className={styles.matchCardFooter}>
                <span className={styles.matchFooterDetailLink}>
                  {ar ? 'مركز المباراة والتشكيلة' : 'Match Center & Lineups'}
                </span>
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180 text-amber-400" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
