/**
 * Archive published news that is not from a trusted host or is non-editorial.
 * Usage: node --env-file=.env scripts/archive-untrusted-news.mjs
 */
import { PrismaClient } from '../src/generated/prisma/index.js';

const prisma = new PrismaClient();

const TRUSTED = [
  'bbc.com',
  'bbc.co.uk',
  'aljazeera.net',
  'aljazeera.com',
  'goal.com',
  'skysports.com',
  'theguardian.com',
  'reuters.com',
  'espn.com',
  'espnfc.com',
  'beinsports.com',
  'france24.com',
  'dw.com',
  'arabnews.com',
  'skynewsarabia.com',
  'yallakora.com',
  'filgoal.com',
  'sport360.com',
  'marca.com',
  'as.com',
  'lequipe.fr',
  'gazzetta.it',
  'kicker.de',
];

const NON_NEWS =
  /who\s*am\s*i|من\s*أنا|quiz|puzzle|crossword|guess\s+the|خمّن|اختبر\s*معرفتك|مسابقة|fantasy/i;

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function trusted(host) {
  if (!host) return false;
  return TRUSTED.some((item) => host === item || host.endsWith(`.${item}`));
}

async function main() {
  const rows = await prisma.news.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, title: true, sourceUrl: true },
  });

  let archived = 0;
  for (const row of rows) {
    const host = hostOf(row.sourceUrl);
    const keep = trusted(host) && !NON_NEWS.test(row.title || '');
    if (keep) continue;
    await prisma.news.update({
      where: { id: row.id },
      data: { status: 'ARCHIVED' },
    });
    archived += 1;
    console.log('[archived]', row.title, row.sourceUrl);
  }

  console.log(JSON.stringify({ scanned: rows.length, archived }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
