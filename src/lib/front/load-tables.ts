import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { STAT_BOARDS } from '@/lib/stats/load-desk';
import { standingZone } from '@/lib/leagues/load-dossier';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontTable } from './types';

export async function loadFrontTables(locale: string): Promise<FrontTable[]> {
  const season = String(currentFootballSeason());
  const previous = String(currentFootballSeason() - 1);
  const ids = STAT_BOARDS.map((board) => board.id);

  const packed = await cachedJson(`front:tables:${season}`, 180, async () => {
    const leagues = await prisma.league
      .findMany({
        where: { externalId: { in: [...ids] } },
        select: { id: true, externalId: true, name: true, slug: true, logoUrl: true, country: true },
      })
      .catch(swallow('front.tables.leagues', []));

    const byExternal = new Map(leagues.map((league) => [league.externalId, league]));
    const tables: FrontTable[] = [];

    for (const board of STAT_BOARDS) {
      const league = byExternal.get(board.id);
      if (!league) continue;
      let seasonId = season;
      let rows = await prisma.standing
        .findMany({
          where: { leagueId: league.id, seasonId },
          orderBy: { rank: 'asc' },
          take: 8,
          include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
        .catch(swallow(`front.tables.${board.id}`, []));
      if (rows.length === 0) {
        seasonId = previous;
        rows = await prisma.standing
          .findMany({
            where: { leagueId: league.id, seasonId },
            orderBy: { rank: 'asc' },
            take: 8,
            include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
          })
          .catch(swallow(`front.tables.${board.id}.prev`, []));
      }
      if (rows.length === 0) continue;
      const total = await prisma.standing
        .count({ where: { leagueId: league.id, seasonId } })
        .catch(swallow(`front.tables.${board.id}.count`, rows.length));
      tables.push({
        league: {
          id: league.id,
          name: league.name,
          slug: league.slug,
          logoUrl: league.logoUrl,
          country: league.country,
        },
        seasonId,
        rows: rows.map((row) => ({
          rank: row.rank,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          points: row.points,
          zone: standingZone(row.rank, total, league.name),
          team: {
            id: row.team.id,
            name: row.team.name,
            slug: row.team.slug,
            logoUrl: row.team.logoUrl,
          },
        })),
      });
    }
    return tables;
  });

  return packed.map((table) => ({
    ...table,
    league: {
      ...table.league,
      name: localizePlainName(locale, table.league.name),
      country: table.league.country ? localizePlainName(locale, table.league.country) : table.league.country,
    },
    rows: table.rows.map((row) => ({
      ...row,
      team: { ...row.team, name: localizePlainName(locale, row.team.name) },
    })),
  }));
}
