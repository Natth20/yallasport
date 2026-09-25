import { prisma } from '@/lib/prisma';
import { deliverPush, reserveOnce, release, usersWanting } from '@/lib/notifications/deliver';

export async function alertBreakingNews(story: { id: string; slug: string; title: string; sourceName?: string | null }) {
  const users = await usersWanting('breakingNews');

  for (const user of users) {
    const dedupKey = `notification:breaking:${story.id}:${user.id}`;
    const reserved = await reserveOnce(dedupKey, 604800);
    if (!reserved) continue;

    const ok = await deliverPush(
      user.id,
      user.pushSubscriptions,
      {
        title: 'خبر عاجل',
        body: story.title,
        url: `/ar/news/${story.slug}`,
        tag: `news-${story.id}`,
      },
      {
        type: 'BREAKING_NEWS',
        entityType: 'NEWS',
        entityId: story.id,
      }
    );
    if (!ok) await release(dedupKey);
  }
}

export async function alertRecentPublishedBreaking() {
  const since = new Date(Date.now() - 70 * 60 * 1000);
  const stories = await prisma.news.findMany({
    where: {
      status: 'PUBLISHED',
      publishedAt: { gte: since },
      OR: [{ breaking: true }, { title: { contains: 'عاجل' } }, { title: { contains: 'breaking', mode: 'insensitive' } }],
    },
    select: { id: true, slug: true, title: true, sourceName: true },
    take: 12,
  });

  for (const story of stories) {
    await alertBreakingNews(story);
  }

  return stories.length;
}
