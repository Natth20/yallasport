import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Trophy } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { loadLeagueDossier, type StandingZone } from '@/lib/leagues/load-dossier';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';

export const revalidate = 300;

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
      title: pick(locale, 'جدول الترتيب', 'Standings'),
      description: pick(locale, 'جدول الترتيب غير متاح.', 'Standings are unavailable.'),
      path: `/league/${slug}/standings`,
      noIndex: true,
    });
  }
  return pageMetadata({
    locale,
    title: `${pick(locale, 'ترتيب', 'Standings')} ${league.name}`,
    description: `${pick(locale, 'جدول ترتيب', 'Standings for')} ${league.name} ${pick(locale, 'بالنقاط، فارق الأهداف، ومناطق التأهل من المصدر الحقيقي.', 'with points, goal difference and qualification zones from the real source.')}`,
    path: `/league/${slug}/standings`,
  });
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

export default function StandingsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <StandingsPageBody params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function StandingsPageBody({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const locale = await getLocale();
  const { slug } = await params;
  const { season: requestedSeason } = await searchParams;
  const dossier = await loadLeagueDossier(slug, { season: requestedSeason });
  if (!dossier) notFound();

  const { league, standings, seasonId, seasons } = dossier;
  const podium = standings.slice(0, 3);
  const total = standings.length;
  const hasUclZones = standings.some((row) => row.zone === 'direct' || row.zone === 'playoff');
  const leader = standings[0];
  const leaderPts = leader?.points ?? 0;

  const signature = [
    standings.length > 0
      ? { value: standings.length, label: pick(locale, 'فريق', 'Clubs') }
      : null,
    leader
      ? { value: leader.points, label: pick(locale, 'نقاط المتصدر', 'Leader pts') }
      : null,
    leader
      ? {
          value: leader.goalsFor - leader.goalsAgainst > 0
            ? `+${leader.goalsFor - leader.goalsAgainst}`
            : leader.goalsFor - leader.goalsAgainst,
          label: pick(locale, 'فارق المتصدر', 'Leader GD'),
        }
      : null,
    seasonId ? { value: seasonId, label: pick(locale, 'الموسم', 'Season') } : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>;

  return (
    <LeagueChapterShell
      locale={locale}
      slug={slug}
      current="standings"
      kicker={pick(locale, 'سجل البطولة', 'Championship ledger')}
      title={`${pick(locale, 'ترتيب', 'Standings')} ${league.name}`}
      subtitle={pick(
        locale,
        'المراكز، النقاط، فارق الأهداف، الفورم، ومناطق التأهل من المصدر فقط.',
        'Ranks, points, goal difference, form and qualification zones from source only.'
      )}
      leagueName={league.name}
      logoUrl={league.logoUrl}
      seasonId={seasonId}
      seasons={seasons}
      seasonHref={(value) => `/league/${slug}/standings?season=${value}`}
      signature={signature}
      ghost={seasonId || undefined}
    >
      {standings.length === 0 ? (
        <div className="league-plate px-6 py-16 text-center">
          <Trophy className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-5 text-lg font-bold">
            {pick(locale, 'لا يوجد جدول ترتيب لهذا الموسم', 'No standings for this season')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(locale, 'سيظهر الجدول فور مزامنة بيانات الترتيب.', 'The table will appear once standings data is synchronized.')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {podium.length > 0 ? (
            <section className="lch-podium club-rise">
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((row) => {
                const isLead = row.rank === 1;
                const gd = row.goalsFor - row.goalsAgainst;
                return (
                  <Link
                    key={row.id}
                    href={row.team.slug ? `/team/${row.team.slug}` : `/league/${slug}/standings`}
                    className={`lch-podium-card${isLead ? ' is-lead' : ''}`}
                  >
                    <span className="lch-podium-rank">{row.rank}</span>
                    <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-12 w-12" />
                    <strong>{row.team.name}</strong>
                    <em>
                      {row.points} {pick(locale, 'نقطة', 'pts')} · {gd > 0 ? `+${gd}` : gd}{' '}
                      {pick(locale, 'ف.أ', 'GD')}
                    </em>
                    <FormPips letters={row.form} />
                  </Link>
                );
              })}
            </section>
          ) : null}

          <section className="league-plate club-rise !p-0 overflow-hidden">
            <div className="border-b border-[rgba(15,23,42,0.06)] px-5 py-4 dark:border-white/8">
              <ChapterSectionHead
                folio="01"
                kicker={pick(locale, 'الجدول الكامل', 'Full table')}
                title={pick(locale, 'لوحة النقاط الرسمية', 'Official points board')}
              />
              {hasUclZones ? (
                <div className="league-zone-legend !mb-0 mt-3">
                  <span className="is-direct">{pick(locale, '1–8 مباشر', '1–8 direct')}</span>
                  <span className="is-playoff">{pick(locale, '9–24 ملحق', '9–24 play-off')}</span>
                  <span className="is-out">{pick(locale, 'خارج', 'Out')}</span>
                </div>
              ) : total >= 8 ? (
                <div className="league-zone-legend !mb-0 mt-3">
                  <span className="is-direct">{pick(locale, 'تأهل / صدارة', 'Title / qualify')}</span>
                  <span className="is-playoff">{pick(locale, 'أوروبا', 'Europe')}</span>
                  <span className="is-out">{pick(locale, 'هبوط', 'Relegation')}</span>
                </div>
              ) : null}
            </div>

            <div className="lch-table-scroll">
              <div className="lch-table-head" aria-hidden>
                <span>#</span>
                <span>{pick(locale, 'الفريق', 'Club')}</span>
                <span>{pick(locale, 'ل', 'P')}</span>
                <span>{pick(locale, 'ف', 'W')}</span>
                <span>{pick(locale, 'ت', 'D')}</span>
                <span>{pick(locale, 'خ', 'L')}</span>
                <span>{pick(locale, 'له', 'GF')}</span>
                <span>{pick(locale, 'عليه', 'GA')}</span>
                <span>{pick(locale, 'ف ر', 'GD')}</span>
                <span>{pick(locale, 'ن', 'Pts')}</span>
                <span>{pick(locale, 'فرق', 'Gap')}</span>
              </div>

              <div className="lch-table-body">
                {standings.map((row) => {
                  const gd = row.goalsFor - row.goalsAgainst;
                  const zone = row.zone;
                  const gap = leaderPts - row.points;
                  return (
                    <Link
                      key={row.id}
                      href={row.team.slug ? `/team/${row.team.slug}` : `/league/${slug}/standings`}
                      className={`lch-table-row${row.rank === 1 ? ' is-lead' : ''}${
                        zone === 'direct' || zone === 'cl' ? ' is-direct' : ''
                      }${zone === 'playoff' || zone === 'el' ? ' is-playoff' : ''}${
                        zone === 'out' ? ' is-out' : ''
                      }${zone === 'rel' ? ' is-rel' : ''}`}
                      title={zoneLabel(locale, zone) || undefined}
                    >
                      <span className="lch-table-rank">{row.rank}</span>
                      <div className="lch-table-club">
                        <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-8 w-8" />
                        <div className="min-w-0">
                          <strong>{row.team.name}</strong>
                          <FormPips letters={row.form} />
                          {zoneLabel(locale, zone) ? (
                            <em className="lch-table-zone">{zoneLabel(locale, zone)}</em>
                          ) : null}
                        </div>
                      </div>
                      <span>{row.played}</span>
                      <span className="is-win">{row.won}</span>
                      <span>{row.drawn}</span>
                      <span className="is-loss">{row.lost}</span>
                      <span>{row.goalsFor}</span>
                      <span>{row.goalsAgainst}</span>
                      <span className={gd > 0 ? 'is-plus' : gd < 0 ? 'is-minus' : ''}>
                        {gd > 0 ? `+${gd}` : gd}
                      </span>
                      <strong className="lch-table-pts">{row.points}</strong>
                      <span className={`lch-table-gap${gap === 0 ? ' is-zero' : ''}`}>
                        {gap === 0 ? '—' : `-${gap}`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </div>
      )}
    </LeagueChapterShell>
  );
}
