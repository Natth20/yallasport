// One-off inventory: what real data exists to build the news page on.
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const published = {
  status: 'PUBLISHED',
  publishedAt: { not: null, lte: new Date() },
  sourceUrl: { not: null },
};

const out = {};

out.newsByStatus = await prisma.news.groupBy({
  by: ['status'],
  _count: { _all: true },
});

out.publishedTotal = await prisma.news.count({ where: published });

out.bySourceLocale = await prisma.news.groupBy({
  by: ['sourceLocale'],
  where: published,
  _count: { _all: true },
});

out.byCategory = await prisma.news.groupBy({
  by: ['category'],
  where: published,
  _count: { _all: true },
  orderBy: { _count: { category: 'desc' } },
});

out.bySource = await prisma.news.groupBy({
  by: ['sourceName'],
  where: published,
  _count: { _all: true },
  orderBy: { _count: { sourceName: 'desc' } },
});

out.flags = {
  breaking: await prisma.news.count({ where: { ...published, breaking: true } }),
  featured: await prisma.news.count({ where: { ...published, featured: true } }),
  premium: await prisma.news.count({ where: { ...published, isPremium: true } }),
  withImage: await prisma.news.count({
    where: { ...published, OR: [{ featuredImage: { not: null } }, { ogImage: { not: null } }] },
  }),
  withExcerpt: await prisma.news.count({ where: { ...published, excerpt: { not: null } } }),
  totalViews: (await prisma.news.aggregate({ where: published, _sum: { views: true } }))._sum.views,
};

const dates = await prisma.news.findMany({
  where: published,
  select: { publishedAt: true },
  orderBy: { publishedAt: 'desc' },
});
out.dateRange = {
  newest: dates[0]?.publishedAt,
  oldest: dates[dates.length - 1]?.publishedAt,
  last24h: dates.filter((d) => Date.now() - d.publishedAt.getTime() < 864e5).length,
  last7d: dates.filter((d) => Date.now() - d.publishedAt.getTime() < 6048e5).length,
};

// how rich are the tags / entity links / translations / comments?
const tagged = await prisma.news.findMany({ where: published, select: { tags: true } });
const tagCount = {};
for (const r of tagged) for (const t of r.tags) tagCount[t] = (tagCount[t] || 0) + 1;
out.topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 20);

out.entityLinks = await prisma.newsEntityLink.groupBy({
  by: ['entityType', 'confirmed'],
  _count: { _all: true },
});
out.translations = await prisma.newsTranslation.groupBy({
  by: ['locale', 'status'],
  _count: { _all: true },
});
out.newsComments = await prisma.comment.count({ where: { newsId: { not: null } } });

// surrounding football data we could surface next to the news
out.football = {
  matches: await prisma.match.count(),
  live: await prisma.match.count({ where: { status: { in: ['LIVE', 'HALFTIME'] } } }),
  finished: await prisma.match.count({ where: { status: 'FINISHED' } }),
  upcoming: await prisma.match.count({ where: { status: 'NOT_STARTED' } }),
  teams: await prisma.team.count(),
  leagues: await prisma.league.count(),
  players: await prisma.player.count(),
  standings: await prisma.standing.count(),
  events: await prisma.matchEvent.count(),
  statistics: await prisma.matchStatistic.count(),
  lineups: await prisma.matchLineup.count(),
  transfers: await prisma.transfer.count(),
  channels: await prisma.channel.count(),
  matchChannels: await prisma.matchChannel.count(),
  coaches: await prisma.coach.count(),
  venues: await prisma.venue.count(),
};

out.leaguesWithStandings = await prisma.standing.groupBy({
  by: ['leagueId'],
  _count: { _all: true },
  orderBy: { _count: { leagueId: 'desc' } },
  take: 8,
});

const topLeagueIds = out.leaguesWithStandings.map((r) => r.leagueId);
out.topLeagueNames = await prisma.league.findMany({
  where: { id: { in: topLeagueIds } },
  select: { id: true, name: true, slug: true, country: true, logoUrl: true },
});

out.sampleStory = await prisma.news.findFirst({
  where: published,
  orderBy: { publishedAt: 'desc' },
  select: {
    slug: true, title: true, excerpt: true, category: true, tags: true,
    sourceName: true, sourceUrl: true, sourceLocale: true, readingTime: true,
    views: true, featuredImage: true, ogImage: true, publishedAt: true,
  },
});

console.log(JSON.stringify(out, null, 2));
await prisma.$disconnect();
