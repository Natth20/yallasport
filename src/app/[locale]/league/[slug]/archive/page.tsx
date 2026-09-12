import React from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { History } from 'lucide-react';
import { LeagueCrest } from '@/components/leagues/LeagueCrest';
import { ChapterSectionHead, LeagueChapterShell } from '@/components/leagues/LeagueChapterShell';
import { pick } from '@/i18n/pick';
import { loadLeagueDossier } from '@/lib/leagues/load-dossier';
import { prisma } from '@/lib/prisma';
import { pageMetadata } from '@/lib/seo/site';

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

export default async function LeagueArchivePage({ params }: { params: Promise<{ slug: string }> }) {
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
        <section className="league-plate club-rise">
          <ChapterSectionHead
            folio="01"
            kicker={pick(locale, 'الخط الزمني', 'Timeline')}
            title={pick(locale, 'المواسم المحفوظة', 'Stored seasons')}
            note={pick(locale, 'اضغط موسماً لفتح ملفه.', 'Open a season folio.')}
          />

          <ol className="lch-archive-timeline">
            {archiveSeasons.map((season, index) => {
              const champion = championBySeason.get(season.seasonId);
              const active = season.seasonId === seasonId || Boolean(season.current);
              return (
                <li key={season.seasonId}>
                  <Link
                    href={`/league/${slug}?season=${season.seasonId}`}
                    className={`lch-archive-card${active ? ' is-active' : ''}`}
                  >
                    <span className="lch-archive-index" aria-hidden>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="lch-archive-year">
                      <strong>{season.seasonId}</strong>
                      {season.current ? (
                        <em>{pick(locale, 'الحالي', 'Current')}</em>
                      ) : null}
                    </div>
                    <div className="lch-archive-body">
                      {champion ? (
                        <div className="lch-archive-champ">
                          <LeagueCrest
                            name={champion.team.name}
                            logoUrl={champion.team.logoUrl}
                            className="h-10 w-10"
                          />
                          <div className="min-w-0">
                            <span className="lch-archive-label">
                              {pick(locale, 'البطل', 'Champion')}
                            </span>
                            <strong>{champion.team.name}</strong>
                            <em>
                              {champion.points} {pick(locale, 'نقطة', 'pts')} · {champion.played}{' '}
                              {pick(locale, 'مباراة', 'played')}
                            </em>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="lch-archive-label">
                            {pick(locale, 'الحالة', 'Status')}
                          </span>
                          <strong>
                            {season.current
                              ? pick(locale, 'الموسم الجاري', 'Ongoing season')
                              : pick(locale, 'موسم مسجّل في المصدر', 'Season on record')}
                          </strong>
                        </div>
                      )}
                      {(season.start || season.end) && (
                        <p className="lch-archive-dates">
                          {[season.start, season.end].filter(Boolean).join(' → ')}
                        </p>
                      )}
                      {season.teams ? (
                        <p className="lch-archive-dates">
                          {season.teams} {pick(locale, 'فريق في السجل', 'teams on ledger')}
                        </p>
                      ) : null}
                    </div>
                    <span className="lch-archive-cta">
                      {pick(locale, 'فتح', 'Open')}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
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
  } catch {
    return [];
  }
}
