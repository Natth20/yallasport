import { pick } from '@/i18n/pick';
import { Link } from '@/i18n/navigation';
import { ALL_STAT_KINDS, STAT_BOARDS, type StatKind, type StatSort, type loadStatsDesk } from '@/lib/stats/load-desk';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { HallFoyer } from '@/components/salon/HallFoyer';
import { SalonStage } from '@/components/salon/SalonStage';
import { Stagger, StaggerItem } from '@/components/motion/PageMotion';
import { ArrowLeftRight, BarChart3, CalendarDays, Radio, Trophy } from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';

type Desk = Awaited<ReturnType<typeof loadStatsDesk>>;

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
          <form className="stats-seek" action={`/stats/${desk.board.slug}/${desk.season}`} method="get">
            <input type="hidden" name="kind" value={kind} />
            <input type="search" name="q" defaultValue={q} placeholder={pick(locale, 'ابحث عن لاعب...', 'Search a player...')} />
            <select name="sort" defaultValue={sort}>
              <option value="value">{pick(locale, 'ترتيب حسب الرقم', 'Sort by value')}</option>
              <option value="apps">{pick(locale, 'المشاركات', 'Appearances')}</option>
              <option value="minutes">{pick(locale, 'الدقائق', 'Minutes')}</option>
              <option value="name">{pick(locale, 'الاسم', 'Name')}</option>
            </select>
            <button type="submit">{pick(locale, 'تطبيق', 'Apply')}</button>
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
        <div className={`stats-stage is-${kind}`}>
          <Stagger className="stats-podium" delay={0.04}>
            {desk.rows.slice(0, 3).map((row) => {
              const name = localizePlainName(locale, row.name);
              const team = row.teamName ? localizeTeamName(locale, row.teamName) : null;
              return (
                <StaggerItem key={`p-${row.rank}-${row.name}`}>
                  <div>
                    <span className="stats-medal">{row.rank}</span>
                    {row.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photoUrl} alt="" />
                    ) : (
                      <i>{name.charAt(0)}</i>
                    )}
                    <strong>{row.slug ? <Link href={`/player/${row.slug}`}>{name}</Link> : name}</strong>
                    {team ? (
                      <em>
                        {row.teamLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.teamLogo} alt="" className="stats-crest" />
                        ) : null}
                        {row.teamSlug ? <Link href={`/team/${row.teamSlug}`}>{team}</Link> : team}
                      </em>
                    ) : null}
                    <b>
                      {row.value}
                      <small>{unit}</small>
                      {kind === 'combined' && row.secondary != null ? <small>{row.value - row.secondary}+{row.secondary}</small> : null}
                      {row.appearances != null ? <small>{row.appearances} {pick(locale, 'مباراة', 'apps')}</small> : null}
                    </b>
                  </div>
                </StaggerItem>
              );
            })}
          </Stagger>
          <ol className="stats-board">
            {desk.rows.slice(3).map((row) => {
              const name = localizePlainName(locale, row.name);
              const team = row.teamName ? localizeTeamName(locale, row.teamName) : null;
              const max = desk.rows[0]?.value || 1;
              return (
                <li key={`${row.rank}-${row.name}`}>
                  <div className="stats-row">
                    <span className="stats-rank">{String(row.rank).padStart(2, '0')}</span>
                    {row.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.photoUrl} alt="" />
                    ) : (
                      <i>{name.charAt(0)}</i>
                    )}
                    <span className="stats-who">
                      <strong>{row.slug ? <Link href={`/player/${row.slug}`}>{name}</Link> : name}</strong>
                      {team ? (
                        <em>
                          {row.teamLogo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={row.teamLogo} alt="" className="stats-crest" />
                          ) : null}
                          {row.teamSlug ? <Link href={`/team/${row.teamSlug}`}>{team}</Link> : team}
                        </em>
                      ) : null}
                      <span className="stats-meter" aria-hidden>
                        <span style={{ width: `${Math.round((row.value / max) * 100)}%` }} />
                      </span>
                    </span>
                    <b>{row.value}</b>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
      {desk.teamRows.length > 0 ? (
        <div className="stats-teams">
          <h2>{pick(locale, 'إحصائيات الفرق', 'Team figures')}</h2>
          <div className="stats-split">
            {[
              [pick(locale, 'أكثر تسجيلًا', 'Most scored'), attack, 'goalsFor'] as const,
              [pick(locale, 'أقل استقبالًا', 'Fewest conceded'), defense, 'goalsAgainst'] as const,
              [pick(locale, 'أكثر انتصارات', 'Most wins'), wins, 'won'] as const,
              [pick(locale, 'أكثر خسائر', 'Most losses'), losses, 'lost'] as const,
              [pick(locale, 'أكثر تعادلات', 'Most draws'), draws, 'drawn'] as const,
            ].map(([title, list, key]) => (
              <section key={title}>
                <h3>{title}</h3>
                <ol>
                  {list.map((row) => (
                    <li key={`${key}-${row.slug}`}>
                      <Link href={`/team/${row.slug}`}>
                        {row.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.logoUrl} alt="" className="stats-crest" />
                        ) : null}
                        {localizeTeamName(locale, row.name)}
                      </Link>
                      <b>{row[key]}</b>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </div>
      ) : null}
      <p className="stats-links">
        {desk.leagueSlug ? <Link href={`/league/${desk.leagueSlug}`}>{pick(locale, 'صفحة البطولة', 'Competition page')}</Link> : null}
        <Link href="/compare-players">{pick(locale, 'مقارنة لاعبين', 'Compare players')}</Link>
      </p>
    </SalonStage>
  );
}
