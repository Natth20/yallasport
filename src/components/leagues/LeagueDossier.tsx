import React from 'react';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { LeagueChapterNav } from '@/components/leagues/LeagueChapterNav';
import { LeagueFollowChip } from '@/components/leagues/LeagueFollowChip';
import { DeskRule, EndMark, StorySpine } from '@/components/news/NewsOrnaments';
import { pick } from '@/i18n/pick';
import type { LeagueDossierData, StandingZone } from '@/lib/leagues/load-dossier';

function gd(row: { goalsFor: number; goalsAgainst: number }) {
  return row.goalsFor - row.goalsAgainst;
}

function zoneLabel(locale: string, zone: StandingZone) {
  switch (zone) {
    case 'direct':
      return pick(locale, 'تأهل مباشر', 'Direct');
    case 'playoff':
      return pick(locale, 'ملحق', 'Play-off');
    case 'out':
      return pick(locale, 'خارج', 'Out');
    case 'cl':
      return pick(locale, 'أبطال', 'UCL');
    case 'el':
      return pick(locale, 'أوروبا', 'UEL');
    case 'rel':
      return pick(locale, 'هبوط', 'Rel');
    default:
      return null;
  }
}

function FormPips({ letters }: { letters: Array<'W' | 'D' | 'L'> }) {
  if (letters.length === 0) return null;
  return (
    <span className="league-form-pips" aria-hidden>
      {letters.map((letter, index) => (
        <em key={`${letter}-${index}`} className={`is-${letter.toLowerCase()}`}>
          {letter}
        </em>
      ))}
    </span>
  );
}

function SectionHead({
  folio,
  kicker,
  title,
  light,
}: {
  folio: string;
  kicker: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="league-section-head">
      <div className="league-section-kicker-row">
        <span className={`league-folio-mark${light ? ' is-light' : ''}`} aria-hidden>
          {folio}
        </span>
        <span className="league-section-kicker">{kicker}</span>
      </div>
      <h2 className="league-section-title">{title}</h2>
      <DeskRule className="mt-3 max-w-sm opacity-45" />
    </div>
  );
}

export function LeagueDossier({
  locale,
  now,
  dossier,
  isLoggedIn,
  initialIsFollowing,
}: {
  locale: string;
  now: Date;
  dossier: LeagueDossierData;
  isLoggedIn: boolean;
  initialIsFollowing: boolean;
}) {
  const {
    league,
    seasonId,
    seasons,
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
    archiveSeasons,
  } = dossier;

  const leader = standings[0] || null;
  const topScorer = topScorers[0] || null;
  const seasonLabel = seasonId || String(now.getFullYear());

  const signature = [
    league.matchCount > 0
      ? { value: league.matchCount, label: pick(locale, 'مباراة', 'Fixtures') }
      : null,
    standings.length > 0
      ? { value: standings.length, label: pick(locale, 'فريق', 'Clubs') }
      : null,
    liveMatches.length > 0
      ? { value: liveMatches.length, label: pick(locale, 'مباشر الآن', 'Live now') }
      : null,
    upcoming.length > 0
      ? { value: upcoming.length, label: pick(locale, 'قادمة', 'Upcoming') }
      : null,
    topScorer
      ? { value: topScorer.goals, label: pick(locale, 'أهداف الهداف', 'Top goals') }
      : null,
    tvGuide.length > 0
      ? { value: tvGuide.length, label: pick(locale, 'على الهواء', 'On air') }
      : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>;

  const chapters = [
    liveMatches.length > 0
      ? { id: 'live', href: '#folio-live', label: pick(locale, 'مباشر', 'Live') }
      : null,
    spotlight
      ? { id: 'spotlight', href: '#folio-spotlight', label: pick(locale, 'مختارة', 'Spotlight') }
      : null,
    roundAgenda
      ? { id: 'agenda', href: '#folio-agenda', label: pick(locale, 'الجولة', 'Matchday') }
      : null,
    standings.length > 0
      ? { id: 'table', href: '#folio-table', label: pick(locale, 'ترتيب', 'Table') }
      : null,
    recent.length > 0
      ? { id: 'results', href: '#folio-results', label: pick(locale, 'نتائج', 'Results') }
      : null,
    topScorers.length > 0
      ? { id: 'scorers', href: '#folio-scorers', label: pick(locale, 'هدافون', 'Scorers') }
      : null,
    topAssists.length > 0
      ? { id: 'assists', href: '#folio-assists', label: pick(locale, 'صناعات', 'Assists') }
      : null,
    topCards.length > 0
      ? { id: 'cards', href: '#folio-cards', label: pick(locale, 'بطاقات', 'Cards') }
      : null,
    tvGuide.length > 0
      ? { id: 'tv', href: '#folio-tv', label: pick(locale, 'بث', 'TV') }
      : null,
    clubs.length > 0
      ? { id: 'clubs', href: '#folio-clubs', label: pick(locale, 'أندية', 'Clubs') }
      : null,
    news.length > 0
      ? { id: 'desk', href: '#folio-desk', label: pick(locale, 'تقارير', 'Reports') }
      : null,
  ].filter(Boolean) as Array<{ id: string; href: string; label: string }>;

  const folioOf = Object.fromEntries(
    chapters.map((chapter, index) => [chapter.id, String(index + 1).padStart(2, '0')])
  ) as Record<string, string>;

  const hasZones = standings.some((row) => row.zone === 'direct' || row.zone === 'playoff');

  return (
    <div className="league-dossier ys-dossier-stack">
      <section className="league-hero league-hero-lux">
        <div className="league-hero-grid" aria-hidden />
        <span className="league-hero-foil" aria-hidden />
        <span className="league-corner is-tl" aria-hidden />
        <span className="league-corner is-tr" aria-hidden />
        <span className="league-corner is-bl" aria-hidden />
        <span className="league-corner is-br" aria-hidden />
        <span className="league-hero-ghost" aria-hidden>
          {seasonLabel}
        </span>
        {league.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={league.logoUrl} alt="" className="league-hero-wash" aria-hidden />
        ) : null}
        <div className="league-hero-vignette" aria-hidden />

        <div className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-6 sm:px-8 lg:px-12">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <Link href="/leagues" className="league-back-link">
              {pick(locale, 'دليل البطولات', 'League directory')}
            </Link>
            <LeagueFollowChip
              leagueId={league.id}
              isLoggedIn={isLoggedIn}
              initialIsFollowing={initialIsFollowing}
              variant="soft"
              callbackUrl={`/league/${league.slug}`}
            />
          </div>

          <div className="league-mast">
            <div className="league-crest-stage">
              <span className="league-crest-ring" aria-hidden />
              <div className="league-crest-plate">
                <LeagueCrest name={league.name} logoUrl={league.logoUrl} className="h-20 w-20 sm:h-24 sm:w-24" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="league-kicker">{pick(locale, 'ملف البطولة', 'Competition folio')}</span>
                {league.country ? <span className="league-meta-chip">{league.country}</span> : null}
                {seasonId ? (
                  <span className="league-meta-chip">
                    {pick(locale, 'الموسم', 'Season')} {seasonId}
                  </span>
                ) : null}
              </div>
              <h1 className="league-wordmark">{league.name}</h1>
              <div className="league-meta-row">
                {leader ? (
                  <span>
                    {pick(locale, 'المتصدر', 'Leader')} · {leader.team.name}
                    <em>
                      {leader.points} {pick(locale, 'نقطة', 'pts')}
                    </em>
                  </span>
                ) : null}
                {topScorer ? (
                  <span>
                    {pick(locale, 'الهداف', 'Top scorer')} · {topScorer.player.name}
                    <em>
                      {topScorer.goals} {pick(locale, 'أهداف', 'goals')}
                    </em>
                  </span>
                ) : null}
                {spotlight ? (
                  <span>
                    {spotlight.status === 'LIVE' || spotlight.status === 'HALFTIME'
                      ? pick(locale, 'الآن', 'Now')
                      : pick(locale, 'التالي', 'Next')}{' '}
                    · {spotlight.homeTeam.name} × {spotlight.awayTeam.name}
                  </span>
                ) : null}
              </div>

              {seasons.length > 1 ? (
                <div className="league-season-switch mt-5">
                  {seasons.slice(0, 6).map((season) => (
                    <Link
                      key={season}
                      href={`/league/${league.slug}?season=${season}`}
                      className={season === seasonId ? 'is-active' : ''}
                    >
                      {season}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {signature.length > 0 ? (
            <div className="league-signature mt-10">
              {signature.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`league-signature-tile${index === 0 ? ' is-lead' : ''}`}
                  style={{ animationDelay: `${index * 55}ms` }}
                >
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-12">
        <div className="mb-8">
          <LeagueChapterNav slug={league.slug} current="hub" />
        </div>

        {chapters.length > 0 ? (
          <nav className="league-folio-nav mb-10" aria-label={pick(locale, 'أقسام الملف', 'Folio sections')}>
            {chapters.map((section) => (
              <a key={section.href} href={section.href} className="league-folio-nav-link">
                <em>{folioOf[section.id]}</em>
                {section.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="league-body-grid">
          <div className="league-main-column space-y-10">
            {spotlight ? (
              <section id="folio-spotlight" className="scroll-mt-28 club-rise">
                <Link href={`/match/${spotlight.id}`} className="league-feature-card">
                  <div className="league-feature-label">
                    <span className="league-folio-mark is-light">{folioOf.spotlight || '01'}</span>
                    <span>
                      {spotlight.status === 'LIVE' || spotlight.status === 'HALFTIME'
                        ? pick(locale, 'المباراة المباشرة', 'Live spotlight')
                        : pick(locale, 'المباراة المختارة', 'Selected fixture')}
                    </span>
                    {spotlight.round ? <em>{spotlight.round}</em> : null}
                  </div>
                  <div className="league-feature-grid">
                    <div className="league-feature-side is-home">
                      <LeagueCrest
                        name={spotlight.homeTeam.name}
                        logoUrl={spotlight.homeTeam.logoUrl}
                        className="h-14 w-14"
                      />
                      <strong>{spotlight.homeTeam.name}</strong>
                    </div>
                    <div className="league-feature-mid">
                      {spotlight.status === 'NOT_STARTED' ? (
                        <ClientTime value={spotlight.kickoffAt} locale={locale} className="league-feature-time" />
                      ) : (
                        <strong className="league-feature-score" dir="ltr">
                          {typeof spotlight.homeScore === 'number' && typeof spotlight.awayScore === 'number'
                            ? `${spotlight.homeScore}:${spotlight.awayScore}`
                            : '—'}
                        </strong>
                      )}
                      <span className="league-feature-vs">
                        {spotlight.status === 'HALFTIME'
                          ? pick(locale, 'استراحة', 'HT')
                          : spotlight.status === 'LIVE'
                            ? spotlight.minute
                              ? `${spotlight.minute}'`
                              : pick(locale, 'مباشر', 'LIVE')
                            : 'VS'}
                      </span>
                      {spotlight.venue?.name ? (
                        <span className="league-feature-venue">
                          {spotlight.venue.name}
                          {spotlight.venue.city ? ` · ${spotlight.venue.city}` : ''}
                        </span>
                      ) : null}
                      {spotlight.channels[0] ? (
                        <span className="league-feature-tv">
                          {spotlight.channels.map((c) => c.name).join(' · ')}
                        </span>
                      ) : null}
                    </div>
                    <div className="league-feature-side is-away">
                      <LeagueCrest
                        name={spotlight.awayTeam.name}
                        logoUrl={spotlight.awayTeam.logoUrl}
                        className="h-14 w-14"
                      />
                      <strong>{spotlight.awayTeam.name}</strong>
                    </div>
                  </div>
                </Link>
              </section>
            ) : null}

            {liveMatches.length > 0 ? (
              <section id="folio-live" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.live}
                  kicker={pick(locale, 'مباشر', 'Live')}
                  title={pick(locale, 'الآن في هذه البطولة', 'Live in this competition')}
                />
                <div className="league-live-stack">
                  {liveMatches.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`} className="league-live-card">
                      <span className="league-live-pulse" aria-hidden />
                      <div className="league-live-teams">
                        <span className="truncate">{match.homeTeam.name}</span>
                        <strong dir="ltr">
                          {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                            ? `${match.homeScore}:${match.awayScore}`
                            : '—'}
                        </strong>
                        <span className="truncate text-end">{match.awayTeam.name}</span>
                      </div>
                      <em>
                        {match.status === 'HALFTIME'
                          ? pick(locale, 'استراحة', 'HT')
                          : match.minute
                            ? `${match.minute}'`
                            : pick(locale, 'مباشر', 'Live')}
                      </em>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {roundAgenda ? (
              <section id="folio-agenda" className="league-plate scroll-mt-28 club-rise">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHead
                    folio={folioOf.agenda}
                    kicker={pick(locale, 'أجندة الجولة', 'Matchday agenda')}
                    title={roundAgenda.round}
                  />
                  <Link href={`/league/${league.slug}/fixtures`} className="league-inline-link">
                    {pick(locale, 'كل المباريات', 'All fixtures')}
                  </Link>
                </div>
                <div className="league-fixture-stack">
                  {roundAgenda.matches.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`} className="league-fixture-card">
                      <ClientTime
                        value={match.kickoffAt}
                        locale={locale}
                        options={{
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }}
                        className="league-fixture-when"
                      />
                      <div className="league-fixture-duel">
                        <span className="truncate">{match.homeTeam.name}</span>
                        {match.status === 'FINISHED' ||
                        match.status === 'LIVE' ||
                        match.status === 'HALFTIME' ? (
                          <strong dir="ltr">
                            {typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
                              ? `${match.homeScore}:${match.awayScore}`
                              : '—'}
                          </strong>
                        ) : (
                          <em>vs</em>
                        )}
                        <span className="truncate text-end">{match.awayTeam.name}</span>
                      </div>
                      <div className="league-fixture-meta">
                        {match.venue?.name ? <span>{match.venue.name}</span> : null}
                        {match.channels[0] ? <span>{match.channels[0].name}</span> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : upcoming.length > 0 ? (
              <section id="folio-agenda" className="league-plate scroll-mt-28 club-rise">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHead
                    folio={folioOf.agenda || '02'}
                    kicker={pick(locale, 'الأجندة', 'Agenda')}
                    title={pick(locale, 'المباريات القادمة', 'Upcoming fixtures')}
                  />
                  <Link href={`/league/${league.slug}/fixtures`} className="league-inline-link">
                    {pick(locale, 'كل المباريات', 'All fixtures')}
                  </Link>
                </div>
                <div className="league-fixture-stack">
                  {upcoming.map((match) => (
                    <Link key={match.id} href={`/match/${match.id}`} className="league-fixture-card">
                      <ClientTime
                        value={match.kickoffAt}
                        locale={locale}
                        options={{
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        }}
                        className="league-fixture-when"
                      />
                      <div className="league-fixture-duel">
                        <span className="truncate">{match.homeTeam.name}</span>
                        <em>vs</em>
                        <span className="truncate text-end">{match.awayTeam.name}</span>
                      </div>
                      <div className="league-fixture-meta">
                        {match.round ? <span>{match.round}</span> : null}
                        {match.channels[0] ? <span>{match.channels[0].name}</span> : null}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {recent.length > 0 ? (
              <section id="folio-results" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.results}
                  kicker={pick(locale, 'السجل', 'Record')}
                  title={pick(locale, 'آخر النتائج', 'Latest results')}
                />
                <div className="league-result-stack">
                  {recent.map((match) => {
                    const homeWon =
                      match.homeScore != null &&
                      match.awayScore != null &&
                      match.homeScore > match.awayScore;
                    const awayWon =
                      match.homeScore != null &&
                      match.awayScore != null &&
                      match.awayScore > match.homeScore;
                    return (
                      <Link key={match.id} href={`/match/${match.id}`} className="league-result-card">
                        <ClientTime
                          value={match.kickoffAt}
                          locale={locale}
                          options={{ day: 'numeric', month: 'short' }}
                          className="league-result-when"
                        />
                        <div className="league-result-duel" dir="ltr">
                          <span className={homeWon ? 'is-win' : awayWon ? 'is-loss' : ''}>
                            {match.homeTeam.name}
                          </span>
                          <strong>
                            {match.homeScore ?? '–'}
                            <em>:</em>
                            {match.awayScore ?? '–'}
                          </strong>
                          <span className={awayWon ? 'is-win' : homeWon ? 'is-loss' : ''}>
                            {match.awayTeam.name}
                          </span>
                        </div>
                        {match.round ? <span className="league-result-round">{match.round}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {topScorers.length > 0 ? (
              <section id="folio-scorers" className="league-plate scroll-mt-28 club-rise">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHead
                    folio={folioOf.scorers}
                    kicker={pick(locale, 'التهديف', 'Scoring')}
                    title={pick(locale, 'سباق الهدافين', 'Top scorers')}
                  />
                  <Link href={`/league/${league.slug}/top-scorers`} className="league-inline-link">
                    {pick(locale, 'القائمة الكاملة', 'Full list')}
                  </Link>
                </div>
                <div className="league-scorer-stack">
                  {topScorers.slice(0, 10).map((row, index) => (
                    <Link
                      key={`${row.player.id}-${row.team.id}`}
                      href={`/player/${row.player.slug}`}
                      className={`league-scorer-card${index === 0 ? ' is-lead' : ''}`}
                    >
                      <span className="league-scorer-rank">{String(index + 1).padStart(2, '0')}</span>
                      {row.player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.player.photoUrl} alt="" className="league-scorer-photo" />
                      ) : (
                        <span className="league-scorer-photo is-empty">{row.player.name.charAt(0)}</span>
                      )}
                      <div className="min-w-0">
                        <strong>{row.player.name}</strong>
                        <em>
                          {row.team.name}
                          {row.assists != null ? ` · ${row.assists} ${pick(locale, 'صناعة', 'ast')}` : ''}
                        </em>
                      </div>
                      <span className="league-scorer-goals">{row.goals}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {topAssists.length > 0 ? (
              <section id="folio-assists" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.assists}
                  kicker={pick(locale, 'الصناعة', 'Creativity')}
                  title={pick(locale, 'صناع اللعب', 'Top assists')}
                />
                <div className="league-scorer-stack">
                  {topAssists.map((row, index) => {
                    const href = row.player?.slug ? `/player/${row.player.slug}` : null;
                    const body = (
                      <>
                        <span className="league-scorer-rank">{String(index + 1).padStart(2, '0')}</span>
                        {row.player?.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.player.photoUrl} alt="" className="league-scorer-photo" />
                        ) : (
                          <span className="league-scorer-photo is-empty">{row.name.charAt(0)}</span>
                        )}
                        <div className="min-w-0">
                          <strong>{row.name}</strong>
                          {row.team ? <em>{row.team.name}</em> : null}
                        </div>
                        <span className="league-scorer-goals">{row.assists}</span>
                      </>
                    );
                    return href ? (
                      <Link key={`${row.name}-${index}`} href={href} className="league-scorer-card">
                        {body}
                      </Link>
                    ) : (
                      <div key={`${row.name}-${index}`} className="league-scorer-card">
                        {body}
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {topCards.length > 0 ? (
              <section id="folio-cards" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.cards}
                  kicker={pick(locale, 'الانضباط', 'Discipline')}
                  title={pick(locale, 'سجل البطاقات', 'Cards ledger')}
                />
                <div className="league-scorer-stack">
                  {topCards.map((row, index) => (
                    <Link
                      key={`${row.player.id}-cards`}
                      href={`/player/${row.player.slug}`}
                      className="league-scorer-card"
                    >
                      <span className="league-scorer-rank">{String(index + 1).padStart(2, '0')}</span>
                      {row.player.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.player.photoUrl} alt="" className="league-scorer-photo" />
                      ) : (
                        <span className="league-scorer-photo is-empty">{row.player.name.charAt(0)}</span>
                      )}
                      <div className="min-w-0">
                        <strong>{row.player.name}</strong>
                        <em>
                          {row.team.name} · {row.yellow}
                          {pick(locale, 'ص', 'Y')} / {row.red}
                          {pick(locale, 'ح', 'R')}
                        </em>
                      </div>
                      <span className="league-scorer-goals">{row.total}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {tvGuide.length > 0 ? (
              <section id="folio-tv" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.tv}
                  kicker={pick(locale, 'البث', 'Broadcast')}
                  title={pick(locale, 'دليل القنوات', 'TV guide')}
                />
                <div className="league-tv-stack">
                  {tvGuide.map((row) => (
                    <Link key={row.matchId} href={`/match/${row.matchId}`} className="league-tv-row">
                      <ClientTime
                        value={row.kickoffAt}
                        locale={locale}
                        options={{ weekday: 'short', hour: '2-digit', minute: '2-digit' }}
                        className="league-tv-when"
                      />
                      <strong>
                        {row.home} × {row.away}
                      </strong>
                      <span>{row.channels.join(' · ')}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {clubs.length > 0 ? (
              <section id="folio-clubs" className="league-plate scroll-mt-28 club-rise">
                <SectionHead
                  folio={folioOf.clubs}
                  kicker={pick(locale, 'المشاركون', 'Participants')}
                  title={pick(locale, 'أندية البطولة', 'Competition clubs')}
                />
                <div className="league-clubs-grid">
                  {clubs.map((club) => (
                    <Link key={club.id} href={`/team/${club.slug}`} className="league-club-chip">
                      <LeagueCrest name={club.name} logoUrl={club.logoUrl} className="h-8 w-8" />
                      <span>{club.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            {news.length > 0 ? (
              <section id="folio-desk" className="league-plate scroll-mt-28 club-rise">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHead
                    folio={folioOf.desk}
                    kicker={pick(locale, 'من المكتب', 'From the desk')}
                    title={pick(locale, 'تقارير البطولة', 'Competition reports')}
                  />
                  <Link href="/news" className="league-inline-link">
                    {pick(locale, 'كل التقارير', 'All reports')}
                  </Link>
                </div>
                <div className="league-reports-grid">
                  {news.slice(0, 1).map((item) => (
                    <Link key={item.id} href={`/news/${item.slug}`} className="league-report-lead">
                      {item.featuredImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.featuredImage} alt="" />
                      ) : (
                        <div className="is-empty" aria-hidden />
                      )}
                      <div>
                        <span>{item.category}</span>
                        <h3>{item.title}</h3>
                        {item.excerpt ? <p>{item.excerpt}</p> : null}
                      </div>
                    </Link>
                  ))}
                  {news.slice(1, 5).map((item, index) => (
                    <Link key={item.id} href={`/news/${item.slug}`} className="league-report-card">
                      <StorySpine mark="YS" folio={String(index + 2).padStart(2, '0')} />
                      <div>
                        <span>{item.category}</span>
                        <h3>{item.title}</h3>
                      </div>
                    </Link>
                  ))}
                </div>
                <EndMark className="mt-8 opacity-55" />
              </section>
            ) : null}

            {archiveSeasons.length > 1 ? (
              <section className="league-plate club-rise">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <SectionHead
                    folio="A"
                    kicker={pick(locale, 'الخزنة', 'Vault')}
                    title={pick(locale, 'المواسم المسجّلة', 'Recorded seasons')}
                  />
                  <Link href={`/league/${league.slug}/archive`} className="league-inline-link">
                    {pick(locale, 'الأرشيف الكامل', 'Full archive')}
                  </Link>
                </div>
                <div className="league-season-switch">
                  {archiveSeasons.slice(0, 8).map((season) => (
                    <Link
                      key={season.seasonId}
                      href={`/league/${league.slug}?season=${season.seasonId}`}
                      className={season.seasonId === seasonId || season.current ? 'is-active' : ''}
                    >
                      {season.seasonId}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="league-aside league-aside-lux space-y-6">
            {standings.length > 0 ? (
              <section id="folio-table" className="league-table-plate scroll-mt-28 club-rise">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="league-section-kicker-row">
                      <span className="league-folio-mark is-light">{folioOf.table || '03'}</span>
                      <span className="league-section-kicker text-orange-300">
                        {pick(locale, 'الترتيب', 'Standings')}
                      </span>
                    </div>
                    <h2 className="mt-2 text-xl font-extrabold tracking-tight text-orange-50">
                      {pick(locale, 'لوحة النقاط', 'Points board')}
                    </h2>
                  </div>
                  <Link href={`/league/${league.slug}/standings`} className="text-[10px] font-bold text-orange-300">
                    {pick(locale, 'الكامل', 'Full')}
                  </Link>
                </div>

                {hasZones ? (
                  <div className="league-zone-legend">
                    <span className="is-direct">{pick(locale, '1–8 مباشر', '1–8 direct')}</span>
                    <span className="is-playoff">{pick(locale, '9–24 ملحق', '9–24 play-off')}</span>
                    <span className="is-out">{pick(locale, 'خارج', 'Out')}</span>
                  </div>
                ) : null}

                <div className="league-table-head" aria-hidden>
                  <span>#</span>
                  <span>{pick(locale, 'الفريق', 'Club')}</span>
                  <span>{pick(locale, 'ل', 'P')}</span>
                  <span>{pick(locale, 'ف ر', 'GD')}</span>
                  <span>{pick(locale, 'ن', 'Pts')}</span>
                </div>

                <div className="league-table-list">
                  {standings.map((row) => {
                    const diff = gd(row);
                    return (
                      <Link
                        key={row.id}
                        href={row.team.slug ? `/team/${row.team.slug}` : `/league/${league.slug}/standings`}
                        className={`league-table-row${row.rank === 1 ? ' is-lead' : ''}${
                          row.zone === 'direct' ? ' is-direct' : ''
                        }${row.zone === 'playoff' ? ' is-playoff' : ''}${row.zone === 'out' ? ' is-out' : ''}${
                          row.zone === 'cl' || row.zone === 'el' ? ' is-zone' : ''
                        }${row.zone === 'rel' ? ' is-rel' : ''}`}
                        title={zoneLabel(locale, row.zone) || undefined}
                      >
                        <span className="league-table-rank">{row.rank}</span>
                        <div className="league-table-club">
                          <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-7 w-7" />
                          <div className="min-w-0">
                            <strong className="truncate">{row.team.name}</strong>
                            <FormPips letters={row.form} />
                          </div>
                        </div>
                        <span className="league-table-num">{row.played}</span>
                        <span
                          className={`league-table-num${diff > 0 ? ' is-plus' : diff < 0 ? ' is-minus' : ''}`}
                        >
                          {diff > 0 ? `+${diff}` : diff}
                        </span>
                        <span className="league-table-pts">{row.points}</span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="league-chapter-rail club-rise">
              {[
                {
                  href: `/league/${league.slug}/fixtures`,
                  label: pick(locale, 'كل المباريات', 'All fixtures'),
                  text: pick(locale, 'أجندة البطولة من المصدر', 'Competition agenda from source'),
                },
                {
                  href: `/league/${league.slug}/standings`,
                  label: pick(locale, 'جدول الترتيب', 'Standings'),
                  text: pick(locale, 'المراكز ومناطق التأهل', 'Ranks and qualification zones'),
                },
                {
                  href: `/league/${league.slug}/top-scorers`,
                  label: pick(locale, 'الهدافون', 'Top scorers'),
                  text: pick(locale, 'سباق التهديف', 'Scoring race'),
                },
                {
                  href: `/league/${league.slug}/archive`,
                  label: pick(locale, 'الأرشيف', 'Archive'),
                  text: pick(locale, 'المواسم المسجّلة', 'Recorded seasons'),
                },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="league-chapter-card">
                  <strong>{item.label}</strong>
                  <span>{item.text}</span>
                </Link>
              ))}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
