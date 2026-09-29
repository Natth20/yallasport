import React from 'react';
import { Link } from '@/i18n/navigation';
import {
  Calendar,
  Flame,
  Goal,
  History,
  Newspaper,
  Radio,
  Trophy,
  Users,
} from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { NewsCard } from '@/components/news/NewsCard';
import { ClientTime } from '@/components/datetime/ClientTime';
import { pick } from '@/i18n/pick';
import type { FormLetter } from '@/components/sports/MatchDossier';
import type {
  NormalizedMatch,
  NormalizedMatchEvent,
  NormalizedScorer,
  NormalizedStanding,
  NormalizedTeam,
} from '@/lib/sports-data/types';
import styles from './match-dossier.module.css';

type SheetIcon = typeof Goal | typeof Flame | typeof History | typeof Trophy;

export type MatchSheetRow = {
  icon: SheetIcon;
  label: string;
  value: string;
};

export type RelatedMatchNews = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  featuredImage?: string | null;
  category: string;
  publishedAt: Date | null;
};

type PackProps = {
  locale: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  leagueName: string;
  leagueSlug: string;
  sheetRows: MatchSheetRow[];
  events: NormalizedMatchEvent[];
  homeForm: FormLetter[];
  awayForm: FormLetter[];
  homeRecent: NormalizedMatch[];
  awayRecent: NormalizedMatch[];
  h2hMatches: NormalizedMatch[];
  h2hTally: { home: number; draw: number; away: number };
  showH2hFixtures?: boolean;
  tableWindow: NormalizedStanding[];
  homeTeamId: string;
  awayTeamId: string;
  scorers: NormalizedScorer[];
  upcoming: NormalizedMatch[];
  sameDay: NormalizedMatch[];
  relatedNews: RelatedMatchNews[];
};

const GOAL_TYPES = new Set(['GOAL', 'OWN_GOAL', 'PENALTY']);

function formTone(letter: FormLetter) {
  if (letter === 'W') return styles.formWin;
  if (letter === 'L') return styles.formLoss;
  return styles.formDraw;
}

function formGlyph(locale: string, letter: FormLetter) {
  if (letter === 'W') return pick(locale, 'ف', 'W');
  if (letter === 'L') return pick(locale, 'خ', 'L');
  return pick(locale, 'ت', 'D');
}

function belongsTo(teamId: string, team: NormalizedTeam) {
  return teamId === team.id || teamId === team.externalId;
}

function FixtureTile({ match }: { match: NormalizedMatch }) {
  const hasScore = typeof match.homeScore === 'number' && typeof match.awayScore === 'number';
  return (
    <Link href={`/match/${match.id}`} className={styles.packFixture}>
      <span className={styles.packFixtureLeague}>{match.league.name}</span>
      <span className={styles.packFixtureRow}>
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className={styles.packMiniCrest} />
        <span className={styles.packFixtureName}>{match.homeTeam.name}</span>
        <strong className={styles.packFixtureScore}>{hasScore ? match.homeScore : '–'}</strong>
      </span>
      <span className={styles.packFixtureRow}>
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className={styles.packMiniCrest} />
        <span className={styles.packFixtureName}>{match.awayTeam.name}</span>
        <strong className={styles.packFixtureScore}>{hasScore ? match.awayScore : '–'}</strong>
      </span>
      <ClientTime value={match.kickoffAt} className={styles.packFixtureTime} />
    </Link>
  );
}

export function MatchContextPack({
  locale,
  homeTeam,
  awayTeam,
  leagueName,
  leagueSlug,
  sheetRows,
  events,
  homeForm,
  awayForm,
  homeRecent,
  awayRecent,
  h2hMatches,
  h2hTally,
  showH2hFixtures = true,
  tableWindow,
  homeTeamId,
  awayTeamId,
  scorers,
  upcoming,
  sameDay,
  relatedNews,
}: PackProps) {
  const goals = events.filter((event) => GOAL_TYPES.has(event.type) && event.player);
  const publishedNews = relatedNews.filter((story) => story.publishedAt);
  const h2hTotal = h2hTally.home + h2hTally.draw + h2hTally.away;
  const hasForm = homeForm.length > 0 || awayForm.length > 0 || homeRecent.length > 0 || awayRecent.length > 0;
  const hasAnything =
    sheetRows.length > 0 ||
    goals.length > 0 ||
    hasForm ||
    h2hMatches.length > 0 ||
    tableWindow.length > 0 ||
    scorers.length > 0 ||
    upcoming.length > 0 ||
    sameDay.length > 0 ||
    publishedNews.length > 0;

  if (!hasAnything) return null;

  return (
    <section className={styles.pack} aria-label={pick(locale, 'سياق المباراة', 'Match context')}>
      <header className={styles.packHead}>
        <p className={styles.packKicker}>{pick(locale, 'ملف المباراة', 'Match file')}</p>
        <h2 className={styles.packTitle}>{pick(locale, 'كل ما يخص هذه المواجهة', 'Everything about this fixture')}</h2>
        <p className={styles.packLead}>
          {pick(
            locale,
            `أرقام ونتائج وجدول وأخبار من المصدر الحي لـ ${homeTeam.name} و${awayTeam.name} في ${leagueName}. لا نتائج مخترعة.`,
            `Live-source numbers, results, table, and news for ${homeTeam.name} and ${awayTeam.name} in ${leagueName}. Nothing invented.`
          )}
        </p>
      </header>

      {sheetRows.length > 0 ? (
        <div className={styles.packFacts}>
          {sheetRows.map((row) => {
            const Icon = row.icon;
            return (
              <article key={row.label} className={styles.packFact}>
                <Icon className={styles.packFactIcon} aria-hidden />
                <span className={styles.packFactLabel}>{row.label}</span>
                <strong className={styles.packFactValue}>{row.value}</strong>
              </article>
            );
          })}
        </div>
      ) : null}

      {goals.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Goal className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'شريط الأهداف', 'Goal tape')}</h3>
          </div>
          <ul className={styles.packTape}>
            {goals.map((event, index) => {
              const home = belongsTo(event.teamId, homeTeam);
              return (
                <li key={event.id ?? `${event.minute}-${index}`} className={home ? styles.packTapeHome : styles.packTapeAway}>
                  <span className={styles.packTapeMin}>
                    {event.minute}
                    {event.extraMinute ? `+${event.extraMinute}` : ''}′
                  </span>
                  <span className={styles.packTapeName}>{event.player}</span>
                  {event.assistPlayer ? (
                    <span className={styles.packTapeAssist}>
                      {pick(locale, 'صناعة', 'A')} {event.assistPlayer}
                    </span>
                  ) : null}
                  {event.type === 'PENALTY' ? (
                    <span className={styles.packTapeTag}>{pick(locale, 'ركلة', 'P')}</span>
                  ) : null}
                  {event.type === 'OWN_GOAL' ? (
                    <span className={styles.packTapeTag}>{pick(locale, 'عكسية', 'OG')}</span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {hasForm ? (
        <div className={styles.packDuel}>
          <FormBoard
            locale={locale}
            team={homeTeam}
            form={homeForm}
            recent={homeRecent}
            tone="home"
          />
          <FormBoard
            locale={locale}
            team={awayTeam}
            form={awayForm}
            recent={awayRecent}
            tone="away"
          />
        </div>
      ) : null}

      {h2hMatches.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <History className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'المواجهات السابقة', 'Head to head')}</h3>
            <span className={styles.packCount}>{h2hTotal}</span>
          </div>
          {h2hTotal > 0 ? (
            <div className={styles.packH2hBar} aria-hidden>
              <span className={styles.packH2hHome} style={{ flexGrow: Math.max(h2hTally.home, 0.15) }} />
              <span className={styles.packH2hDraw} style={{ flexGrow: Math.max(h2hTally.draw, 0.15) }} />
              <span className={styles.packH2hAway} style={{ flexGrow: Math.max(h2hTally.away, 0.15) }} />
            </div>
          ) : null}
          <p className={styles.packH2hLegend}>
            <span>
              {homeTeam.name} <strong>{h2hTally.home}</strong>
            </span>
            <span>
              {pick(locale, 'تعادل', 'Draw')} <strong>{h2hTally.draw}</strong>
            </span>
            <span>
              {awayTeam.name} <strong>{h2hTally.away}</strong>
            </span>
          </p>
          {showH2hFixtures ? (
            <div className={styles.packFixtureGrid}>
              {h2hMatches.slice(0, 6).map((item) => (
                <FixtureTile key={item.id} match={item} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {tableWindow.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Trophy className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'نافذة الجدول', 'Table window')}</h3>
            <Link href={`/league/${leagueSlug}`} className={styles.packMore}>
              {leagueName}
            </Link>
          </div>
          <div className={styles.packTableWrap}>
            <table className={styles.packTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{pick(locale, 'الفريق', 'Team')}</th>
                  <th>{pick(locale, 'ل', 'P')}</th>
                  <th>{pick(locale, 'ف', 'W')}</th>
                  <th>{pick(locale, 'ت', 'D')}</th>
                  <th>{pick(locale, 'خ', 'L')}</th>
                  <th>+/−</th>
                  <th>{pick(locale, 'ن', 'Pts')}</th>
                </tr>
              </thead>
              <tbody>
                {tableWindow.map((row) => {
                  const involved =
                    row.team.id === homeTeamId ||
                    row.team.id === awayTeamId ||
                    row.team.externalId === homeTeam.externalId ||
                    row.team.externalId === awayTeam.externalId ||
                    row.team.name === homeTeam.name ||
                    row.team.name === awayTeam.name;
                  return (
                    <tr key={row.team.id} className={involved ? styles.packTableHot : undefined}>
                      <td>{row.rank}</td>
                      <td>
                        <Link href={`/team/${row.team.slug}`} className={styles.packTableTeam}>
                          <LeagueCrest
                            name={row.team.name}
                            logoUrl={row.team.logoUrl}
                            className={styles.packMiniCrest}
                          />
                          {row.team.name}
                        </Link>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>
                        {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}
                        {row.goalsFor - row.goalsAgainst}
                      </td>
                      <td>{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {scorers.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Flame className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'هدافو المسابقة', 'League scorers')}</h3>
          </div>
          <ol className={styles.packScorers}>
            {scorers.slice(0, 8).map((row, index) => (
              <li key={`${row.player.id}-${index}`} className={styles.packScorer}>
                <span className={styles.packScorerRank}>{index + 1}</span>
                {row.player.photoUrl ? (
                  <img src={row.player.photoUrl} alt="" className={styles.packScorerPhoto} />
                ) : (
                  <span className={styles.packScorerGhost} aria-hidden />
                )}
                <span>
                  <strong>{row.player.name}</strong>
                  {row.teamName ? <em>{row.teamName}</em> : null}
                </span>
                <b>{row.goals}</b>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {upcoming.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Calendar className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'مواعيد الفريقين التالية', 'Next fixtures')}</h3>
          </div>
          <div className={styles.packFixtureGrid}>
            {upcoming.map((item) => (
              <FixtureTile key={item.id} match={item} />
            ))}
          </div>
        </div>
      ) : null}

      {sameDay.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Radio className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'نفس الجولة في الدوري', 'Same-day league slate')}</h3>
          </div>
          <div className={styles.packFixtureGrid}>
            {sameDay.map((item) => (
              <FixtureTile key={item.id} match={item} />
            ))}
          </div>
        </div>
      ) : null}

      {publishedNews.length > 0 ? (
        <div className={styles.packBand}>
          <div className={styles.packBandHead}>
            <Newspaper className={styles.packBandIcon} aria-hidden />
            <h3>{pick(locale, 'تقارير مرتبطة', 'Linked reports')}</h3>
          </div>
          <div className={styles.packNews}>
            {publishedNews.map(
              (news) =>
                news.publishedAt && (
                  <NewsCard
                    key={news.id}
                    news={{
                      ...news,
                      excerpt: news.excerpt ?? undefined,
                      featuredImage: news.featuredImage ?? undefined,
                      publishedAt: news.publishedAt,
                    }}
                    variant="vertical"
                  />
                )
            )}
          </div>
        </div>
      ) : null}

      <p className={styles.packFoot}>
        <Users className="h-3.5 w-3.5" aria-hidden />
        {pick(
          locale,
          'المصدر: واجهة البيانات الرياضية وقاعدة النشر فقط. إن غاب رقم فهو غير متوفر بعد.',
          'Source: sports API and published rows only. Missing numbers are not available yet.'
        )}
      </p>
    </section>
  );
}

function FormBoard({
  locale,
  team,
  form,
  recent,
  tone,
}: {
  locale: string;
  team: NormalizedTeam;
  form: FormLetter[];
  recent: NormalizedMatch[];
  tone: 'home' | 'away';
}) {
  return (
    <article className={tone === 'home' ? styles.packBoardHome : styles.packBoardAway}>
      <Link href={`/team/${team.slug}`} className={styles.packBoardHead}>
        <LeagueCrest name={team.name} logoUrl={team.logoUrl} className={styles.packBoardCrest} />
        <span>
          <strong>{team.name}</strong>
          <em>{pick(locale, 'آخر النتائج', 'Recent form')}</em>
        </span>
      </Link>
      {form.length > 0 ? (
        <div className={styles.packPips}>
          {form.map((letter, index) => (
            <span key={`${letter}-${index}`} className={formTone(letter)}>
              {formGlyph(locale, letter)}
            </span>
          ))}
        </div>
      ) : null}
      {recent.length > 0 ? (
        <div className={styles.packRecent}>
          {recent.map((item) => (
            <FixtureTile key={item.id} match={item} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
