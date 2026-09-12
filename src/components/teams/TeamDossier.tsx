import React from 'react';
import { Link } from '@/i18n/navigation';
import { Calendar, MapPin, Shield, Trophy, Users } from 'lucide-react';
import { FollowButton } from '@/components/common/FollowButton';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { DeskRule, EditionPlate, EndMark, PhotoCorners, StorySpine } from '@/components/news/NewsOrnaments';
import { pick } from '@/i18n/pick';
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

function formClass(letter: FormLetter) {
  if (letter === 'W') return 'club-form-pip is-w';
  if (letter === 'D') return 'club-form-pip is-d';
  return 'club-form-pip is-l';
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

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&apos;/gi, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function SplitBoard({
  title,
  stats,
  locale,
}: {
  title: string;
  stats: SplitStats;
  locale: string;
}) {
  if (stats.played <= 0) return null;
  return (
    <div className="club-split-card">
      <span className="club-split-title">{title}</span>
      <div className="club-split-metrics">
        <div>
          <strong>{stats.played}</strong>
          <span>{pick(locale, 'لعب', 'P')}</span>
        </div>
        <div>
          <strong>{stats.won}</strong>
          <span>{pick(locale, 'فوز', 'W')}</span>
        </div>
        <div>
          <strong>{stats.drawn}</strong>
          <span>{pick(locale, 'تعادل', 'D')}</span>
        </div>
        <div>
          <strong>{stats.lost}</strong>
          <span>{pick(locale, 'خسارة', 'L')}</span>
        </div>
        <div>
          <strong>
            {stats.goalsFor}:{stats.goalsAgainst}
          </strong>
          <span>{pick(locale, 'أهداف', 'GF:GA')}</span>
        </div>
      </div>
    </div>
  );
}

function MatchFaceOff({
  match,
  teamId,
  locale,
  mode,
  featured,
}: {
  match: DossierMatch;
  teamId: string;
  locale: string;
  mode: 'live' | 'upcoming' | 'result';
  featured?: boolean;
}) {
  const isHome = match.homeTeamId === teamId;
  const className = [
    featured ? 'club-feature-fixture' : mode === 'live' ? 'atlas-live-ticket club-live-ticket' : 'club-fixture-slip',
  ].join(' ');

  return (
    <Link href={`/match/${match.id}`} className={className}>
      {featured ? <PhotoCorners className="pointer-events-none absolute inset-3 opacity-35" /> : null}
      <div className="club-fixture-meta">
        <span className="inline-flex items-center gap-2">
          <LeagueCrest name={match.league.name} logoUrl={match.league.logoUrl} className="h-4 w-4" />
          {match.league.name}
        </span>
        {mode === 'live' ? (
          <span className="club-live-clock">{liveClock(match, locale)}</span>
        ) : mode === 'upcoming' ? (
          <ClientTime
            value={match.kickoffAt}
            locale={locale}
            options={{ weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }}
          />
        ) : (
          <span>{pick(locale, 'نهاية', 'FT')}</span>
        )}
      </div>
      <div className="club-fixture-body">
        <span className={`club-fixture-side ${isHome ? 'is-focus' : ''}`}>
          <span className="atlas-result-crest club-fixture-crest">
            <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-8 w-8" />
          </span>
          <strong>{match.homeTeam.name}</strong>
        </span>
        <span className="club-fixture-score" aria-label={`${match.homeScore ?? '-'}-${match.awayScore ?? '-'}`}>
          {mode === 'upcoming' ? (
            <em>{pick(locale, 'ضد', 'vs')}</em>
          ) : (
            <>
              <b>{match.homeScore ?? '–'}</b>
              <span>–</span>
              <b>{match.awayScore ?? '–'}</b>
            </>
          )}
        </span>
        <span className={`club-fixture-side ${!isHome ? 'is-focus' : ''}`}>
          <span className="atlas-result-crest club-fixture-crest">
            <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-8 w-8" />
          </span>
          <strong>{match.awayTeam.name}</strong>
        </span>
      </div>
      <div className="club-fixture-foot">
        {match.round ? <span>{match.round}</span> : <span />}
        {match.venue?.name ? (
          <span>
            {match.venue.name}
            {match.venue.city ? ` · ${match.venue.city}` : ''}
          </span>
        ) : null}
      </div>
    </Link>
  );
}

function FormTrail({ trail, locale }: { trail: FormEntry[]; locale: string }) {
  if (trail.length === 0) return null;
  return (
    <div className="club-form-trail" aria-label={pick(locale, 'الشكل الأخير', 'Recent form')}>
      {trail.map((entry) => (
        <Link key={entry.matchId} href={`/match/${entry.matchId}`} className="club-form-ticket">
          <span className={formClass(entry.letter)}>{formWord(entry.letter, locale)}</span>
          <span className="club-form-ticket-body">
            <strong>
              {entry.isHome ? pick(locale, 'منزل', 'H') : pick(locale, 'خارج', 'A')} · {entry.opponent.name}
            </strong>
            <em>
              {entry.homeScore}–{entry.awayScore}
            </em>
          </span>
          <span className="atlas-result-crest">
            <LeagueCrest name={entry.opponent.name} logoUrl={entry.opponent.logoUrl} className="h-6 w-6" />
          </span>
        </Link>
      ))}
    </div>
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
    <ol className="club-scorer-list">
      {rows.map((row, index) => {
        const value =
          metric === 'goals'
            ? row.goals || 0
            : metric === 'assists'
              ? row.assists || 0
              : `${row.yellow || 0}/${row.red || 0}`;
        const label =
          metric === 'goals'
            ? pick(locale, 'هدف', 'goals')
            : metric === 'assists'
              ? pick(locale, 'تمريرة', 'assists')
              : pick(locale, 'ص/ح', 'Y/R');
        const inner = (
          <>
            <span className="club-scorer-rank">{String(index + 1).padStart(2, '0')}</span>
            {row.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.photoUrl} alt="" className="club-scorer-photo" />
            ) : (
              <span className="club-scorer-photo is-empty" aria-hidden>
                {row.name.charAt(0)}
              </span>
            )}
            <span className="club-scorer-name">{row.name}</span>
            <span className="club-scorer-goals">
              <strong>{value}</strong>
              <em>{label}</em>
            </span>
          </>
        );
        return row.slug ? (
          <li key={`${row.slug}-${metric}-${index}`}>
            <Link href={`/player/${row.slug}`} className="club-scorer-row">
              {inner}
            </Link>
          </li>
        ) : (
          <li key={`${row.name}-${metric}-${index}`}>
            <div className="club-scorer-row">{inner}</div>
          </li>
        );
      })}
    </ol>
  );
}

export function TeamDossier({
  locale,
  now,
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

  const editionYear = team.founded || now.getFullYear();
  const editionLabel = team.founded
    ? pick(locale, 'تأسس', 'Founded')
    : pick(locale, 'الملف', 'Dossier');

  const census = [
    stats.played > 0 ? { value: String(stats.played), label: pick(locale, 'مباراة', 'Played'), tone: 'ink' as const } : null,
    stats.won > 0 ? { value: String(stats.won), label: pick(locale, 'انتصار', 'Wins'), tone: 'green' as const } : null,
    stats.goalsFor > 0 ? { value: String(stats.goalsFor), label: pick(locale, 'هدف', 'Goals'), tone: 'orange' as const } : null,
    stats.played > 0
      ? { value: goalDiffLabel(stats.goalDiff), label: pick(locale, 'فارق', 'GD'), tone: 'ink' as const }
      : null,
    stats.winPct != null
      ? { value: `${stats.winPct}%`, label: pick(locale, 'نسبة الفوز', 'Win %'), tone: 'gold' as const }
      : null,
    standing && standing.points > 0
      ? { value: String(standing.points), label: pick(locale, 'نقطة', 'Points'), tone: 'orange' as const }
      : null,
    standing && standing.rank > 0
      ? { value: `#${standing.rank}`, label: pick(locale, 'الترتيب', 'Rank'), tone: 'ink' as const }
      : null,
    squadCount > 0 ? { value: String(squadCount), label: pick(locale, 'لاعب', 'Squad'), tone: 'ink' as const } : null,
    squadAges ? { value: String(squadAges.avg), label: pick(locale, 'متوسط العمر', 'Avg age'), tone: 'gold' as const } : null,
    nationalities.length > 0
      ? { value: String(nationalities.length), label: pick(locale, 'جنسية', 'Nations'), tone: 'ink' as const }
      : null,
    discipline.yellow > 0
      ? { value: String(discipline.yellow), label: pick(locale, 'بطاقة صفراء', 'Yellow'), tone: 'gold' as const }
      : null,
    discipline.red > 0
      ? { value: String(discipline.red), label: pick(locale, 'بطاقة حمراء', 'Red'), tone: 'orange' as const }
      : null,
  ].filter(Boolean) as Array<{ value: string; label: string; tone: 'ink' | 'orange' | 'green' | 'gold' }>;

  const squadChapters = SQUAD_ORDER.map((key) => ({ key, players: squad[key] })).filter(
    (chapter) => chapter.players.length > 0
  );

  const programmeUpcoming = upcoming.filter((m) => m.id !== nextMatch?.id).slice(0, 6);
  const hasProgramme = upcoming.length > 0 || recentResults.length > 0 || Boolean(nextMatch);
  const hasLedger = homeStats.played > 0 || awayStats.played > 0;
  const hasAttackBoard = scorers.length > 0 || assisters.length > 0;
  const hasDiscipline = discipline.yellow > 0 || discipline.red > 0 || discipline.players.length > 0;
  const leadStory = news[0] || null;
  const sideStories = news.slice(1);
  const maxComposition = Math.max(...squadComposition.map((row) => row.count), 1);
  const venue = team.venue
    ? {
        ...team.venue,
        name: decodeHtmlEntities(team.venue.name),
        city: team.venue.city ? decodeHtmlEntities(team.venue.city) : null,
        address: team.venue.address ? decodeHtmlEntities(team.venue.address) : null,
        surface: team.venue.surface ? decodeHtmlEntities(team.venue.surface) : null,
      }
    : null;
  const venueFacts = venue
    ? (
        [
          venue.city
            ? { label: pick(locale, 'المدينة', 'City'), value: venue.city }
            : null,
          typeof venue.capacity === 'number' && venue.capacity > 0
            ? {
                label: pick(locale, 'السعة', 'Capacity'),
                value: venue.capacity.toLocaleString(locale === 'ar' ? 'ar' : 'en'),
              }
            : null,
          venue.surface
            ? { label: pick(locale, 'الأرضية', 'Surface'), value: venue.surface }
            : null,
          venue.address
            ? { label: pick(locale, 'العنوان', 'Address'), value: venue.address }
            : null,
        ] as Array<{ label: string; value: string } | null>
      ).filter(Boolean) as Array<{ label: string; value: string }>
    : [];

  return (
    <div className="club-dossier ys-dossier-stack">
      <span className="atlas-flood atlas-flood-a" aria-hidden />
      <span className="atlas-flood atlas-flood-b" aria-hidden />

      <section className="club-hero">
        <span className="club-arch" aria-hidden />
        <span className="club-pitch-lines" aria-hidden />
        <PhotoCorners className="pointer-events-none absolute inset-4 opacity-40 sm:inset-6" />
        {team.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logoUrl} alt="" className="club-hero-watermark" aria-hidden />
        ) : null}

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-10 sm:px-8 lg:px-12">
          <div className="club-wire-bar mb-8">
            <span>{pick(locale, 'مكتب النتائج · ملف نادي', 'Results desk · Club dossier')}</span>
            <span>YS · {String(now.getFullYear())}</span>
          </div>

          <header className="club-mast">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <EditionPlate year={editionYear} label={editionLabel} />
              <div className="club-mast-actions">
                <FollowButton
                  entityId={team.id}
                  entityType="TEAM"
                  isLoggedIn={loggedIn}
                  initialIsFollowing={isFollowing}
                  variant="ghost"
                />
                <Link href={`/compare?team1=${team.slug}`} className="club-compare-link">
                  {pick(locale, 'قارن', 'Compare')}
                </Link>
              </div>
            </div>

            <div className="club-mast-grid mt-8">
              <div className="club-crest-stage">
                <span className="club-crest-ring" aria-hidden />
                <span className="club-crest-ring is-delayed" aria-hidden />
                <div className="club-crest-well">
                  <LeagueCrest name={team.name} logoUrl={team.logoUrl} className="h-28 w-28 sm:h-40 sm:w-40" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="atlas-section-kicker text-orange-400">
                    {pick(locale, 'ملف النادي', 'Club dossier')}
                  </span>
                  {team.code ? <span className="club-country-chip">{team.code}</span> : null}
                  {team.country ? <span className="club-country-chip">{team.country}</span> : null}
                </div>
                <h1 className="club-wordmark mt-2">{team.name}</h1>

                <div className="club-meta-row mt-5">
                  {venue?.name ? (
                    <span>
                      <MapPin className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                      {venue.name}
                      {venue.city ? ` · ${venue.city}` : ''}
                    </span>
                  ) : null}
                  {team.founded ? (
                    <span>
                      <Calendar className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                      {pick(locale, 'تأسس', 'Est.')} {team.founded}
                    </span>
                  ) : null}
                  {team.coach?.name ? (
                    <span>
                      <Shield className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                      {pick(locale, 'المدرب', 'Coach')} · {team.coach.name}
                    </span>
                  ) : null}
                  {squadCount > 0 ? (
                    <span>
                      <Users className="h-3.5 w-3.5 text-orange-400" aria-hidden />
                      {squadCount} {pick(locale, 'لاعب', 'players')}
                    </span>
                  ) : null}
                </div>

                {form.length > 0 ? (
                  <div className="club-form-strip mt-6" aria-label={pick(locale, 'الشكل الأخير', 'Recent form')}>
                    <span className="club-form-label">{pick(locale, 'الشكل', 'Form')}</span>
                    {form.map((letter, index) => (
                      <span key={`${letter}-${index}`} className={formClass(letter)}>
                        {formWord(letter, locale)}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <DeskRule className="mb-8 mt-10 opacity-70" />

          {census.length > 0 ? (
            <div className="club-census">
              {census.map((stat) => (
                <div key={stat.label} className={`club-census-cell tone-${stat.tone}`}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="club-seal-row mt-8" aria-hidden>
            <span className="club-seal">YS</span>
            <span className="club-seal-line" />
            <span className="club-seal-copy">{pick(locale, 'من المصدر فقط', 'Source verified')}</span>
            <span className="club-seal-line" />
            <span className="club-seal">{team.code || 'CLUB'}</span>
          </div>
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl space-y-10 px-5 py-10 sm:px-8 lg:px-12 club-body-stack">
        {(liveMatches.length > 0 ||
          nextMatch ||
          standing ||
          hasProgramme ||
          hasAttackBoard ||
          squadChapters.length > 0) && (
          <nav className="club-folio-nav club-order-nav" aria-label={pick(locale, 'أقسام الملف', 'Dossier sections')}>
            {liveMatches.length > 0 || (nextMatch && nextMatch.status === 'NOT_STARTED') ? (
              <a href="#club-action" className="club-folio-nav-link">
                <em>01</em>
                {pick(locale, 'الملعب', 'Pitch')}
              </a>
            ) : null}
            {standing || hasLedger ? (
              <a href="#club-table" className="club-folio-nav-link">
                <em>02</em>
                {pick(locale, 'الترتيب', 'Table')}
              </a>
            ) : null}
            {hasProgramme ? (
              <a href="#club-programme" className="club-folio-nav-link">
                <em>03</em>
                {pick(locale, 'البرنامج', 'Programme')}
              </a>
            ) : null}
            {hasAttackBoard || hasDiscipline ? (
              <a href="#club-attack" className="club-folio-nav-link">
                <em>04</em>
                {pick(locale, 'الهجوم', 'Attack')}
              </a>
            ) : null}
            {squadComposition.length > 0 || nationalities.length > 0 ? (
              <a href="#club-intel" className="club-folio-nav-link">
                <em>05</em>
                {pick(locale, 'التكوين', 'Mix')}
              </a>
            ) : null}
            {venue ? (
              <a href="#club-ground" className="club-folio-nav-link">
                <em>07</em>
                {pick(locale, 'الأرض', 'Ground')}
              </a>
            ) : null}
            {squadChapters.length > 0 ? (
              <a href="#club-squad" className="club-folio-nav-link">
                <em>06</em>
                {pick(locale, 'القائمة', 'Squad')}
              </a>
            ) : null}
          </nav>
        )}

        {squadComposition.length > 0 || nationalities.length > 0 ? (
          <section id="club-intel" className="grid gap-6 lg:grid-cols-2 club-rise club-order-intel scroll-mt-28">
            {squadComposition.length > 0 ? (
              <div className="club-intel-plate club-mix-plate">
                <span className="atlas-section-kicker">{pick(locale, 'تركيب القائمة', 'Squad mix')}</span>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'توزيع المراكز', 'Positional balance')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="club-mix-layout">
                  <div className="club-mix-pitch" aria-hidden>
                    <span className="club-mix-pitch-line" />
                    <span className="club-mix-pitch-circle" />
                    {squadComposition.map((row) => {
                      const pct = Math.round((row.count / squadCount) * 100);
                      return (
                        <div
                          key={row.key}
                          className={`club-mix-zone is-${row.key.toLowerCase()}`}
                          style={{ ['--mix-pct' as string]: `${Math.max(18, pct)}%` }}
                        >
                          <strong>{row.count}</strong>
                          <em>{squadLabel(row.key, locale)}</em>
                          <span>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="club-mix-legend">
                    {squadComposition.map((row, index) => {
                      const pct = Math.round((row.count / squadCount) * 100);
                      return (
                        <div key={row.key} className="club-mix-legend-row">
                          <span className="club-mix-folio">{String(index + 1).padStart(2, '0')}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <strong>{squadLabel(row.key, locale)}</strong>
                              <em>
                                {row.count} · {pct}%
                              </em>
                            </div>
                            <div className="club-mix-track">
                              <i
                                className={`is-${row.key.toLowerCase()}`}
                                style={{ width: `${Math.max(8, (row.count / maxComposition) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <p className="club-mix-note">
                      {pick(
                        locale,
                        `${squadCount} لاعباً مسجّلاً من المصدر — بلا تقديرات.`,
                        `${squadCount} registered players from source — no estimates.`
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {nationalities.length > 0 ? (
              <div className="club-intel-plate club-locker-plate">
                <div className="club-locker-head">
                  <div>
                    <span className="atlas-section-kicker">{pick(locale, 'الجنسيات', 'Nationalities')}</span>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                      {pick(locale, 'خريطة غرفة الملابس', 'Dressing-room map')}
                    </h2>
                  </div>
                  <span className="club-locker-count">
                    {nationalities.length} {pick(locale, 'جنسية', 'nations')}
                  </span>
                </div>
                <DeskRule className="my-4 max-w-xs opacity-50" />

                {nationalities[0] ? (
                  <div className="club-locker-lead">
                    <div className="club-locker-lead-copy">
                      <span>{pick(locale, 'الأكثر حضوراً', 'Largest presence')}</span>
                      <strong>{nationalities[0].name}</strong>
                      <em>
                        {nationalities[0].count} {pick(locale, 'لاعب', 'players')} · {nationalities[0].pct}%
                      </em>
                    </div>
                    <div className="club-locker-lead-meter" aria-hidden>
                      <i style={{ height: `${Math.max(18, nationalities[0].pct)}%` }} />
                    </div>
                  </div>
                ) : null}

                <div className="club-locker-board">
                  {nationalities.map((nation, index) => (
                    <div
                      key={nation.name}
                      className={`club-locker-row ${index === 0 ? 'is-lead' : ''}`}
                    >
                      <span className="club-locker-rank">{String(index + 1).padStart(2, '0')}</span>
                      <div className="club-locker-main">
                        <div className="club-locker-title">
                          <strong>{nation.name}</strong>
                          <em>
                            {nation.count} {pick(locale, 'لاعب', 'players')} · {nation.pct}%
                          </em>
                        </div>
                        <div className="club-locker-track">
                          <i style={{ width: `${Math.max(8, nation.pct)}%` }} />
                        </div>
                      </div>
                      <span className="club-locker-qty">{nation.count}</span>
                    </div>
                  ))}
                </div>
                <p className="club-mix-note mt-4">
                  {pick(
                    locale,
                    `توزيع حقيقي حسب جنسيات اللاعبين المعروفين في التشكيلة (${nationalities.reduce((s, n) => s + n.count, 0)} من ${squadCount}).`,
                    `Real distribution by known squad nationalities (${nationalities.reduce((s, n) => s + n.count, 0)} of ${squadCount}).`
                  )}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {formTrail.length > 0 ? (
          <section className="club-rise club-order-form">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'شريط الشكل', 'Form ribbon')}</span>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'آخر خمس نتائج', 'Last five results')}
                </h2>
              </div>
              <DeskRule className="max-w-[12rem] opacity-50" />
            </div>
            <FormTrail trail={formTrail} locale={locale} />
          </section>
        ) : null}

        {liveMatches.length > 0 ? (
          <section id="club-action" className="atlas-desk club-rise relative p-5 sm:p-7 club-order-action scroll-mt-28">
            <div className="mb-5">
              <span className="atlas-section-kicker text-rose-500">
                {pick(locale, 'على الملعب', 'On the pitch')}
              </span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                {pick(locale, 'الآن مباشر', 'Live now')}
              </h2>
              <DeskRule className="mt-3 max-w-xs opacity-60" />
            </div>
            <div className="atlas-live-grid">
              {liveMatches.map((match) => (
                <MatchFaceOff key={match.id} match={match} teamId={team.id} locale={locale} mode="live" />
              ))}
            </div>
          </section>
        ) : null}

        {nextMatch && nextMatch.status === 'NOT_STARTED' ? (
          <section
            id={liveMatches.length === 0 ? 'club-action' : undefined}
            className="club-rise club-order-action scroll-mt-28"
          >
            <div className="mb-4">
              <span className="atlas-section-kicker">{pick(locale, 'الموعد القادم', 'Next fixture')}</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                {pick(locale, 'تحدي على الأجندة', 'Next on the programme')}
              </h2>
            </div>
            <MatchFaceOff
              match={nextMatch}
              teamId={team.id}
              locale={locale}
              mode="upcoming"
              featured
            />
          </section>
        ) : null}

        {standing ? (
          <section id="club-table" className="club-standing-plate club-rise club-order-table scroll-mt-28">
            <div className="club-standing-head">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'الترتيب', 'Standing')}</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {pick(locale, 'موقع النادي', 'Club position')}
                </h2>
              </div>
              <Link href={`/league/${standing.league.slug}`} className="club-standing-league">
                <LeagueCrest
                  name={standing.league.name}
                  logoUrl={standing.league.logoUrl}
                  className="h-8 w-8"
                />
                <span>{standing.league.name}</span>
              </Link>
            </div>
            <DeskRule className="my-5 opacity-50" />
            <div className="club-standing-grid">
              <div className="club-standing-rank">
                <strong>{standing.rank}</strong>
                <span>{pick(locale, 'المركز', 'Pos')}</span>
              </div>
              <div className="club-standing-metrics">
                <div>
                  <strong>{standing.played}</strong>
                  <span>{pick(locale, 'لعب', 'P')}</span>
                </div>
                <div>
                  <strong>{standing.won}</strong>
                  <span>{pick(locale, 'فوز', 'W')}</span>
                </div>
                <div>
                  <strong>{standing.drawn}</strong>
                  <span>{pick(locale, 'تعادل', 'D')}</span>
                </div>
                <div>
                  <strong>{standing.lost}</strong>
                  <span>{pick(locale, 'خسارة', 'L')}</span>
                </div>
                <div>
                  <strong>
                    {standing.goalsFor}:{standing.goalsAgainst}
                  </strong>
                  <span>{pick(locale, 'أهداف', 'GF:GA')}</span>
                </div>
                <div>
                  <strong>{standing.points}</strong>
                  <span>{pick(locale, 'نقاط', 'Pts')}</span>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {hasLedger ? (
          <section className="club-ledger club-rise club-order-table">
            <div className="mb-5">
              <span className="atlas-section-kicker">{pick(locale, 'دفتر الموسم', 'Season ledger')}</span>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                {pick(locale, 'منزل وخارج الأرض', 'Home & away')}
              </h2>
              <DeskRule className="mt-3 max-w-sm opacity-50" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <SplitBoard title={pick(locale, 'على أرضه', 'At home')} stats={homeStats} locale={locale} />
              <SplitBoard title={pick(locale, 'خارج الديار', 'Away')} stats={awayStats} locale={locale} />
            </div>
          </section>
        ) : null}

        {competitions.length > 0 ? (
          <section className="club-rise club-order-comps">
            <div className="mb-4">
              <span className="atlas-section-kicker">{pick(locale, 'المسابقات', 'Competitions')}</span>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                {pick(locale, 'حيث يظهر النادي', 'Where the club appears')}
              </h2>
            </div>
            <div className="club-comp-rail">
              {competitions.map((comp) => (
                <Link key={comp.id} href={`/league/${comp.slug}`} className="club-comp-chip">
                  <LeagueCrest name={comp.name} logoUrl={comp.logoUrl} className="h-7 w-7" />
                  <span>
                    <strong>{comp.name}</strong>
                    <em>
                      {comp.matches} {pick(locale, 'مباراة', 'matches')}
                      {comp.country ? ` · ${comp.country}` : ''}
                    </em>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {hasAttackBoard || hasDiscipline ? (
          <section id="club-attack" className="grid gap-6 lg:grid-cols-2 club-rise club-order-attack scroll-mt-28">
            {hasAttackBoard ? (
              <div className="club-scorers">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <span className="atlas-section-kicker">{pick(locale, 'الهجوم', 'Attack')}</span>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                      {pick(locale, 'صناع اللحظة', 'Difference makers')}
                    </h2>
                    <DeskRule className="mt-3 max-w-sm opacity-50" />
                  </div>
                  <Trophy className="h-5 w-5 text-orange-500 opacity-70" aria-hidden />
                </div>
                {scorers.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      {pick(locale, 'الهدافون', 'Scorers')}
                    </h3>
                    <ContributorList rows={scorers} locale={locale} metric="goals" />
                  </div>
                ) : null}
                {assisters.length > 0 ? (
                  <div>
                    <h3 className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                      {pick(locale, 'صناع الأهداف', 'Assists')}
                    </h3>
                    <ContributorList rows={assisters} locale={locale} metric="assists" />
                  </div>
                ) : null}
              </div>
            ) : null}

            {hasDiscipline ? (
              <div className="club-scorers club-discipline">
                <div className="mb-5">
                  <span className="atlas-section-kicker">{pick(locale, 'الانضباط', 'Discipline')}</span>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                    {pick(locale, 'دفتر البطاقات', 'Cards ledger')}
                  </h2>
                  <DeskRule className="mt-3 max-w-sm opacity-50" />
                </div>
                <div className="club-card-totals mb-5">
                  {discipline.yellow > 0 ? (
                    <div className="is-yellow">
                      <strong>{discipline.yellow}</strong>
                      <span>{pick(locale, 'صفراء', 'Yellow')}</span>
                    </div>
                  ) : null}
                  {discipline.red > 0 ? (
                    <div className="is-red">
                      <strong>{discipline.red}</strong>
                      <span>{pick(locale, 'حمراء', 'Red')}</span>
                    </div>
                  ) : null}
                </div>
                <ContributorList rows={discipline.players} locale={locale} metric="cards" />
              </div>
            ) : null}
          </section>
        ) : null}

        {transfers.length > 0 ? (
          <section className="club-transfers club-rise club-order-transfers">
            <div className="mb-5">
              <span className="atlas-section-kicker">{pick(locale, 'الانتقالات', 'Transfers')}</span>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                {pick(locale, 'حركة اللاعبين', 'Player movement')}
              </h2>
              <DeskRule className="mt-3 max-w-sm opacity-50" />
            </div>
            <div className="club-transfer-grid">
              {transfers.map((row) => (
                <Link key={row.id} href={`/player/${row.player.slug}`} className="club-transfer-chip">
                  {row.player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.player.photoUrl} alt="" />
                  ) : (
                    <span className="is-empty" aria-hidden>
                      {row.player.name.charAt(0)}
                    </span>
                  )}
                  <div>
                    <strong>{row.player.name}</strong>
                    <em>
                      {[row.fromTeam, row.toTeam].filter(Boolean).join(' → ') || pick(locale, 'انتقال', 'Transfer')}
                      {row.fee ? ` · ${row.fee}` : ''}
                    </em>
                  </div>
                  <ClientTime
                    value={row.date}
                    locale={locale}
                    options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {hasProgramme ? (
          <section id="club-programme" className="grid gap-6 lg:grid-cols-2 club-order-programme scroll-mt-28">
            {programmeUpcoming.length > 0 ? (
              <div className="atlas-desk club-rise p-5 sm:p-6">
                <span className="atlas-section-kicker">{pick(locale, 'البرنامج', 'Programme')}</span>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'المباريات القادمة', 'Upcoming')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="space-y-3">
                  {programmeUpcoming.map((match) => (
                    <MatchFaceOff
                      key={match.id}
                      match={match}
                      teamId={team.id}
                      locale={locale}
                      mode="upcoming"
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {recentResults.length > 0 ? (
              <div className="atlas-desk club-rise p-5 sm:p-6">
                <span className="atlas-section-kicker">{pick(locale, 'من المصدر', 'From source')}</span>
                <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                  {pick(locale, 'آخر النتائج', 'Latest results')}
                </h2>
                <DeskRule className="my-4 max-w-xs opacity-50" />
                <div className="atlas-results-grid club-results-compact">
                  {recentResults.map((match) => (
                    <MatchFaceOff
                      key={match.id}
                      match={match}
                      teamId={team.id}
                      locale={locale}
                      mode="result"
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {squadChapters.length > 0 ? (
          <section id="club-squad" className="club-squad club-rise club-order-squad scroll-mt-28">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'التشكيلة', 'Squad')}</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {pick(locale, 'القائمة الحالية', 'Current roster')}
                </h2>
                <DeskRule className="mt-3 max-w-sm opacity-50" />
              </div>
              <div className="text-end text-[10px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                <div>
                  {squadCount} {pick(locale, 'لاعب مسجّل', 'registered')}
                </div>
                {squadAges ? (
                  <div className="mt-1 normal-case tracking-normal text-muted-foreground">
                    {pick(locale, 'أعمار', 'Ages')} {squadAges.min}–{squadAges.max}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-8">
              {squadChapters.map((chapter, chapterIndex) => (
                <div key={chapter.key} className="club-squad-chapter">
                  <div className="club-squad-chapter-head">
                    <StorySpine
                      mark="YS"
                      folio={String(chapterIndex + 1).padStart(2, '0')}
                      className="club-squad-spine"
                    />
                    <div>
                      <h3 className="text-lg font-extrabold tracking-tight">
                        {squadLabel(chapter.key, locale)}
                      </h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">
                        {chapter.players.length} {pick(locale, 'لاعب', 'players')}
                      </p>
                    </div>
                  </div>
                  <div className="club-squad-grid">
                    {chapter.players.map((row) => (
                      <Link
                        key={row.id}
                        href={`/player/${row.player.slug}`}
                        className="club-player-chip"
                      >
                        <span className="club-player-number">{row.shirtNumber ?? '·'}</span>
                        <span className="club-player-body">
                          <strong>{row.player.name}</strong>
                          <em>
                            {[row.player.position, row.player.nationality, row.player.age != null ? `${row.player.age}` : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </em>
                        </span>
                        {row.player.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.player.photoUrl} alt="" className="club-player-photo" />
                        ) : (
                          <span className="club-player-photo is-empty" aria-hidden>
                            {row.player.name.charAt(0)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {team.coach ? (
          <section id="club-coach" className="club-order-staff scroll-mt-28">
            <div className="club-staff-plate club-rise">
              <span className="atlas-section-kicker">{pick(locale, 'غرفة المدرب', 'Coach room')}</span>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                {pick(locale, 'الجهاز الفني', 'Technical staff')}
              </h2>
              <DeskRule className="my-4 max-w-xs opacity-50" />
              <div className="club-coach-row">
                {team.coach.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={team.coach.photoUrl} alt="" className="club-coach-photo" />
                ) : (
                  <span className="club-coach-photo is-empty" aria-hidden>
                    <Shield className="h-6 w-6" />
                  </span>
                )}
                <div>
                  <strong className="block text-lg font-extrabold tracking-tight">
                    {team.coach.name}
                  </strong>
                  {team.coach.nationality ? (
                    <span className="text-[11px] font-semibold text-muted-foreground dark:text-muted-foreground">
                      {team.coach.nationality}
                    </span>
                  ) : null}
                  {team.coach.birthDate ? (
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      {pick(locale, 'مواليد', 'Born')}{' '}
                      <ClientTime
                        value={team.coach.birthDate}
                        locale={locale}
                        options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                      />
                    </span>
                  ) : null}
                  {team.coach.bio ? (
                    <p className="mt-3 text-sm leading-relaxed text-foreground dark:text-muted-foreground">
                      {team.coach.bio}
                    </p>
                  ) : null}
                </div>
              </div>
              {team.coach.career.length > 0 ? (
                <ul className="club-career-list">
                  {team.coach.career.map((stint) => (
                    <li key={`${stint.club}-${stint.from || ''}-${stint.to || ''}`}>
                      <strong>{stint.club}</strong>
                      <em>
                        {[stint.role, stint.from, stint.to].filter(Boolean).join(' · ')}
                        {typeof stint.matches === 'number'
                          ? ` · ${stint.matches} ${pick(locale, 'مباراة', 'apps')}`
                          : ''}
                        {typeof stint.winRate === 'number' ? ` · ${stint.winRate}%` : ''}
                      </em>
                    </li>
                  ))}
                </ul>
              ) : null}
              {team.coach.trophies.length > 0 ? (
                <ul className="club-trophy-list">
                  {team.coach.trophies.map((trophy) => (
                    <li key={`${trophy.title}-${trophy.season}`}>
                      <Trophy className="h-3.5 w-3.5 text-orange-500" aria-hidden />
                      <span>
                        <strong>{trophy.title}</strong>
                        <em>
                          {trophy.season}
                          {trophy.teamName ? ` · ${trophy.teamName}` : ''}
                        </em>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </section>
        ) : null}

        {venue ? (
          <section id="club-ground" className="club-ground club-rise club-order-staff scroll-mt-28">
            <div className="club-ground-head">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'الملعب', 'Venue')}</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {pick(locale, 'أرض النادي', 'Home ground')}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground dark:text-muted-foreground">
                  {pick(
                    locale,
                    'بيانات الملعب من المصدر فقط — الاسم، المدينة، السعة، والأرضية عند توفرها.',
                    'Ground details from source only — name, city, capacity and surface when available.'
                  )}
                </p>
              </div>
              <span className="club-ground-seal" aria-hidden>
                YS · HOME
              </span>
            </div>

            <div className={`club-ground-stage${venue.imageUrl ? '' : ' is-plain'}`}>
              <div className={`club-ground-media${venue.imageUrl ? ' has-shot' : ''}`}>
                {venue.imageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={venue.imageUrl}
                      alt=""
                      className="club-ground-media-blur"
                      aria-hidden
                      referrerPolicy="no-referrer"
                    />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="club-ground-media-shot"
                      referrerPolicy="no-referrer"
                    />
                    <div className="club-ground-media-shade" aria-hidden />
                    <div className="club-ground-media-caption">
                      <span>{pick(locale, 'من المصدر', 'From source')}</span>
                      <strong>{venue.name}</strong>
                      {venue.city ? <em>{venue.city}</em> : null}
                    </div>
                    <PhotoCorners className="pointer-events-none absolute inset-3 z-[4] opacity-40 sm:inset-5" />
                  </>
                ) : (
                  <div className="club-ground-ghost">
                    <span className="club-ground-pitch" aria-hidden />
                    <span className="club-ground-corner is-tl" aria-hidden />
                    <span className="club-ground-corner is-tr" aria-hidden />
                    <span className="club-ground-corner is-bl" aria-hidden />
                    <span className="club-ground-corner is-br" aria-hidden />
                    {typeof venue.capacity === 'number' && venue.capacity > 0 ? (
                      <div className="club-ground-capacity-hero">
                        <strong>
                          {venue.capacity.toLocaleString(locale === 'ar' ? 'ar' : 'en')}
                        </strong>
                        <span>{pick(locale, 'مقعد', 'seats')}</span>
                      </div>
                    ) : (
                      <strong className="club-ground-ghost-name">{venue.name}</strong>
                    )}
                  </div>
                )}
                <span className="club-ground-foil" aria-hidden />
              </div>

              <div className="club-ground-panel">
                <div className="club-ground-panel-top">
                  <span className="club-ground-folio" aria-hidden>
                    01
                  </span>
                  <span className="club-ground-stamp">
                    {pick(locale, 'أرض المنزل', 'Home turf')}
                  </span>
                </div>

                <div className="club-ground-title-row">
                  <MapPin className="club-ground-pin" aria-hidden />
                  <div className="min-w-0">
                    <h3>{venue.name}</h3>
                    {venue.city ? <em>{venue.city}</em> : null}
                  </div>
                </div>

                {venueFacts.length > 0 ? (
                  <div className="club-ground-facts">
                    {venueFacts.map((fact) => (
                      <div key={fact.label} className="club-ground-fact">
                        <span>{fact.label}</span>
                        <strong>{fact.value}</strong>
                      </div>
                    ))}
                  </div>
                ) : null}

                <DeskRule className="mt-5 max-w-xs opacity-40" />
              </div>
            </div>
          </section>
        ) : null}

        {team.bio ? (
          <section className="club-bio club-rise club-order-bio">
            <span className="atlas-section-kicker">{pick(locale, 'الأرشيف', 'Archive')}</span>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
              {pick(locale, 'نبذة النادي', 'Club profile')}
            </h2>
            <DeskRule className="my-5 max-w-sm opacity-50" />
            <p className="club-bio-copy">{team.bio}</p>
            <EndMark className="mt-8 opacity-70" />
          </section>
        ) : null}

        {news.length > 0 ? (
          <section className="club-reports club-rise club-order-news">
            <div className="club-reports-head">
              <div>
                <span className="atlas-section-kicker">{pick(locale, 'من المكتب', 'From the desk')}</span>
                <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
                  {pick(locale, 'تقارير مرتبطة', 'Linked reports')}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground dark:text-muted-foreground">
                  {pick(
                    locale,
                    'قصص حقيقية مرتبطة بهذا النادي من غرفة التحرير — بلا حشو.',
                    'Real desk stories linked to this club — no filler.'
                  )}
                </p>
                <DeskRule className="mt-4 max-w-sm opacity-50" />
              </div>
              <Link href="/news" className="club-reports-all">
                {pick(locale, 'كل التقارير', 'All reports')}
              </Link>
            </div>

            <div className="club-reports-layout">
              {leadStory ? (
                <Link href={`/news/${leadStory.slug}`} className="club-report-lead">
                  <PhotoCorners className="pointer-events-none absolute inset-3 opacity-40" />
                  {leadStory.featuredImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={leadStory.featuredImage} alt="" className="club-report-lead-media" />
                  ) : (
                    <div className="club-report-lead-media is-empty" aria-hidden />
                  )}
                  <div className="club-report-lead-copy">
                    <div className="club-report-meta">
                      <span>{leadStory.category}</span>
                      {leadStory.breaking ? <span className="is-break">{pick(locale, 'عاجل', 'Breaking')}</span> : null}
                      {leadStory.featured ? <span>{pick(locale, 'مختار', 'Featured')}</span> : null}
                    </div>
                    <h3>{leadStory.shortTitle || leadStory.title}</h3>
                    {leadStory.excerpt ? <p>{leadStory.excerpt}</p> : null}
                    <div className="club-report-foot">
                      <ClientTime
                        value={leadStory.publishedAt}
                        locale={locale}
                        options={{ day: 'numeric', month: 'short', year: 'numeric' }}
                      />
                      {leadStory.readingTime ? (
                        <span>
                          {leadStory.readingTime} {pick(locale, 'د', 'min')}
                        </span>
                      ) : null}
                      {leadStory.sourceName ? <span>{leadStory.sourceName}</span> : null}
                    </div>
                  </div>
                </Link>
              ) : null}

              {sideStories.length > 0 ? (
                <div className="club-report-stack">
                  {sideStories.map((item, index) => (
                    <Link key={item.id} href={`/news/${item.slug}`} className="club-report-card">
                      <StorySpine
                        mark="YS"
                        folio={String(index + 2).padStart(2, '0')}
                        className="club-report-spine"
                      />
                      <div className="club-report-card-body">
                        <div className="club-report-meta">
                          <span>{item.category}</span>
                          {item.isPremium ? <span>{pick(locale, 'خاص', 'Premium')}</span> : null}
                        </div>
                        <h3>{item.shortTitle || item.title}</h3>
                        {item.excerpt ? <p>{item.excerpt}</p> : null}
                        <div className="club-report-foot">
                          <ClientTime
                            value={item.publishedAt}
                            locale={locale}
                            options={{ day: 'numeric', month: 'short' }}
                          />
                          {item.views ? (
                            <span>
                              {item.views.toLocaleString(locale === 'ar' ? 'ar' : 'en')}{' '}
                              {pick(locale, 'مشاهدة', 'views')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {item.featuredImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.featuredImage} alt="" className="club-report-thumb" />
                      ) : null}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
