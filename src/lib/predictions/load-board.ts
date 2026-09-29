import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { swallow } from '@/lib/ops/caught';

const OPEN_LEAGUE_IDS = ['2', '39', '140', '307', '135', '78', '61', '3'] as const;

export const loadBoardPublic = cache(async function loadBoardPublic(bucket: number) {
  const now = new Date(bucket * 60_000);
  const openWhere = {
    status: 'NOT_STARTED' as const,
    kickoffAt: { gte: now },
    league: { externalId: { in: [...OPEN_LEAGUE_IDS] } },
  };
  const participantWhere = { OR: [{ points: { gt: 0 } }, { predictions: { some: {} } }] };

  const [rows, peopleCount, pointsAgg, slipCount, settledCount, openCount, openMatches, moodRows] = await Promise.all([
    prisma.user.findMany({
      where: participantWhere,
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
        _count: { select: { predictions: true } },
      },
      orderBy: [{ points: 'desc' }, { predictions: { _count: 'desc' } }],
      take: 80,
    }).catch(swallow('board.rows', [] as Array<{
      id: string;
      name: string | null;
      image: string | null;
      points: number;
      _count: { predictions: number };
    }>)),
    prisma.user.count({ where: participantWhere }).catch(swallow('board.people', 0)),
    prisma.user.aggregate({ where: participantWhere, _sum: { points: true } }).catch(
      swallow('board.points', { _sum: { points: null as number | null } }),
    ),
    prisma.prediction.count().catch(swallow('board.slips', 0)),
    prisma.prediction.count({ where: { isCorrect: { not: null } } }).catch(swallow('board.settled', 0)),
    prisma.match.count({ where: openWhere }).catch(swallow('board.open', 0)),
    prisma.match.findMany({
      where: openWhere,
      orderBy: { kickoffAt: 'asc' },
      take: 8,
      select: {
        id: true,
        kickoffAt: true,
        homeTeam: { select: { name: true, logoUrl: true } },
        awayTeam: { select: { name: true, logoUrl: true } },
        league: { select: { name: true } },
        _count: { select: { predictions: true } },
      },
    }).catch(swallow('board.kicks', [] as Array<{
      id: string;
      kickoffAt: Date;
      homeTeam: { name: string; logoUrl: string | null };
      awayTeam: { name: string; logoUrl: string | null };
      league: { name: string };
      _count: { predictions: number };
    }>)),
    prisma.prediction.groupBy({
      by: ['predictedOutcome'],
      _count: { _all: true },
    }).catch(swallow('board.mood', [] as Array<{ predictedOutcome: string; _count: { _all: number } }>)),
  ]);

  return { rows, peopleCount, pointsAgg, slipCount, settledCount, openCount, openMatches, moodRows, participantWhere };
});
