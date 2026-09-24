import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { STAT_BOARDS } from '@/lib/stats/load-desk';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontCrest } from './types';

export async function loadFrontSquads(locale: string): Promise<{
  leagues: FrontCrest[];
  clubs: FrontCrest[];
  players: Array<FrontCrest & { photoUrl: string | null }>;
}> {
  const season = String(currentFootballSeason());
  const packed = await cachedJson(`front:squads:${season}`, 300, async () => {
    const ids = STAT_BOARDS.map((board) => board.id);
    const leagues = await prisma.league
      .findMany({
        where: { externalId: { in: [...ids] } },
        select: { id: true, externalId: true, name: true, slug: true, logoUrl: true },
      })
      .catch(swallow('front.squads.leagues', []));
    const orderedLeagues = STAT_BOARDS.map((board) => leagues.find((league) => league.externalId === board.id)).filter(
      Boolean,
    ) as Array<{ id: string; name: string; slug: string; logoUrl: string | null }>;

    const clubMap = new Map<string, FrontCrest>();
    for (const league of orderedLeagues) {
      const rows = await prisma.standing
        .findMany({
          where: { leagueId: league.id, seasonId: season },
          orderBy: { rank: 'asc' },
          take: 4,
          include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
        .catch(swallow(`front.squads.clubs.${league.id}`, []));
      for (const row of rows) {
        if (!clubMap.has(row.team.id)) {
          clubMap.set(row.team.id, {
            id: row.team.id,
            name: row.team.name,
            slug: row.team.slug,
            logoUrl: row.team.logoUrl,
          });
        }
      }
    }
    const clubs = [...clubMap.values()].slice(0, 16);
    const teamIds = clubs.map((club) => club.id);
    const stints = teamIds.length
      ? await prisma.playerTeam
          .findMany({
            where: { teamId: { in: teamIds }, to: null },
            take: 40,
            include: { player: { select: { id: true, name: true, slug: true, photoUrl: true } } },
          })
          .catch(swallow('front.squads.players', []))
      : [];
    const players = stints
      .filter((row) => row.player.photoUrl)
      .slice(0, 12)
      .map((row) => ({
        id: row.player.id,
        name: row.player.name,
        slug: row.player.slug,
        logoUrl: null,
        photoUrl: row.player.photoUrl,
      }));

    return {
      leagues: orderedLeagues.map(({ id, name, slug, logoUrl }) => ({ id, name, slug, logoUrl })),
      clubs,
      players,
    };
  });

  return {
    leagues: packed.leagues.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
    clubs: packed.clubs.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
    players: packed.players.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
  };
}
