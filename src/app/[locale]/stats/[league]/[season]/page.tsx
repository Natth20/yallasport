import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { ALL_STAT_KINDS, loadStatsDesk, resolveStatBoard, type StatKind, type StatSort } from '@/lib/stats/load-desk';
import { StatsCentre } from '@/components/stats/StatsCentre';

export const revalidate = 90;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ league: string; season: string }>;
}): Promise<Metadata> {
  const locale = await getLocale();
  const { league, season } = await params;
  const board = resolveStatBoard(league);
  const name = locale === 'en' ? board.en : board.ar;
  return pageMetadata({
    locale,
    title: pick(locale, `إحصائيات ${name} ${season}`, `${name} ${season} stats`),
    description: pick(locale, `أرقام ${name} موسم ${season} من المصدر.`, `${name} ${season} figures from the source.`),
    path: `/stats/${board.slug}/${season}`,
  });
}

function parseKind(raw?: string): StatKind {
  return ALL_STAT_KINDS.includes(raw as StatKind) ? (raw as StatKind) : 'goals';
}

function parseSort(raw?: string): StatSort {
  if (raw === 'apps' || raw === 'minutes' || raw === 'name') return raw;
  return 'value';
}

export default function StatsSeasonPage(props: {
  params: Promise<{ league: string; season: string }>;
  searchParams: Promise<{ kind?: string; q?: string; sort?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <Body params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Body({
  params,
  searchParams,
}: {
  params: Promise<{ league: string; season: string }>;
  searchParams: Promise<{ kind?: string; q?: string; sort?: string }>;
}) {
  const locale = await getLocale();
  const { league, season } = await params;
  const query = await searchParams;
  const board = resolveStatBoard(league);
  const kind = parseKind(query.kind);
  const seasonYear = Number.parseInt(season, 10);
  const sort = parseSort(query.sort);
  const desk = await loadStatsDesk(board.id, kind, Number.isFinite(seasonYear) ? seasonYear : undefined, {
    q: query.q,
    sort,
  });
  return <StatsCentre locale={locale} desk={desk} leagueId={board.id} kind={kind} q={query.q} sort={sort} />;
}
