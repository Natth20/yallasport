import { PrismaClient } from '../src/generated/prisma/index.js';
import { formatNewsHtml } from '../src/lib/news/format-body';
import { validateArticleHtml } from '../src/lib/news/article-clean';
import { readingTimeMinutes } from '../src/lib/news/reading-time';
import { publicNewsTags } from '../src/lib/news/article-clean';

const prisma = new PrismaClient();

async function main() {
  console.log('reprocess start');
  const ids = await prisma.news.findMany({
    where: { status: { in: ['PUBLISHED', 'PENDING_REVIEW'] } },
    orderBy: { publishedAt: 'desc' },
    take: 120,
    select: { id: true },
  });
  console.log('loaded', ids.length);

  let cleaned = 0;
  let held = 0;
  for (const { id } of ids) {
    const row = await prisma.news.findUnique({
      where: { id },
      select: { id: true, content: true, tags: true, status: true },
    });
    if (!row) continue;
    const html = formatNewsHtml(row.content || '');
    const check = validateArticleHtml(html);
    const tags = publicNewsTags(row.tags);
    const nextStatus = check.ok || check.reasons.every((reason) => reason === 'too-short') ? row.status : 'PENDING_REVIEW';
    if (html === row.content && nextStatus === row.status && tags.join() === row.tags.join()) continue;
    await prisma.news.update({
      where: { id: row.id },
      data: {
        content: html,
        tags,
        readingTime: readingTimeMinutes(html),
        status: nextStatus,
      },
    });
    cleaned += 1;
    if (nextStatus === 'PENDING_REVIEW' && row.status !== 'PENDING_REVIEW') held += 1;
  }

  console.log(JSON.stringify({ scanned: ids.length, updated: cleaned, pendingReview: held }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
