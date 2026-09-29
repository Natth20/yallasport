import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';
import { DEFAULT_TIMEZONE, hourInTimezone } from '@/lib/datetime/format';
import { localizePlainName } from '@/lib/i18n/sports-lexicon';
import { isFriendlyLeague } from '@/lib/sports-data/friendly';
import { isLiveStatus } from '@/lib/sports-data/match-window';
import { rotateTake } from './rotate-shelf';
import { loadFrontBoard } from './load-board';
import { loadFrontScorers } from './load-scorers';
import { loadFrontTransfers } from './load-transfers';
import type { FrontMatch, FrontScorer, FrontTransfer } from './types';

export type FrontHourSlot = { hour: number; count: number };

export type FrontCensus = {
  live: number;
  remaining: number;
  finished: number;
};

export type FrontFacts = {
  next: (FrontMatch & { venue: string | null; city: string | null }) | null;
  loud: (FrontMatch & { goals: number }) | null;
  podium: FrontScorer[];
  move: FrontTransfer | null;
  hours: FrontHourSlot[];
  census: FrontCensus;
};

export async function loadFrontFacts(locale: string): Promise<FrontFacts> {
  const [board, scorers, transfers] = await Promise.all([
    loadFrontBoard(locale),
    loadFrontScorers(locale),
    loadFrontTransfers(locale),
  ]);

  const now = Date.now();
  const nextBase =
    board
      .filter((match) => match.status === 'NOT_STARTED' && new Date(match.kickoffAt).getTime() >= now)
      .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())[0] ?? null;

  let next: FrontFacts['next'] = nextBase
    ? { ...nextBase, venue: null, city: null }
    : null;
  if (nextBase) {
    const extra = await prisma.match
      .findUnique({
        where: { id: nextBase.id },
        select: { venue: { select: { name: true, city: true } } },
      })
      .catch(swallow('front.facts.venue', null));
    if (extra?.venue) {
      next = {
        ...nextBase,
        venue: extra.venue.name ? localizePlainName(locale, extra.venue.name) : null,
        city: extra.venue.city ? localizePlainName(locale, extra.venue.city) : null,
      };
    }
  }

  const scored = [...board]
    .map((match) => ({
      match,
      goals: (match.homeScore ?? 0) + (match.awayScore ?? 0),
    }))
    .filter((row) => row.goals > 0 && (isLiveStatus(row.match.status) || row.match.status === 'FINISHED'))
    .sort((a, b) => b.goals - a.goals);
  const loudBase =
    scored.find((row) => !isFriendlyLeague(row.match.league)) ?? scored[0];

  const hourMap = new Map<number, number>();
  for (const match of board) {
    const hour = hourInTimezone(new Date(match.kickoffAt), DEFAULT_TIMEZONE);
    hourMap.set(hour, (hourMap.get(hour) ?? 0) + 1);
  }
  const hours = [...hourMap.entries()]
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => b.count - a.count || a.hour - b.hour)
    .slice(0, 10)
    .sort((a, b) => a.hour - b.hour);

  return {
    next,
    loud: loudBase ? { ...loudBase.match, goals: loudBase.goals } : null,
    podium: scorers.goals.slice(0, 3),
    move: rotateTake(transfers, 1, 11)[0] ?? null,
    hours,
    census: {
      live: board.filter((match) => isLiveStatus(match.status)).length,
      remaining: board.filter((match) => match.status === 'NOT_STARTED').length,
      finished: board.filter((match) => match.status === 'FINISHED').length,
    },
  };
}
