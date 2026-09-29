import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';

export type FrontPredict = {
  total: number;
  settled: number;
  leaders: Array<{ name: string; points: number }>;
};

export async function loadFrontPredict(): Promise<FrontPredict | null> {
  const packed = await cachedJson('front:predict:v3', 60, async () => {
    const [total, settled, leaders] = await Promise.all([
      prisma.prediction.count().catch(swallow('front.predict.total', 0)),
      prisma.prediction.count({ where: { isCorrect: { not: null } } }).catch(swallow('front.predict.settled', 0)),
      prisma.user
        .findMany({
          where: { points: { gt: 0 } },
          orderBy: [{ points: 'desc' }, { id: 'asc' }],
          take: 3,
          select: { name: true, points: true },
        })
        .catch(swallow('front.predict.leaders', [])),
    ]);
    return {
      total,
      settled,
      leaders: leaders.map((row) => ({
        name: row.name?.trim() || '',
        points: row.points,
      })),
    };
  });
  if (packed.total === 0) return null;
  return packed;
}
