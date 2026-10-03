import { Suspense } from 'react';
import type { Metadata } from 'next';
import { FrontSkeleton } from '@/components/front/FrontMark';
import { getLocale } from 'next-intl/server';
import { pick } from '@/i18n/pick';
import { pageMetadata } from '@/lib/seo/site';
import { ALL_STAT_KINDS, loadStatsDesk, resolveStatBoard, type StatKind, type StatSort } from '@/lib/stats/load-desk';
import { StatsCentre } from '@/components/stats/StatsCentre';

export const revalidate = 90;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return pageMetadata({
    locale,
    title: pick(locale, 'مركز الإحصائيات', 'Stats centre'),
    description: pick(
      locale,
      'هدافون وتمريرات حاسمة وتسديد ودفاع وحراس وفرق من المصدر.',
      'Scorers, assists, shots, defence, keepers and teams from the source.',
    ),
    path: '/stats',
  });
}

function parseKind(raw?: string): StatKind {
  return ALL_STAT_KINDS.includes(raw as StatKind) ? (raw as StatKind) : 'goals';
}

function parseSort(raw?: string): StatSort {
  if (raw === 'apps' || raw === 'minutes' || raw === 'name') return raw;
  return 'value';
}

export default function StatsPage(props: {
  searchParams: Promise<{ league?: string; kind?: string; season?: string; q?: string; sort?: string }>;
}) {
  return (
    <Suspense fallback={<FrontSkeleton kind="hero" />}>
      <StatsPageBody searchParams={props.searchParams} />
    </Suspense>
  );
}

async function StatsPageBody({
  searchParams,
}: {
  searchParams: Promise<{ league?: string; kind?: string; season?: string; q?: string; sort?: string }>;
}) {
  const locale = await getLocale();
  const params = await searchParams;
  const board = resolveStatBoard(params.league);
  const kind = parseKind(params.kind);
  const seasonYear = Number.parseInt(params.season || '', 10);
  const sort = parseSort(params.sort);
  const desk = await loadStatsDesk(board.id, kind, Number.isFinite(seasonYear) ? seasonYear : undefined, {
    q: params.q,
    sort,
  });
  return <StatsCentre locale={locale} desk={desk} leagueId={board.id} kind={kind} q={params.q} sort={sort} />;
}
