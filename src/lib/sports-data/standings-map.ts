import type { NormalizedStanding } from './types';

type StandingTeam = {
  id?: number | string;
  name?: string;
  logo?: string;
};

type StandingBlock = {
  rank?: unknown;
  points?: unknown;
  goalsDiff?: unknown;
  description?: unknown;
  team?: StandingTeam;
  all?: {
    played?: unknown;
    win?: unknown;
    draw?: unknown;
    lose?: unknown;
    goals?: { for?: unknown; against?: unknown };
  };
};

function asInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isStandingBlock(value: unknown): value is StandingBlock {
  if (!value || typeof value !== 'object') return false;
  const row = value as StandingBlock;
  return Boolean(row.team && (row.team.name || row.team.id != null) && row.all && typeof row.all === 'object');
}

function standingTables(standings: unknown): StandingBlock[][] {
  if (!Array.isArray(standings) || standings.length === 0) return [];
  if (isStandingBlock(standings[0])) return [standings.filter(isStandingBlock)];
  return standings
    .filter(Array.isArray)
    .map((group) => group.filter(isStandingBlock))
    .filter((group) => group.length > 0);
}

function mapBlock(row: StandingBlock): NormalizedStanding | null {
  const teamId = row.team?.id;
  const teamName = row.team?.name?.trim();
  if (teamId == null || !teamName) return null;

  const rank = asInt(row.rank);
  const points = asInt(row.points);
  const played = asInt(row.all?.played);
  const won = asInt(row.all?.win);
  const drawn = asInt(row.all?.draw);
  const lost = asInt(row.all?.lose);
  const goalsFor = asInt(row.all?.goals?.for);
  const goalsAgainst = asInt(row.all?.goals?.against);
  if (
    rank == null ||
    points == null ||
    played == null ||
    won == null ||
    drawn == null ||
    lost == null ||
    goalsFor == null ||
    goalsAgainst == null
  ) {
    return null;
  }

  const externalId = String(teamId);
  const goalDiff = asInt(row.goalsDiff);
  return {
    rank,
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDiff: goalDiff ?? goalsFor - goalsAgainst,
    points,
    description: typeof row.description === 'string' ? row.description : null,
    team: {
      id: externalId,
      externalId,
      name: teamName,
      slug: teamName.toLowerCase().replace(/\s+/g, '-'),
      logoUrl: row.team?.logo,
    },
  };
}

export function mapApiFootballStandings(payload: unknown): NormalizedStanding[] {
  const response = (payload as { response?: Array<{ league?: { standings?: unknown } }> } | null)?.response;
  if (!Array.isArray(response) || response.length === 0) return [];

  const tables = standingTables(response[0]?.league?.standings);
  if (tables.length === 0) return [];

  const rows = tables.flatMap((table) => table.map(mapBlock).filter((row): row is NormalizedStanding => Boolean(row)));
  const ranks = rows.map((row) => row.rank);
  const uniqueRanks = new Set(ranks);
  if (uniqueRanks.size === rows.length) {
    return [...rows].sort((left, right) => left.rank - right.rank);
  }
  return rows;
}
