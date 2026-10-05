import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';

export async function loadFrontSources(): Promise<string[]> {
  const rows = await cachedJson('front:sources:v1', 120, () =>
    prisma.news
      .groupBy({
        by: ['sourceName'],
        where: { status: 'PUBLISHED', sourceName: { not: null } },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 16,
      })
      .catch(swallow('front.sources', [])),
  );
  return rows.map((row) => row.sourceName).filter((name): name is string => Boolean(name));
}
