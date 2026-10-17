'use client';

import { useState, useEffect } from 'react';
import { pick } from '@/i18n/pick';
import { Link, useRouter } from '@/i18n/navigation';
import { ALL_STAT_KINDS, STAT_BOARDS, type StatKind, type StatSort, type Desk } from '@/lib/stats/types';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { ArrowLeftRight, ArrowUpDown, BarChart3, CalendarDays, Crown, Medal, Radio, Search, SlidersHorizontal, Trophy, X } from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import styles from './stats-centre.module.css';

const KIND_META: Record<StatKind, { ar: string; en: string; group: 'players' | 'attack' | 'defense' | 'keep' | 'cards' }> = {
  goals: { ar: 'الهدافون', en: 'Scorers', group: 'players' },
  assists: { ar: 'التمريرات الحاسمة', en: 'Assists', group: 'players' },
  combined: { ar: 'أهداف + صناعات', en: 'Goals + assists', group: 'players' },
  shots: { ar: 'التسديدات', en: 'Shots', group: 'attack' },
  shotsOn: { ar: 'تسديدات على المرمى', en: 'Shots on target', group: 'attack' },
  keyPasses: { ar: 'الفرص المصنوعة', en: 'Key passes', group: 'attack' },
  dribbles: { ar: 'المراوغات', en: 'Dribbles', group: 'attack' },
  duels: { ar: 'الكرات المكسوبة', en: 'Duels won', group: 'attack' },
  penaltiesScored: { ar: 'ركلات جزاء مسجلة', en: 'Penalties scored', group: 'attack' },
  foulsDrawn: { ar: 'أخطاء ضده', en: 'Fouls drawn', group: 'attack' },
  tackles: { ar: 'التدخلات', en: 'Tackles', group: 'defense' },
  interceptions: { ar: 'الاعتراضات', en: 'Interceptions', group: 'defense' },
  yellow: { ar: 'صفراء', en: 'Yellow', group: 'cards' },
  red: { ar: 'حمراء', en: 'Red', group: 'cards' },
  saves: { ar: 'التصديات', en: 'Saves', group: 'keep' },
  conceded: { ar: 'أهداف مستقبلة', en: 'Goals conceded', group: 'keep' },
  rating: { ar: 'التقييم', en: 'Rating', group: 'players' },
  xg: { ar: 'الأهداف المتوقعة xG', en: 'Expected goals xG', group: 'attack' },
};

function unitFor(locale: string, kind: StatKind) {
  const map: Record<StatKind, [string, string]> = {
    goals: ['هدف', 'goals'],
    assists: ['تمريرة حاسمة', 'assists'],
    combined: ['مشاركة', 'G+A'],
    shots: ['تسديدة', 'shots'],
    shotsOn: ['على المرمى', 'on target'],
    keyPasses: ['تمريرة مفتاحية', 'key passes'],
    tackles: ['تدخل', 'tackles'],
    interceptions: ['اعتراض', 'interceptions'],
    dribbles: ['مراوغة', 'dribbles'],
    duels: ['كرة', 'duels'],
    penaltiesScored: ['ركلة جزاء', 'penalties'],
    foulsDrawn: ['خطأ', 'fouls'],
    yellow: ['بطاقة', 'cards'],
    red: ['بطاقة', 'cards'],
    saves: ['تصدي', 'saves'],
    conceded: ['هدف مستقبَل', 'conceded'],
    rating: ['تقييم', 'rating'],
    xg: ['xG', 'xG'],
  };
  return pick(locale, map[kind][0], map[kind][1]);
}

export function StatsCentre({
  locale,
  desk,
  leagueId,
  kind,
  q,
  sort,
}: {
  locale: string;
  desk: Desk;
  leagueId: string;
  kind: StatKind;
  q?: string;
  sort: StatSort;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(q || '');

  useEffect(() => {
    setSearchQuery(q || '');
  }, [q]);

  // Continuous auto-sync: Poll every 60 seconds from the live source without full reload
  useEffect(() => {
    const timer = setInterval(() => {
      router.refresh();
    }, 60_000);
    return () => clearInterval(timer);
  }, [router]);

  const href = (next: { league?: string; kind?: StatKind; season?: number; q?: string; sort?: StatSort }) => {
    const board = STAT_BOARDS.find((row) => row.id === (next.league || leagueId)) || desk.board;
    const season = next.season ?? desk.season;
    const nextKind = next.kind || kind;
    const query = new URLSearchParams();
    if (nextKind !== 'goals') query.set('kind', nextKind);
    if (next.q ?? q) query.set('q', next.q ?? q ?? '');
    if ((next.sort || sort) !== 'value') query.set('sort', next.sort || sort);
    const suffix = query.toString() ? `?${query}` : '';
    return `/stats/${board.slug}/${season}${suffix}`;
  };

  // Advanced metrics (xG, rating) stay out of the tab bar until the source
  // actually returns them, but remain reachable by URL and render on arrival.
  const ADVANCED: StatKind[] = ['rating', 'xg'];
  const visibleKinds = ALL_STAT_KINDS.filter((item) => !ADVANCED.includes(item) || item === kind);
  const boardName = locale === 'en' ? desk.board.en : desk.board.ar;
  const unit = unitFor(locale, kind);
  const attack = [...desk.teamRows].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, 5);
  const defense = [...desk.teamRows].sort((a, b) => a.goalsAgainst - b.goalsAgainst).slice(0, 5);
  const wins = [...desk.teamRows].sort((a, b) => b.won - a.won).slice(0, 5);
  const losses = [...desk.teamRows].sort((a, b) => b.lost - a.lost).slice(0, 5);
  const draws = [...desk.teamRows].sort((a, b) => b.drawn - a.drawn).slice(0, 5);

  return (
    <SalonStage
      tone="ledger"
      wide
      compact
      kicker={pick(locale, 'مركز الإحصائيات', 'Stats centre')}
      title={pick(locale, 'مركز الإحصائيات', 'Stats centre')}
      lead={
        desk.previousSeason
          ? pick(
            locale,
            `المصدر ما رجّع لوحة للموسم الحالي بعد. الأرقام من موسم ${desk.season}/${desk.season + 1} كما وصلت.`,
            `The source has not returned a board for the live season yet. Figures are ${desk.season}/${desk.season + 1} as filed.`,
          )
          : pick(
            locale,
            `الموسم: ${desk.season}/${desk.season + 1} | البطولة: ${boardName}. من المصدر فقط.`,
            `Season ${desk.season}/${desk.season + 1} | ${boardName}. From the source only.`,
          )
      }
      aside={`${boardName} · ${desk.season}/${String(desk.season + 1).slice(-2)}`}
      tools={
        <div className="salon-foyer">
          <HallFoyer
            label={pick(locale, 'جناح الملعب', 'Pitch suite')}
            items={[
              { href: '/matches', label: pick(locale, 'المباريات', 'Matches'), icon: CalendarDays },
              { href: '/live', label: pick(locale, 'مباشر', 'Live'), badge: 'LIVE', icon: Radio },
              { href: '/leagues', label: pick(locale, 'البطولات', 'Leagues'), icon: Trophy },
              { href: '/transfers', label: pick(locale, 'الانتقالات', 'Transfers'), icon: ArrowLeftRight },
              { href: '/stats', label: pick(locale, 'إحصائيات', 'Stats'), icon: BarChart3, current: true },
            ]}
          />
          <nav className="salon-tabs" aria-label={pick(locale, 'الموسم', 'Season')}>
            {desk.seasons.map((year) => (
              <Link key={year} href={href({ season: year })} className={`salon-tab${year === desk.season ? ' is-on' : ''}`}>
                {year}/{String(year + 1).slice(-2)}
              </Link>
            ))}
          </nav>
          <nav className="salon-tabs" aria-label={pick(locale, 'البطولة', 'Competition')}>
            {STAT_BOARDS.map((board) => (
              <Link key={board.id} href={href({ league: board.id })} className={`salon-tab${board.id === desk.board.id ? ' is-on' : ''}`}>
                {locale === 'en' ? board.en : board.ar}
              </Link>
            ))}
          </nav>
          <nav className="salon-tabs" aria-label={pick(locale, 'اللاعبون', 'Players')}>
            {visibleKinds.map((item) => (
              <Link key={item} href={href({ kind: item })} className={`salon-tab${item === kind ? ' is-on' : ''}`}>
                {pick(locale, KIND_META[item].ar, KIND_META[item].en)}
              </Link>
            ))}
          </nav>
          <form className={styles.filterConsole} action={`/stats/${desk.board.slug}/${desk.season}`} method="get">
            <input type="hidden" name="kind" value={kind} />
            
            <div className={styles.searchWrapper}>
              <Search size={15} className={styles.searchIcon} aria-hidden />
              <input
                type="search"
                name="q"
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={pick(locale, 'ابحث عن لاعب...', 'Search a player...')}
              />
              {searchQuery ? (
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => setSearchQuery('')}
                  aria-label={pick(locale, 'مسح البحث', 'Clear search')}
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>

            <div className={styles.sortWrapper}>
              <SlidersHorizontal size={14} className={styles.sortIcon} aria-hidden />
              <select name="sort" defaultValue={sort} className={styles.sortSelect}>
                <option value="value">{pick(locale, 'ترتيب حسب الرقم', 'Sort by value')}</option>
                <option value="apps">{pick(locale, 'المشاركات', 'Appearances')}</option>
                <option value="minutes">{pick(locale, 'الدقائق', 'Minutes')}</option>
                <option value="name">{pick(locale, 'الاسم', 'Name')}</option>
              </select>
            </div>

            <button type="submit" className={styles.applyBtn}>
              <ArrowUpDown size={14} aria-hidden />
              <span>{pick(locale, 'تطبيق', 'Apply')}</span>
            </button>

            <div className={styles.liveAutoBadge} title={pick(locale, 'تحديث تلقائي كل 60 ثانية من المصدر', 'Auto-syncs live every 60s from source')}>
              <span className={styles.pulseDot} aria-hidden />
              <span>{pick(locale, 'مباشر وتلقائي', 'Live Auto-Sync')}</span>
            </div>
          </form>
        </div>
      }
    >
      {desk.minApps > 0 ? (
        <p className="stats-note">
          {pick(locale, `شرط المشاركة: ${desk.minApps} مباريات على الأقل حتى لا تضلل المقارنة.`, `Minimum ${desk.minApps} appearances so a one-off does not lead the board.`)}
        </p>
      ) : null}
      {desk.fetchedAt ? (
        <p className="stats-note">
          {pick(locale, 'آخر تحديث من المصدر: ', 'Last source update: ')}
          <ClientTime value={desk.fetchedAt} options={{ day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }} />
        </p>
      ) : null}
      {desk.leagueTotals ? (
        <ul className="stats-league">
          <li><b>{desk.leagueTotals.matches}</b><span>{pick(locale, 'مباريات البطولة', 'League matches')}</span></li>
          <li><b>{desk.leagueTotals.goals}</b><span>{pick(locale, 'أهداف', 'Goals')}</span></li>
          <li><b>{desk.leagueTotals.wins}</b><span>{pick(locale, 'انتصارات', 'Wins')}</span></li>
        </ul>
      ) : null}
      {desk.rows.length === 0 ? (
        <div className="salon-empty">
          <strong>{pick(locale, 'اللوحة فارغة', 'The board is empty')}</strong>
          <p>{pick(locale, 'المصدر ما رجّع هذه الإحصائية بعد، أو لا أحد بلغ شرط المشاركة.', 'The source has not returned this board yet, or nobody met the appearance floor.')}</p>
        </div>
      ) : (
        <div className={styles.statsStage}>
          {/* Top 3 Podium */}
          <Stagger className={styles.podiumGrid} delay={0.04}>
            {(desk.rows.length >= 3
              ? [desk.rows[1], desk.rows[0], desk.rows[2]]
              : desk.rows.slice(0, 3)
            ).map((row) => {
              const name = localizePlainName(locale, row.name);
              const team = row.teamName ? localizeTeamName(locale, row.teamName) : null;
              const isRank1 = row.rank === 1;
              const isRank2 = row.rank === 2;
              const cardClass = isRank1
                ? `${styles.podiumCard} ${styles.rank1}`
                : isRank2
                  ? `${styles.podiumCard} ${styles.rank2}`
                  : `${styles.podiumCard} ${styles.rank3}`;
              const tagClass = isRank1
                ? `${styles.medalTag} ${styles.medalTag1}`
                : isRank2
                  ? `${styles.medalTag} ${styles.medalTag2}`
                  : `${styles.medalTag} ${styles.medalTag3}`;

              return (
                <StaggerItem key={`podium-${row.rank}-${row.name}`}>
                  <div className={cardClass}>
                    <span className={tagClass}>
                      {isRank1 ? <Crown size={13} aria-hidden /> : <Medal size={13} aria-hidden />}
                      <span>#{row.rank}</span>
                    </span>

                    <div className={styles.avatarWrap}>
                      {isRank1 ? (
                        <div className={styles.crownBadge} aria-hidden>
                          <Crown size={14} />
                        </div>
                      ) : null}
                      {row.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.photoUrl} alt={name} className={styles.avatar} />
                      ) : (
                        <i className={styles.avatarFallback}>{name.charAt(0)}</i>
                      )}
                    </div>

                    <strong className={styles.playerName}>
                      {row.slug ? <Link href={`/player/${row.slug}`}>{name}</Link> : name}
                    </strong>

                    {team ? (
                      <span className={styles.clubBadge}>
                        {row.teamLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.teamLogo} alt="" className={styles.clubCrest} />
                        ) : null}
                        {row.teamSlug ? <Link href={`/team/${row.teamSlug}`}>{team}</Link> : <span>{team}</span>}
                      </span>
                    ) : null}

                    <div className={styles.valueBox}>
                      <span className={styles.bigValue}>{row.value}</span>
                      <span className={styles.unitLabel}>{unit}</span>
                      {kind === 'combined' && row.secondary != null ? (
                        <span className={styles.secondaryNote}>
                          {row.value - row.secondary} + {row.secondary} {pick(locale, 'صناعة', 'assist')}
                        </span>
                      ) : null}
                      {row.appearances != null ? (
                        <span className={styles.secondaryNote}>
                          {row.appearances} {pick(locale, 'مباراة', 'matches')}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>

          {/* Leaderboard list (4th place onwards) */}
          {desk.rows.length > 3 ? (
            <ol className={styles.boardList}>
              {desk.rows.slice(3).map((row) => {
                const name = localizePlainName(locale, row.name);
                const team = row.teamName ? localizeTeamName(locale, row.teamName) : null;
                const max = desk.rows[0]?.value || 1;
                const pct = Math.min(100, Math.max(12, Math.round((row.value / max) * 100)));

                return (
                  <li key={`${row.rank}-${row.name}`}>
                    <div className={styles.leaderRow}>
                      <span className={styles.rankBadge}>
                        #{String(row.rank).padStart(2, '0')}
                      </span>

                      {row.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.photoUrl} alt="" className={styles.leaderAvatar} />
                      ) : (
                        <i className={styles.leaderAvatarFallback}>{name.charAt(0)}</i>
                      )}

                      <div className={styles.playerInfo}>
                        <strong className={styles.playerTitle}>
                          {row.slug ? <Link href={`/player/${row.slug}`}>{name}</Link> : name}
                        </strong>

                        {team ? (
                          <span className={styles.clubSub}>
                            {row.teamLogo ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.teamLogo} alt="" className={styles.clubSubCrest} />
                            ) : null}
                            {row.teamSlug ? <Link href={`/team/${row.teamSlug}`}>{team}</Link> : <span>{team}</span>}
                            {row.appearances != null ? (
                              <span>· {row.appearances} {pick(locale, 'مباراة', 'apps')}</span>
                            ) : null}
                          </span>
                        ) : null}

                        <div className={styles.meterTrack} aria-hidden>
                          <div className={styles.meterFill} style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className={styles.scorePill}>
                        <span className={styles.scoreVal}>{row.value}</span>
                        <span className={styles.scoreUnit}>{unit}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : null}
        </div>
      )}
      {desk.teamRows.length > 0 ? (
        <section className="stats-teams-block">
          <div className="stats-teams-header">
            <div className="stats-teams-title-box">
              <div className="stats-teams-icon">
                <Trophy size={20} aria-hidden />
              </div>
              <div>
                <h2>{pick(locale, 'إحصائيات الفرق وأرقام الموسم', 'Team Figures & Season Analytics')}</h2>
                <p>{pick(locale, `تحليل تفصيلي لأداء أندية ${boardName} — الهجوم، الدفاع، وسجلات المباريات من مصدر الترتيب الرسمي.`, `Detailed breakdown of ${boardName} club performance — attack, defense, and records from the official table.`)}</p>
              </div>
            </div>
            <span className="stats-teams-badge">{desk.teamRows.length} {pick(locale, 'فريقاً', 'Teams')}</span>
          </div>

          <div className="stats-split">
            {[
              {
                title: pick(locale, 'أكثر الفرق تسجيلاً', 'Most scored'),
                subtitle: pick(locale, 'القوة الهجومية الضاربة', 'Top attack'),
                list: attack,
                key: 'goalsFor' as const,
                unit: pick(locale, 'هدف', 'goals'),
                tone: 'orange',
              },
              {
                title: pick(locale, 'أقوى خط دفاع', 'Best defense'),
                subtitle: pick(locale, 'الأقل استقبالاً للأهداف', 'Fewest conceded'),
                list: defense,
                key: 'goalsAgainst' as const,
                unit: pick(locale, 'في مرماه', 'conceded'),
                tone: 'green',
              },
              {
                title: pick(locale, 'أكثر الفرق فوزاً', 'Most wins'),
                subtitle: pick(locale, 'حاصدو الانتصارات', 'Top winners'),
                list: wins,
                key: 'won' as const,
                unit: pick(locale, 'فوز', 'wins'),
                tone: 'amber',
              },
              {
                title: pick(locale, 'أكثر الفرق تعادلاً', 'Most draws'),
                subtitle: pick(locale, 'التكافؤ وتقاسم النقاط', 'Most drawn'),
                list: draws,
                key: 'drawn' as const,
                unit: pick(locale, 'تعادل', 'draws'),
                tone: 'sky',
              },
              {
                title: pick(locale, 'أكثر الفرق خسارة', 'Most losses'),
                subtitle: pick(locale, 'معاناة الدفاع والنتائج', 'Most defeats'),
                list: losses,
                key: 'lost' as const,
                unit: pick(locale, 'هزيمة', 'losses'),
                tone: 'rose',
              },
            ].map(({ title, subtitle, list, key, unit: u, tone }) => {
              const maxVal = Math.max(...list.map((r) => r[key]), 1);
              return (
                <div key={title} className={`stats-team-card is-${tone}`}>
                  <div className="stats-team-card-head">
                    <div>
                      <h3>{title}</h3>
                      <p>{subtitle}</p>
                    </div>
                  </div>

                  <ol className="stats-team-list">
                    {list.map((row, idx) => {
                      const val = row[key];
                      const pct = Math.max(12, Math.round((val / maxVal) * 100));
                      return (
                        <li key={`${key}-${row.slug}`} className="stats-team-item">
                          <span className={`stats-team-rank is-rank-${idx + 1}`}>{idx + 1}</span>
                          <Link href={`/team/${row.slug}`} className="stats-team-link">
                            {row.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.logoUrl} alt="" className="stats-team-crest" />
                            ) : (
                              <span className="stats-team-crest-empty">{row.name.charAt(0)}</span>
                            )}
                            <div className="stats-team-info">
                              <span className="stats-team-name">{localizeTeamName(locale, row.name)}</span>
                              <div className="stats-team-bar-wrap">
                                <div className="stats-team-bar" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          </Link>
                          <span className="stats-team-val">
                            <b>{val}</b>
                            <small>{u}</small>
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
      <p className="stats-links">
        {desk.leagueSlug ? <Link href={`/league/${desk.leagueSlug}`}>{pick(locale, 'صفحة البطولة', 'Competition page')}</Link> : null}
        <Link href="/compare-players">{pick(locale, 'مقارنة لاعبين', 'Compare players')}</Link>
      </p>
    </SalonStage>
  );
}
