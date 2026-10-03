import { swallow } from '@/lib/ops/caught';
import { prisma } from '@/lib/prisma';
import { sportsData } from '@/lib/sports-data';
import { isLiveSportsApi } from '@/lib/sports-data/config';
import { upsertTeam } from '@/lib/sports-data/persistence';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { STAT_BOARDS } from '@/lib/stats/load-desk';
import type { NormalizedStanding } from '@/lib/sports-data/types';
import { safeRedisGet, safeRedisSet } from '../redis';

export async function persistLeagueStandings(
  leagueDbId: string,
  seasonId: string,
  rows: NormalizedStanding[],
) {
  if (rows.length === 0) return 0;
  const keptTeamIds: string[] = [];

  for (const row of rows) {
    const team = await upsertTeam({
      externalId: row.team.externalId || row.team.id,
      name: row.team.name,
      slug: row.team.slug,
      logoUrl: row.team.logoUrl,
    });
    if (!team) continue;
    keptTeamIds.push(team.id);
    await prisma.standing
      .upsert({
        where: {
          leagueId_seasonId_teamId: {
            leagueId: leagueDbId,
            seasonId,
            teamId: team.id,
          },
        },
        update: {
          rank: row.rank,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
        },
        create: {
          leagueId: leagueDbId,
          seasonId,
          teamId: team.id,
          rank: row.rank,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
        },
      })
      .catch(swallow(`standings.persist.${leagueDbId}.${row.team.externalId}`, null));
  }

  if (keptTeamIds.length > 0) {
    await prisma.standing
      .deleteMany({
        where: {
          leagueId: leagueDbId,
          seasonId,
          teamId: { notIn: keptTeamIds },
        },
      })
      .catch(swallow(`standings.prune.${leagueDbId}.${seasonId}`, null));
  }

  return keptTeamIds.length;
}

async function resolveSeason(leagueExternalId: string, preferred: string) {
  const seasons = [preferred, String(Number(preferred) - 1)].filter(
    (value, index, list) => value && list.indexOf(value) === index,
  );
  for (const season of seasons) {
    const rows = await sportsData.getStandings(leagueExternalId, season);
    if (rows.length > 0) return { season, rows };
  }
  return { season: preferred, rows: [] as NormalizedStanding[] };
}

export async function refreshLeagueStandings(leagueExternalId: string, seasonHint?: string) {
  if (!isLiveSportsApi() || !leagueExternalId) return 0;
  const preferred = seasonHint || String(currentFootballSeason());
  const { season, rows } = await resolveSeason(leagueExternalId, preferred);
  if (rows.length === 0) return 0;

  const league = await prisma.league.findFirst({
    where: { externalId: leagueExternalId },
    select: { id: true },
  });
  if (!league) return 0;
  return persistLeagueStandings(league.id, season, rows);
}

export async function refreshFeaturedStandings() {
  if (!isLiveSportsApi()) return { boards: 0, rows: 0 };
  const season = String(currentFootballSeason());
  let rows = 0;
  await Promise.all(
    STAT_BOARDS.map(async (board) => {
      rows += await refreshLeagueStandings(board.id, season);
    }),
  );
  return { boards: STAT_BOARDS.length, rows };
}

export async function maybeRefreshFeaturedStandings() {
  const lock = await safeRedisGet<string>('sports:standings:lock');
  if (lock) return { boards: 0, rows: 0, skipped: true as const };
  await safeRedisSet('sports:standings:lock', '1', { ex: 300 });
  const result = await refreshFeaturedStandings();
  return { ...result, skipped: false as const };
}
