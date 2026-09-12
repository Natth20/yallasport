/**
 * Remove placeholder demo VOD (yalla-demo-reel) and clear demo stream URLs.
 * Usage: node --env-file=.env scripts/purge-demo-vod.mjs
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function wipeShow(slugOrId, by = 'slug') {
  const show =
    by === 'slug'
      ? await prisma.show.findUnique({ where: { slug: slugOrId } })
      : await prisma.show.findUnique({ where: { id: slugOrId } });
  if (!show) return false;
  await prisma.streamAsset.deleteMany({ where: { episode: { showId: show.id } } });
  await prisma.episode.deleteMany({ where: { showId: show.id } });
  await prisma.show.delete({ where: { id: show.id } });
  return true;
}

async function main() {
  const removedDemoReel = await wipeShow('yalla-demo-reel');

  const cleared = await prisma.episode.updateMany({
    where: {
      OR: [
        { streamUrl: { contains: 'shaka-demo-assets' } },
        { streamUrl: { contains: 'storage.googleapis.com' } },
      ],
    },
    data: { streamUrl: null },
  });

  const demoShows = await prisma.show.findMany({
    where: {
      OR: [{ categories: { has: 'demo' } }, { categories: { has: 'technical' } }],
    },
    select: { id: true, slug: true },
  });

  let removedDemoShows = 0;
  for (const row of demoShows) {
    if (await wipeShow(row.id, 'id')) removedDemoShows += 1;
  }

  console.log(
    JSON.stringify(
      {
        removedDemoReel,
        clearedDemoStreamUrls: cleared.count,
        removedDemoShows,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
