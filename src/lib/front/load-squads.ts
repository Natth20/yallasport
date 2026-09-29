import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { STAT_BOARDS, statBoardLabel } from '@/lib/stats/load-desk';
import { currentFootballSeason } from '@/lib/sports-data/season';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontCrest } from './types';

export async function loadFrontSquads(locale: string): Promise<{
  leagues: FrontCrest[];
  clubs: FrontCrest[];
  players: Array<FrontCrest & { photoUrl: string | null }>;
}> {
  const season = String(currentFootballSeason());
  const packed = await cachedJson(`front:squads:${season}:v5`, 180, async () => {
    const ids = STAT_BOARDS.map((board) => board.id);
    const leagues = await prisma.league
      .findMany({
        where: { externalId: { in: [...ids] } },
        select: { id: true, externalId: true, name: true, slug: true, logoUrl: true },
      })
      .catch(swallow('front.squads.leagues', []));
    const orderedLeagues = STAT_BOARDS.map((board) => leagues.find((league) => league.externalId === board.id)).filter(
      Boolean,
    ) as Array<{ id: string; externalId: string; name: string; slug: string; logoUrl: string | null }>;

    const previous = String(currentFootballSeason() - 1);
    const leaders: FrontCrest[] = [];
    const extras: FrontCrest[] = [];
    for (const league of orderedLeagues) {
      let rows = await prisma.standing
        .findMany({
          where: { leagueId: league.id, seasonId: season },
          orderBy: { rank: 'asc' },
          take: 6,
          include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
        })
        .catch(swallow(`front.squads.clubs.${league.id}`, []));
      if (rows.length === 0) {
        rows = await prisma.standing
          .findMany({
            where: { leagueId: league.id, seasonId: previous },
            orderBy: { rank: 'asc' },
            take: 6,
            include: { team: { select: { id: true, name: true, slug: true, logoUrl: true } } },
          })
          .catch(swallow(`front.squads.clubs.${league.id}.prev`, []));
      }
      for (const row of rows) {
        const crest: FrontCrest = {
          id: row.team.id,
          name: row.team.name,
          slug: row.team.slug,
          logoUrl: row.team.logoUrl,
        };
        if (row.rank === 1) leaders.push(crest);
        else extras.push(crest);
      }
    }
    const clubMap = new Map<string, FrontCrest>();
    for (const club of [...leaders, ...extras]) {
      if (clubMap.size >= 8) break;
      if (!clubMap.has(club.id)) clubMap.set(club.id, club);
    }
    const clubs = [...clubMap.values()];
    const teamIds = clubs.map((club) => club.id);
    const stints = teamIds.length
      ? await prisma.playerTeam
          .findMany({
            where: { teamId: { in: teamIds }, to: null },
            take: 160,
            include: { player: { select: { id: true, name: true, slug: true, photoUrl: true, position: true } } },
          })
          .catch(swallow('front.squads.players', []))
      : [];
    const uniquePlayers = new Map<
      string,
      { id: string; name: string; slug: string; logoUrl: null; photoUrl: string | null; position: string | null }
    >();
    for (const row of stints) {
      if (uniquePlayers.has(row.player.id)) continue;
      uniquePlayers.set(row.player.id, {
        id: row.player.id,
        name: row.player.name,
        slug: row.player.slug,
        logoUrl: null,
        photoUrl: row.player.photoUrl,
        position: row.player.position,
      });
    }
    const players = [...uniquePlayers.values()]
      .sort((a, b) => playerWeight(b) - playerWeight(a))
      .slice(0, 8)
      .map(({ position: _position, ...row }) => row);

    return {
      leagues: orderedLeagues.map(({ id, externalId, name, slug, logoUrl }) => ({ id, externalId, name, slug, logoUrl })),
      clubs,
      players,
    };
  });

  return {
    leagues: packed.leagues.map((row) => ({
      id: row.id,
      slug: row.slug,
      logoUrl: row.logoUrl,
      name: statBoardLabel(locale, row.externalId, localizePlainName(locale, row.name)),
    })),
    clubs: packed.clubs.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
    players: packed.players.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
  };
}

function playerWeight(row: { photoUrl: string | null; position: string | null }) {
  const position = (row.position || '').toUpperCase();
  let score = row.photoUrl ? 24 : 0;
  if (/\b(GK|G)\b/.test(position) || position.includes('GOAL') || position.includes('حارس')) score -= 18;
  if (/\b(ST|CF|FW|ATT|FWD)\b/.test(position) || position.includes('هجوم')) score += 12;
  if (/\b(AM|LW|RW|WF)\b/.test(position) || position.includes('جناح')) score += 8;
  return score;
}
