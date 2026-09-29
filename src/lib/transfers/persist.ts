import { swallow } from '@/lib/ops/caught';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { sportsData } from '@/lib/sports-data';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { currentFootballSeason, footballSeasonStart } from '@/lib/sports-data/season';
import { playerSlugFor } from '@/lib/players/search';
import { STAT_BOARDS } from '@/lib/stats/load-desk';
import { splitTransferType } from './fee';

type ApiTeamTransfers = {
  response?: Array<{
    player?: { id?: number; name?: string };
    transfers?: Array<{
      date?: string;
      type?: string;
      teams?: {
        in?: { id?: number; name?: string; logo?: string };
        out?: { id?: number; name?: string; logo?: string };
      };
    }>;
  }>;
};

function isSideSquad(name: string | null) {
  if (!name) return false;
  return /\b(u1[5-9]|u2[0-3]|youth|reserves?|academy|ii\b| b\b|sub-?23)\b/i.test(` ${name} `);
}

async function deskClubs() {
  const leagueIds = STAT_BOARDS.map((board) => board.id);
  const select = { externalId: true, name: true, id: true, logoUrl: true } as const;
  const fromStandings = await prisma.team.findMany({
    where: { standings: { some: { league: { externalId: { in: leagueIds } } } } },
    take: 48,
    select,
  });
  if (fromStandings.length >= 12) return fromStandings.slice(0, 32);

  const since = footballSeasonStart(currentFootballSeason() - 1);
  const recent = await prisma.match.findMany({
    where: { league: { externalId: { in: leagueIds } }, kickoffAt: { gte: since } },
    orderBy: { kickoffAt: 'desc' },
    take: 180,
    select: { homeTeam: { select }, awayTeam: { select } },
  });
  const seen = new Map(fromStandings.map((club) => [club.externalId, club]));
  for (const match of recent) {
    for (const club of [match.homeTeam, match.awayTeam]) {
      if (!seen.has(club.externalId)) seen.set(club.externalId, club);
      if (seen.size >= 32) break;
    }
    if (seen.size >= 32) break;
  }
  return [...seen.values()].slice(0, 32);
}

async function rememberPlayer(externalId: string, name: string) {
  const existing = await prisma.player.findUnique({
    where: { externalId },
    select: { id: true },
  });
  if (existing) return existing.id;
  try {
    const created = await prisma.player.create({
      data: {
        externalId,
        name,
        slug: playerSlugFor(name, externalId),
      },
      select: { id: true },
    });
    return created.id;
  } catch {
    const again = await prisma.player.findUnique({ where: { externalId }, select: { id: true } });
    return again?.id ?? null;
  }
}

export async function persistTransfers() {
  const since = footballSeasonStart(currentFootballSeason() - 1);
  const clubs = await deskClubs();
  if (clubs.length === 0) return { upserted: 0, clubs: 0 };

  const teamByExt = new Map(clubs.map((club) => [club.externalId, club]));
  let upserted = 0;

  for (let i = 0; i < clubs.length; i += 8) {
    const chunk = clubs.slice(i, i + 8);
    const packs = await Promise.all(
      chunk.map((club) =>
        sportsData.getRaw<ApiTeamTransfers>(`/transfers?team=${encodeURIComponent(club.externalId)}`),
      ),
    );
    for (const pack of packs) {
      for (const row of pack?.response || []) {
        const playerName = row.player?.name?.trim();
        const playerExt = row.player?.id != null ? String(row.player.id) : '';
        if (!playerName || !playerExt) continue;
        const playerId = await rememberPlayer(playerExt, playerName);
        if (!playerId) continue;
        for (const move of row.transfers || []) {
          if (!move.date) continue;
          const date = new Date(move.date);
          if (Number.isNaN(date.getTime()) || date < since) continue;
          const fromTeam = move.teams?.out?.name || null;
          const toTeam = move.teams?.in?.name || null;
          if (fromTeam && toTeam && fromTeam.toLowerCase() === toTeam.toLowerCase()) continue;
          if (!fromTeam && !toTeam) continue;
          if (isSideSquad(fromTeam) || isSideSquad(toTeam)) continue;
          const parsed = splitTransferType(move.type);
          const externalId = `${playerExt}-${move.date}-${move.teams?.in?.id || ''}-${move.teams?.out?.id || ''}`;
          const fromExt = move.teams?.out?.id != null ? String(move.teams.out.id) : '';
          const toExt = move.teams?.in?.id != null ? String(move.teams.in.id) : '';
          await prisma.transfer
            .upsert({
              where: { externalId },
              update: {
                fromTeam,
                toTeam,
                fromLogo: move.teams?.out?.logo || teamByExt.get(fromExt)?.logoUrl || null,
                toLogo: move.teams?.in?.logo || teamByExt.get(toExt)?.logoUrl || null,
                fromTeamId: teamByExt.get(fromExt)?.id || null,
                toTeamId: teamByExt.get(toExt)?.id || null,
                fee: parsed.fee,
                type: parsed.type,
                syncedAt: new Date(),
              },
              create: {
                externalId,
                playerId,
                playerExternalId: playerExt,
                fromTeam,
                toTeam,
                fromLogo: move.teams?.out?.logo || teamByExt.get(fromExt)?.logoUrl || null,
                toLogo: move.teams?.in?.logo || teamByExt.get(toExt)?.logoUrl || null,
                fromTeamId: teamByExt.get(fromExt)?.id || null,
                toTeamId: teamByExt.get(toExt)?.id || null,
                date,
                fee: parsed.fee,
                type: parsed.type,
              },
            })
            .catch(swallow('persistTransfers.upsert', null));
          upserted += 1;
        }
      }
    }
  }

  const syncedAt = new Date().toISOString();
  await redis.set(
    'sports:meta:transfers',
    { syncedAt, upserted, clubs: clubs.length, source: isLiveSportsApi() ? 'LIVE' : 'EMPTY' },
    { ex: 86400 * 3 },
  );
  return { upserted, clubs: clubs.length, syncedAt };
}
