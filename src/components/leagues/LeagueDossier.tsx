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
  Users,
} from 'lucide-react';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { LeagueFollowChip } from '@/components/leagues/LeagueFollowChip';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import type { LeagueDossierData, LeagueMatchCard } from '@/lib/leagues/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

function statusWord(match: LeagueMatchCard, locale: string) {
  if (match.status === 'LIVE' || match.status === 'HALFTIME') {
    return match.minute ? `${match.minute}'` : pick(locale, 'مباشر', 'Live');
  }
  if (match.status === 'FINISHED') return pick(locale, 'نهاية', 'FT');
  return pick(locale, 'موعد', 'Kick-off');
}

function MatchDuel({ match, locale }: { match: LeagueMatchCard; locale: string }) {
  const live = match.status === 'LIVE' || match.status === 'HALFTIME';
  const scored = match.homeScore != null && match.awayScore != null;

  return (
    <div className={styles.duel}>
      <div className={styles.side}>
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-20 w-20" />
        <strong>{localizePlainName(locale, match.homeTeam.name)}</strong>
      </div>
      <div className={styles.score}>
        <em className={live ? styles.liveBadge : undefined}>
          {live ? <span className={styles.liveDot} aria-hidden /> : null}
          {statusWord(match, locale)}
        </em>
        <b>{scored ? `${match.homeScore} – ${match.awayScore}` : 'VS'}</b>
      </div>
      <div className={styles.side}>
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-20 w-20" />
        <strong>{localizePlainName(locale, match.awayTeam.name)}</strong>
      </div>
    </div>
  );
}

function Slip({ match, locale }: { match: LeagueMatchCard; locale: string }) {
  const scored = match.homeScore != null && match.awayScore != null;
  const live = match.status === 'LIVE' || match.status === 'HALFTIME';

  return (
    <Link href={`/match/${match.id}`} className={styles.slip}>
      <div className={styles.slipTop}>
        <span className={styles.slipRound}>{match.round || pick(locale, 'مباراة', 'Match')}</span>
        {match.status === 'NOT_STARTED' ? (
          <ClientTime
            value={match.kickoffAt}
            locale={locale}
            options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
          />
        ) : (
          <em style={{ fontStyle: 'normal', color: live ? '#ef4444' : 'var(--ys-orange)' }}>
            {statusWord(match, locale)}
          </em>
        )}
      </div>
      <div className={styles.row}>
        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-5 w-5" />
        <span>{localizePlainName(locale, match.homeTeam.name)}</span>
        <strong>{scored ? match.homeScore : '–'}</strong>
      </div>
      <div className={styles.row}>
        <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-5 w-5" />
        <span>{localizePlainName(locale, match.awayTeam.name)}</span>
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
  const name = localizePlainName(locale, league.name);

  const stepReel = (delta: number) => {
    if (reel.length === 0) return;
    const next = (currentIndex + delta + reel.length) % reel.length;
    setActiveId(reel[next].id);
  };

  const kpis = [
    league.matchCount > 0 ? { label: pick(locale, 'مباراة', 'Fixtures'), value: league.matchCount } : null,
    standings.length > 0 ? { label: pick(locale, 'فريق', 'Clubs'), value: standings.length } : null,
    liveMatches.length > 0 ? { label: pick(locale, 'مباشر', 'Live'), value: liveMatches.length } : null,
    upcoming.length > 0 ? { label: pick(locale, 'قادمة', 'Upcoming'), value: upcoming.length } : null,
    topScorers[0] ? { label: pick(locale, 'أعلى هداف', 'Top scorer'), value: topScorers[0].goals } : null,
    tvGuide.length > 0 ? { label: pick(locale, 'منقولة', 'On air'), value: tvGuide.length } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return (
    <div className={`${styles.hall} ${styles.sashHall}`}>
      {/* ---------------- FOYER SUB-NAVIGATION ---------------- */}
      <nav className={styles.foyer} aria-label={pick(locale, 'أقسام البطولة', 'Competition sections')}>
        <div className={styles.foyerTabs}>
          <a href="#hall-screen" className={`${styles.foyerTab} ${styles.isOn}`}>
            <Flame size={14} aria-hidden />
            <span>{pick(locale, 'الشاشة والبرنامج', 'Screen & Programme')}</span>
          </a>
          {standings.length > 0 ? (
            <a href="#hall-standings" className={styles.foyerTab}>
              <Trophy size={14} aria-hidden />
              <span>{pick(locale, 'جدول الترتيب', 'Table')}</span>
              <span className={styles.foyerBadge}>{standings.length}</span>
            </a>
          ) : null}
          {upcoming.length > 0 || recent.length > 0 ? (
            <a href="#hall-fixtures" className={styles.foyerTab}>
              <Calendar size={14} aria-hidden />
              <span>{pick(locale, 'المواعيد والنتائج', 'Fixtures')}</span>
              <span className={styles.foyerBadge}>{upcoming.length + recent.length}</span>
            </a>
          ) : null}
          {topScorers.length > 0 ? (
            <a href="#hall-scorers" className={styles.foyerTab}>
              <Sparkles size={14} aria-hidden />
              <span>{pick(locale, 'الهدافون والأرقام', 'Numbers & Scorers')}</span>
              <span className={styles.foyerBadge}>{topScorers.length}</span>
            </a>
          ) : null}
          {clubs.length > 0 ? (
            <a href="#hall-clubs" className={styles.foyerTab}>
              <Shield size={14} aria-hidden />
              <span>{pick(locale, 'أندية البطولة', 'Clubs')}</span>
              <span className={styles.foyerBadge}>{clubs.length}</span>
            </a>
          ) : null}
          {news.length > 0 ? (
            <a href="#hall-news" className={styles.foyerTab}>
              <Newspaper size={14} aria-hidden />
              <span>{pick(locale, 'التقارير', 'Reports')}</span>
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
              label={pick(locale, 'صالة البطولة', 'Competition salon')}
              clock={reel.length ? `${folio(currentIndex)} / ${folio(reel.length)}` : '00 / 00'}
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
                      <b>{current.round || name}</b>
                      {current.venue?.name ? ` · ${current.venue.name}` : ''}
                    </span>
                    <span>{statusWord(current, locale)}</span>
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
              {league.country ? <span className={styles.chip}>{localizePlainName(locale, league.country)}</span> : null}
              {seasonId ? <span className={styles.chip}>{seasonId}</span> : null}
              {current?.round ? <span className={styles.chip}>{current.round}</span> : null}
            </div>
            <h2 className={styles.programTitle}>
              {current
                ? `${localizePlainName(locale, current.homeTeam.name)} — ${localizePlainName(locale, current.awayTeam.name)}`
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
                {pick(locale, 'الجدول الكامل', 'Full Fixtures')}
              </Link>
              <Link href={`/league/${league.slug}/standings`} className={styles.ghost}>
                {pick(locale, 'الترتيب الكامل', 'Full Table')}
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
          <aside className={styles.queue} aria-label={pick(locale, 'قائمة العرض', 'Programme')}>
            <header className={styles.queueHead}>
              <div>
                <p>{pick(locale, 'الآن على الصالة', 'On the easel')}</p>
                <h3>{pick(locale, 'قائمة العرض', 'Programme')}</h3>
              </div>
              <span className={styles.shelfBadge}>{folio(reel.length)}</span>
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
                      <span className={styles.queueNum}>{folio(index)}</span>
                      <span className={styles.queueThumb}>
                        <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-7 w-7" />
                      </span>
                      <span className={styles.queueCopy}>
                        <b>
                          {localizePlainName(locale, match.homeTeam.name)} — {localizePlainName(locale, match.awayTeam.name)}
                        </b>
                        <small>{statusWord(match, locale)}</small>
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

      {/* ---------------- STANDINGS WALL ---------------- */}
      {standings.length > 0 ? (
        <section id="hall-standings" className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Trophy size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'جدار الترتيب الرسمي', 'Official Standings Wall')}</h3>
                <p>{pick(locale, 'ترتيب الأندية من المصدر الحي مباشرة، مع مؤشرات التأهل المباشر والملحق.', 'Live standings directly from the source with qualification indicators.')}</p>
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
                  <th title={pick(locale, 'المباريات الملعوبة', 'Played')}>P</th>
                  <th title={pick(locale, 'فوز', 'Won')}>W</th>
                  <th title={pick(locale, 'تعادل', 'Drawn')}>D</th>
                  <th title={pick(locale, 'خسارة', 'Lost')}>L</th>
                  <th title={pick(locale, 'فارق الأهداف', 'Goal Difference')}>+/−</th>
                  <th title={pick(locale, 'النقاط', 'Points')}>PTS</th>
                  <th>{pick(locale, 'آخر 5', 'Form')}</th>
                </tr>
              </thead>
              <tbody>
                {standings.slice(0, 16).map((row) => {
                  const direct = row.rank <= 8;
                  const playoff = row.rank > 8 && row.rank <= 24;
                  return (
                    <tr key={row.id}>
                      <td>
                        <span className={`${styles.rankBadge} ${direct ? styles.rankDirect : playoff ? styles.rankPlayoff : ''}`}>
                          {row.rank}
                        </span>
                      </td>
                      <td>
                        <Link href={`/team/${row.team.slug}`} className={styles.queueLink} style={{ gridTemplateColumns: '1.8rem minmax(0, 1fr)' }}>
                          <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-6 w-6" />
                          <b>{localizePlainName(locale, row.team.name)}</b>
                        </Link>
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.drawn}</td>
                      <td>{row.lost}</td>
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
                <h3>{pick(locale, 'جدار المواعيد والنتائج', 'Fixtures & Schedule Wall')}</h3>
                <p>{pick(locale, 'المواجهات القادمة والأخيرة بتوقيتك المحلي من المصدر.', 'Upcoming and recent clashes in your local time.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{upcoming.length + recent.length}</span>
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
                <h3>{pick(locale, 'جدار نجوم البطولة والأرقام', 'Stars & Numbers Wall')}</h3>
                <p>{pick(locale, 'أبرز الهدافين وصناع اللعب والإنذارات المسجّلة رسمياً.', 'Leading goalscorers, playmakers and discipline records.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{topScorers.length} {pick(locale, 'هداف', 'Scorers')}</span>
          </header>

          {topScorers.length > 0 ? (
            <div className={styles.performersGrid}>
              {topScorers.slice(0, 8).map((row) => {
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
                      <em>{localizePlainName(locale, row.team.name)}</em>
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
                <h3>{pick(locale, 'جدار أندية البطولة', 'Participating Clubs Wall')}</h3>
                <p>{pick(locale, 'الأندية المشاركة في هذا الموسم المسجّلة في الدفتر الرياضي.', 'Registered clubs competing in this edition.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{clubs.length}</span>
          </header>

          <div className={styles.grid}>
            {clubs.slice(0, 24).map((club) => (
              <Link key={club.id} href={`/team/${club.slug}`} className={styles.tile}>
                <span className={`${styles.tileShot} ${styles.isCrest}`}>
                  <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-12 w-12" />
                </span>
                <strong>{localizePlainName(locale, club.name)}</strong>
              </Link>
            ))}
          </div>
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
                <h3>{pick(locale, 'جدار التقارير والأخبار', 'Coverage Desk Wall')}</h3>
                <p>{pick(locale, 'آخر التقارير والمتابعات المنشورة عن البطولة.', 'Latest coverage and reporting on this competition.')}</p>
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

      <p className={styles.source}>
        {pick(
          locale,
          'المصدر: واجهة البيانات الرياضية والصفوف المنشورة فقط. إن غاب رقم فهو غير متوفر بعد.',
          'Source: sports API and published rows only. Missing numbers are not available yet.',
        )}
      </p>
    </div>
  );
}
