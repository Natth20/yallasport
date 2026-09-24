import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { auth } from '@/lib/auth/auth';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontFavorite } from './types';

export async function loadFrontPersonal(locale: string): Promise<{ loggedIn: boolean; items: FrontFavorite[] }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { loggedIn: false, items: [] };

  const favorites = await prisma.userFavorite
    .findMany({ where: { userId }, orderBy: { id: 'desc' }, take: 24 })
    .catch(swallow('front.personal', []));

  const teamIds = favorites.filter((row) => row.entityType === 'TEAM').map((row) => row.entityId);
  const leagueIds = favorites.filter((row) => row.entityType === 'LEAGUE').map((row) => row.entityId);
  const playerIds = favorites.filter((row) => row.entityType === 'PLAYER').map((row) => row.entityId);

  const [teams, leagues, players] = await Promise.all([
    teamIds.length
      ? prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true, slug: true, logoUrl: true } })
      : [],
    leagueIds.length
      ? prisma.league.findMany({
          where: { id: { in: leagueIds } },
          select: { id: true, name: true, slug: true, logoUrl: true },
        })
      : [],
    playerIds.length
      ? prisma.player.findMany({
          where: { id: { in: playerIds } },
          select: { id: true, name: true, slug: true, photoUrl: true },
        })
      : [],
  ]);

  const items: FrontFavorite[] = [];
  for (const team of teams) {
    items.push({ kind: 'TEAM', name: localizePlainName(locale, team.name), slug: team.slug, logoUrl: team.logoUrl });
  }
  for (const league of leagues) {
    items.push({
      kind: 'LEAGUE',
      name: localizePlainName(locale, league.name),
      slug: league.slug,
      logoUrl: league.logoUrl,
    });
  }
  for (const player of players) {
    items.push({
      kind: 'PLAYER',
      name: localizePlainName(locale, player.name),
      slug: player.slug,
      logoUrl: player.photoUrl,
    });
  }
  return { loggedIn: true, items: items.slice(0, 12) };
}
