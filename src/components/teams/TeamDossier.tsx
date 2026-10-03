'use client';

import React, { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { FollowButton } from '@/components/common/FollowButton';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { HallBezel, HallBrackets } from '@/components/salon/HallBezel';
import { pick } from '@/i18n/pick';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { slugifyCoachName } from '@/lib/coaches/slug';
import { apiSportsCoachPhoto, apiSportsPlayerPhoto } from '@/lib/sports-data/media';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Flame,
  Layers,
  MapPin,
  Newspaper,
  Repeat,
  Shield,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import type {
  FormLetter,
  SquadGroupKey,
  TeamDossierData,
} from '@/lib/teams/load-dossier';
import styles from '@/components/salon/entity-hall.module.css';
import board from '@/components/teams/team-salon.module.css';

type SquadFilter = SquadGroupKey | 'ALL';

const SQUAD_ORDER: SquadGroupKey[] = ['GK', 'DF', 'MF', 'FW', 'OTHER'];

function folio(index: number) {
  return String(index + 1).padStart(2, '0');
}

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

function formPillClass(letter: string) {
  const key = letter.toUpperCase();
  if (key === 'W') return styles.formPillW;
  if (key === 'L') return styles.formPillL;
  return styles.formPillD;
}

function goalDiffLabel(diff: number) {
  if (diff > 0) return `+${diff}`;
  return String(diff);
}

function slugTailId(slug?: string | null) {
  return slug?.match(/(\d+)$/)?.[1] ?? null;
}

function playerShot(photoUrl?: string | null, slug?: string | null) {
  return apiSportsPlayerPhoto(slugTailId(slug), photoUrl);
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

export function TeamDossier({
  locale,
  dossier,
  loggedIn,
  isFollowing,
}: {
  locale: string;
  now: string | Date;
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
    formTrail,
    standing,
    stats,
    homeStats,
    awayStats,
    competitions,
    scorers,
    assisters,
    transfers,
    news,
    tableWindow,
  } = dossier;

  const name = localizePlainName(locale, team.name);
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

  const [dept, setDept] = useState<SquadFilter>('ALL');

  // Focus match for cinema stage
  const matchesQueue = useMemo(() => {
    const rows = [...liveMatches, ...(nextMatch ? [nextMatch] : []), ...upcoming.slice(0, 5)];
    const seen = new Set<string>();
    return rows.filter((match) => {
      if (!match?.id || seen.has(match.id)) return false;
      seen.add(match.id);
      return true;
    });
  }, [liveMatches, nextMatch, upcoming]);

  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const activeMatch = matchesQueue[activeMatchIndex] || matchesQueue[0];

  const squadChapters = SQUAD_ORDER.map((key) => ({ key, players: squad[key] })).filter(
    (chapter) => chapter.players.length > 0,
  );

  const displayedSquad = useMemo(() => {
    if (dept === 'ALL') return squadChapters.flatMap((c) => c.players);
    return squad[dept] || [];
  }, [dept, squad, squadChapters]);
  const liveOnStage = Boolean(activeMatch && (activeMatch.status === 'LIVE' || activeMatch.status === 'HALFTIME'));

  const identity = [
    country ? { label: pick(locale, 'الدولة / الاتحاد', 'Country / Federation'), value: country } : null,
    team.founded ? { label: pick(locale, 'سنة التأسيس', 'Founded'), value: String(team.founded) } : null,
    team.code ? { label: pick(locale, 'الرمز المختصر', 'Team Code'), value: team.code } : null,
    venue?.name ? { label: pick(locale, 'الملعب الرسمي', 'Home Ground'), value: venue.name } : null,
    venue?.city ? { label: pick(locale, 'المدينة', 'City'), value: venue.city } : null,
    team.coach?.name
      ? { label: pick(locale, 'المدير الفني', 'Head Coach'), value: localizePlainName(locale, team.coach.name) }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  const kpis = [
    stats.played > 0 ? { label: pick(locale, 'مباريات الموسم', 'Played'), value: stats.played } : null,
    stats.won > 0 ? { label: pick(locale, 'الانتصارات', 'Wins'), value: stats.won } : null,
    stats.goalsFor > 0 ? { label: pick(locale, 'الأهداف المسجلة', 'Goals Scored'), value: stats.goalsFor } : null,
    stats.played > 0 ? { label: pick(locale, 'فارق الأهداف', 'Goal Difference'), value: goalDiffLabel(stats.goalDiff) } : null,
    stats.winPct != null ? { label: pick(locale, 'نسبة الفوز', 'Win Percentage'), value: `${stats.winPct}%` } : null,
    standing && standing.points > 0 ? { label: pick(locale, 'رصيد النقاط', 'League Points'), value: standing.points } : null,
    standing && standing.rank > 0 ? { label: pick(locale, 'الترتيب الرسمي', 'League Rank'), value: `#${standing.rank}` } : null,
    squadCount > 0 ? { label: pick(locale, 'قائمة اللاعبين', 'Squad Count'), value: squadCount } : null,
    squadAges ? { label: pick(locale, 'متوسط الأعمار', 'Average Age'), value: `${squadAges.avg} سنة` } : null,
    nationalities.length > 0 ? { label: pick(locale, 'جنسيات مختلفة', 'Nationalities'), value: nationalities.length } : null,
  ].filter(Boolean) as Array<{ label: string; value: string | number }>;

  return (
    <div className={`${styles.hall} ${styles.vaultHall}`}>
      {/* ---------------- FOYER SUB-NAVIGATION ---------------- */}
      <nav className={styles.foyer} aria-label={pick(locale, 'أقسام ملف النادي', 'Club sections')}>
        <div className={styles.foyerTabs}>
          <a href="#hall-screen" className={`${styles.foyerTab} ${styles.isOn}`}>
            <Flame size={14} aria-hidden />
            <span>{pick(locale, 'مسرح النادي والمواجهات', 'Cinema Duel Stage')}</span>
          </a>
          <a href="#hall-stats" className={styles.foyerTab}>
            <Activity size={14} aria-hidden />
            <span>{pick(locale, 'أرقام وإحصاءات الموسم', 'Key Figures')}</span>
          </a>
          {standing ? (
            <a href="#hall-standing" className={styles.foyerTab}>
              <Trophy size={14} aria-hidden />
              <span>{pick(locale, 'الترتيب في الدوري', 'League Standing')}</span>
            </a>
          ) : null}
          <a href="#hall-squad" className={styles.foyerTab}>
            <Users size={14} aria-hidden />
            <span>{pick(locale, 'قائمة الفريق', 'Squad')}</span>
            <span className={styles.foyerBadge}>{squadCount}</span>
          </a>
          {formTrail.length > 0 || recentResults.length > 0 ? (
            <a href="#hall-record" className={styles.foyerTab}>
              <Calendar size={14} aria-hidden />
              <span>{pick(locale, 'سجل النتائج', 'Match Record')}</span>
            </a>
          ) : null}
          {scorers.length > 0 || assisters.length > 0 ? (
            <a href="#hall-performers" className={styles.foyerTab}>
              <Zap size={14} aria-hidden />
              <span>{pick(locale, 'الهدافون والنجوم', 'Top Performers')}</span>
            </a>
          ) : null}
          {team.coach ? (
            <a href="#hall-coach" className={styles.foyerTab}>
              <UserCheck size={14} aria-hidden />
              <span>{pick(locale, 'المدير الفني', 'Head Coach')}</span>
            </a>
          ) : null}
          {venue ? (
            <a href="#hall-ground" className={styles.foyerTab}>
              <MapPin size={14} aria-hidden />
              <span>{pick(locale, 'ملعب النادي', 'Home Ground')}</span>
            </a>
          ) : null}
        </div>
      </nav>

      <section id="hall-screen" className={`${styles.wideScreen} ${board.clubSalon}`} aria-label={name}>
        <div className={styles.chassis}>
          <HallBezel
            label={activeMatch ? localizePlainName(locale, activeMatch.league.name) : pick(locale, 'النادي', 'Club')}
            clock={
              activeMatch
                ? activeMatch.status === 'NOT_STARTED'
                  ? pick(locale, 'مباراة قادمة', 'Upcoming')
                  : liveClock(activeMatch, locale)
                : pick(locale, 'ملف رسمي', 'Official')
            }
          />
          <div className={`${styles.frame} ${board.clubFrame}`}>
            {activeMatch ? (
              <>
                <div className={styles.crestWash} aria-hidden>
                  {activeMatch.homeTeam.logoUrl ? <img src={activeMatch.homeTeam.logoUrl} alt="" /> : <span />}
                  {activeMatch.awayTeam.logoUrl ? <img src={activeMatch.awayTeam.logoUrl} alt="" /> : <span />}
                </div>
                <div className={styles.duel}>
                  {activeMatch.homeTeam.slug ? (
                    <Link href={`/team/${activeMatch.homeTeam.slug}`} className={styles.side}>
                      <LeagueCrest name={activeMatch.homeTeam.name} logoUrl={activeMatch.homeTeam.logoUrl} className="h-16 w-16" />
                      <strong>{localizePlainName(locale, activeMatch.homeTeam.name)}</strong>
                    </Link>
                  ) : (
                    <div className={styles.side}>
                      <LeagueCrest name={activeMatch.homeTeam.name} logoUrl={activeMatch.homeTeam.logoUrl} className="h-16 w-16" />
                      <strong>{localizePlainName(locale, activeMatch.homeTeam.name)}</strong>
                    </div>
                  )}

                  <div className={styles.score}>
                    {activeMatch.status === 'NOT_STARTED' ? (
                      <span className={board.kickoffBlock}>
                        <ClientTime
                          value={activeMatch.kickoffAt}
                          locale={locale}
                          options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
                        />
                      </span>
                    ) : (
                      <b>
                        {activeMatch.homeScore ?? '–'} : {activeMatch.awayScore ?? '–'}
                      </b>
                    )}
                    <em className={liveOnStage ? styles.liveBadge : undefined}>
                      {liveOnStage ? <span className={styles.liveDot} /> : null}
                      {liveOnStage
                        ? pick(locale, 'مباشر', 'Live')
                        : localizePlainName(locale, activeMatch.league.name)}
                    </em>
                  </div>

                  {activeMatch.awayTeam.slug ? (
                    <Link href={`/team/${activeMatch.awayTeam.slug}`} className={styles.side}>
                      <LeagueCrest name={activeMatch.awayTeam.name} logoUrl={activeMatch.awayTeam.logoUrl} className="h-16 w-16" />
                      <strong>{localizePlainName(locale, activeMatch.awayTeam.name)}</strong>
                    </Link>
                  ) : (
                    <div className={styles.side}>
                      <LeagueCrest name={activeMatch.awayTeam.name} logoUrl={activeMatch.awayTeam.logoUrl} className="h-16 w-16" />
                      <strong>{localizePlainName(locale, activeMatch.awayTeam.name)}</strong>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.vipCard}>
                <div className={styles.vipInfo}>
                  <span className={styles.vipTeamBadge}>
                    <Shield size={16} />
                    <span>{country || pick(locale, 'نادي رياضي رسمي', 'Official Club')}</span>
                  </span>
                  <h1 className={styles.vipTitle}>{name}</h1>
                  <div className={styles.vipMetaPills}>
                    {standing ? (
                      <span className={styles.vipPill}>
                        <b>
                          {pick(locale, 'الترتيب', 'Rank')} #{standing.rank}
                        </b>
                      </span>
                    ) : null}
                    {standing ? (
                      <span className={styles.vipPill}>
                        <span>
                          {standing.points} {pick(locale, 'نقطة', 'pts')}
                        </span>
                      </span>
                    ) : null}
                    {stats.played > 0 ? (
                      <span className={styles.vipPill}>
                        <span>
                          {stats.won} {pick(locale, 'فوز', 'wins')}
                        </span>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className={styles.vipAvatarBox}>
                  <div className={styles.vipAvatarFrame}>
                    {team.logoUrl ? (
                      <img src={team.logoUrl} alt={name} className={board.crestPhoto} />
                    ) : (
                      <div className={styles.vipAvatarPlaceholder}>{name.charAt(0)}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className={styles.caption}>
              <span>
                <b>{name}</b>
                {standing ? ` · #${standing.rank} ${localizePlainName(locale, standing.league.name)}` : ''}
              </span>
              {matchesQueue.length > 1 ? (
                <div className={styles.stepGroup}>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setActiveMatchIndex((prev) => (prev > 0 ? prev - 1 : matchesQueue.length - 1))}
                    aria-label={pick(locale, 'المواجهة السابقة', 'Previous fixture')}
                  >
                    ←
                  </button>
                  <span>
                    {folio(activeMatchIndex)} / {folio(matchesQueue.length - 1)}
                  </span>
                  <button
                    type="button"
                    className={styles.stepBtn}
                    onClick={() => setActiveMatchIndex((prev) => (prev < matchesQueue.length - 1 ? prev + 1 : 0))}
                    aria-label={pick(locale, 'المواجهة التالية', 'Next fixture')}
                  >
                    →
                  </button>
                </div>
              ) : null}
            </div>
            <HallBrackets />
          </div>
        </div>

        <div className={styles.program}>
          <div className={styles.chips}>
            <span className={styles.chipOn}>
              <b>{name}</b>
            </span>
            {country ? <span className={styles.chip}>{country}</span> : null}
            {standing ? (
              <span className={styles.chip}>
                #{standing.rank} {localizePlainName(locale, standing.league.name)}
              </span>
            ) : null}
            {team.coach?.name ? <span className={styles.chip}>{localizePlainName(locale, team.coach.name)}</span> : null}
          </div>
          <h2 className={styles.programTitle}>{name}</h2>
          <div className={styles.acts}>
            <FollowButton
              entityId={team.id}
              entityType="TEAM"
              isLoggedIn={loggedIn}
              initialIsFollowing={isFollowing}
              variant="ghost"
            />
            <Link href={`/compare?team1=${team.slug}`} className={styles.ghost}>
              {pick(locale, 'مقارنة هذا النادي', 'Compare Club')}
            </Link>
            {activeMatch ? (
              <Link href={`/match/${activeMatch.id}`} className={styles.go}>
                <span>{pick(locale, 'فتح مركز المباراة', 'Match Center')}</span>
                <ArrowUpRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>

        {matchesQueue.length > 0 ? (
          <aside className={board.pitchStrip} aria-label={pick(locale, 'برنامج مباريات النادي', 'Club fixtures')}>
            <header className={board.pitchStripHead}>
              <div>
                <p>{pick(locale, 'شريط المواجهات', 'Fixture strip')}</p>
                <h3>{pick(locale, 'المواعيد على المسرح', 'On the programme')}</h3>
              </div>
              <span>{folio(matchesQueue.length)}</span>
            </header>
            <ol className={board.pitchStripList}>
              {matchesQueue.map((m, index) => {
                const active = index === activeMatchIndex;
                const opp = m.homeTeam?.name === team.name ? m.awayTeam : m.homeTeam;
                if (!opp) return null;
                return (
                  <li key={`${m.id || 'queue'}-${opp.name}-${index}`}>
                    <button
                      type="button"
                      className={`${board.pitchCard}${active ? ` ${board.pitchCardOn}` : ''}`}
                      onClick={() => setActiveMatchIndex(index)}
                      aria-pressed={Boolean(active)}
                    >
                      <span className={board.pitchNum}>{folio(index)}</span>
                      <span className={board.pitchThumb}>
                        <LeagueCrest name={opp.name} logoUrl={opp.logoUrl} className="h-8 w-8" />
                      </span>
                      <span className={board.pitchCopy}>
                        <b>{localizePlainName(locale, opp.name)}</b>
                        <i>
                          {m.status === 'NOT_STARTED' ? (
                            <ClientTime value={m.kickoffAt} locale={locale} options={{ day: 'numeric', month: 'short' }} />
                          ) : (
                            liveClock(m, locale)
                          )}
                          {' · '}
                          {localizePlainName(locale, m.league.name)}
                        </i>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </aside>
        ) : null}
      </section>

      <div className={board.suite}>
        <div id="hall-stats" className={board.stack}>
          {identity.length > 0 ? (
            <div className={styles.facts}>
              {identity.map((row) => (
                <article key={row.label} className={styles.fact}>
                  <em>{row.label}</em>
                  <strong>{row.value}</strong>
                </article>
              ))}
            </div>
          ) : null}

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
        </div>

        {/* ---------------- LEAGUE TABLE WINDOW ---------------- */}
        {standing ? (
          <section id="hall-standing" className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Trophy size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'موقف النادي في جدول الدوري', 'League Standing & Context')}</h3>
                  <p>
                    {localizePlainName(locale, standing.league.name)} · {pick(locale, `المركز #${standing.rank} برصيد ${standing.points} نقطة`, `Rank #${standing.rank} with ${standing.points} pts`)}
                  </p>
                </div>
              </div>
              <Link href={`/league/${standing.league.slug}/standings`} className={styles.shelfBadge}>
                {pick(locale, 'الجدول الكامل', 'Full Table')} →
              </Link>
            </header>

            {tableWindow.length > 0 ? (
              <div className={styles.tableCard}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>{pick(locale, 'الفريق', 'Club')}</th>
                      <th>{pick(locale, 'لعب', 'P')}</th>
                      <th>{pick(locale, 'فوز', 'W')}</th>
                      <th>{pick(locale, 'تعادل', 'D')}</th>
                      <th>{pick(locale, 'خسارة', 'L')}</th>
                      <th>{pick(locale, 'فارق', 'GD')}</th>
                      <th>{pick(locale, 'نقاط', 'Pts')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableWindow.map((row, index) => {
                      const isUs = row.isUs || row.team.name === team.name;
                      return (
                        <tr key={row.team.id || row.team.slug || `standing-row-${index}`} className={isUs ? styles.rowDirect : undefined}>
                          <td>
                            <b>{row.rank}</b>
                          </td>
                          <td>
                            <Link href={`/team/${row.team.slug}`} className={styles.teamCol}>
                              <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-6 w-6" />
                              <span>{localizePlainName(locale, row.team.name)}</span>
                            </Link>
                          </td>
                          <td>{row.played}</td>
                          <td>{row.won}</td>
                          <td>{row.drawn}</td>
                          <td>{row.lost}</td>
                          <td>{(row.goalsFor ?? 0) - (row.goalsAgainst ?? 0)}</td>
                          <td>
                            <span className={styles.pts}>{row.points}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}

            {/* Home vs Away Splits */}
            {homeStats.played > 0 || awayStats.played > 0 ? (
              <div className={`${styles.facts} ${board.splitFacts}`}>
                <article className={styles.fact}>
                  <em>{pick(locale, 'السجل على أرضه', 'Home Record')}</em>
                  <strong>{homeStats.won} فوز · {homeStats.drawn} تعادل · {homeStats.lost} خسارة</strong>
                  <span className={board.mutedLine}>
                    {homeStats.goalsFor}:{homeStats.goalsAgainst} ({pick(locale, 'أهداف', 'goals')})
                  </span>
                </article>
                <article className={styles.fact}>
                  <em>{pick(locale, 'السجل خارج الديار', 'Away Record')}</em>
                  <strong>{awayStats.won} فوز · {awayStats.drawn} تعادل · {awayStats.lost} خسارة</strong>
                  <span className={board.mutedLine}>
                    {awayStats.goalsFor}:{awayStats.goalsAgainst} ({pick(locale, 'أهداف', 'goals')})
                  </span>
                </article>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      {/* ---------------- SQUAD SHOWCASE ---------------- */}
      <section id="hall-squad" className={styles.shelf}>
        <header className={styles.shelfHead}>
          <div className={styles.shelfTitle}>
            <div className={styles.shelfIconBox}>
              <Users size={18} aria-hidden />
            </div>
            <div>
              <h3>{pick(locale, 'قائمة الفريق والتشكيلة الرسمية', 'Official Squad & Roster')}</h3>
              <p>
                {squadAges
                  ? pick(locale, `${squadCount} لاعباً مسجلاً من المصدر · متوسط الأعمار ${squadAges.avg} سنة`, `${squadCount} registered players · avg age ${squadAges.avg}`)
                  : pick(locale, `${squadCount} لاعباً مسجلاً`, `${squadCount} players`)}
              </p>
            </div>
          </div>
          <span className={styles.shelfBadge}>{displayedSquad.length}</span>
        </header>

        {/* Squad Position Filter Tabs */}
        <div className={styles.deptTabs}>
          <button
            type="button"
            className={`${styles.deptTab}${dept === 'ALL' ? ` ${styles.isOn}` : ''}`}
            onClick={() => setDept('ALL')}
          >
            <span>{pick(locale, 'الكل', 'All')}</span>
            <span className={styles.deptBadge}>{squadCount}</span>
          </button>
          {squadChapters.map((ch) => (
            <button
              key={ch.key}
              type="button"
              className={`${styles.deptTab}${dept === ch.key ? ` ${styles.isOn}` : ''}`}
              onClick={() => setDept(ch.key)}
            >
              <span>{squadLabel(ch.key, locale)}</span>
              <span className={styles.deptBadge}>{ch.players.length}</span>
            </button>
          ))}
        </div>

        {/* Squad Grid */}
        <div className={styles.grid}>
          {displayedSquad.map((row) => {
            const shot = playerShot(row.player.photoUrl, row.player.slug);
            return (
              <Link key={row.id} href={`/player/${row.player.slug}`} className={styles.tile}>
                <span className={styles.tileShot}>
                  {shot ? <img src={shot} alt="" /> : <span>{row.player.name.charAt(0)}</span>}
                  {row.shirtNumber != null ? <b className={board.shirt}>#{row.shirtNumber}</b> : null}
                </span>
                <strong>{localizePlainName(locale, row.player.name)}</strong>
                <em>
                  {[
                    row.player.position ? localizePlainName(locale, row.player.position) : null,
                    row.player.nationality ? localizePlainName(locale, row.player.nationality) : null,
                    row.player.age != null ? `${row.player.age} ${pick(locale, 'سنة', 'y')}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </em>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------- FORM TRAIL & MATCH RECORD ---------------- */}
      <div className={board.suite}>
        {formTrail.length > 0 || recentResults.length > 0 ? (
          <section id="hall-record" className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Calendar size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'سجل النتائج وشكل الفريق', 'Form Guide & Recent Results')}</h3>
                  <p>{pick(locale, 'نتائج آخر المباريات الرسمية للنادي من المصدر.', 'Last official match results from verified data.')}</p>
                </div>
              </div>
              <span className={styles.shelfBadge}>{formTrail.length || recentResults.length}</span>
            </header>

            {/* Form Guide Pill Trail */}
            {formTrail.length > 0 ? (
              <ul className={styles.formTrail}>
                {formTrail.map((entry) => (
                  <li key={entry.matchId}>
                    <Link href={`/match/${entry.matchId}`} className={styles.formTrailItem}>
                      <span className={`${styles.formPill} ${formPillClass(entry.letter)}`}>
                        {formWord(entry.letter, locale)}
                      </span>
                      <LeagueCrest name={entry.opponent.name} logoUrl={entry.opponent.logoUrl} className="h-5 w-5" />
                      <span>
                        <strong className={board.formName}>{localizePlainName(locale, entry.opponent.name)}</strong>
                        <small className={board.formMeta}>
                          {entry.isHome ? pick(locale, 'على أرضه', 'H') : pick(locale, 'خارج ملعبه', 'A')} · {entry.homeScore}:{entry.awayScore}
                        </small>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            {/* Slips */}
            {recentResults.length > 0 ? (
              <div className={`${styles.slips} ${board.recordSlips}`}>
                {recentResults.slice(0, 6).map((match) => {
                  const scored = match.homeScore != null && match.awayScore != null;
                  return (
                    <Link key={match.id} href={`/match/${match.id}`} className={styles.slip}>
                      <div className={styles.slipTop}>
                        <span className={styles.slipRound}>{localizePlainName(locale, match.league.name)}</span>
                        <em style={{ fontStyle: 'normal', color: 'var(--ys-orange)' }}>{pick(locale, 'نهاية', 'FT')}</em>
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
                })}
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ---------------- TOP PERFORMERS: SCORERS & ASSISTS ---------------- */}
        {scorers.length > 0 || assisters.length > 0 ? (
          <section id="hall-performers" className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Zap size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'نجوم النادي: الهدافون وصناع الأهداف', 'Top Club Performers')}</h3>
                  <p>{pick(locale, 'أبرز المساهمين في أهداف النادي هذا الموسم.', 'Club leading scorers and playmakers.')}</p>
                </div>
              </div>
            </header>

            <div className={styles.performersGrid}>
              {scorers.slice(0, 6).map((performer) => {
                const shot = playerShot(performer.photoUrl, performer.slug);
                return (
                  <Link key={performer.slug || performer.name} href={`/player/${performer.slug}`} className={styles.performerCard}>
                    <div className={styles.performerPhoto}>
                      {shot ? <img src={shot} alt="" /> : <span>{performer.name.charAt(0)}</span>}
                    </div>
                    <div className={styles.performerCopy}>
                      <strong>{localizePlainName(locale, performer.name)}</strong>
                      <em>{pick(locale, 'هداف الفريق', 'Club Scorer')}</em>
                    </div>
                    <div className={styles.performerStat}>
                      <b>{performer.goals || 0}</b>
                      <small>{pick(locale, 'أهداف', 'goals')}</small>
                    </div>
                  </Link>
                );
              })}
              {assisters.slice(0, 4).map((performer) => {
                const shot = playerShot(performer.photoUrl, performer.slug);
                return (
                  <Link key={performer.slug || performer.name} href={`/player/${performer.slug}`} className={styles.performerCard}>
                    <div className={styles.performerPhoto}>
                      {shot ? <img src={shot} alt="" /> : <span>{performer.name.charAt(0)}</span>}
                    </div>
                    <div className={styles.performerCopy}>
                      <strong>{localizePlainName(locale, performer.name)}</strong>
                      <em>{pick(locale, 'صانع ألعاب', 'Playmaker')}</em>
                    </div>
                    <div className={styles.performerStat}>
                      <b>{performer.assists || 0}</b>
                      <small>{pick(locale, 'صناعة', 'assists')}</small>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>

      <div className={board.suite}>
        {team.coach ? (
          <section id="hall-coach" className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <UserCheck size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'الجهاز الفني والمدرب', 'Technical Staff & Head Coach')}</h3>
                  <p>{pick(locale, 'المسؤول الفني الأول عن قيادة الفريق.', 'First-team manager leading the club.')}</p>
                </div>
              </div>
            </header>

            <div className={styles.facts}>
              <div className={`${styles.fact} ${board.coachCard}`}>
                <div className={board.coachShot}>
                  {apiSportsCoachPhoto(slugTailId(team.coach.slug), team.coach.photoUrl) ? (
                    <img src={apiSportsCoachPhoto(slugTailId(team.coach.slug), team.coach.photoUrl)!} alt="" />
                  ) : (
                    <span>{team.coach.name.charAt(0)}</span>
                  )}
                </div>
                <div>
                  <Link
                    href={`/coach/${team.coach.slug || slugifyCoachName(team.coach.name, team.coach.id)}`}
                    className={board.coachName}
                  >
                    <strong>{localizePlainName(locale, team.coach.name)}</strong>
                  </Link>
                  {team.coach.nationality ? (
                    <em>{localizePlainName(locale, team.coach.nationality)}</em>
                  ) : null}
                </div>
              </div>
              {team.coach.career.length > 0 ? (
                <div className={styles.fact}>
                  <em>{pick(locale, 'سجل المحطات التدريبية', 'Career Stints')}</em>
                  <strong>
                    {team.coach.career.length} {pick(locale, 'محطات موثقة', 'stints')}
                  </strong>
                  <span className={board.mutedLine}>
                    {team.coach.career.slice(0, 3).map((s) => s.club).join(' · ')}
                  </span>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ---------------- HOME GROUND / VENUE ---------------- */}
        {venue ? (
          <section id="hall-ground" className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <MapPin size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'أرض النادي وملعبه الرسمي', 'Club Official Home Ground')}</h3>
                  <p>{pick(locale, 'الملعب المعتمد لمباريات الفريق على أرضه.', 'Official verified venue from sports data.')}</p>
                </div>
              </div>
            </header>

            <div className={styles.venueDossier}>
              {venue.imageUrl ? (
                <div className={styles.venueImgBox}>
                  <img src={venue.imageUrl} alt={venue.name} referrerPolicy="no-referrer" />
                </div>
              ) : null}
              <div className={styles.venueBody}>
                <div>
                  <h3 className={board.venueTitle}>{venue.name}</h3>
                  {venue.address ? <p className={board.venueLead}>{venue.address}</p> : null}
                </div>

                <div className={styles.venueMetaGrid}>
                  {venue.city ? (
                    <div className={styles.venueMetaItem}>
                      <span>{pick(locale, 'المدينة', 'City')}</span>
                      <strong>{venue.city}</strong>
                    </div>
                  ) : null}
                  {typeof venue.capacity === 'number' && venue.capacity > 0 ? (
                    <div className={styles.venueMetaItem}>
                      <span>{pick(locale, 'السعة الجماهيرية', 'Capacity')}</span>
                      <strong>{venue.capacity.toLocaleString(locale === 'ar' ? 'ar' : 'en')} {pick(locale, 'مشجع', 'fans')}</strong>
                    </div>
                  ) : null}
                  {venue.surface ? (
                    <div className={styles.venueMetaItem}>
                      <span>{pick(locale, 'أرضية الملعب', 'Surface')}</span>
                      <strong>{venue.surface}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <div className={styles.split}>
        {competitions.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Layers size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'المسابقات المشارك بها', 'Competitions')}</h3>
                  <p>{pick(locale, 'البطولات الرسمية للموسم.', 'Season tournaments.')}</p>
                </div>
              </div>
            </header>
            <ul className={styles.people}>
              {competitions.map((comp) => (
                <li key={comp.id}>
                  <Link href={`/league/${comp.slug}`}>
                    <LeagueCrest name={comp.name} logoUrl={comp.logoUrl} className="h-7 w-7" />
                    <div>
                      <strong>{localizePlainName(locale, comp.name)}</strong>
                      <em>{comp.matches} {pick(locale, 'مباراة', 'matches')}{comp.country ? ` · ${localizePlainName(locale, comp.country)}` : ''}</em>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {transfers.length > 0 ? (
          <section className={styles.shelf}>
            <header className={styles.shelfHead}>
              <div className={styles.shelfTitle}>
                <div className={styles.shelfIconBox}>
                  <Repeat size={18} aria-hidden />
                </div>
                <div>
                  <h3>{pick(locale, 'سوق الانتقالات', 'Transfers Market')}</h3>
                  <p>{pick(locale, 'حركات الانتقال المسجلة.', 'Latest player moves.')}</p>
                </div>
              </div>
              <span className={styles.shelfBadge}>{transfers.length}</span>
            </header>
            <ul className={styles.people}>
              {transfers.slice(0, 8).map((row) => (
                <li key={row.id}>
                  <Link href={`/player/${row.player.slug}`}>
                    {playerShot(row.player.photoUrl, row.player.slug) ? (
                      <img src={playerShot(row.player.photoUrl, row.player.slug)!} alt="" className={styles.ghostFace} />
                    ) : (
                      <span className={styles.ghostFace}>{row.player.name.charAt(0)}</span>
                    )}
                    <div>
                      <strong>{localizePlainName(locale, row.player.name)}</strong>
                      <em>
                        {[row.fromTeam, row.toTeam].filter(Boolean).map((t) => localizePlainName(locale, t as string)).join(' → ')}
                      </em>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      {/* ---------------- LINKED NEWS ---------------- */}
      {news && news.length > 0 ? (
        <section className={styles.shelf}>
          <header className={styles.shelfHead}>
            <div className={styles.shelfTitle}>
              <div className={styles.shelfIconBox}>
                <Newspaper size={18} aria-hidden />
              </div>
              <div>
                <h3>{pick(locale, 'أخبار وتقارير النادي', 'Club News & Editorial')}</h3>
                <p>{pick(locale, 'التغطيات الصحفية والتحليلات المباشرة.', 'Editorial match reports and club updates.')}</p>
              </div>
            </div>
            <span className={styles.shelfBadge}>{news.length}</span>
          </header>
          <ul className={styles.people}>
            {news.map((item) => (
              <li key={item.id}>
                <Link href={`/news/${item.slug}`}>
                  <span className={styles.ghostFace}>📰</span>
                  <div>
                    <strong>{item.title}</strong>
                    <em>{item.category} · <ClientTime value={item.publishedAt} locale={locale} options={{ day: 'numeric', month: 'short' }} /></em>
                  </div>
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className={styles.source}>
        {pick(
          locale,
          'المصدر: بيانات النادي الرسمية والمباريات الموثقة عبر واجهة البيانات دون أي أرقام وهمية.',
          'Source: verified club sports data and fixtures without invented numbers.',
        )}
      </p>
    </div>
  );
}
