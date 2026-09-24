/**
 * Restores each story's real publication time.
 *
 * The first ingest run stamped `publishedAt` with the moment the desk approved
 * the row, which flattened a week of reporting onto a single day. The feeds
 * still carry the outlets' own `pubDate`, so re-read them and match on
 * sourceUrl. Also settles the two different names BBC Sport was filed under.
 *
 * Run with the pool capped, same as ingest-news.ts.
 */
import Parser from 'rss-parser';
import { prisma } from '../src/lib/prisma';
import { TRUSTED_RSS_FEEDS } from '../src/lib/news/trusted-sources';

const parser = new Parser({ timeout: 15000 });

async function main() {
  const dateByUrl = new Map<string, Date>();

  for (const feed of TRUSTED_RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items ?? []) {
        if (!item.link || !item.pubDate) continue;
        const date = new Date(item.pubDate);
        if (Number.isNaN(date.getTime())) continue;
        dateByUrl.set(item.link, date);
      }
      console.log(`read ${feed.name.padEnd(22)} ${parsed.items?.length ?? 0} items`);
    } catch (error) {
      console.log(`FAILED ${feed.name}: ${(error as Error).message}`);
    }
  }
  console.log(`collected ${dateByUrl.size} source dates`);

  const rows = await prisma.news.findMany({
    where: { status: 'PUBLISHED', sourceUrl: { not: null } },
    select: { id: true, sourceUrl: true, publishedAt: true },
  });

  let fixed = 0;
  for (const row of rows) {
    const source = row.sourceUrl ? dateByUrl.get(row.sourceUrl) : undefined;
    if (!source) continue;
    if (row.publishedAt && Math.abs(row.publishedAt.getTime() - source.getTime()) < 60_000) continue;
    await prisma.news.update({ where: { id: row.id }, data: { publishedAt: source } });
    fixed += 1;
  }
  console.log(`restored ${fixed} publication dates (of ${rows.length} published rows)`);

  // One outlet, one name — otherwise the source ledger splits BBC in two.
  const merged = await prisma.news.updateMany({
    where: { sourceName: 'BBC Sport' },
    data: { sourceName: 'BBC Sport Football' },
  });
  console.log(`merged ${merged.count} rows onto the canonical BBC source name`);

  const spread = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: { publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  });
  const days = new Set(spread.map((r) => r.publishedAt?.toISOString().slice(0, 10)));
  console.log(`stories now span ${days.size} distinct days`);
  console.log(`newest ${spread[0]?.publishedAt?.toISOString()}  oldest ${spread.at(-1)?.publishedAt?.toISOString()}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
