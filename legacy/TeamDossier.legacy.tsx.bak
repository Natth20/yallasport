import React from 'react';
import { Link } from '@/i18n/navigation';
import { FollowButton } from '@/components/common/FollowButton';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { EntityBody, EntityBrand, EntityFrame, EntityHero } from '@/components/entity/EntityFrame';
import type {
  Contributor,
  DossierMatch,
  FormEntry,
  FormLetter,
  SquadGroupKey,
  SplitStats,
  TeamDossierData,
} from '@/lib/teams/load-dossier';

const SQUAD_ORDER: SquadGroupKey[] = ['GK', 'DF', 'MF', 'FW', 'OTHER'];

function squadLabel(key: SquadGroupKey, locale: string) {
  switch (key) {
    case 'GK':
      return pick(locale, 'حراس المرمى', 'Goalkeepers');
    case 'DF':
      return pick(locale, 'الدفاع', 'Defence');
    case 'MF':
      return pick(locale, 'الوسط', 'Midfield');
    case 'FW':
      return pick(locale, 'الهجوم', 'Attack');
    default:
      return pick(locale, 'أخرى', 'Other');
  }
}

function liveClock(match: { status: string; minute: number | null }, locale: string) {
  if (match.status === 'HALFTIME') return pick(locale, 'استراحة', 'Half-time');
  if (match.minute) return `${match.minute}'`;
  return pick(locale, 'مباشر', 'Live');
}

function formWord(letter: FormLetter, locale: string) {
  if (letter === 'W') return pick(locale, 'ف', 'W');
  if (letter === 'D') return pick(locale, 'ت', 'D');
  return pick(locale, 'خ', 'L');
}

function goalDiffLabel(diff: number) {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

function decodeHtmlEntities(value: unknown) {
  if (typeof value !== 'string') return value == null ? '' : String(value);
  return value
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function dateLabel(value: Date, locale: string) {
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function Head({ title, note }: { title: string; note?: string }) {
  return (
    <header className="psheet-head">
      <h2>{title}</h2>
      {note ? <p>{note}</p> : null}
    </header>
  );
}

function SubHead({ title, note }: { title: string; note?: string }) {
  return (
    <header className="psheet-head is-sub">
      <h3>{title}</h3>
      {note ? <p>{note}</p> : null}
    </header>
  );
}

function Chapter({
  num,
  title,
  note,
  children,
}: {
  num: string;
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="tsheet-block">
      <header className="tsheet-mark">
        <span>{num}</span>
        <h2>{title}</h2>
        {note ? <p>{note}</p> : null}
      </header>
      <div className="tsheet-block-body">{children}</div>
    </section>
  );
}

function SplitBoard({ title, stats, locale }: { title: string; stats: SplitStats; locale: string }) {
  if (stats.played <= 0) return null;
  return (
    <div className="psheet-card">
      <h3 className="tsheet-sub">{title}</h3>
      <ul className="psheet-kpis tsheet-mini">
        <li>
          <strong>{stats.played}</strong>
          <span>{pick(locale, 'لعب', 'P')}</span>
        </li>
        <li>
          <strong>{stats.won}</strong>
          <span>{pick(locale, 'فوز', 'W')}</span>
        </li>
        <li>
          <strong>{stats.drawn}</strong>
          <span>{pick(locale, 'تعادل', 'D')}</span>
        </li>
        <li>
          <strong>{stats.lost}</strong>
          <span>{pick(locale, 'خسارة', 'L')}</span>
        </li>
        <li>
          <strong>
            {stats.goalsFor}:{stats.goalsAgainst}
          </strong>
          <span>{pick(locale, 'أهداف', 'GF:GA')}</span>
        </li>
      </ul>
    </div>
  );
}

function MatchSlip({
  match,
  teamId,
  locale,
  mode,
}: {
  match: DossierMatch;
  teamId: string;
  locale: string;
  mode: 'live' | 'upcoming' | 'result';
}) {
  const isHome = match.homeTeamId === teamId;
  return (
    <Link href={`/match/${match.id}`} className={`tsheet-slip is-${mode}`}>
      <p>
        <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
        <span>{localizePlainName(locale, match.league.name)}</span>
        {mode === 'live' ? (
          <b>{liveClock(match, locale)}</b>
        ) : mode === 'upcoming' ? (
          <ClientTime
            value={match.kickoffAt}
            locale={locale}
            options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
          />
        ) : (
          <em>{pick(locale, 'نهاية', 'FT')}</em>
        )}
      </p>
      <div>
        <span className={isHome ? 'is-us' : undefined}>
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
          <strong>{localizePlainName(locale, match.homeTeam.name)}</strong>
        </span>
        <i>
          {mode === 'upcoming' ? (
            pick(locale, 'ضد', 'vs')
          ) : (
            <>
              {match.homeScore ?? '—'}–{match.awayScore ?? '—'}
            </>
          )}
        </i>
        <span className={!isHome ? 'is-us' : undefined}>
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-7 w-7" />
          <strong>{localizePlainName(locale, match.awayTeam.name)}</strong>
        </span>
      </div>
      {(match.round || match.venue?.name) && (
        <em>
          {[match.round, match.venue?.name, match.venue?.city].filter(Boolean).join(' · ')}
        </em>
      )}
    </Link>
  );
}

function FormTrail({ trail, locale }: { trail: FormEntry[]; locale: string }) {
  if (trail.length === 0) return null;
  return (
    <ul className="tsheet-trail">
      {trail.map((entry) => (
        <li key={entry.matchId}>
          <Link href={`/match/${entry.matchId}`}>
            <b className={`tsheet-pip is-${entry.letter.toLowerCase()}`}>{formWord(entry.letter, locale)}</b>
            <span>
              <strong>
                {entry.isHome ? pick(locale, 'منزل', 'H') : pick(locale, 'خارج', 'A')} · {localizePlainName(locale, entry.opponent.name)}
              </strong>
              <em>
                {entry.homeScore}–{entry.awayScore}
              </em>
            </span>
            <LeagueCrest name={entry.opponent.name} logoUrl={entry.opponent.logoUrl} className="h-6 w-6" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function ContributorList({
  rows,
  locale,
  metric,
}: {
  rows: Contributor[];
  locale: string;
  metric: 'goals' | 'assists' | 'cards';
}) {
  if (rows.length === 0) return null;
  return (
    <ol className="tsheet-board">
      {rows.map((row, index) => {
        const value =
          metric === 'goals' ? row.goals || 0 : metric === 'assists' ? row.assists || 0 : `${row.yellow || 0}/${row.red || 0}`;
        const label =
          metric === 'goals'
            ? pick(locale, 'هدف', 'goals')
            : metric === 'assists'
              ? pick(locale, 'صناعة', 'assists')
              : pick(locale, 'ص/ح', 'Y/R');
        const inner = (
          <>
            <em>{String(index + 1).padStart(2, '0')}</em>
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photoUrl} alt="" />
            ) : (
              <span>{row.name.charAt(0)}</span>
            )}
            <strong>{localizePlainName(locale, row.name)}</strong>
            <b>
              {value} <i>{label}</i>
            </b>
          </>
        );
        return (
          <li key={`${row.slug || row.name}-${metric}-${index}`}>
            {row.slug ? <Link href={`/player/${row.slug}`}>{inner}</Link> : <div>{inner}</div>}
          </li>
        );
      })}
    </ol>
  );
}

export function TeamDossier({
  locale,
  dossier,
  loggedIn,
  isFollowing,
}: {
  locale: string;
  now: Date;
  dossier: TeamDossierData;
  loggedIn: boolean;
  isFollowing: boolean;
}) {
  const {
    team,
    squad,
    squadCount,
    squadAges,
    squadComposition,
    nationalities,
    liveMatches,
    upcoming,
    recentResults,
    nextMatch,
    form,
    formTrail,
    standing,
    stats,
    homeStats,
    awayStats,
    competitions,
    scorers,
    assisters,
    discipline,
    transfers,
    news,
  } = dossier;

  const name = localizePlainName(locale, team.name);
  const national = /منتخب|national|\bu-?\d{2}\b/i.test(team.name);
  const country = team.country ? localizePlainName(locale, team.country) : null;
  const venue = team.venue
    ? {
      ...team.venue,
      name: decodeHtmlEntities(team.venue.name),
      city: team.venue.city ? decodeHtmlEntities(team.venue.city) : null,
      address: team.venue.address ? decodeHtmlEntities(team.venue.address) : null,
      surface: team.venue.surface ? decodeHtmlEntities(team.venue.surface) : null,
    }
    : null;

  const kpis = [
    stats.played > 0 ? { label: pick(locale, 'مباراة', 'Played'), value: stats.played } : null,
    stats.won > 0 ? { label: pick(locale, 'فوز', 'Wins'), value: stats.won } : null,
    stats.goalsFor > 0 ? { label: pick(locale, 'أهداف', 'Goals'), value: stats.goalsFor } : null,
    stats.played > 0 ? { label: pick(locale, 'فارق', 'GD'), value: goalDiffLabel(stats.goalDiff) } : null,
    stats.winPct != null ? { label: pick(locale, 'نسبة الفوز', 'Win %'), value: `${stats.winPct}%` } : null,
    standing && standing.points > 0 ? { label: pick(locale, 'نقاط', 'Points'), value: standing.points } : null,
    standing && standing.rank > 0 ? { label: pick(locale, 'الترتيب', 'Rank'), value: `#${standing.rank}` } : null,
    squadCount > 0 ? { label: pick(locale, 'لاعب', 'Squad'), value: squadCount } : null,
    squadAges ? { label: pick(locale, 'متوسط العمر', 'Avg age'), value: squadAges.avg } : null,
    nationalities.length > 0 ? { label: pick(locale, 'جنسية', 'Nations'), value: nationalities.length } : null,
    discipline.yellow > 0 ? { label: pick(locale, 'صفراء', 'Yellow'), value: discipline.yellow } : null,
    discipline.red > 0 ? { label: pick(locale, 'حمراء', 'Red'), value: discipline.red } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  const identity = [
    country ? { label: pick(locale, 'البلد', 'Country'), value: country } : null,
    team.founded ? { label: pick(locale, 'تأسس', 'Founded'), value: String(team.founded) } : null,
    team.code ? { label: pick(locale, 'الرمز', 'Code'), value: team.code } : null,
    venue?.name ? { label: pick(locale, 'الملعب', 'Ground'), value: venue.name } : null,
    venue?.city ? { label: pick(locale, 'المدينة', 'City'), value: venue.city } : null,
    team.coach?.name
      ? { label: pick(locale, 'المدرب', 'Coach'), value: localizePlainName(locale, team.coach.name) }
      : null,
    squadCount > 0 ? { label: pick(locale, 'القائمة', 'Squad'), value: String(squadCount) } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const squadChapters = SQUAD_ORDER.map((key) => ({ key, players: squad[key] })).filter(
    (chapter) => chapter.players.length > 0,
  );
  const programmeUpcoming = upcoming.filter((m) => m.id !== nextMatch?.id).slice(0, 6);
  const maxComposition = Math.max(...squadComposition.map((row) => row.count), 1);

  return (
    <EntityFrame tone={national ? 'nation' : 'club'}>
      <div className="psheet tsheet">
        <div className="psheet-inner">
          <EntityHero>
            <section className="psheet-hero tsheet-hero">
              <div className="tsheet-medallion">
                <LeagueCrest name={team.name} logoUrl={team.logoUrl} className="h-full w-full" />
                {standing && standing.rank > 0 ? <b>#{standing.rank}</b> : null}
              </div>
              <div className="psheet-intro">
                <EntityBrand kicker={national ? pick(locale, 'ملف المنتخب', 'National side') : pick(locale, 'ملف النادي', 'Club house')} />
                <p className="psheet-kicker">
                  {national ? pick(locale, 'منتخب', 'National team') : pick(locale, 'نادي', 'Club')}
                  {standing ? ` · ${localizePlainName(locale, standing.league.name)}` : ''}
                </p>
                <h1>{name}</h1>
                <div className="psheet-chips">
                  {country ? <span className="psheet-chip">{country}</span> : null}
                  {team.founded ? (
                    <span className="psheet-chip">
                      {pick(locale, 'تأسس', 'Est.')} {team.founded}
                    </span>
                  ) : null}
                  {venue?.name ? <span className="psheet-chip">{venue.name}</span> : null}
                  {team.coach?.name ? (
                    <Link
                      href={`/coach/${team.coach.slug || slugifyCoachName(team.coach.name, team.coach.id)}`}
                      className="psheet-chip"
                    >
                      {localizePlainName(locale, team.coach.name)}
                    </Link>
                  ) : null}
                </div>
                {form.length > 0 ? (
                  <div className="tsheet-form" aria-label={pick(locale, 'الشكل الأخير', 'Recent form')}>
                    {form.map((letter, index) => (
                      <span key={`${letter}-${index}`} className={`tsheet-pip is-${letter.toLowerCase()}`}>
                        {formWord(letter, locale)}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="tsheet-actions">
                  <FollowButton
                    entityId={team.id}
                    entityType="TEAM"
                    isLoggedIn={loggedIn}
                    initialIsFollowing={isFollowing}
                    variant="ghost"
                  />
                  <Link href={`/compare?team1=${team.slug}`} className="psheet-compare">
                    {national ? pick(locale, 'قارن هذا المنتخب', 'Compare this side') : pick(locale, 'قارن هذا النادي', 'Compare this club')}
                  </Link>
                </div>
              </div>
              {identity.length > 0 ? (
                <dl className="psheet-facts psheet-hero-facts">
                  {identity.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          </EntityHero>

          <EntityBody>
            {kpis.length > 0 ? (
              <ul
                className="psheet-kpis tsheet-figures"
                aria-label={pick(locale, 'أرقام النادي من المصدر', 'Club figures from the source')}
              >
                {kpis.map((row) => (
                  <li key={row.label}>
                    <strong>{row.value}</strong>
                    <span>{row.label}</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="psheet-layout">
              <div className="psheet-main">
                {liveMatches.length > 0 || (nextMatch && nextMatch.status === 'NOT_STARTED') ? (
                  <Chapter
                    num="01"
                    title={liveMatches.length > 0 ? pick(locale, 'الآن على الملعب', 'On the pitch now') : pick(locale, 'الموعد القادم', 'Next fixture')}
                    note={
                      liveMatches.length > 0
                        ? pick(locale, 'مباريات جارية الآن بحسب المصدر.', 'Matches in progress per the source.')
                        : pick(locale, 'أقرب موعد مثبّت في الجدول.', 'The nearest confirmed kickoff.')
                    }
                  >
                    {liveMatches.length > 0 ? (
                      <div className="tsheet-slips">
                        {liveMatches.map((match) => (
                          <MatchSlip key={match.id} match={match} teamId={team.id} locale={locale} mode="live" />
                        ))}
                      </div>
                    ) : null}
                    {nextMatch && nextMatch.status === 'NOT_STARTED' ? (
                      <MatchSlip match={nextMatch} teamId={team.id} locale={locale} mode="upcoming" />
                    ) : null}
                  </Chapter>
                ) : null}

                {standing || homeStats.played > 0 || awayStats.played > 0 ? (
                  <Chapter
                    num="02"
                    title={pick(locale, 'الموقف في المسابقة', 'Competition standing')}
                    note={pick(locale, 'أرقام الترتيب كما وصلت من المصدر.', 'Table figures exactly as received.')}
                  >
                    {standing ? (
                      <div className="tsheet-standing">
                        <Link href={`/league/${standing.league.slug}`} className="tsheet-standing-league">
                          <LeagueCrest name={standing.league.name} logoUrl={standing.league.logoUrl} className="h-9 w-9" />
                          <span>
                            <strong>{localizePlainName(locale, standing.league.name)}</strong>
                            {standing.league.country ? <em>{localizePlainName(locale, standing.league.country)}</em> : null}
                          </span>
                        </Link>
                        <ul className="tsheet-standing-cells">
                          <li>
                            <strong>{standing.played}</strong>
                            <span>{pick(locale, 'لعب', 'P')}</span>
                          </li>
                          <li>
                            <strong>{standing.won}</strong>
                            <span>{pick(locale, 'فوز', 'W')}</span>
                          </li>
                          <li>
                            <strong>{standing.drawn}</strong>
                            <span>{pick(locale, 'تعادل', 'D')}</span>
                          </li>
                          <li>
                            <strong>{standing.lost}</strong>
                            <span>{pick(locale, 'خسارة', 'L')}</span>
                          </li>
                          <li>
                            <strong>
                              {standing.goalsFor}:{standing.goalsAgainst}
                            </strong>
                            <span>{pick(locale, 'أهداف', 'GF:GA')}</span>
                          </li>
                        </ul>
                        <div className="tsheet-standing-points">
                          <strong>{standing.points}</strong>
                          <span>{pick(locale, 'نقطة', 'Pts')}</span>
                        </div>
                      </div>
                    ) : null}

                    {(homeStats.played > 0 || awayStats.played > 0) && (
                      <div className="psheet-split">
                        <SplitBoard title={pick(locale, 'على أرضه', 'At home')} stats={homeStats} locale={locale} />
                        <SplitBoard title={pick(locale, 'خارج الديار', 'Away')} stats={awayStats} locale={locale} />
                      </div>
                    )}
                  </Chapter>
                ) : null}

                {formTrail.length > 0 || programmeUpcoming.length > 0 || recentResults.length > 0 ? (
                  <Chapter
                    num="03"
                    title={pick(locale, 'السجل والبرنامج', 'Record and programme')}
                    note={pick(locale, 'ما انتهى وما بقي في الجدول.', 'What is done and what remains.')}
                  >
                    {formTrail.length > 0 ? (
                      <div>
                        <SubHead title={pick(locale, 'آخر النتائج', 'Last results')} />
                        <FormTrail trail={formTrail} locale={locale} />
                      </div>
                    ) : null}

                    {(programmeUpcoming.length > 0 || recentResults.length > 0) && (
                      <div className="psheet-split">
                        {programmeUpcoming.length > 0 ? (
                          <div>
                            <SubHead title={pick(locale, 'المباريات القادمة', 'Upcoming')} />
                            <div className="tsheet-slips">
                              {programmeUpcoming.map((match) => (
                                <MatchSlip key={match.id} match={match} teamId={team.id} locale={locale} mode="upcoming" />
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {recentResults.length > 0 ? (
                          <div>
                            <SubHead title={pick(locale, 'النتائج الأخيرة', 'Latest results')} />
                            <div className="tsheet-slips">
                              {recentResults.map((match) => (
                                <MatchSlip key={match.id} match={match} teamId={team.id} locale={locale} mode="result" />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </Chapter>
                ) : null}

                {squadChapters.length > 0 ? (
                  <Chapter
                    num="04"
                    title={pick(locale, 'القائمة الحالية', 'Current roster')}
                    note={
                      squadAges
                        ? pick(
                          locale,
                          `${squadCount} لاعباً · الأعمار ${squadAges.min}–${squadAges.max}`,
                          `${squadCount} players · ages ${squadAges.min}–${squadAges.max}`,
                        )
                        : pick(locale, `${squadCount} لاعباً`, `${squadCount} players`)
                    }
                  >
                    {squadChapters.map((chapter) => (
                      <div key={chapter.key} className="tsheet-chapter">
                        <h3>
                          {squadLabel(chapter.key, locale)} <i>{chapter.players.length}</i>
                        </h3>
                        <ul className="tsheet-squad">
                          {chapter.players.map((row) => (
                            <li key={row.id}>
                              <Link href={`/player/${row.player.slug}`}>
                                <b>{row.shirtNumber ?? '·'}</b>
                                {row.player.photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={row.player.photoUrl} alt="" />
                                ) : (
                                  <span>{row.player.name.charAt(0)}</span>
                                )}
                                <span>
                                  <strong>{localizePlainName(locale, row.player.name)}</strong>
                                  <em>
                                    {[
                                      row.player.position ? localizePlainName(locale, row.player.position) : null,
                                      row.player.nationality ? localizePlainName(locale, row.player.nationality) : null,
                                      row.player.age != null ? String(row.player.age) : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </em>
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </Chapter>
                ) : null}
              </div>

              <aside className="psheet-rail">
                {competitions.length > 0 ? (
                  <section>
                    <Head title={pick(locale, 'المسابقات', 'Competitions')} />
                    <ul className="psheet-people">
                      {competitions.map((comp) => (
                        <li key={comp.id}>
                          <Link href={`/league/${comp.slug}`}>
                            <LeagueCrest name={comp.name} logoUrl={comp.logoUrl} className="h-7 w-7" />
                            <span>
                              <strong>{localizePlainName(locale, comp.name)}</strong>
                              <em>
                                {comp.matches} {pick(locale, 'مباراة', 'matches')}
                                {comp.country ? ` · ${localizePlainName(locale, comp.country)}` : ''}
                              </em>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {scorers.length > 0 ? (
                  <section className="psheet-card">
                    <Head title={pick(locale, 'الهدافون', 'Scorers')} />
                    <ContributorList rows={scorers} locale={locale} metric="goals" />
                  </section>
                ) : null}
                {assisters.length > 0 ? (
                  <section className="psheet-card">
                    <Head title={pick(locale, 'صناع الأهداف', 'Assists')} />
                    <ContributorList rows={assisters} locale={locale} metric="assists" />
                  </section>
                ) : null}
                {discipline.players.length > 0 ? (
                  <section className="psheet-card">
                    <Head title={pick(locale, 'البطاقات', 'Cards')} />
                    <ContributorList rows={discipline.players} locale={locale} metric="cards" />
                  </section>
                ) : null}

                {squadComposition.length > 0 ? (
                  <section className="psheet-card">
                    <Head
                      title={pick(locale, 'توزيع المراكز', 'Positional mix')}
                      note={pick(locale, `${squadCount} لاعباً مسجّلاً من المصدر.`, `${squadCount} registered players from the source.`)}
                    />
                    <div className="psheet-bars">
                      {squadComposition.map((row) => {
                        const pct = Math.round((row.count / squadCount) * 100);
                        return (
                          <div key={row.key}>
                            <p>
                              <strong>{squadLabel(row.key, locale)}</strong>
                              <em>
                                {row.count} · {pct}%
                              </em>
                            </p>
                            <i>
                              <b style={{ width: `${Math.max(8, (row.count / maxComposition) * 100)}%` }} />
                            </i>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ) : null}

                {nationalities.length > 0 ? (
                  <section className="psheet-card">
                    <Head title={pick(locale, 'الجنسيات', 'Nationalities')} />
                    <div className="psheet-bars">
                      {nationalities.map((nation) => (
                        <div key={nation.name}>
                          <p>
                            <strong>{localizePlainName(locale, nation.name)}</strong>
                            <em>
                              {nation.count} · {nation.pct}%
                            </em>
                          </p>
                          <i>
                            <b style={{ width: `${Math.max(8, nation.pct)}%` }} />
                          </i>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {team.coach ? (
                  <section>
                    <Head title={pick(locale, 'الجهاز الفني', 'Technical staff')} />
                    <div className="psheet-card tsheet-coach">
                      {team.coach.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={team.coach.photoUrl} alt="" />
                      ) : (
                        <span>{team.coach.name.charAt(0)}</span>
                      )}
                      <div>
                        <Link href={`/coach/${team.coach.slug || slugifyCoachName(team.coach.name, team.coach.id)}`}>
                          <strong>{localizePlainName(locale, team.coach.name)}</strong>
                        </Link>
                        {team.coach.nationality ? <em>{localizePlainName(locale, team.coach.nationality)}</em> : null}
                        {team.coach.birthDate ? (
                          <em>
                            {pick(locale, 'مواليد', 'Born')} {dateLabel(team.coach.birthDate, locale)}
                          </em>
                        ) : null}
                        {team.coach.bio ? <p>{team.coach.bio}</p> : null}
                      </div>
                    </div>
                    {team.coach.career.length > 0 ? (
                      <ul className="psheet-list">
                        {team.coach.career.map((stint) => (
                          <li key={`${stint.club}-${stint.from || ''}-${stint.to || ''}`}>
                            <strong>{localizePlainName(locale, stint.club)}</strong>
                            <em>
                              {[stint.role, stint.from, stint.to].filter(Boolean).join(' · ')}
                              {typeof stint.matches === 'number' ? ` · ${stint.matches} ${pick(locale, 'مباراة', 'apps')}` : ''}
                              {typeof stint.winRate === 'number' ? ` · ${stint.winRate}%` : ''}
                            </em>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {team.coach.trophies.length > 0 ? (
                      <ul className="psheet-honours">
                        {team.coach.trophies.map((trophy) => (
                          <li key={`${trophy.title}-${trophy.season}`}>
                            <strong>{localizePlainName(locale, trophy.title)}</strong>
                            <em>
                              {trophy.season}
                              {trophy.teamName ? ` · ${localizePlainName(locale, trophy.teamName)}` : ''}
                            </em>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ) : null}

                {venue ? (
                  <section>
                    <Head title={pick(locale, 'أرض النادي', 'Home ground')} />
                    <article className="psheet-card tsheet-ground">
                      {venue.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={venue.imageUrl} alt={venue.name} referrerPolicy="no-referrer" />
                      ) : null}
                      <div>
                        <strong>{venue.name}</strong>
                        {venue.city ? <em>{venue.city}</em> : null}
                        <dl className="psheet-facts">
                          {typeof venue.capacity === 'number' && venue.capacity > 0 ? (
                            <div>
                              <dt>{pick(locale, 'السعة', 'Capacity')}</dt>
                              <dd>{venue.capacity.toLocaleString(locale === 'ar' ? 'ar' : 'en')}</dd>
                            </div>
                          ) : null}
                          {venue.surface ? (
                            <div>
                              <dt>{pick(locale, 'الأرضية', 'Surface')}</dt>
                              <dd>{venue.surface}</dd>
                            </div>
                          ) : null}
                          {venue.address ? (
                            <div>
                              <dt>{pick(locale, 'العنوان', 'Address')}</dt>
                              <dd>{venue.address}</dd>
                            </div>
                          ) : null}
                        </dl>
                      </div>
                    </article>
                  </section>
                ) : null}

                {transfers.length > 0 ? (
                  <section>
                    <Head title={pick(locale, 'الانتقالات', 'Transfers')} />
                    <ul className="psheet-people">
                      {transfers.map((row) => (
                        <li key={row.id}>
                          <Link href={`/player/${row.player.slug}`}>
                            {row.player.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.player.photoUrl} alt="" className="tsheet-mini-photo" />
                            ) : (
                              <span className="tsheet-mini-photo">{row.player.name.charAt(0)}</span>
                            )}
                            <span>
                              <strong>{localizePlainName(locale, row.player.name)}</strong>
                              <em>
                                {[row.fromTeam, row.toTeam].filter(Boolean).map((club) => localizePlainName(locale, club)).join(' → ') ||
                                  pick(locale, 'انتقال', 'Transfer')}
                                {row.fee ? ` · ${row.fee}` : ''}
                                {' · '}
                                {dateLabel(row.date, locale)}
                              </em>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}

                {team.bio ? (
                  <section>
                    <Head title={pick(locale, 'نبذة النادي', 'Club profile')} />
                    <p className="tsheet-bio">{team.bio}</p>
                  </section>
                ) : null}

                {news.length > 0 ? (
                  <section>
                    <Head title={pick(locale, 'تقارير مرتبطة', 'Linked reports')} />
                    <ul className="psheet-news">
                      {news.map((item) => (
                        <li key={item.id}>
                          <Link href={`/news/${item.slug}`}>
                            <strong>{item.shortTitle || item.title}</strong>
                            <em>
                              {item.category}
                              {item.sourceName ? ` · ${item.sourceName}` : ''}
                            </em>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </aside>
            </div>
          </EntityBody>
        </div>
      </div>
    </EntityFrame>
  );
}
