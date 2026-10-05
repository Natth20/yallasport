import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';
import { loadStatsDesk } from '@/lib/stats/load-desk';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import type { FrontScorer } from './types';

const WINDOW_DAYS = 7;

function paint(locale: string, rows: FrontScorer[]) {
  return rows.map((row) => ({ ...row, name: localizePlainName(locale, row.name) }));
}

async function _loadFrontScorers(locale: string): Promise<{
  goals: FrontScorer[];
  assists: FrontScorer[];
  days: number;
}> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const packed = await cachedJson('front:scorers:7d:v3', 90, async () => {
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
          take: 10,
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
          take: 10,
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

  if (packed.goals.length > 0 && packed.assists.length > 0) {
    return {
      days: WINDOW_DAYS,
      goals: paint(locale, packed.goals),
      assists: paint(locale, packed.assists),
    };
  }

  const [goalDesk, assistDesk] = await Promise.all([
    packed.goals.length === 0 ? loadStatsDesk('39', 'goals') : Promise.resolve(null),
    packed.assists.length === 0 ? loadStatsDesk('39', 'assists') : Promise.resolve(null),
  ]);
  return {
    days: packed.goals.length === 0 && packed.assists.length === 0 ? 0 : WINDOW_DAYS,
    goals: paint(
      locale,
      packed.goals.length > 0
        ? packed.goals
        : (goalDesk?.rows.slice(0, 5).map((row) => ({
          name: row.name,
          slug: row.slug,
          photoUrl: row.photoUrl,
          value: row.value,
        })) ?? []),
    ),
    assists: paint(
      locale,
      packed.assists.length > 0
        ? packed.assists
        : (assistDesk?.rows.slice(0, 5).map((row) => ({
          name: row.name,
          slug: row.slug,
          photoUrl: row.photoUrl,
          value: row.value,
        })) ?? []),
    ),
  };
}

const _getCachedFrontScorers = cache(_loadFrontScorers);

export async function loadFrontScorers(locale: string): Promise<{
  goals: FrontScorer[];
  assists: FrontScorer[];
  days: number;
}> {
  try {
    const res = await _getCachedFrontScorers(locale);
    if (res) return res;
  } catch {
    // fallback
  }
  return {
    goals: [],
    assists: [],
    days: 0,
  };
}

