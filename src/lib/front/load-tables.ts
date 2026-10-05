import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { STAT_BOARDS } from '@/lib/stats/load-desk';
import { standingZone } from '@/lib/leagues/load-dossier';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { localizeTeamName } from '@/lib/i18n/sports-lexicon';
import { localizeCompetitionTitle, localizeCountryName } from '@/lib/i18n/competition-names';
import { maybeRefreshFeaturedStandings } from '@/lib/sports-data/standings-persist';
import type { FrontTable } from './types';

async function _loadFrontTables(locale: string): Promise<FrontTable[]> {
  const season = String(currentFootballSeason());
  const previous = String(currentFootballSeason() - 1);
  const ids = STAT_BOARDS.map((board) => board.id);

  const packed = await cachedJson(`front:tables:${season}:v5`, 180, async () => {
    void maybeRefreshFeaturedStandings().catch(swallow('front.tables.refresh', { boards: 0, rows: 0, skipped: true }));

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
          include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
        .catch(swallow(`front.tables.${board.id}`, []));
      if (rows.length === 0) {
        seasonId = previous;
        rows = await prisma.standing
          .findMany({
            where: { leagueId: league.id, seasonId },
            orderBy: { rank: 'asc' },
            include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
          })
          .catch(swallow(`front.tables.${board.id}.prev`, []));
      }
      if (rows.length === 0) continue;
      const total = rows.length;
      tables.push({
        league: {
          id: league.id,
          name: league.name,
          slug: league.slug,
          logoUrl: league.logoUrl,
          country: league.country,
          externalId: league.externalId,
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
          goalDiff: row.goalsFor - row.goalsAgainst,
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

  return (packed || []).map((table) => ({
    ...table,
    league: {
      id: table.league.id,
      slug: table.league.slug,
      logoUrl: table.league.logoUrl,
      name: localizeCompetitionTitle(locale, table.league),
      country: table.league.country ? localizeCountryName(locale, table.league.country) : table.league.country,
    },
    rows: (table.rows || []).map((row) => ({
      ...row,
      goalDiff: row.goalDiff ?? row.goalsFor - row.goalsAgainst,
      team: { ...row.team, name: localizeTeamName(locale, row.team.name) },
    })),
  }));
}

const _getCachedFrontTables = cache(_loadFrontTables);

export async function loadFrontTables(locale: string): Promise<FrontTable[]> {
  try {
    const res = await _getCachedFrontTables(locale);
    return res || [];
  } catch {
    return [];
  }
}

