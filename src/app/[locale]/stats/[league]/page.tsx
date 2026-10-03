import { redirect } from 'next/navigation';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { resolveStatBoard } from '@/lib/stats/load-desk';

export default async function StatsLeaguePage({
  params,
}: {
  params: Promise<{ league: string }>;
}) {
  const { league } = await params;
  const board = resolveStatBoard(league);
  redirect(`/stats/${board.slug}/${currentFootballSeason()}`);
}
