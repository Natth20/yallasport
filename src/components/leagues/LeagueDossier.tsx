'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Newspaper,
  Shield,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { LeagueFollowChip } from '@/components/leagues/LeagueFollowChip';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import { localizePlainName, localizeTeamName } from '@/lib/i18n/sports-lexicon';
import {
  formatLeagueSeason,
  localizeCompetitionTitle,
  localizeLeagueRegion,
  localizeRoundName,
} from '@/lib/i18n/competition-names';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { LeagueDossierData, LeagueMatchCard } from '@/lib/leagues/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';

function zoneRankClass(zone: LeagueDossierData['standings'][number]['zone']) {
  if (zone === 'direct' || zone === 'cl') return styles.rankDirect;
  if (zone === 'playoff' || zone === 'el') return styles.rankPlayoff;
  return '';
}

function MatchWhen({ match, locale }: { match: LeagueMatchCard; locale: string }) {
  if (match.status === 'LIVE' || match.status === 'HALFTIME') {
    return <>{match.minute ? `${match.minute}'` : pick(locale, 'مباشر', 'Live')}</>;
  }
  if (match.status === 'FINISHED') return <>{pick(locale, 'نهاية', 'FT')}</>;
  return (
    <ClientTime
      value={match.kickoffAt}
      locale={locale}
      options={{ weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }}
    />
  );
}

function MatchDuel({ match, locale }: { match: LeagueMatchCard; locale: string }) {
  const live = match.status === 'LIVE' || match.status === 'HALFTIME';
  const scored = match.homeScore != null && match.awayScore != null;

  return (
    <div className={styles.duel}>
      <div className={styles.side}>
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-20 w-20" />
        <strong>{localizeTeamName(locale, match.homeTeam.name)}</strong>
      </div>
      <div className={styles.score}>
        <em className={live ? styles.liveBadge : undefined}>
          {live ? <span className={styles.liveDot} aria-hidden /> : null}
          <MatchWhen match={match} locale={locale} />
        </em>
        <b>{scored ? `${match.homeScore} – ${match.awayScore}` : '×'}</b>
      </div>
      <div className={styles.side}>
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-20 w-20" />
        <strong>{localizeTeamName(locale, match.awayTeam.name)}</strong>
      </div>
    </div>
  );
}

function Slip({ match, locale }: { match: LeagueMatchCard; locale: string }) {
  const scored = match.homeScore != null && match.awayScore != null;

  return (
    <Link href={`/match/${match.id}`} className={styles.slip}>
      <div className={styles.slipTop}>
        <span className={styles.slipRound}>{localizeRoundName(locale, match.round) || pick(locale, 'مباراة', 'Match')}</span>
        <MatchWhen match={match} locale={locale} />
      </div>
      <div className={styles.row}>
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5" />
        <span>{localizeTeamName(locale, match.homeTeam.name)}</span>
        <strong>{scored ? match.homeScore : '–'}</strong>
      </div>
      <div className={styles.row}>
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5" />
        <span>{localizeTeamName(locale, match.awayTeam.name)}</span>
        <strong>{scored ? match.awayScore : '–'}</strong>
      </div>
    </Link>
  );
}

export function LeagueDossier({
  locale,
  dossier,
  isLoggedIn,
  initialIsFollowing,
}: {
  locale: string;
  dossier: LeagueDossierData;
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
}) {
  const {
    league,
    seasonId,
    liveMatches,
    upcoming,
    recent,
    roundAgenda,
    spotlight,
    tvGuide,
    standings,
    clubs,
    topScorers,
    topAssists,
    topCards,
    news,
    lastSyncedAt,
    provider,
    seasons,
    archiveSeasons,
  } = dossier;

  const reel = useMemo(() => {
    const seen = new Set<string>();
    const rows: LeagueMatchCard[] = [];
    for (const match of [...liveMatches, spotlight ? [spotlight] : [], upcoming, recent].flat()) {
      if (!match || seen.has(match.id)) continue;
      seen.add(match.id);
      rows.push(match);
    }
    return rows.slice(0, 10);
  }, [liveMatches, upcoming, recent, spotlight]);

  const [activeId, setActiveId] = useState(reel[0]?.id || null);
  const current = reel.find((match) => match.id === activeId) || reel[0] || null;
  const currentIndex = Math.max(0, reel.findIndex((match) => match.id === current?.id));
  const name = localizeCompetitionTitle(locale, league);

  const stepReel = (delta: number) => {
    if (reel.length === 0) return;
    const next = (currentIndex + delta + reel.length) % reel.length;
    setActiveId(reel[next].id);
  };

  const tablePreview = standings.slice(0, 16);
  const clubPreview = clubs.slice(0, 24);
  const scorerPreview = topScorers.slice(0, 8);
  const region = localizeLeagueRegion(locale, league.country, league.externalId);
  const seasonLabel = formatLeagueSeason(seasonId) || seasonId;
  const currentArchive = archiveSeasons.find((row) => row.seasonId === seasonId) || archiveSeasons[0];
  const status = liveMatches.length > 0
    ? pick(locale, 'جارية', 'Live')
    : upcoming.length > 0 && recent.length === 0
      ? pick(locale, 'لم تبدأ', 'Not started')
      : upcoming.length === 0 && recent.length > 0
        ? pick(locale, 'انتهت', 'Finished')
        : upcoming.length > 0
          ? pick(locale, 'جارية', 'In progress')
          : null;

  const kpis = [
    league.matchCount > 0 ? { label: pick(locale, 'مباراة', 'Fixtures'), value: league.matchCount } : null,
    standings.length > 0 ? { label: pick(locale, 'فريق', 'Clubs'), value: standings.length } : null,
    liveMatches.length > 0 ? { label: pick(locale, 'مباشر', 'Live'), value: liveMatches.length } : null,
    upcoming.length > 0 ? { label: pick(locale, 'قادمة', 'Upcoming'), value: upcoming.length } : null,
    tvGuide.length > 0 ? { label: pick(locale, 'قنوات ناقلة', 'Broadcasters'), value: tvGuide.length } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return (
    <div className={`${styles.hall} ${styles.sashHall}`}>
      {/* ---------------- FOYER SUB-NAVIGATION ---------------- */}
      <nav className={styles.foyer} aria-label={pick(locale, 'أقسام البطولة', 'Competition sections')}>
        <div className={styles.foyerTabs}>
          <a href="#hall-screen" className={`${styles.foyerTab} ${styles.isOn}`}>
            <Flame size={14} aria-hidden />
            <span>{pick(locale, 'نظرة عامة', 'Overview')}</span>
          </a>
          {standings.length > 0 ? (
            <a href="#hall-standings" className={styles.foyerTab}>
              <Trophy size={14} aria-hidden />
              <span>{pick(locale, 'الترتيب', 'Table')}</span>
              <span className={styles.foyerBadge}>{standings.length}</span>
            </a>
          ) : null}
          {upcoming.length > 0 || recent.length > 0 ? (
            <a href="#hall-fixtures" className={styles.foyerTab}>
              <Calendar size={14} aria-hidden />
              <span>{pick(locale, 'المباريات', 'Matches')}</span>
              <span className={styles.foyerBadge}>{upcoming.length + recent.length}</span>
            </a>
          ) : null}
          {topScorers.length > 0 ? (
            <a href="#hall-scorers" className={styles.foyerTab}>
              <Sparkles size={14} aria-hidden />
              <span>{pick(locale, 'الهدافون', 'Scorers')}</span>
              <span className={styles.foyerBadge}>{topScorers.length}</span>
            </a>
          ) : null}
          {clubs.length > 0 ? (
            <a href="#hall-clubs" className={styles.foyerTab}>
              <Shield size={14} aria-hidden />
              <span>{pick(locale, 'الفرق', 'Clubs')}</span>
              <span className={styles.foyerBadge}>{clubs.length}</span>
            </a>
          ) : null}
          {news.length > 0 ? (
            <a href="#hall-news" className={styles.foyerTab}>
              <Newspaper size={14} aria-hidden />
              <span>{pick(locale, 'الأخبار', 'News')}</span>
              <span className={styles.foyerBadge}>{news.length}</span>
            </a>
          ) : null}
        </div>
      </nav>

      {/* ---------------- CONSOLE (CHASSIS + QUEUE) ---------------- */}
      <div id="hall-screen" className={styles.console}>
        <section className={styles.screen}>
          <div className={styles.chassis}>
            <HallBezel
              label={pick(locale, 'البطولة', 'Competition')}
              clock={null}
            />
            <div className={styles.frame}>
              {current ? (
                <>
                  <div className={styles.crestWash} aria-hidden>
                    {current.homeTeam.logoUrl ? <img src={current.homeTeam.logoUrl} alt="" /> : <span />}
                    {current.awayTeam.logoUrl ? <img src={current.awayTeam.logoUrl} alt="" /> : <span />}
                  </div>
                  <MatchDuel match={current} locale={locale} />
                  <div className={styles.caption}>
                    <span>
                      <b>{localizeRoundName(locale, current.round) || name}</b>
                      {current.venue?.name ? ` · ${current.venue.name}` : ''}
                    </span>
                    <span><MatchWhen match={current} locale={locale} /></span>
                  </div>
                  <span className={styles.meter} key={current.id} />
                  {reel.length > 1 ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.step} ${styles.prev}`}
                        onClick={() => stepReel(-1)}
                        aria-label={pick(locale, 'السابق', 'Previous')}
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.step} ${styles.next}`}
                        onClick={() => stepReel(1)}
                        aria-label={pick(locale, 'التالي', 'Next')}
                      >
                        <ChevronLeft size={18} />
                      </button>
                    </>
                  ) : null}
                </>
              ) : league.logoUrl ? (
                <div className={styles.duel}>
                  <div className={styles.side} />
                  <div className={styles.side}>
                    <img src={league.logoUrl} alt="" />
                    <strong>{name}</strong>
                  </div>
                  <div className={styles.side} />
                </div>
              ) : null}
              <HallBrackets />
            </div>
          </div>

          <div className={styles.program}>
            <div className={styles.chips}>
              <span className={styles.chipOn}>
                <Trophy size={13} aria-hidden />
                <b>{name}</b>
              </span>
              {region ? <span className={styles.chip}>{region}</span> : null}
              {locale === 'ar' && league.name && league.name !== name ? (
                <span className={styles.chip}>{league.name}</span>
              ) : null}
              {seasonLabel ? <span className={styles.chip}>{pick(locale, 'الموسم', 'Season')} {seasonLabel}</span> : null}
              {current?.round ? <span className={styles.chip}>{localizeRoundName(locale, current.round)}</span> : null}
              {status ? <span className={styles.chip}>{status}</span> : null}
            </div>
            {seasons.length > 1 ? (
              <div className={styles.chips} style={{ marginTop: 8 }}>
                {seasons.slice(0, 8).map((season) => (
                  <Link
                    key={season}
                    href={`/league/${league.slug}?season=${season}`}
                    className={season === seasonId ? styles.chipOn : styles.chip}
                  >
                    {formatLeagueSeason(season) || season}
                  </Link>
                ))}
              </div>
            ) : null}
            <h2 className={styles.programTitle}>
              {current
                ? `${localizeTeamName(locale, current.homeTeam.name)} — ${localizeTeamName(locale, current.awayTeam.name)}`
                : name}
            </h2>
            <div className={styles.acts}>
              {current ? (
                <Link href={`/match/${current.id}`} className={styles.go}>
                  <span>{pick(locale, 'افتح المباراة', 'Open match')}</span>
                  <ArrowUpRight size={14} />
                </Link>
              ) : null}
              <Link href={`/league/${league.slug}/fixtures`} className={styles.ghost}>
                {pick(locale, 'كل المباريات', 'All matches')}
              </Link>
              <Link href={`/league/${league.slug}/standings`} className={styles.ghost}>
                {pick(locale, 'الترتيب الكامل', 'Full table')}
              </Link>
              <LeagueFollowChip
                leagueId={league.id}
                isLoggedIn={isLoggedIn}
                initialIsFollowing={initialIsFollowing}
                variant="soft"
                callbackUrl={`/league/${league.slug}`}
              />
            </div>
          </div>
        </section>

        {reel.length > 0 ? (
          <aside className={styles.queue} aria-label={pick(locale, 'مباريات البطولة', 'Competition matches')}>
            <header className={styles.queueHead}>
              <div>
                <p>{liveMatches.length > 0 ? pick(locale, 'المباريات المباشرة الآن', 'Live now') : pick(locale, 'المباريات القادمة', 'Upcoming matches')}</p>
                <h3>{pick(locale, 'مباريات البطولة', 'Competition matches')}</h3>
              </div>
              <span className={styles.shelfBadge}>{reel.length} {pick(locale, 'مباراة', 'matches')}</span>
            </header>
            <ol className={styles.queueList}>
              {reel.map((match, index) => {
                const on = match.id === current?.id;
                return (
                  <li key={match.id}>
                    <button
                      type="button"
                      className={`${styles.queueItem}${on ? ` ${styles.on}` : ''}`}
                      onClick={() => setActiveId(match.id)}
                      aria-pressed={on}
                    >
                      <span className={styles.queueNum}>{index + 1}</span>
                      <span className={styles.queueThumb}>
                        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
                      </span>
                      <span className={styles.queueCopy}>
                        <b>
                          {localizeTeamName(locale, match.homeTeam.name)} — {localizeTeamName(locale, match.awayTeam.name)}
                        </b>
                        <small><MatchWhen match={match} locale={locale} /></small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </div>

      {/* ---------------- KPIS BAR ---------------- */}
      {kpis.length > 0 ? (
        <ul className={styles.kpis}>
          {kpis.map((row) => (
            <li key={row.label}>
              <strong>{row.value}</strong>
              <span>{row.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {standings.length === 0 ? (
        <section id="hall-standings" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div>
                <h3>{pick(locale, 'جدول ترتيب البطولة', 'Competition table')}</h3>
                <p>{pick(locale, 'البيانات غير متاحة من المصدر لهذا الموسم — ليست بالضرورة أن البطولة بلا ترتيب.', 'Standings are not available from the source for this season — the competition may still have a table.')}</p>
              </div>
            </div>
          </header>
        </section>
      ) : null}

      {/* ---------------- STANDINGS WALL ---------------- */}
      {standings.length > 0 ? (
        <section id="hall-standings" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Trophy size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدول ترتيب البطولة', 'Competition table')}</h3>
                <p>
                  {pick(
                    locale,
                    `معاينة أول ${tablePreview.length} فريقاً من أصل ${standings.length} — المراكز والنقاط من مصدر الترتيب.`,
                    `Preview of the first ${tablePreview.length} of ${standings.length} clubs — ranks and points from the standings source.`
                  )}
                </p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{standings.length} {pick(locale, 'فريق', 'Clubs')}</span>
          </header>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ width: '3rem' }}>#</th>
                  <th>{pick(locale, 'الفريق', 'Club')}</th>
                  <th>{pick(locale, 'لعب', 'P')}</th>
                  <th>{pick(locale, 'فاز', 'W')}</th>
                  <th>{pick(locale, 'تعادل', 'D')}</th>
                  <th>{pick(locale, 'خسر', 'L')}</th>
                  <th>{pick(locale, 'له', 'GF')}</th>
                  <th>{pick(locale, 'عليه', 'GA')}</th>
                  <th>{pick(locale, 'الفارق', 'GD')}</th>
                  <th>{pick(locale, 'النقاط', 'Pts')}</th>
                  <th>{pick(locale, 'آخر 5', 'Form')}</th>
                </tr>
              </thead>
              <tbody>
                {tablePreview.map((row) => {
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`${styles.rankBadge} ${zoneRankClass(row.zone)}`}>
                          {row.rank}
                        </span>
                      </td>
                      <td>
                        <Link href={`/team/${row.team.slug}`} className={styles.queueLink} style={{ gridTemplateColumns: '1.8rem minmax(0, 1fr)' }}>
                          <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-6 w-6" />
                          <b>{localizeTeamName(locale, row.team.name)}</b>
                        </Link>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{row.goalsFor - row.goalsAgainst}</td>
                      <td>
                        <span className={styles.pointsBadge}>{row.points}</span>
                      </td>
                      <td>
                        {row.form.length > 0 ? (
                          <span className={styles.formDots}>
                            {row.form.map((letter, i) => (
                              <span
                                key={i}
                                className={`${styles.formDot} ${letter === 'W' ? styles.formW : letter === 'D' ? styles.formD : styles.formL
                                  }`}
                                title={letter === 'W' ? 'فوز' : letter === 'D' ? 'تعادل' : 'خسارة'}
                              >
                                {letter}
                              </span>
                            ))}
                          </span>
                        ) : (
                          '–'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Link href={`/league/${league.slug}/standings`} className={styles.go}>
              <span>{pick(locale, 'عرض جدول الترتيب بالكامل', 'View Full Standings Table')}</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </section>
      ) : null}

      {/* ---------------- FIXTURES WALL ---------------- */}
      {upcoming.length > 0 || recent.length > 0 || roundAgenda ? (
        <section id="hall-fixtures" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Calendar size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'المباريات والنتائج', 'Matches and results')}</h3>
                <p>{pick(locale, 'المباريات القادمة والنتائج بتوقيتك المحلي من المصدر.', 'Upcoming fixtures and results in your local time, from the source.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{upcoming.length + recent.length} {pick(locale, 'مباراة', 'matches')}</span>
          </header>

          <div className={styles.slips}>
            {(roundAgenda?.matches.length ? roundAgenda.matches : [...upcoming.slice(0, 6), ...recent.slice(0, 4)]).map((match) => (
              <Slip key={match.id} match={match} locale={locale} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Link href={`/league/${league.slug}/fixtures`} className={styles.ghost}>
              {pick(locale, 'جميع مباريات البطولة', 'View All Fixtures')}
            </Link>
          </div>
        </section>
      ) : null}

      {/* ---------------- TOP SCORERS & PERFORMERS ---------------- */}
      {topScorers.length > 0 || topAssists.length > 0 || topCards.length > 0 ? (
        <section id="hall-scorers" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Sparkles size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'هدافو البطولة وإحصائيات اللاعبين', 'Top scorers and player stats')}</h3>
                <p className="text-sm text-muted-foreground">
                  {pick(
                    locale,
                    'فريق الجولة لا يظهر لأن المصدر لا يوفّر تشكيلة الجولة. لا نؤلّف أحد عشر لاعبًا.',
                    'Team of the round is omitted because the source does not file a round XI. We do not invent one.',
                  )}
                </p>
                <p>{pick(locale, 'الأرقام من أحداث المباريات أو لوحة الهدافين في المصدر لنفس الموسم.', 'Figures from match events or the source scorer board for this season.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{topScorers.length} {pick(locale, 'هداف', 'scorers')}</span>
          </header>

          {topScorers.length > 0 ? (
            <div className={styles.performersGrid}>
              {scorerPreview.map((row) => {
                const shot = apiSportsPlayerPhoto(row.player.slug.match(/(\d+)$/)?.[1], row.player.photoUrl);
                return (
                  <Link key={row.player.id} href={`/player/${row.player.slug}`} className={styles.performerCard}>
                    <div className={styles.performerPhoto}>
                      {shot ? <img src={shot} alt="" /> : <span>{row.player.name.charAt(0)}</span>}
                      {row.team.logoUrl ? (
                        <img src={row.team.logoUrl} alt="" className={styles.performerTeamCrest} />
                      ) : null}
                    </div>
                    <div className={styles.performerCopy}>
                      <strong>{localizePlainName(locale, row.player.name)}</strong>
                      <em>{localizeTeamName(locale, row.team.name)}</em>
                    </div>
                    <div className={styles.performerStat}>
                      <b>{row.goals}</b>
                      <small>{pick(locale, 'هدف', 'Goals')}</small>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <Link href={`/league/${league.slug}/top-scorers`} className={styles.ghost}>
              {pick(locale, 'لوحة الهدافين الكاملة', 'Full Scorers Leaderboard')}
            </Link>
            <Link href={`/stats/${encodeURIComponent(league.externalId)}`} className={styles.ghost}>
              {pick(locale, 'مركز إحصائيات البطولة', 'Competition stats centre')}
            </Link>
          </div>
        </section>
      ) : null}

      {/* ---------------- CLUBS WALL ---------------- */}
      {clubs.length > 0 ? (
        <section id="hall-clubs" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Shield size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'فرق البطولة', 'Competition teams')}</h3>
                <p>
                  {clubs.length > clubPreview.length
                    ? pick(
                      locale,
                      `عرض أول ${clubPreview.length} نادياً من أصل ${clubs.length}.`,
                      `Showing the first ${clubPreview.length} of ${clubs.length} clubs.`
                    )
                    : pick(locale, 'الأندية المسجّلة في جدول هذا الموسم.', 'Clubs recorded in this season’s table.')}
                </p>
              </div>
            </div>
            <span className={styles.shelfBadge}>
              {clubPreview.length}
              {clubs.length > clubPreview.length ? ` / ${clubs.length}` : ''}
            </span>
          </header>

          <div className={styles.grid}>
            {clubPreview.map((club) => (
              <Link key={club.id} href={`/team/${club.slug}`} className={styles.tile}>
                <span className={`${styles.tileShot} ${styles.isCrest}`}>
                  <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-12 w-12" />
                </span>
                <strong>{localizeTeamName(locale, club.name)}</strong>
              </Link>
            ))}
          </div>
          {clubs.length > clubPreview.length ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Link href={`/league/${league.slug}/standings`} className={styles.ghost}>
                {pick(locale, 'عرض جميع الأندية', 'View all clubs')}
              </Link>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* ---------------- NEWS WALL ---------------- */}
      {news.length > 0 ? (
        <section id="hall-news" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Newspaper size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'أخبار البطولة', 'Competition news')}</h3>
                <p>{pick(locale, 'آخر الأخبار المرتبطة بهذه البطولة من المصدر التحريري.', 'Latest editorial stories linked to this competition.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{news.length}</span>
          </header>
          <ul className={styles.people}>
            {news.map((item) => (
              <li key={item.id}>
                <Link href={`/news/${item.slug}`}>
                  <span className={styles.ghostFace}>N</span>
                  <span>
                    <strong>{item.title}</strong>
                    <em>{item.category}</em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.shelf}>
        <header className={styles.shelfHead}>
          <div className={styles.shelfTitle}>
            <div>
              <h3>{pick(locale, 'معلومات البطولة', 'Competition facts')}</h3>
              <p>{pick(locale, 'أسئلة من البيانات المتوفرة فقط — لا اختراع لأرقام أو أبطال.', 'Answers from available fields only — no invented figures or champions.')}</p>
            </div>
          </div>
        </header>
        <ul className={styles.people}>
          {standings[0] ? (
            <li>
              <span>
                <strong>{pick(locale, 'من يتصدر الآن؟', 'Who is leading?')}</strong>
                <em>{localizeTeamName(locale, standings[0].team.name)} · {standings[0].points} {pick(locale, 'نقطة', 'pts')}</em>
              </span>
            </li>
          ) : null}
          {seasonLabel ? (
            <li>
              <span>
                <strong>{pick(locale, 'ما الموسم المعروض؟', 'Which season is shown?')}</strong>
                <em>{seasonLabel}</em>
              </span>
            </li>
          ) : null}
          {currentArchive?.start || currentArchive?.end ? (
            <li>
              <span>
                <strong>{pick(locale, 'متى يبدأ الموسم ومتى ينتهي؟', 'When does the season start and end?')}</strong>
                <em>
                  {[currentArchive.start, currentArchive.end].filter(Boolean).join(' — ')}
                </em>
              </span>
            </li>
          ) : null}
          {standings.length > 0 ? (
            <li>
              <span>
                <strong>{pick(locale, 'كم فريقًا يظهر في الجدول؟', 'How many teams are in the table?')}</strong>
                <em>{standings.length}</em>
              </span>
            </li>
          ) : (
            <li>
              <span>
                <strong>{pick(locale, 'هل جدول الترتيب متاح؟', 'Are standings available?')}</strong>
                <em>{pick(locale, 'البيانات غير متاحة من المصدر لهذا الموسم.', 'Standings are not available from the source for this season.')}</em>
              </span>
            </li>
          )}
        </ul>
      </section>

      <p className={styles.source}>
        {pick(
          locale,
          provider === 'api-football'
            ? 'المصدر: API-Football (البطولة، الموسم، الترتيب، والمباريات). لا تُعرض أرقام غير موجودة في المصدر.'
            : 'المصدر: السجلات المحفوظة في قاعدة البيانات فقط. لا تُعرض أرقام غير موجودة في المصدر.',
          provider === 'api-football'
            ? 'Source: API-Football (competition, season, standings and fixtures). Missing figures are not invented.'
            : 'Source: stored database rows only. Missing figures are not invented.',
        )}
        {lastSyncedAt ? (
          <>
            {' · '}
            {pick(locale, 'آخر تحديث:', 'Last update:')}{' '}
            <ClientTime
              value={lastSyncedAt}
              locale={locale}
              options={{ day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }}
            />
          </>
        ) : (
          <> · {pick(locale, 'بيانات تُحدَّث تلقائياً عند توفر المصدر.', 'Data refreshes automatically from the source.')}</>
        )}
      </p>
    </div>
  );
}
