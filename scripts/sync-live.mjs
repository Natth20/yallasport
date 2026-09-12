import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const apiKey = process.env.SPORTS_API_KEY;
const baseUrl = 'https://v3.football.api-sports.io';

const statusMap = {
  TBD: 'NOT_STARTED',
  NS: 'NOT_STARTED',
  '1H': 'LIVE',
  HT: 'HALFTIME',
  '2H': 'LIVE',
  ET: 'LIVE',
  BT: 'LIVE',
  P: 'LIVE',
  SUSP: 'LIVE',
  INT: 'LIVE',
  FT: 'FINISHED',
  AET: 'FINISHED',
  PEN: 'FINISHED',
  PST: 'POSTPONED',
  CANC: 'CANCELLED',
  ABD: 'CANCELLED',
  AWD: 'FINISHED',
  WO: 'FINISHED',
};

const slug = (name, id) => `${(name || 'entity').toLowerCase().replace(/\s+/g, '-')}-${id}`;

async function fetchApi(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'x-apisports-key': apiKey },
  });
  if (!response.ok) {
    throw new Error(`API ${response.status} ${path}`);
  }
  const payload = await response.json();
  return payload.response || [];
}

async function persistFixture(fixture) {
  const [homeTeam, awayTeam, league] = await Promise.all([
    prisma.team.upsert({
      where: { externalId: String(fixture.teams.home.id) },
      update: { name: fixture.teams.home.name, logoUrl: fixture.teams.home.logo },
      create: {
        externalId: String(fixture.teams.home.id),
        name: fixture.teams.home.name,
        slug: slug(fixture.teams.home.name, fixture.teams.home.id),
        logoUrl: fixture.teams.home.logo,
      },
    }),
    prisma.team.upsert({
      where: { externalId: String(fixture.teams.away.id) },
      update: { name: fixture.teams.away.name, logoUrl: fixture.teams.away.logo },
      create: {
        externalId: String(fixture.teams.away.id),
        name: fixture.teams.away.name,
        slug: slug(fixture.teams.away.name, fixture.teams.away.id),
        logoUrl: fixture.teams.away.logo,
      },
    }),
    prisma.league.upsert({
      where: { externalId: String(fixture.league.id) },
      update: {
        name: fixture.league.name,
        logoUrl: fixture.league.logo,
        country: fixture.league.country || undefined,
      },
      create: {
        externalId: String(fixture.league.id),
        name: fixture.league.name,
        slug: slug(fixture.league.name, fixture.league.id),
        logoUrl: fixture.league.logo,
        country: fixture.league.country || null,
      },
    }),
  ]);

  return prisma.match.upsert({
    where: { externalId: String(fixture.fixture.id) },
    update: {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      leagueId: league.id,
      status: statusMap[fixture.fixture.status.short] || 'NOT_STARTED',
      homeScore: fixture.goals.home ?? null,
      awayScore: fixture.goals.away ?? null,
      minute: fixture.fixture.status.elapsed ?? null,
      kickoffAt: new Date(fixture.fixture.date),
      lastSyncedAt: new Date(),
    },
    create: {
      externalId: String(fixture.fixture.id),
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      leagueId: league.id,
      seasonId: String(fixture.league.season || new Date(fixture.fixture.date).getUTCFullYear()),
      status: statusMap[fixture.fixture.status.short] || 'NOT_STARTED',
      homeScore: fixture.goals.home ?? null,
      awayScore: fixture.goals.away ?? null,
      minute: fixture.fixture.status.elapsed ?? null,
      kickoffAt: new Date(fixture.fixture.date),
      lastSyncedAt: new Date(),
    },
  });
}

async function main() {
  if (!apiKey || apiKey === 'placeholder-api-key') {
    throw new Error('Missing live sports API key');
  }

  const today = new Date().toISOString().slice(0, 10);
  const [live, dated] = await Promise.all([
    fetchApi('/fixtures?live=all'),
    fetchApi(`/fixtures?date=${today}`),
  ]);

  const fixtures = [...dated, ...live].filter(
    (fixture, index, list) => list.findIndex((item) => item.fixture.id === fixture.fixture.id) === index
  );

  let saved = 0;
  for (const fixture of fixtures) {
    await persistFixture(fixture);
    saved += 1;
  }

  console.log(JSON.stringify({ today, live: live.length, dated: dated.length, saved }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
