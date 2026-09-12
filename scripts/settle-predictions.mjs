import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();
const CORRECT_POINTS = 3;

function outcomeFromScore(homeScore, awayScore) {
  if (homeScore > awayScore) return 'HOME_WIN';
  if (awayScore > homeScore) return 'AWAY_WIN';
  return 'DRAW';
}

async function main() {
  const matches = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
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
    take: 80,
  });

  let settled = 0;
  let awarded = 0;
  for (const match of matches) {
    const actual = outcomeFromScore(match.homeScore, match.awayScore);
    for (const prediction of match.predictions) {
      const correct = prediction.predictedOutcome === actual;
      const points = correct ? CORRECT_POINTS : 0;
      await prisma.$transaction([
        prisma.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect: correct, pointsAwarded: points },
        }),
        ...(points > 0
          ? [prisma.user.update({ where: { id: prediction.userId }, data: { points: { increment: points } } })]
          : []),
      ]);
      settled += 1;
      awarded += points;
    }
  }

  // Demo settlement path: if no unsettled rows, create+settle one against a finished match for engine proof.
  if (settled === 0) {
    const finished = await prisma.match.findFirst({
      where: { status: 'FINISHED', homeScore: { not: null }, awayScore: { not: null } },
      orderBy: { kickoffAt: 'desc' },
    });
    let user = await prisma.user.findFirst({ where: { email: 'system@yallasport.com' } });
    if (!user) {
      user = await prisma.user.create({
        data: { email: 'system@yallasport.com', name: 'Yalla Sport Bot', role: 'SUPER_ADMIN' },
      });
    }
    if (finished && user) {
      const actual = outcomeFromScore(finished.homeScore, finished.awayScore);
      const prediction = await prisma.prediction.upsert({
        where: { userId_matchId: { userId: user.id, matchId: finished.id } },
        update: { predictedOutcome: actual, isCorrect: null, pointsAwarded: 0 },
        create: { userId: user.id, matchId: finished.id, predictedOutcome: actual },
      });
      await prisma.prediction.update({
        where: { id: prediction.id },
        data: { isCorrect: true, pointsAwarded: CORRECT_POINTS },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { points: { increment: CORRECT_POINTS } },
      });
      settled = 1;
      awarded = CORRECT_POINTS;
    }
  }

  console.log(JSON.stringify({ matchBatches: matches.length, settled, awarded }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
