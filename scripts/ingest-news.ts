/**
 * Fills the news desk with real content from the trusted feeds.
 *
 * Pulls every allowlisted feed, files each story under a real desk, publishes
 * what came from a trusted host, backfills the missing og:images, and links
 * stories to the teams / leagues / matches already in the database.
 *
 * The Supabase session pooler caps the project at 15 clients and the dev server
 * already holds five, so run this with the pool capped to a single connection:
 *
 *   $env:DIRECT_URL = "<DIRECT_URL from .env>&connection_limit=1"
 *   node node_modules/tsx/dist/cli.mjs --tsconfig scripts/tsconfig.json scripts/ingest-news.ts
 */
import { prisma } from '../src/lib/prisma';
import { importFromRSS } from '../src/lib/news/rss-service';
import { TRUSTED_RSS_FEEDS, isTrustedNewsUrl } from '../src/lib/news/trusted-sources';
import { classifyDesk, competitionTags } from '../src/lib/news/desks';
import { fetchTrustedSourceImage, resolveNewsImage } from '../src/lib/news/enrich-source';
import { resolveFullArticleBody, wordCount } from '../src/lib/news/fetch-article';
import { suggestNewsEntities } from '../src/lib/news/entity-suggest';

function log(step: string, detail: string) {
  process.stdout.write(`[${new Date().toISOString().slice(11, 19)}] ${step.padEnd(12)} ${detail}\n`);
}

/** The hosted database drops connections under load; a retry beats a crash. */
async function retry<T>(label: string, run: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      const code = (error as { code?: string }).code;
      const transient = code === 'P1001' || code === 'P1017' || code === 'P2024';
      if (!transient || attempt === attempts) break;
      const wait = attempt * 4000;
      log('retry', `${label} attempt ${attempt} failed (${code}), waiting ${wait / 1000}s`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastError;
}

async function step1_import() {
  let total = 0;
  for (const feed of TRUSTED_RSS_FEEDS) {
    try {
      const { imported } = await retry(`import ${feed.name}`, () => importFromRSS(feed.url));
      total += imported;
      log('import', `${feed.name.padEnd(22)} +${imported}`);
    } catch (error) {
      log('import', `${feed.name.padEnd(22)} FAILED ${(error as Error).message}`);
    }
  }
  log('import', `total new stories: ${total}`);
}

/** Older rows were all filed under the generic "Football" desk. */
async function step2_reclassify() {
  const rows = await retry('reclassify read', () =>
    prisma.news.findMany({
      where: { status: { in: ['PUBLISHED', 'PENDING_REVIEW'] } },
      select: { id: true, title: true, excerpt: true, content: true, category: true, tags: true },
    })
  );
  let moved = 0;
  for (const row of rows) {
    const body = row.excerpt || row.content || '';
    const desk = classifyDesk(row.title, body);
    const comps = competitionTags(row.title, body);
    const tags = Array.from(new Set([...row.tags, ...comps]));
    if (desk === row.category && tags.length === row.tags.length) continue;
    await retry('reclassify write', () =>
      prisma.news.update({ where: { id: row.id }, data: { category: desk, tags } })
    );
    moved += 1;
  }
  log('reclassify', `${moved} stories refiled`);
}

/** Everything we imported came from an allowlisted outlet, so it can go live. */
async function step3_publish() {
  const desk = await retry('desk user', () =>
    prisma.user.findUnique({ where: { email: 'system@yallasport.com' } })
  );
  const pending = await retry('pending read', () =>
    prisma.news.findMany({
      where: { status: 'PENDING_REVIEW' },
      select: {
        id: true,
        title: true,
        content: true,
        sourceUrl: true,
        featuredImage: true,
        ogImage: true,
        publishedAt: true,
      },
    })
  );

  let published = 0;
  let rejected = 0;
  for (const row of pending) {
    if (!isTrustedNewsUrl(row.sourceUrl)) {
      await retry('archive', () => prisma.news.update({ where: { id: row.id }, data: { status: 'ARCHIVED' } }));
      rejected += 1;
      continue;
    }

    let content = row.content;
    let image = row.featuredImage || row.ogImage;

    if (wordCount(content) < 120) {
      const fuller = await resolveFullArticleBody({ content, sourceUrl: row.sourceUrl });
      if (fuller.enriched) content = fuller.html;
      if (!image && fuller.image) image = fuller.image;
    }
    if (!image) image = await resolveNewsImage({ content, sourceUrl: row.sourceUrl });

    const plain = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    await retry('publish', () =>
      prisma.news.update({
        where: { id: row.id },
        data: {
          content,
          featuredImage: image,
          ogImage: image,
          excerpt: plain.slice(0, 220) || null,
          readingTime: Math.max(1, Math.ceil(plain.split(/\s+/).length / 200)),
          status: 'PUBLISHED',
          // The importer already stamped the outlet's own date; only fall back
          // to now for rows that predate that.
          publishedAt: row.publishedAt ?? new Date(),
          editorId: desk?.id ?? undefined,
        },
      })
    );
    published += 1;
    if (published % 20 === 0) log('publish', `${published}/${pending.length}`);
  }
  log('publish', `${published} published, ${rejected} archived as untrusted`);
}

/** The original 13 rows arrived before image enrichment existed. */
async function step4_images() {
  const missing = await retry('image read', () =>
    prisma.news.findMany({
      where: { status: 'PUBLISHED', featuredImage: null, ogImage: null, sourceUrl: { not: null } },
      select: { id: true, sourceUrl: true, content: true },
    })
  );
  log('images', `${missing.length} stories without an image`);

  let filled = 0;
  for (const row of missing) {
    const image =
      (await fetchTrustedSourceImage(row.sourceUrl)) ??
      (await resolveNewsImage({ content: row.content, sourceUrl: row.sourceUrl }));
    if (!image) continue;
    await retry('image write', () =>
      prisma.news.update({ where: { id: row.id }, data: { featuredImage: image, ogImage: image } })
    );
    filled += 1;
  }
  log('images', `${filled} images backfilled`);
}

/** Links stories to the teams / leagues / matches we already hold. */
async function step5_link() {
  const rows = await retry('link read', () =>
    prisma.news.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, content: true },
    })
  );
  let linked = 0;
  for (const row of rows) {
    const hits = await retry('link write', () =>
      suggestNewsEntities({ newsId: row.id, title: row.title, content: row.content })
    );
    if (hits.length) linked += 1;
  }
  const total = await retry('link count', () => prisma.newsEntityLink.count());
  log('link', `${linked}/${rows.length} stories matched an entity, ${total} links total`);
}

/** Suggested links are invisible to the public page until confirmed. */
async function step6_confirm() {
  const { count } = await retry('confirm', () =>
    prisma.newsEntityLink.updateMany({ where: { confirmed: false }, data: { confirmed: true } })
  );
  log('confirm', `${count} entity links confirmed`);
}

async function main() {
  await step1_import();
  await step2_reclassify();
  await step3_publish();
  await step4_images();
  await step5_link();
  await step6_confirm();

  const published = await prisma.news.count({ where: { status: 'PUBLISHED' } });
  const byDesk = await prisma.news.groupBy({
    by: ['category'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true },
  });
  const byLocale = await prisma.news.groupBy({
    by: ['sourceLocale'],
    where: { status: 'PUBLISHED' },
    _count: { _all: true },
  });
  const withImage = await prisma.news.count({
    where: { status: 'PUBLISHED', OR: [{ featuredImage: { not: null } }, { ogImage: { not: null } }] },
  });

  console.log('\n=== DESK STATE ===');
  console.log(`published: ${published}   with image: ${withImage}`);
  console.log('by locale:', byLocale.map((r) => `${r.sourceLocale}=${r._count._all}`).join('  '));
  console.log('by desk:');
  for (const r of byDesk.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${String(r._count._all).padStart(4)}  ${r.category}`);
  }
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
