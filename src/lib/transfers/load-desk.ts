import { prisma } from '@/lib/prisma';
import { currentFootballSeason, footballSeasonStart, inFootballSeason } from '@/lib/sports-data/season';
import { safeRedisGet } from '@/lib/redis';
import { feeToNumber, mercatoWindow, splitTransferType, type TransferKind } from './fee';

export type TransferMove = {
  id: string;
  date: Date;
  playerName: string;
  playerSlug: string | null;
  playerPhoto: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  fromLogo: string | null;
  toLogo: string | null;
  fromSlug: string | null;
  toSlug: string | null;
  fee: string | null;
  type: string | null;
  kind: TransferKind;
  window: 'summer' | 'winter' | 'other';
};

export async function loadTransferDesk(filters: {
  club?: string;
  player?: string;
  season?: string;
  kind?: string;
  window?: string;
}) {
  const current = currentFootballSeason();
  const seasonYear = Number.parseInt(filters.season || '', 10);
  const since = footballSeasonStart(current - 1);

  const rowsRaw = await prisma.transfer.findMany({
    where: { date: { gte: since } },
    orderBy: { date: 'desc' },
    take: 400,
    include: {
      player: { select: { name: true, slug: true, photoUrl: true } },
    },
  });

  const teamIds = [
    ...new Set(rowsRaw.flatMap((row) => [row.fromTeamId, row.toTeamId]).filter(Boolean) as string[]),
  ];
  const teams = teamIds.length
    ? await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, slug: true, logoUrl: true },
      })
    : [];
  const teamById = new Map(teams.map((row) => [row.id, row]));

  let rows: TransferMove[] = rowsRaw.map((row) => {
    const parsed = splitTransferType(row.type || row.fee);
    const from = row.fromTeamId ? teamById.get(row.fromTeamId) : null;
    const to = row.toTeamId ? teamById.get(row.toTeamId) : null;
    return {
      id: row.id,
      date: row.date,
      playerName: row.player.name,
      playerSlug: row.player.slug,
      playerPhoto: row.player.photoUrl,
      fromTeam: row.fromTeam,
      toTeam: row.toTeam,
      fromLogo: row.fromLogo || from?.logoUrl || null,
      toLogo: row.toLogo || to?.logoUrl || null,
      fromSlug: from?.slug || null,
      toSlug: to?.slug || null,
      fee: row.fee || parsed.fee,
      type: parsed.type || row.type,
      kind: parsed.kind,
      window: mercatoWindow(row.date),
    };
  });

  const seenNear = new Set<string>();
  rows = rows.filter((row) => {
    const stamp = `${row.playerName}|${row.toTeam}|${row.date.toISOString().slice(0, 7)}`;
    if (seenNear.has(stamp)) return false;
    seenNear.add(stamp);
    return true;
  });

  const freq = new Map<string, number>();
  for (const row of rows) {
    for (const name of [row.fromTeam, row.toTeam]) {
      if (!name) continue;
      freq.set(name, (freq.get(name) || 0) + 1);
    }
  }
  const clubs = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name)
    .slice(0, 60);
  const players = [...new Map(rows.map((row) => [row.playerName, row])).values()]
    .map((row) => ({ name: row.playerName, slug: row.playerSlug }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const seasons = [current, current - 1];

  if (filters.club) {
    const needle = filters.club.toLowerCase();
    rows = rows.filter(
      (row) => row.fromTeam?.toLowerCase().includes(needle) || row.toTeam?.toLowerCase().includes(needle),
    );
  }
  if (filters.player) {
    rows = rows.filter(
      (row) =>
        row.playerSlug === filters.player || row.playerName.toLowerCase().includes(filters.player!.toLowerCase()),
    );
  }
  if (Number.isFinite(seasonYear) && seasonYear > 1990) {
    rows = rows.filter((row) => inFootballSeason(row.date, seasonYear));
  }
  if (filters.kind === 'loan' || filters.kind === 'free' || filters.kind === 'move') {
    rows = rows.filter((row) => row.kind === filters.kind);
  }
  if (filters.window === 'summer' || filters.window === 'winter') {
    rows = rows.filter((row) => row.window === filters.window);
  }

  const headline = [...rows].sort((a, b) => (feeToNumber(b.fee) || 0) - (feeToNumber(a.fee) || 0))[0] || null;
  const meta = await safeRedisGet<{ syncedAt?: string; source?: string }>('sports:meta:transfers');

  return {
    rows: rows.slice(0, 160),
    clubs,
    players,
    seasons,
    seasonLabel: current,
    fromSeason: current - 1,
    headline: headline && feeToNumber(headline.fee) ? headline : null,
    syncedAt: meta?.syncedAt || null,
    source: meta?.source || null,
  };
}
