import { reportCaughtError } from '@/lib/ops/caught';
import React, { Suspense } from 'react';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowUpRight, Crown, History, Trophy } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { loadLeagueDossier } from '@/lib/leagues/load-dossier';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';
import luxuryStyles from '@/components/leagues/league-luxury.module.css';

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
      title: pick(locale, 'أرشيف البطولة', 'League archive'),
      description: pick(locale, 'الأرشيف غير متاح.', 'Archive is unavailable.'),
      path: `/league/${slug}/archive`,
      noIndex: true,
    });
  }
  return pageMetadata({
    locale,
    title: `${pick(locale, 'أرشيف', 'Archive')} ${league.name}`,
    description: `${pick(locale, 'سجل مواسم', 'Season record for')} ${league.name} ${pick(locale, 'من المصدر الحقيقي فقط.', 'from the real source only.')}`,
    path: `/league/${slug}/archive`,
  });
}

export default function LeagueArchivePage(props: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <LeagueArchivePageBody params={props.params} />
    </Suspense>
  );
}

async function LeagueArchivePageBody({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await getLocale();
  const { slug } = await params;
  const dossier = await loadLeagueDossier(slug);
  if (!dossier) notFound();

  const { league, archiveSeasons, seasonId } = dossier;

  const champions = await softChampions(league.id);
  const championBySeason = new Map(champions.map((row) => [row.seasonId, row]));

  const withChampion = archiveSeasons.filter((season) => championBySeason.has(season.seasonId));
  const current = archiveSeasons.find((season) => season.current) || archiveSeasons[0];

  const signature = [
    archiveSeasons.length > 0
      ? { value: archiveSeasons.length, label: pick(locale, 'موسم', 'Seasons') }
      : null,
    withChampion.length > 0
      ? { value: withChampion.length, label: pick(locale, 'بطل مسجّل', 'Champions') }
      : null,
    current
      ? { value: current.seasonId, label: pick(locale, 'الأحدث', 'Latest') }
      : null,
  ].filter(Boolean) as Array<{ value: string | number; label: string }>;

  return (
    <LeagueChapterShell
      locale={locale}
      slug={slug}
      current="archive"
      kicker={pick(locale, 'الخزنة', 'The Vault')}
      title={pick(locale, 'خزنة المواسم', 'Season vault')}
      subtitle={pick(
        locale,
        `سجل ${league.name} من المصدر — مواسم وتواريخ وأبطال عند توفرهم.`,
        `The record of ${league.name} from source — seasons, dates and champions when available.`
      )}
      leagueName={league.name}
      logoUrl={league.logoUrl}
      statsLeagueId={league.externalId}
      seasonId={seasonId}
      signature={signature}
      ghost={archiveSeasons.length ? String(archiveSeasons.length) : undefined}
    >
      {archiveSeasons.length === 0 ? (
        <div className="league-plate px-6 py-16 text-center">
          <History className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">
            {pick(locale, 'لا توجد مواسم مسجّلة من المصدر بعد.', 'No seasons are recorded from the source yet.')}
          </p>
        </div>
      ) : (
        <section className="league-plate club-rise !p-0 overflow-hidden">
          <div className="border-b border-[rgba(15,23,42,0.06)] px-5 py-4 dark:border-white/8">
            <ChapterSectionHead
              folio="01"
              kicker={pick(locale, 'الخزنة الملكية', 'Royal Vault')}
              title={pick(locale, 'أرشيف المواسم وتاريخ الأبطال', 'Championship History & Season Vault')}
              note={pick(locale, 'اضغط على أي موسم لاستعراض ترتيبه ونتائجه الكاملة.', 'Select any season to explore its full standings and records.')}
            />
          </div>

          <div className="p-5">
            <div className={luxuryStyles.trophyVaultGrid}>
              {archiveSeasons.map((season, index) => {
                const champion = championBySeason.get(season.seasonId);
                const active = season.seasonId === seasonId || Boolean(season.current);

                return (
                  <Link
                    key={season.seasonId}
                    href={`/league/${slug}?season=${season.seasonId}`}
                    className={`${luxuryStyles.vaultCard}${active ? ` ${luxuryStyles.vaultCardCurrent}` : ''}`}
                  >
                    <div className={luxuryStyles.vaultHeader}>
                      <span className={luxuryStyles.vaultSeasonYear}>
                        {season.seasonId}
                      </span>
                      {season.current ? (
                        <span className={`${luxuryStyles.cardBadge} border-emerald-500/30 bg-emerald-500/10 text-emerald-400`}>
                          ⚡ {pick(locale, 'الموسم الجاري', 'Current')}
                        </span>
                      ) : champion ? (
                        <span className={luxuryStyles.cardBadge}>
                          <Crown size={12} />
                          <span>{pick(locale, 'بطل مسجّل', 'Champion')}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          #{String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {champion ? (
                      <div className={luxuryStyles.vaultChampBody}>
                        <div style={{ padding: '0.4rem', borderRadius: '0.75rem', background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(245,158,11,0.3)' }}>
                          <LeagueCrest
                            name={champion.team.name}
                            logoUrl={champion.team.logoUrl}
                            className="h-10 w-10"
                          />
                        </div>
                        <div className={luxuryStyles.vaultChampInfo}>
                          <span className={luxuryStyles.vaultChampLabel}>
                            {pick(locale, 'بطل الموسم', 'Season Champion')}
                          </span>
                          <strong className={luxuryStyles.vaultChampName}>
                            {localizeTeamName(locale, champion.team.name)}
                          </strong>
                          <span className={luxuryStyles.vaultChampStats}>
                            {champion.points} {pick(locale, 'نقطة', 'pts')} · {champion.played} {pick(locale, 'مباراة', 'matches')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className={luxuryStyles.vaultChampBody}>
                        <div style={{ padding: '0.4rem', borderRadius: '0.75rem', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <History className="h-9 w-9 text-slate-400" />
                        </div>
                        <div className={luxuryStyles.vaultChampInfo}>
                          <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                            {pick(locale, 'سجل الموسم', 'Season Record')}
                          </span>
                          <strong style={{ fontSize: '0.9rem', color: '#f8fafc' }}>
                            {season.current
                              ? pick(locale, 'منافسات الموسم جارية', 'Season in progress')
                              : pick(locale, 'أرشيف موثق في السجل', 'Documented in archive')}
                          </strong>
                          {season.teams ? (
                            <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                              {season.teams} {pick(locale, 'أندية مسجلة', 'registered clubs')}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700 }}>
                      <span>{pick(locale, 'استعراض تفاصيل الموسم', 'View Season Dossier')}</span>
                      <ArrowUpRight size={13} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </LeagueChapterShell>
  );
}

async function softChampions(leagueId: string) {
  try {
    return await prisma.standing.findMany({
      where: { leagueId, rank: 1 },
      select: {
        seasonId: true,
        points: true,
        played: true,
        team: { select: { name: true, logoUrl: true, slug: true } },
      },
    });
  } catch (error) {
    reportCaughtError("src/app/[locale]/league/[slug]/archive/page.tsx:190", error);
    return [];
  }
}
