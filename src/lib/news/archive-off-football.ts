import { prisma } from '@/lib/prisma';
import { isFootballCoverage } from '@/lib/news/football-scope';

/** Pull already-published off-desk rows (leaky Al Jazeera sport RSS, etc.) off the halls. */
export async function archiveOffFootballNews() {
  const rows = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      excerpt: true,
      content: true,
      sourceUrl: true,
      sourceName: true,
    },
  });
  const dropIds = rows.filter((row) => !isFootballCoverage(row)).map((row) => row.id);
  if (dropIds.length === 0) return 0;

  const chunk = 80;
  for (let i = 0; i < dropIds.length; i += chunk) {
    await prisma.news.updateMany({
      where: { id: { in: dropIds.slice(i, i + chunk) } },
      data: { status: 'ARCHIVED' },
    });
  }
  return dropIds.length;
}
