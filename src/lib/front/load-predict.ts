import { prisma } from '@/lib/prisma';
import { cachedJson } from '@/lib/redis';
import { swallow } from '@/lib/ops/caught';

export async function loadFrontPredict(): Promise<{ total: number; settled: number } | null> {
  const packed = await cachedJson('front:predict:v1', 120, async () => {
    const [total, settled] = await Promise.all([
      prisma.prediction.count().catch(swallow('front.predict.total', 0)),
      prisma.prediction.count({ where: { isCorrect: { not: null } } }).catch(swallow('front.predict.settled', 0)),
    ]);
    return { total, settled };
  });
  if (packed.total === 0) return null;
  return packed;
}
