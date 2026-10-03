import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '../src/generated/prisma/index.js';
import { mapApiFootballStandings } from '../src/lib/sports-data/standings-map';

const prisma = new PrismaClient();
const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'tmp', 'standings-audit');
mkdirSync(outDir, { recursive: true });

const apiKey = process.env.SPORTS_API_KEY?.trim();
const provider = (process.env.SPORTS_API_PROVIDER || 'apisports').toLowerCase();
const transport: { baseUrl: string; headers: Record<string, string> } =
  provider === 'rapidapi'
    ? {
      baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
      headers: {
        'x-rapidapi-key': apiKey || '',
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      },
    }
    : {
      baseUrl: 'https://v3.football.api-sports.io',
      headers: { 'x-apisports-key': apiKey || '' },
    };

const boards = [
  { id: '2', season: '2026', name: 'ucl' },
  { id: '39', season: '2026', name: 'epl' },
  { id: '140', season: '2026', name: 'laliga' },
  { id: '307', season: '2026', name: 'roshn' },
];

const summary: unknown[] = [];

async function main() {
  console.log('audit start');
  for (const board of boards) {
    console.log('fetch', board.name);
    const url = `${transport.baseUrl}/standings?league=${board.id}&season=${board.season}`;
    const res = await fetch(url, { headers: transport.headers, signal: AbortSignal.timeout(20000) });
    const json = await res.json();
    writeFileSync(join(outDir, `${board.name}-raw.json`), JSON.stringify(json, null, 2));
    const mapped = mapApiFootballStandings(json);
    const league = await prisma.league.findFirst({
      where: { externalId: board.id },
      select: { id: true, name: true },
    });
    const keptTeamIds: string[] = [];
    if (league && mapped.length > 0) {
      for (const row of mapped) {
        const team = await prisma.team.upsert({
          where: { externalId: row.team.externalId },
          update: { name: row.team.name, logoUrl: row.team.logoUrl ?? null },
          create: {
            externalId: row.team.externalId,
            name: row.team.name,
            slug: `${row.team.slug}-${row.team.externalId}`,
            logoUrl: row.team.logoUrl ?? null,
          },
        });
        keptTeamIds.push(team.id);
        await prisma.standing.upsert({
          where: {
            leagueId_seasonId_teamId: {
              leagueId: league.id,
              seasonId: board.season,
              teamId: team.id,
            },
          },
          update: {
            rank: row.rank,
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            points: row.points,
          },
          create: {
            leagueId: league.id,
            seasonId: board.season,
            teamId: team.id,
            rank: row.rank,
            played: row.played,
            won: row.won,
            drawn: row.drawn,
            lost: row.lost,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            points: row.points,
          },
        });
      }
      await prisma.standing.deleteMany({
        where: { leagueId: league.id, seasonId: board.season, teamId: { notIn: keptTeamIds } },
      });
    }
    const dbRows = league
      ? await prisma.standing.findMany({
        where: { leagueId: league.id, seasonId: board.season },
        orderBy: { rank: 'asc' },
        include: { team: { select: { name: true, externalId: true } } },
      })
      : [];
    const mismatches: unknown[] = [];
    for (const apiRow of mapped) {
      const db = dbRows.find((row) => row.team.externalId === String(apiRow.team.externalId));
      if (!db) {
        mismatches.push({ kind: 'missing-db', team: apiRow.team.name, rank: apiRow.rank });
        continue;
      }
      if (
        db.rank !== apiRow.rank ||
        db.played !== apiRow.played ||
        db.won !== apiRow.won ||
        db.drawn !== apiRow.drawn ||
        db.lost !== apiRow.lost ||
        db.goalsFor !== apiRow.goalsFor ||
        db.goalsAgainst !== apiRow.goalsAgainst ||
        db.points !== apiRow.points
      ) {
        mismatches.push({
          kind: 'field-mismatch',
          team: apiRow.team.name,
          api: { rank: apiRow.rank, played: apiRow.played, points: apiRow.points },
          db: { rank: db.rank, played: db.played, points: db.points },
        });
      }
    }
    summary.push({
      board: board.name,
      leagueId: board.id,
      season: board.season,
      apiCount: mapped.length,
      dbCount: dbRows.length,
      mismatchCount: mismatches.length,
      apiTop: mapped.slice(0, 5).map((row) => ({
        rank: row.rank,
        team: row.team.name,
        played: row.played,
        points: row.points,
      })),
      dbTop: dbRows.slice(0, 5).map((row) => ({
        rank: row.rank,
        team: row.team.name,
        played: row.played,
        points: row.points,
      })),
      mismatches: mismatches.slice(0, 12),
    });
  }

  writeFileSync(join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await prisma.$disconnect();
}

main();
