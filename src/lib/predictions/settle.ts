import 'server-only';

import { prisma } from '@/lib/prisma';
import type { Outcome } from '@/generated/prisma';

const CORRECT_POINTS = 3;

function outcomeFromScore(homeScore: number, awayScore: number): Outcome {
  if (homeScore > awayScore) return 'HOME_WIN';
  if (awayScore > homeScore) return 'AWAY_WIN';
  return 'DRAW';
}

/**
 * Settles unsettled predictions for finished matches and awards leaderboard points.
 * Safe to call repeatedly — only rows with isCorrect === null are processed.
 */
export async function settleFinishedPredictions(matchIds?: string[]) {
  const matches = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
      ...(matchIds?.length ? { id: { in: matchIds } } : {}),
      predictions: { some: { isCorrect: null } },
    },
    select: {
      id: true,
      homeScore: true,
      awayScore: true,
      predictions: {
        where: { isCorrect: null },
        select: { id: true, userId: true, predictedOutcome: true },
      },
    },
    take: matchIds?.length ? undefined : 80,
  });

  let settled = 0;
  let awarded = 0;

  for (const match of matches) {
    const actual = outcomeFromScore(match.homeScore as number, match.awayScore as number);

    for (const prediction of match.predictions) {
      const correct = prediction.predictedOutcome === actual;
      const points = correct ? CORRECT_POINTS : 0;

      await prisma.$transaction([
        prisma.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect: correct, pointsAwarded: points },
        }),
        ...(points > 0
          ? [
              prisma.user.update({
                where: { id: prediction.userId },
                data: { points: { increment: points } },
              }),
            ]
          : []),
      ]);

      settled += 1;
      awarded += points;
    }
  }

  return { matches: matches.length, settled, awarded };
}
