import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Target } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { loadLeagueDossier } from '@/lib/leagues/load-dossier';
import { pageMetadata } from '@/lib/seo/site';
import { formatLeagueSeason, localizeCompetitionTitle } from '@/lib/i18n/competition-names';

export const revalidate = 90;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadLeagueDossier(slug);
  if (!dossier) {
    return pageMetadata({
      locale,
      title: pick(locale, 'الهدافون', 'Top scorers'),
      description: pick(locale, 'قائمة الهدافين غير متاحة.', 'Top scorers are unavailable.'),
      path: `/league/${slug}/top-scorers`,
      noIndex: true,
    });
  }
  const name = localizeCompetitionTitle(locale, dossier.league);
  const season = formatLeagueSeason(dossier.seasonId);
  const seasonBit = season ? ` ${season}` : '';
  return pageMetadata({
    locale,
    title: pick(locale, `هدافو ${name}${seasonBit} | يلا سبورت`, `${name}${seasonBit} top scorers | Yalla Sport`),
    description: pick(
      locale,
      `هدافو ${name}${seasonBit} من أحداث المباريات أو لوحة المصدر لنفس الموسم.`,
      `Top scorers in ${name}${seasonBit} from match events or the source board for the same season.`
    ),
    path: `/league/${slug}/top-scorers`,
  });
}

export default function TopScorersPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <TopScorersPageBody params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function TopScorersPageBody({
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

  const { league, topScorers, topAssists, topCards, seasonId, seasons } = dossier;
  const leader = topScorers[0];
  const maxGoals = leader?.goals || 1;
  const podium = topScorers.slice(0, 3);

  const signature = [
    topScorers.length > 0
      ? { value: topScorers.length, label: pick(locale, 'هداف', 'Scorers') }
      : null,
    leader
      ? { value: leader.goals, label: pick(locale, 'أهداف الصدارة', 'Lead goals') }
      : null,
    topAssists[0]
      ? { value: topAssists[0].assists, label: pick(locale, 'أفضل صناعة', 'Top assists') }
      : null,
    topCards[0]
      ? { value: topCards[0].total, label: pick(locale, 'أكثر بطاقات', 'Most cards') }
      : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>;

  return (
    <LeagueChapterShell
      locale={locale}
      slug={slug}
      current="scorers"
      kicker={pick(locale, 'الحذاء الذهبي', 'Golden Boot')}
      title={pick(locale, 'سباق الهدافين', 'Top-scorer race')}
      subtitle={`${league.name}${seasonId ? ` · ${pick(locale, 'الموسم', 'Season')} ${seasonId}` : ''} — ${pick(locale, 'أهداف وصناعات وبطاقات من المصدر فقط.', 'goals, assists and cards from source only.')}`}
      leagueName={league.name}
      logoUrl={league.logoUrl}
      statsLeagueId={league.externalId}
      seasonId={seasonId}
      seasons={seasons}
      seasonHref={(value) => `/league/${slug}/top-scorers?season=${value}`}
      signature={signature}
      ghost={leader ? String(leader.goals) : seasonId || undefined}
    >
      {topScorers.length === 0 && topAssists.length === 0 && topCards.length === 0 ? (
        <div className="league-plate px-6 py-16 text-center">
          <Target className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {pick(
              locale,
              'لا توجد أهداف مسجّلة بأسماء لاعبين من المصدر بعد.',
              'No named goal events are recorded from the source yet.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {podium.length > 0 ? (
            <section className="lch-scorer-podium club-rise">
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((row) => (
                <Link
                  key={`${row.player.id}-podium`}
                  href={`/player/${row.player.slug}`}
                  className={`lch-scorer-podium-card${row === podium[0] ? ' is-lead' : ''}`}
                >
                  <span className="lch-podium-rank">{String(topScorers.indexOf(row) + 1).padStart(2, '0')}</span>
                  {row.player.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={row.player.photoUrl} alt="" className="lch-scorer-face" />
                  ) : (
                    <span className="lch-scorer-face is-empty">{row.player.name.charAt(0)}</span>
                  )}
                  <strong>{row.player.name}</strong>
                  <em>{row.team.name}</em>
                  <b>{row.goals}</b>
                  {row.assists != null ? (
                    <span>
                      {row.assists} {pick(locale, 'صناعة', 'ast')}
                    </span>
                  ) : null}
                </Link>
              ))}
            </section>
          ) : null}

          <div className="lch-scorers-grid">
            {topScorers.length > 0 ? (
              <section className="league-plate club-rise">
                <ChapterSectionHead
                  folio="01"
                  kicker={pick(locale, 'التهديف', 'Scoring')}
                  title={pick(locale, 'قائمة الهدافين', 'Scorers list')}
                />
                <div className="league-scorer-stack">
                  {topScorers.map((row, index) => (
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
                      <div className="min-w-0 flex-1">
                        <strong>{row.player.name}</strong>
                        <em>
                          {row.team.name}
                          {row.player.position ? ` · ${row.player.position}` : ''}
                          {row.assists != null
                            ? ` · ${row.assists} ${pick(locale, 'صناعة', 'ast')}`
                            : ''}
                          {index > 0
                            ? ` · ${pick(locale, 'خلف بـ', 'behind by')} ${maxGoals - row.goals}`
                            : ''}
                        </em>
                        <span className="lch-race-track" aria-hidden>
                          <span style={{ width: `${Math.max(8, (row.goals / maxGoals) * 100)}%` }} />
                        </span>
                      </div>
                      <span className="league-scorer-goals">{row.goals}</span>
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="space-y-8">
              {topAssists.length > 0 ? (
                <section className="league-plate club-rise">
                  <ChapterSectionHead
                    folio="02"
                    kicker={pick(locale, 'الصناعة', 'Creativity')}
                    title={pick(locale, 'صناع اللعب', 'Top assists')}
                  />
                  <div className="league-scorer-stack">
                    {topAssists.map((row, index) => {
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
                      return row.player?.slug ? (
                        <Link
                          key={`${row.name}-${index}`}
                          href={`/player/${row.player.slug}`}
                          className="league-scorer-card"
                        >
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
                <section className="league-plate club-rise">
                  <ChapterSectionHead
                    folio="03"
                    kicker={pick(locale, 'الانضباط', 'Discipline')}
                    title={pick(locale, 'سجل البطاقات', 'Cards ledger')}
                  />
                  <div className="league-scorer-stack">
                    {topCards.map((row, index) => (
                      <Link
                        key={`${row.player.id}-card`}
                        href={`/player/${row.player.slug}`}
                        className="league-scorer-card"
                      >
                        <span className="league-scorer-rank">{String(index + 1).padStart(2, '0')}</span>
                        <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-9 w-9" />
                        <div className="min-w-0">
                          <strong>{row.player.name}</strong>
                          <em>
                            <span className="lch-card-y">{row.yellow}</span>
                            {pick(locale, ' صفراء', ' Y')} ·{' '}
                            <span className="lch-card-r">{row.red}</span>
                            {pick(locale, ' حمراء', ' R')}
                          </em>
                        </div>
                        <span className="league-scorer-goals">{row.total}</span>
                      </Link>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </LeagueChapterShell>
  );
}
