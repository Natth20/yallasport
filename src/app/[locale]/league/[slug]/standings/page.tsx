import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Award, Crown, Shield, Trophy } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { loadLeagueDossier, type StandingZone } from '@/lib/leagues/load-dossier';
import { pageMetadata } from '@/lib/seo/site';
import { formatLeagueSeason, localizeCompetitionTitle } from '@/lib/i18n/competition-names';
import luxuryStyles from '@/components/leagues/league-luxury.module.css';

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
      title: pick(locale, 'جدول الترتيب', 'Standings'),
      description: pick(locale, 'جدول الترتيب غير متاح.', 'Standings are unavailable.'),
      path: `/league/${slug}/standings`,
      noIndex: true,
    });
  }
  const name = localizeCompetitionTitle(locale, dossier.league);
  const season = formatLeagueSeason(dossier.seasonId);
  const seasonBit = season ? ` ${season}` : '';
  return pageMetadata({
    locale,
    title: pick(locale, `ترتيب ${name}${seasonBit} | يلا سبورت`, `${name}${seasonBit} standings | Yalla Sport`),
    description: pick(
      locale,
      `جدول ترتيب ${name}${seasonBit} بالنقاط وفارق الأهداف ومناطق التأهل من المصدر.`,
      `Standings for ${name}${seasonBit} with points, goal difference and qualification zones from the source.`
    ),
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
    seasonId ? { value: formatLeagueSeason(seasonId) || seasonId, label: pick(locale, 'الموسم', 'Season') } : null,
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
      statsLeagueId={league.externalId}
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
            {pick(locale, 'البيانات غير متاحة من المصدر', 'Data is not available from the source')}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {pick(
              locale,
              'مزود البيانات لم يُرجع جدول ترتيب لهذا الموسم. هذا لا يعني أن البطولة بلا ترتيب.',
              'The data provider did not return a table for this season. That does not mean the competition has no standings.'
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {podium.length > 0 ? (
            <section className={luxuryStyles.podiumSuite} aria-label={pick(locale, 'منصة صدارة الترتيب', 'Top 3 Podium')}>
              {[podium[1], podium[0], podium[2]].filter(Boolean).map((row) => {
                const isLead = row.rank === 1;
                const isSecond = row.rank === 2;
                const gd = row.goalsFor - row.goalsAgainst;
                const boxClass = isLead
                  ? `${luxuryStyles.podiumBox} ${luxuryStyles.goldChampion}`
                  : isSecond
                    ? `${luxuryStyles.podiumBox} ${luxuryStyles.silverChaser}`
                    : `${luxuryStyles.podiumBox} ${luxuryStyles.bronzeThird}`;
                const badgeClass = isLead
                  ? `${luxuryStyles.podiumCrownBadge} ${luxuryStyles.badgeGold}`
                  : isSecond
                    ? `${luxuryStyles.podiumCrownBadge} ${luxuryStyles.badgeSilver}`
                    : `${luxuryStyles.podiumCrownBadge} ${luxuryStyles.badgeBronze}`;

                return (
                  <Link
                    key={row.id}
                    href={row.team.slug ? `/team/${row.team.slug}` : `/league/${slug}/standings`}
                    className={boxClass}
                  >
                    <span className={badgeClass}>
                      {isLead ? <Crown size={14} /> : <Award size={14} />}
                      <span>#{row.rank} {isLead ? pick(locale, 'المتصدر', 'Leader') : isSecond ? pick(locale, 'الوصيف', '2nd') : pick(locale, 'الثالث', '3rd')}</span>
                    </span>

                    <div className={luxuryStyles.podiumCrestWrap}>
                      <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className={isLead ? 'h-16 w-16' : 'h-14 w-14'} />
                    </div>

                    <strong className={luxuryStyles.podiumClubName}>
                      {localizeTeamName(locale, row.team.name)}
                    </strong>

                    <div className={luxuryStyles.podiumMetrics}>
                      <strong>{row.points}</strong>
                      <span>{pick(locale, 'نقطة', 'pts')}</span>
                      <span style={{ marginInlineStart: '0.4rem', color: '#94a3b8' }}>
                        ({gd > 0 ? `+${gd}` : gd} {pick(locale, 'فارق', 'GD')})
                      </span>
                    </div>

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
                title={pick(locale, 'لوحة النقاط الرسمية الفاخرة', 'Official Championship Board')}
              />
              {hasUclZones ? (
                <div className="league-zone-legend !mb-0 mt-3">
                  <span className="is-direct">{pick(locale, '1–8 تأهل مباشر للأبطال', '1–8 direct UCL')}</span>
                  <span className="is-playoff">{pick(locale, '9–24 ملحق التأهل', '9–24 play-off')}</span>
                  <span className="is-out">{pick(locale, 'خارج المنافسة', 'Out')}</span>
                </div>
              ) : total >= 8 ? (
                <div className="league-zone-legend !mb-0 mt-3">
                  <span className="is-direct">{pick(locale, 'تأهل مباشر / أبطال أوروبا', 'Direct / Champions League')}</span>
                  <span className="is-playoff">{pick(locale, 'الدوري الأوروبي / المؤتمر', 'Europa / Conference')}</span>
                  <span className="is-out">{pick(locale, 'منطقة الهبوط', 'Relegation zone')}</span>
                </div>
              ) : null}
            </div>

            <div className={luxuryStyles.tableContainer}>
              <table className={luxuryStyles.royalTable}>
                <thead>
                  <tr>
                    <th style={{ width: '3.5rem' }}>#</th>
                    <th>{pick(locale, 'النادي والفريق', 'Club')}</th>
                    <th>{pick(locale, 'لعب', 'P')}</th>
                    <th>{pick(locale, 'فاز', 'W')}</th>
                    <th>{pick(locale, 'تعادل', 'D')}</th>
                    <th>{pick(locale, 'خسر', 'L')}</th>
                    <th>{pick(locale, 'له', 'GF')}</th>
                    <th>{pick(locale, 'عليه', 'GA')}</th>
                    <th>{pick(locale, 'الفارق', 'GD')}</th>
                    <th>{pick(locale, 'النقاط', 'Pts')}</th>
                    <th>{pick(locale, 'فارق الصدارة', 'Gap')}</th>
                    <th>{pick(locale, 'آخر 5 مباريات', 'Form')}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row) => {
                    const gd = row.goalsFor - row.goalsAgainst;
                    const zone = row.zone;
                    const gap = leaderPts - row.points;
                    const zoneClass = zone === 'direct' || zone === 'cl'
                      ? luxuryStyles.zoneCl
                      : zone === 'playoff' || zone === 'el'
                        ? luxuryStyles.zoneEl
                        : zone === 'rel' || zone === 'out'
                          ? luxuryStyles.zoneRel
                          : '';

                    return (
                      <tr key={row.id} className={luxuryStyles.tableRow}>
                        <td>
                          <span className={`${luxuryStyles.rankPill} ${zoneClass}`}>
                            {row.rank}
                          </span>
                        </td>
                        <td>
                          <Link
                            href={row.team.slug ? `/team/${row.team.slug}` : `/league/${slug}/standings`}
                            className={luxuryStyles.clubCell}
                          >
                            <LeagueCrest name={row.team.name} logoUrl={row.team.logoUrl} className="h-7 w-7" />
                            <div>
                              <strong>{localizeTeamName(locale, row.team.name)}</strong>
                              {zoneLabel(locale, zone) ? (
                                <span style={{ display: 'block', fontSize: '0.68rem', color: '#94a3b8' }}>
                                  {zoneLabel(locale, zone)}
                                </span>
                              ) : null}
                            </div>
                          </Link>
                        </td>
                        <td>{row.played}</td>
                        <td style={{ color: '#34d399', fontWeight: 800 }}>{row.won}</td>
                        <td style={{ color: '#94a3b8' }}>{row.drawn}</td>
                        <td style={{ color: '#f87171' }}>{row.lost}</td>
                        <td>{row.goalsFor}</td>
                        <td>{row.goalsAgainst}</td>
                        <td style={{ color: gd > 0 ? '#34d399' : gd < 0 ? '#f87171' : 'inherit', fontWeight: 700 }}>
                          {gd > 0 ? `+${gd}` : gd}
                        </td>
                        <td>
                          <span className={luxuryStyles.tablePointsBadge}>
                            {row.points}
                          </span>
                        </td>
                        <td style={{ color: gap === 0 ? '#fbbf24' : '#94a3b8', fontWeight: 700 }}>
                          {gap === 0 ? '—' : `-${gap}`}
                        </td>
                        <td>
                          <FormPips letters={row.form} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </LeagueChapterShell>
  );
}
