/**
 * Phase 5 acceptance checks (local).
 * Usage: node --env-file=.env scripts/qa-phase5.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { PrismaClient } from '../src/generated/prisma/index.js';

const BASE = process.env.QA_BASE_URL || 'http://localhost:3000';
const prisma = new PrismaClient();

const STATIC_PATHS = [
  '/ar',
  '/ar/matches',
  '/ar/live',
  '/ar/news',
  '/ar/leagues',
  '/ar/tv-guide',
  '/ar/search',
  '/ar/watch',
  '/ar/vod',
  '/ar/leaderboard',
  '/ar/about',
  '/ar/contact',
  '/ar/compare',
  '/ar/compare-players',
  '/ar/privacy',
  '/ar/terms',
  '/ar/copyright',
  '/ar/report',
  '/ar/login',
  '/ar/register',
  '/ar/forgot-password',
  '/ar/profile',
  '/ar/subscribe',
  '/ar/settings/notifications',
  '/ar/admin',
  '/ar/admin/inbox',
  '/ar/admin/matches',
  '/ar/admin/news',
  '/ar/admin/users',
  '/ar/admin/streaming',
  '/ar/admin/vod',
  '/ar/admin/ads',
  '/ar/admin/comments',
  '/ar/admin/kpis',
  '/ar/admin/licenses',
  '/ar/admin/translations',
  '/ar/admin/tv-guide',
  '/ar/admin/teams',
  '/ar/admin/players',
  '/ar/admin/leagues',
  '/en',
  '/en/news',
  '/en/matches',
  '/en/about',
  '/en/search',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.json',
  '/sw.js',
];

async function http(path) {
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}${path}`, {
      redirect: 'manual',
      headers: { Accept: 'text/html,application/json,*/*' },
    });
    return { path, status: res.status, ms: Date.now() - started, ok: res.status >= 200 && res.status < 400 };
  } catch (err) {
    return { path, status: 0, ms: Date.now() - started, ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

function scanBundleForSecrets() {
  const roots = ['.next/static', '.next/server'];
  const needles = [
    process.env.SPORTS_API_KEY,
    process.env.AUTH_GOOGLE_SECRET,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.AUTH_SECRET,
    process.env.DATABASE_URL?.match(/\/\/([^@]+)@/)?.[1],
  ].filter((v) => v && String(v).length > 8);

  const hits = [];
  const walk = (dir, depth = 0) => {
    if (!existsSync(dir) || depth > 6) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (name === 'cache' || name === 'types') continue;
        walk(full, depth + 1);
        continue;
      }
      if (!/\.(js|json|html|txt)$/i.test(name) || st.size > 2_000_000) continue;
      let text = '';
      try {
        text = readFileSync(full, 'utf8');
      } catch {
        continue;
      }
      for (const needle of needles) {
        if (needle && text.includes(String(needle))) {
          hits.push({ file: full, kind: 'secret_like' });
        }
      }
    }
  };
  for (const root of roots) walk(root);
  return hits;
}

async function main() {
  const report = {
    base: BASE,
    streamingEnabled: process.env.STREAMING_ENABLED === 'true',
    cronSecretSet: Boolean(process.env.CRON_SECRET?.trim()),
    pages: [],
    counts: {},
    schemaSample: null,
    rateLimit: null,
    secretsInBundle: null,
    rtlDark: null,
  };

  report.counts = {
    Team: await prisma.team.count(),
    Match: await prisma.match.count(),
    League: await prisma.league.count(),
    Player: await prisma.player.count(),
    Coach: await prisma.coach.count(),
    Channel: await prisma.channel.count(),
    MatchChannel: await prisma.matchChannel.count(),
    NewsPublished: await prisma.news.count({ where: { status: 'PUBLISHED' } }),
    Show: await prisma.show.count(),
    Episode: await prisma.episode.count(),
  };

  const samplePlayer = await prisma.player.findFirst({ select: { slug: true } });
  const sampleCoach = await prisma.coach.findFirst({ select: { id: true } });
  const sampleNews = await prisma.news.findFirst({
    where: { status: 'PUBLISHED' },
    select: { slug: true },
    orderBy: { publishedAt: 'desc' },
  });
  const sampleMatch = await prisma.match.findFirst({ select: { id: true }, orderBy: { kickoffAt: 'desc' } });
  const sampleLeague = await prisma.league.findFirst({ select: { slug: true } });
  const sampleTeam = await prisma.team.findFirst({
    where: { externalId: { not: { startsWith: 'et' } } },
    select: { slug: true },
  });
  const sampleEpisode = await prisma.episode.findFirst({ select: { id: true } });

  const dynamic = [
    samplePlayer ? `/ar/player/${samplePlayer.slug}` : null,
    sampleCoach ? `/ar/coach/${sampleCoach.id}` : null,
    sampleNews ? `/ar/news/${sampleNews.slug}` : null,
    sampleMatch ? `/ar/match/${sampleMatch.id}` : null,
    sampleLeague ? `/ar/league/${sampleLeague.slug}` : null,
    sampleLeague ? `/ar/league/${sampleLeague.slug}/standings` : null,
    sampleTeam ? `/ar/team/${sampleTeam.slug}` : null,
    sampleEpisode ? `/ar/vod/player/${sampleEpisode.id}` : null,
  ].filter(Boolean);

  const paths = [...STATIC_PATHS, ...dynamic];
  for (const path of paths) {
    report.pages.push(await http(path));
  }

  // Schema.org presence on home
  try {
    const home = await fetch(`${BASE}/ar`);
    const html = await home.text();
    report.schemaSample = {
      status: home.status,
      hasJsonLd: html.includes('application/ld+json'),
      hasSportsOrOrg: /SportsOrganization|Organization|WebSite|NewsArticle/.test(html),
      dirRtl: html.includes('dir="rtl"'),
      cairo: html.includes('Cairo') || html.includes('cairo'),
      themeColor: html.includes('#f97316') || html.includes('f97316'),
    };
  } catch (err) {
    report.schemaSample = { error: err instanceof Error ? err.message : String(err) };
  }

  // Dark-mode cookie page still serves
  try {
    const dark = await fetch(`${BASE}/ar/about`, {
      headers: { Cookie: 'theme=dark' },
    });
    const html = await dark.text();
    report.rtlDark = {
      status: dark.status,
      hasDarkClass: html.includes('class="dark') || html.includes(' class="h-full scroll-smooth dark"') || html.includes('dark'),
    };
  } catch (err) {
    report.rtlDark = { error: err instanceof Error ? err.message : String(err) };
  }

  // Rate limit probe on search suggestions
  const statuses = [];
  for (let i = 0; i < 25; i += 1) {
    const res = await fetch(`${BASE}/api/search/suggestions?q=real&locale=ar`);
    statuses.push(res.status);
  }
  report.rateLimit = {
    samples: statuses.length,
    unique: [...new Set(statuses)],
    hit429: statuses.includes(429),
  };

  report.secretsInBundle = {
    scanned: existsSync('.next'),
    hits: existsSync('.next') ? scanBundleForSecrets() : [],
  };

  const failed = report.pages.filter((p) => !p.ok);
  report.summary = {
    total: report.pages.length,
    passed: report.pages.length - failed.length,
    failed: failed.map((f) => `${f.path}:${f.status}`),
    streamingLocked: report.streamingEnabled === false,
  };

  console.log(JSON.stringify(report, null, 2));
  if (failed.length) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
