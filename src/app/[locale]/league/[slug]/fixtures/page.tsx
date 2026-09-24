import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ClientTime } from '@/components/datetime/ClientTime';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { loadLeagueDossier, type LeagueMatchCard } from '@/lib/leagues/load-dossier';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 180;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const league = await prisma.league.findUnique({
    where: { slug },
    select: { name: true },
  });
  if (!league) {
    return pageMetadata({
      locale,
      title: pick(locale, 'مباريات البطولة', 'League fixtures'),
      description: pick(locale, 'المباريات غير متاحة.', 'Fixtures are unavailable.'),
      path: `/league/${slug}/fixtures`,
      noIndex: true,
    });
  }
  return pageMetadata({
    locale,
    title: `${pick(locale, 'مباريات', 'Fixtures')} ${league.name}`,
    description: `${pick(locale, 'أجندة ونتائج', 'Agenda and results for')} ${league.name} ${pick(locale, 'من مصدر البيانات الحقيقي فقط.', 'from the real data source only.')}`,
    path: `/league/${slug}/fixtures`,
  });
}

function groupByRound(matches: LeagueMatchCard[], unassigned: string) {
  const map = new Map<string, LeagueMatchCard[]>();
  for (const match of matches) {
    const key = match.round || unassigned;
    const list = map.get(key) || [];
    list.push(match);
    map.set(key, list);
  }
  return [...map.entries()];
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

function MatchRow({
  match,
  locale,
  tone,
  homeForm,
  awayForm,
  homeRank,
  awayRank,
  homePts,
  awayPts,
}: {
  match: LeagueMatchCard;
  locale: string;
  tone: 'live' | 'upcoming' | 'result';
  homeForm?: Array<'W' | 'D' | 'L'>;
  awayForm?: Array<'W' | 'D' | 'L'>;
  homeRank?: number;
  awayRank?: number;
  homePts?: number;
  awayPts?: number;
}) {
  const live = tone === 'live';
  const finished = tone === 'result';
  const homeWon =
    finished &&
    match.homeScore != null &&
    match.awayScore != null &&
    match.homeScore > match.awayScore;
  const awayWon =
    finished &&
    match.homeScore != null &&
    match.awayScore != null &&
    match.awayScore > match.homeScore;

  return (
    <Link href={`/match/${match.id}`} className={`lch-match-row${live ? ' is-live' : ''}`}>
      <div className="lch-match-when">
        {live ? (
          <span className="lch-live-badge">
            <i />
            {match.status === 'HALFTIME'
              ? pick(locale, 'استراحة', 'HT')
              : match.minute
                ? `${match.minute}'`
                : pick(locale, 'مباشر', 'Live')}
          </span>
        ) : (
          <ClientTime
            value={match.kickoffAt}
            locale={locale}
            options={
              finished
                ? { weekday: 'short', day: 'numeric', month: 'short' }
                : { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
            }
          />
        )}
        {match.round ? <em>{match.round}</em> : null}
      </div>

      <div className="lch-match-duel">
        <div className={`lch-match-side is-home${homeWon ? ' is-win' : ''}${awayWon ? ' is-loss' : ''}`}>
          <LeagueCrest name={match.homeTeam.name} logoUrl={match.homeTeam.logoUrl} className="h-9 w-9" />
          <div className="min-w-0">
            <strong>{match.homeTeam.name}</strong>
            <div className="lch-match-sub">
              {homeRank != null ? (
                <span>
                  #{homeRank}
                  {homePts != null ? ` · ${homePts}${pick(locale, 'ن', 'p')}` : ''}
                </span>
              ) : null}
              {homeForm?.length ? <FormPips letters={homeForm} /> : null}
            </div>
          </div>
        </div>

        <div className="lch-match-score" dir="ltr">
          {finished || live ? (
            <strong>
              {typeof match.homeScore === 'number' ? match.homeScore : '—'}
              <span>:</span>
              {typeof match.awayScore === 'number' ? match.awayScore : '—'}
            </strong>
          ) : (
            <em>VS</em>
          )}
        </div>

        <div className={`lch-match-side is-away${awayWon ? ' is-win' : ''}${homeWon ? ' is-loss' : ''}`}>
          <div className="min-w-0">
            <strong>{match.awayTeam.name}</strong>
            <div className="lch-match-sub is-away">
              {awayRank != null ? (
                <span>
                  #{awayRank}
                  {awayPts != null ? ` · ${awayPts}${pick(locale, 'ن', 'p')}` : ''}
                </span>
              ) : null}
              {awayForm?.length ? <FormPips letters={awayForm} /> : null}
            </div>
          </div>
          <LeagueCrest name={match.awayTeam.name} logoUrl={match.awayTeam.logoUrl} className="h-9 w-9" />
        </div>
      </div>

      <div className="lch-match-meta">
        {match.venue?.name ? (
          <span>
            {match.venue.name}
            {match.venue.city ? ` · ${match.venue.city}` : ''}
          </span>
        ) : null}
        {match.channels.length > 0 ? (
          <span className="lch-match-tv">{match.channels.map((c) => c.name).join(' · ')}</span>
        ) : null}
      </div>
    </Link>
  );
}

export default function LeagueFixturesPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LeagueFixturesPageBody params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function LeagueFixturesPageBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const locale = await getLocale();
  const { slug } = await params;
  const { season } = await searchParams;
  const dossier = await loadLeagueDossier(slug, { season });
  if (!dossier) notFound();

  const { league, liveMatches, upcoming, recent, seasonId, seasons, tvGuide, standings } = dossier;
  const hasAny = liveMatches.length + upcoming.length + recent.length > 0;
  const upcomingByRound = groupByRound(
    upcoming,
    pick(locale, 'بدون جولة', 'Unassigned')
  );
  const recentByRound = groupByRound(recent, pick(locale, 'بدون جولة', 'Unassigned'));
  const tableByTeam = new Map(
    standings.map((row) => [
      row.team.id,
      { rank: row.rank, points: row.points, form: row.form },
    ])
  );
  const rowProps = (match: LeagueMatchCard) => {
    const home = tableByTeam.get(match.homeTeam.id);
    const away = tableByTeam.get(match.awayTeam.id);
    return {
      homeForm: home?.form,
      awayForm: away?.form,
      homeRank: home?.rank,
      awayRank: away?.rank,
      homePts: home?.points,
      awayPts: away?.points,
    };
  };

  const signature = [
    liveMatches.length > 0
      ? { value: liveMatches.length, label: pick(locale, 'مباشر', 'Live') }
      : null,
    upcoming.length > 0
      ? { value: upcoming.length, label: pick(locale, 'قادمة', 'Upcoming') }
      : null,
    recent.length > 0
      ? { value: recent.length, label: pick(locale, 'نتائج', 'Results') }
      : null,
    tvGuide.length > 0
      ? { value: tvGuide.length, label: pick(locale, 'على الهواء', 'On air') }
      : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>;

  return (
    <LeagueChapterShell
      locale={locale}
      slug={slug}
      current="fixtures"
      kicker={pick(locale, 'أجندة البطولة', 'Competition agenda')}
      title={`${pick(locale, 'مباريات', 'Fixtures')} ${league.name}`}
      subtitle={pick(
        locale,
        'مباشر، قادم، ونتائج — مع الملعب والقنوات إن توفرت من المصدر.',
        'Live, upcoming and results — with venue and channels when available from source.'
      )}
      leagueName={league.name}
      logoUrl={league.logoUrl}
      seasonId={seasonId}
      seasons={seasons}
      seasonHref={(value) => `/league/${slug}/fixtures?season=${value}`}
      signature={signature}
      ghost={seasonId || undefined}
    >
      {!hasAny ? (
        <div className="league-plate px-6 py-16 text-center text-sm text-muted-foreground">
          {pick(
            locale,
            'لا توجد مباريات مسجّلة لهذه البطولة من المصدر بعد.',
            'No fixtures are recorded for this competition from the source yet.'
          )}
        </div>
      ) : null}

      <div className="space-y-8">
        {liveMatches.length > 0 ? (
          <section className="league-plate club-rise">
            <ChapterSectionHead
              folio="01"
              kicker={pick(locale, 'مباشر', 'Live')}
              title={pick(locale, 'الآن على الملعب', 'On the pitch now')}
            />
            <div className="lch-match-stack">
              {liveMatches.map((match) => (
                <MatchRow key={match.id} match={match} locale={locale} tone="live" {...rowProps(match)} />
              ))}
            </div>
          </section>
        ) : null}

        {upcoming.length > 0 ? (
          <section className="league-plate club-rise">
            <ChapterSectionHead
              folio="02"
              kicker={pick(locale, 'القادمة', 'Upcoming')}
              title={pick(locale, 'ما تبقّى على الأجندة', 'Still on the agenda')}
              note={`${upcoming.length} ${pick(locale, 'مباراة', 'fixtures')}`}
            />
            <div className="space-y-6">
              {upcomingByRound.map(([round, matches]) => (
                <div key={round}>
                  <div className="lch-round-label">{round}</div>
                  <div className="lch-match-stack mt-3">
                    {matches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        locale={locale}
                        tone="upcoming"
                        {...rowProps(match)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {tvGuide.length > 0 ? (
          <section className="league-plate club-rise">
            <ChapterSectionHead
              folio="03"
              kicker={pick(locale, 'البث', 'Broadcast')}
              title={pick(locale, 'دليل القنوات', 'TV guide')}
            />
            <div className="league-tv-stack">
              {tvGuide.map((row) => (
                <Link key={row.matchId} href={`/match/${row.matchId}`} className="league-tv-row">
                  <ClientTime
                    value={row.kickoffAt}
                    locale={locale}
                    options={{ weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }}
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

        {recent.length > 0 ? (
          <section className="league-plate club-rise">
            <ChapterSectionHead
              folio="04"
              kicker={pick(locale, 'النتائج', 'Results')}
              title={pick(locale, 'آخر ما انتهى', 'Latest finished')}
            />
            <div className="space-y-6">
              {recentByRound.map(([round, matches]) => (
                <div key={round}>
                  <div className="lch-round-label">{round}</div>
                  <div className="lch-match-stack mt-3">
                    {matches.map((match) => (
                      <MatchRow
                        key={match.id}
                        match={match}
                        locale={locale}
                        tone="result"
                        {...rowProps(match)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </LeagueChapterShell>
  );
}
