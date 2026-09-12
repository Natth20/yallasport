import { PrismaClient } from '@prisma/client';
import { Redis } from '@upstash/redis';

const prisma = new PrismaClient();

async function main() {
  const fakeMatchFilter = {
    OR: [
      { externalId: 'EL-CLASICO-TEST' },
      { externalId: { startsWith: 'dev-' } },
      { externalId: { startsWith: 'mock-' } },
      { externalId: { startsWith: 'mock-match-' } },
    ],
  };

  const fakeMatches = await prisma.match.findMany({
    where: fakeMatchFilter,
    select: { id: true, externalId: true },
  });
  const fakeMatchIds = fakeMatches.map((match) => match.id);

  if (fakeMatchIds.length > 0) {
    await prisma.matchEvent.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.matchLineup.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.matchStatistic.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.matchChannel.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.matchPoll.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.prediction.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.comment.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.notification.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.matchReminder.deleteMany({ where: { matchId: { in: fakeMatchIds } } });
    await prisma.match.deleteMany({ where: { id: { in: fakeMatchIds } } });
  }

  await prisma.comment.deleteMany({
    where: { news: { slug: 'real-madrid-dominates-clasico' } },
  });
  const deletedNews = await prisma.news.deleteMany({
    where: { slug: 'real-madrid-dominates-clasico' },
  });

  await prisma.episode.deleteMany({ where: { id: 'test-ep-1' } });
  const deletedShows = await prisma.show.deleteMany({ where: { slug: 'real-madrid-14' } });

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    const today = new Date().toISOString().slice(0, 10);
    await redis.del('live_matches', 'sports:live:all', 'sports:meta:live', `matches_${today}`);
  }

  console.log(
    JSON.stringify(
      {
        deletedFakeMatches: fakeMatches.map((match) => match.externalId),
        deletedNews: deletedNews.count,
        deletedShows: deletedShows.count,
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
