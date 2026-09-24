import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontScorer } from './types';

const WINDOW_DAYS = 7;

export async function loadFrontScorers(locale: string): Promise<{ goals: FrontScorer[]; assists: FrontScorer[]; days: number }> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const packed = await cachedJson('front:scorers:7d:v1', 300, async () => {
    const [goalGroups, assistGroups] = await Promise.all([
      prisma.matchEvent
        .groupBy({
          by: ['playerId'],
          where: {
            type: { in: ['GOAL', 'PENALTY'] },
            playerId: { not: null },
            match: { kickoffAt: { gte: since } },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        })
        .catch(swallow('front.scorers.goals', [])),
      prisma.matchEvent
        .groupBy({
          by: ['assistName'],
          where: {
            assistName: { not: null },
            type: { in: ['GOAL', 'PENALTY'] },
            match: { kickoffAt: { gte: since } },
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 8,
        })
        .catch(swallow('front.scorers.assists', [])),
    ]);

    const playerIds = goalGroups.map((row) => row.playerId).filter((id): id is string => Boolean(id));
    const assistNames = assistGroups.map((row) => row.assistName).filter((name): name is string => Boolean(name));
    const players = playerIds.length
      ? await prisma.player
          .findMany({
            where: { id: { in: playerIds } },
            select: { id: true, name: true, slug: true, photoUrl: true },
          })
          .catch(swallow('front.scorers.players', []))
      : [];
    const assistPlayers = assistNames.length
      ? await prisma.player
          .findMany({
            where: { name: { in: assistNames } },
            select: { name: true, slug: true, photoUrl: true },
          })
          .catch(swallow('front.scorers.assistPlayers', []))
      : [];
    const byId = new Map(players.map((player) => [player.id, player]));
    const byName = new Map(assistPlayers.map((player) => [player.name, player]));

    const goals: FrontScorer[] = goalGroups
      .map((row) => {
        const player = row.playerId ? byId.get(row.playerId) : null;
        if (!player) return null;
        return { name: player.name, slug: player.slug, photoUrl: player.photoUrl, value: row._count.id };
      })
      .filter(Boolean) as FrontScorer[];

    const assists: FrontScorer[] = assistGroups
      .map((row) => {
        const name = row.assistName?.trim();
        if (!name) return null;
        const player = byName.get(name);
        return {
          name,
          slug: player?.slug ?? null,
          photoUrl: player?.photoUrl ?? null,
          value: row._count.id,
        };
      })
      .filter(Boolean) as FrontScorer[];

    return { goals, assists };
  });

  return {
    days: WINDOW_DAYS,
    goals: packed.goals.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
    assists: packed.assists.map((row) => ({ ...row, name: localizePlainName(locale, row.name) })),
  };
}
