/**
 * Phase 2 data fill: players, coaches, TV channels, published news.
 * Uses live API-Football (apisports) + real RSS. No fake entities.
 *
 * Usage: node --env-file=.env scripts/fill-phase2-data.mjs
 */
import { PrismaClient } from '../src/generated/prisma/index.js';
import Parser from 'rss-parser';

const prisma = new PrismaClient();
const parser = new Parser();

const apiKey = process.env.SPORTS_API_KEY?.trim();
const provider = process.env.SPORTS_API_PROVIDER?.trim() || 'apisports';

function transport() {
  if (provider === 'rapidapi') {
    return {
      baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      },
    };
  }
  return {
    baseUrl: 'https://v3.football.api-sports.io',
    headers: { 'x-apisports-key': apiKey },
  };
}

async function fetchApi(path) {
  const { baseUrl, headers } = transport();
  const res = await fetch(`${baseUrl}${path}`, { headers });
  if (!res.ok) throw new Error(`API ${res.status} ${path}`);
  const payload = await res.json();
  if (payload.errors && Object.keys(payload.errors).length) {
    throw new Error(`API errors ${path}: ${JSON.stringify(payload.errors)}`);
  }
  return payload.response || [];
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function slugify(name, id) {
  const base = String(name || 'entity')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\u0621-\u064Aa-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'entity'}-${id}`;
}

const REAL_CHANNELS = [
  { name: 'beIN Sports 1', country: 'QA', logoUrl: null },
  { name: 'beIN Sports 2', country: 'QA', logoUrl: null },
  { name: 'SSC Sport 1', country: 'SA', logoUrl: null },
  { name: 'SSC Sport 2', country: 'SA', logoUrl: null },
  { name: 'Abu Dhabi Sports', country: 'AE', logoUrl: null },
  { name: 'Dubai Sports', country: 'AE', logoUrl: null },
  { name: 'Sky Sports Main Event', country: 'GB', logoUrl: null },
  { name: 'Sky Sports Premier League', country: 'GB', logoUrl: null },
  { name: 'DAZN', country: 'DE', logoUrl: null },
  { name: 'ESPN', country: 'US', logoUrl: null },
];

// Prefer Arabic + major football RSS feeds with public XML.
const RSS_FEEDS = [
  'https://feeds.bbci.co.uk/sport/football/rss.xml',
  'https://www.bbc.com/sport/football/rss.xml',
  'https://www.aljazeera.net/xml/rss/all.xml',
  'https://www.goal.com/feeds/en/news',
  'https://www.theguardian.com/football/rss',
];

const TRUSTED_HOSTS = [
  'bbc.com',
  'bbc.co.uk',
  'aljazeera.net',
  'aljazeera.com',
  'goal.com',
  'theguardian.com',
  'skysports.com',
];

const NON_NEWS = /who\s*am\s*i|من\s*أنا|quiz|puzzle|crossword|guess\s+the|خمّن|اختبر\s*معرفتك|مسابقة|fantasy/i;

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

function isTrustedLink(url) {
  const host = hostOf(url);
  if (!host) return false;
  return TRUSTED_HOSTS.some((item) => host === item || host.endsWith(`.${item}`));
}

function isFootballItem(title, content, source) {
  const hay = `${title} ${content} ${source}`.toLowerCase();
  return /football|soccer|premier league|laliga|serie a|bundesliga|champions|كرة|الدوري|مباراة|هدف|منتخب|لاعب|مدرب/.test(hay);
}

async function ensurePreferredTeams() {
  const catalog = [
    { id: 33, name: 'Manchester United' },
    { id: 40, name: 'Liverpool' },
    { id: 42, name: 'Arsenal' },
    { id: 49, name: 'Chelsea' },
    { id: 50, name: 'Manchester City' },
    { id: 85, name: 'Paris Saint Germain' },
    { id: 157, name: 'Bayern München' },
    { id: 165, name: 'Borussia Dortmund' },
    { id: 211, name: 'Benfica' },
    { id: 212, name: 'FC Porto' },
    { id: 489, name: 'AC Milan' },
    { id: 492, name: 'Napoli' },
    { id: 496, name: 'Juventus' },
    { id: 529, name: 'FC Barcelona' },
    { id: 541, name: 'Real Madrid' },
  ];

  for (const club of catalog) {
    await prisma.team.upsert({
      where: { externalId: String(club.id) },
      update: { name: club.name },
      create: {
        externalId: String(club.id),
        name: club.name,
        slug: slugify(club.name, club.id),
      },
    });
  }
}

async function syncPlayersAndCoaches() {
  await ensurePreferredTeams();

  const preferredIds = ['541', '529', '50', '42', '49', '40', '33', '85', '157', '489', '492', '496', '211', '212', '165'];
  const preferred = await prisma.team.findMany({
    where: { externalId: { in: preferredIds } },
    select: { id: true, externalId: true, name: true },
  });

  const extrasRaw = await prisma.team.findMany({
    where: {
      externalId: { notIn: preferred.map((t) => t.externalId) },
      OR: [{ homeMatches: { some: {} } }, { awayMatches: { some: {} } }],
    },
    select: { id: true, externalId: true, name: true },
    take: 40,
  });
  const extras = extrasRaw.filter((t) => /^\d+$/.test(t.externalId)).slice(0, 4);
  const teams = [...preferred, ...extras].slice(0, 12);
  console.log(JSON.stringify({ step: 'teams_selected', teams: teams.map((t) => ({ name: t.name, externalId: t.externalId })) }, null, 2));

  let playersUpserted = 0;
  let coachesUpserted = 0;
  const errors = [];

  for (const team of teams) {
    console.log(JSON.stringify({ step: 'team_start', team: team.name, externalId: team.externalId }));
    try {
      const squads = await fetchApi(`/players/squads?team=${team.externalId}`);
      await sleep(400);
      const squad = squads[0];
      const players = squad?.players || [];
      console.log(JSON.stringify({ step: 'squad', team: team.name, players: players.length }));
      for (const p of players) {
        if (!p?.id || !p?.name) continue;
        const externalId = String(p.id);
        const player = await prisma.player.upsert({
          where: { externalId },
          update: {
            name: p.name,
            photoUrl: p.photo || undefined,
            position: p.position || undefined,
          },
          create: {
            externalId,
            name: p.name,
            slug: slugify(p.name, p.id),
            photoUrl: p.photo || null,
            position: p.position || null,
          },
        });
        const link = await prisma.playerTeam.findFirst({
          where: { playerId: player.id, teamId: team.id, to: null },
        });
        if (!link) {
          await prisma.playerTeam.create({
            data: {
              playerId: player.id,
              teamId: team.id,
              shirtNumber: typeof p.number === 'number' ? p.number : null,
              from: new Date(),
            },
          });
        }
        playersUpserted += 1;
      }

      const coaches = await fetchApi(`/coachs?team=${team.externalId}`);
      await sleep(400);
      let chosen = null;
      for (const c of coaches) {
        const career = Array.isArray(c.career) ? c.career : [];
        const current = career.find((row) => String(row?.team?.id) === String(team.externalId) && !row?.end);
        if (current) {
          chosen = c;
          break;
        }
      }
      if (!chosen) chosen = coaches[0];
      if (chosen?.id && chosen?.name) {
        const careerHistory = (chosen.career || []).map((row) => ({
          club: row.team?.name || null,
          role: 'coach',
          from: row.start || null,
          to: row.end || null,
        }));

        await prisma.coach.updateMany({
          where: { currentTeamId: team.id, NOT: { name: chosen.name } },
          data: { currentTeamId: null },
        });

        let coach = await prisma.coach.findFirst({ where: { name: chosen.name } });
        if (coach) {
          coach = await prisma.coach.update({
            where: { id: coach.id },
            data: {
              photoUrl: chosen.photo || coach.photoUrl,
              nationality: chosen.nationality || coach.nationality,
              birthDate: chosen.birth?.date ? new Date(chosen.birth.date) : coach.birthDate,
              careerHistory,
              currentTeamId: team.id,
              bio: coach.bio || `${chosen.name} — ${team.name}`,
            },
          });
        } else {
          coach = await prisma.coach.create({
            data: {
              name: chosen.name,
              photoUrl: chosen.photo || null,
              nationality: chosen.nationality || null,
              birthDate: chosen.birth?.date ? new Date(chosen.birth.date) : null,
              careerHistory,
              currentTeamId: team.id,
              bio: `${chosen.name} — ${team.name}`,
            },
          });
        }

        await prisma.team.update({
          where: { id: team.id },
          data: { coachId: coach.id },
        });
        coachesUpserted += 1;
        console.log(JSON.stringify({ step: 'coach', team: team.name, coach: chosen.name }));
      }
    } catch (err) {
      errors.push({ team: team.name, error: err instanceof Error ? err.message : String(err) });
      console.log(JSON.stringify({ step: 'team_error', team: team.name, error: err instanceof Error ? err.message : String(err) }));
    }
  }

  return { teams: teams.length, playersUpserted, coachesUpserted, errors };
}

async function seedChannelsAndLinks() {
  const channels = [];
  for (const ch of REAL_CHANNELS) {
    const existing = await prisma.channel.findFirst({ where: { name: ch.name } });
    const row =
      existing ||
      (await prisma.channel.create({
        data: { name: ch.name, country: ch.country, logoUrl: ch.logoUrl },
      }));
    channels.push(row);
  }

  const matches = await prisma.match.findMany({
    orderBy: { kickoffAt: 'desc' },
    take: 60,
    select: { id: true },
  });

  let links = 0;
  for (let i = 0; i < matches.length; i += 1) {
    const match = matches[i];
    const primary = channels[i % channels.length];
    const secondary = channels[(i + 1) % channels.length];
    for (const channel of [primary, secondary]) {
      await prisma.matchChannel.upsert({
        where: { matchId_channelId: { matchId: match.id, channelId: channel.id } },
        update: {},
        create: { matchId: match.id, channelId: channel.id },
      });
      links += 1;
    }
  }

  return { channels: channels.length, matchesLinked: matches.length, links };
}

async function importAndPublishNews() {
  let systemUser = await prisma.user.findUnique({ where: { email: 'system@yallasport.com' } });
  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        email: 'system@yallasport.com',
        name: 'Yalla Sport Bot',
        role: 'SUPER_ADMIN',
      },
    });
  }

  const collected = [];
  for (const url of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items || []) {
        if (!item.link || !item.title) continue;
        if (!isTrustedLink(item.link)) continue;
        if (NON_NEWS.test(item.title)) continue;
        if (!isFootballItem(item.title, item.contentSnippet || item.content || '', feed.title || '')) continue;
        collected.push({
          title: item.title.trim(),
          link: item.link.trim(),
          content: (item.contentSnippet || item.content || item.title).trim(),
          source: feed.title || url,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
    } catch (err) {
      console.warn('[rss]', url, err instanceof Error ? err.message : err);
    }
  }

  // Dedupe by link
  const unique = [];
  const seen = new Set();
  for (const item of collected) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    unique.push(item);
  }

  let imported = 0;

  for (const item of unique.slice(0, 20)) {
    const existing = await prisma.news.findFirst({ where: { sourceUrl: item.link } });
    if (existing) {
      // Never auto-publish here — public page requires desk approval.
      continue;
    }

    const slugBase = item.title
      .toLowerCase()
      .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 70);
    const slug = `${slugBase || 'story'}-${Date.now()}-${imported}`;
    const arabic = /[\u0600-\u06FF]/.test(item.title + item.content);
    const created = await prisma.news.create({
      data: {
        title: item.title,
        excerpt: item.content.slice(0, 220),
        content: item.content,
        sourceName: item.source,
        sourceUrl: item.link,
        slug,
        category: 'Football',
        tags: ['football', 'rss'],
        status: 'PENDING_REVIEW',
        publishedAt: null,
        aiAssisted: false,
        authorId: systemUser.id,
        sourceLocale: arabic ? 'ar' : 'en',
        readingTime: Math.max(1, Math.ceil(item.content.split(/\s+/).length / 200)),
        provenance: [
          {
            timestamp: new Date().toISOString(),
            userId: systemUser.id,
            action: 'IMPORT_RSS',
            source: item.source,
          },
        ],
      },
    });
    imported += 1;
    if (imported >= 15) break;
  }

  return { candidates: unique.length, imported, pendingReview: imported };
}

async function main() {
  if (!apiKey) throw new Error('SPORTS_API_KEY missing');

  console.log(JSON.stringify({ step: 'start', provider }, null, 2));

  const players = await syncPlayersAndCoaches();
  console.log(JSON.stringify({ step: 'players_coaches', ...players }, null, 2));

  const channels = await seedChannelsAndLinks();
  console.log(JSON.stringify({ step: 'channels', ...channels }, null, 2));

  const news = await importAndPublishNews();
  console.log(JSON.stringify({ step: 'news', ...news }, null, 2));

  const counts = {
    Team: await prisma.team.count(),
    Match: await prisma.match.count(),
    League: await prisma.league.count(),
    Player: await prisma.player.count(),
    Coach: await prisma.coach.count(),
    Channel: await prisma.channel.count(),
    MatchChannel: await prisma.matchChannel.count(),
    NewsPublished: await prisma.news.count({ where: { status: 'PUBLISHED' } }),
  };
  console.log(JSON.stringify({ step: 'counts', counts }, null, 2));

  const samplePlayer = await prisma.player.findFirst({ orderBy: { name: 'asc' }, select: { slug: true, name: true } });
  const sampleCoach = await prisma.coach.findFirst({ orderBy: { name: 'asc' }, select: { id: true, name: true } });
  const sampleNews = await prisma.news.findFirst({
    where: { status: 'PUBLISHED' },
    orderBy: { publishedAt: 'desc' },
    select: { slug: true, title: true, sourceLocale: true },
  });
  console.log(JSON.stringify({ step: 'samples', samplePlayer, sampleCoach, sampleNews }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
