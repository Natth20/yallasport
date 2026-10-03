import type {
  MatchStatus,
  NormalizedChannel,
  NormalizedCommentator,
  NormalizedLineup,
  NormalizedMatch,
  NormalizedMatchDetail,
  NormalizedMatchEvent,
  NormalizedStanding,
  NormalizedStatistic,
} from './types';

export type DbTeamRef = {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type DbLeagueRef = {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  country?: string | null;
};

type StoredLineupPayload = {
  players?: NormalizedLineup['players'];
  bench?: NormalizedLineup['bench'];
  coach?: NormalizedLineup['coach'];
};

export const MATCH_LIST_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
  league: true,
  venue: { select: { name: true } },
  channels: {
    take: 1,
    select: { channel: { select: { id: true, name: true, logoUrl: true, country: true } } },
  },
} as const;

export const MATCH_DETAIL_INCLUDE = {
  homeTeam: true,
  awayTeam: true,
  league: true,
  channels: { include: { channel: true } },
  commentators: true,
  lineups: true,
  statistics: true,
  events: { orderBy: [{ minute: 'asc' as const }, { extraMinute: 'asc' as const }] },
  venue: true,
  referee: true,
};

export function toNormalizedMatch(match: {
  id: string;
  externalId: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date;
  venue?: { name: string } | null;
  round?: string | null;
  homeTeam: DbTeamRef;
  awayTeam: DbTeamRef;
  league: DbLeagueRef;
}): NormalizedMatch {
  return {
    id: match.id,
    externalId: match.externalId,
    status: match.status,
    homeScore: match.homeScore ?? undefined,
    awayScore: match.awayScore ?? undefined,
    minute: match.minute ?? undefined,
    kickoffAt: match.kickoffAt,
    venue: match.venue?.name,
    round: match.round ?? undefined,
    homeTeam: {
      id: match.homeTeam.id,
      externalId: match.homeTeam.externalId,
      name: match.homeTeam.name,
      slug: match.homeTeam.slug,
      logoUrl: match.homeTeam.logoUrl ?? undefined,
    },
    awayTeam: {
      id: match.awayTeam.id,
      externalId: match.awayTeam.externalId,
      name: match.awayTeam.name,
      slug: match.awayTeam.slug,
      logoUrl: match.awayTeam.logoUrl ?? undefined,
    },
    league: {
      id: match.league.id,
      externalId: match.league.externalId,
      name: match.league.name,
      slug: match.league.slug,
      logoUrl: match.league.logoUrl ?? undefined,
      country: match.league.country ?? undefined,
    },
  };
}

export function toNormalizedStanding(row: {
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  team: DbTeamRef;
}): NormalizedStanding {
  return {
    rank: row.rank,
    played: row.played,
    won: row.won,
    drawn: row.drawn,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    goalDiff: row.goalsFor - row.goalsAgainst,
    points: row.points,
    team: {
      id: row.team.id,
      externalId: row.team.externalId,
      name: row.team.name,
      slug: row.team.slug,
      logoUrl: row.team.logoUrl ?? undefined,
    },
  };
}

export function mapStoredMatchToDetail(stored: {
  id: string;
  externalId: string;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: Date;
  homeTeam: DbTeamRef;
  awayTeam: DbTeamRef;
  league: DbLeagueRef;
  venue: { id: string; name: string; city: string | null; capacity: number | null } | null;
  referee: { id: string; name: string } | null;
  attendance?: number | null;
  channels: Array<{ channel: { id: string; name: string; logoUrl: string | null; country: string | null } }>;
  commentators: Array<{ name: string; role: string; language: string | null }>;
  lineups: Array<{
    teamId: string;
    formation: string | null;
    playersJson: unknown;
    isPredicted: boolean;
    source: string | null;
  }>;
  statistics: Array<{
    teamId: string;
    possession: number | null;
    shotsOnTarget: number | null;
    shotsOffTarget: number | null;
    corners: number | null;
    offsides: number | null;
    fouls: number | null;
  }>;
  events: Array<{
    id: string;
    type: string;
    minute: number;
    extraMinute: number | null;
    playerId: string | null;
    playerName: string | null;
    assistName: string | null;
    teamId: string;
    detail: string | null;
  }>;
}): NormalizedMatchDetail {
  const base = toNormalizedMatch(stored);
  const channels: NormalizedChannel[] = (stored.channels ?? []).map(({ channel }) => ({
    id: channel.id,
    name: channel.name,
    logoUrl: channel.logoUrl ?? undefined,
    country: channel.country ?? undefined,
  }));
  const commentators: NormalizedCommentator[] = (stored.commentators ?? []).map((commentator) => ({
    name: commentator.name,
    role: commentator.role === 'CO_COMMENTATOR' ? 'CO_COMMENTATOR' : 'MAIN',
    language: commentator.language ?? undefined,
  }));

  const preferredLineups = (stored.lineups ?? []).filter((lineup) => !lineup.isPredicted);

  const lineups: NormalizedLineup[] = preferredLineups.map((lineup) => {
    const payload = (lineup.playersJson ?? {}) as StoredLineupPayload;
    return {
      teamId: lineup.teamId,
      formation: lineup.formation ?? undefined,
      players: payload.players ?? [],
      bench: payload.bench,
      coach: payload.coach,
      status: lineup.isPredicted ? 'PREDICTED' : 'CONFIRMED',
      source: lineup.source === 'EDITORIAL' || lineup.source === 'INFERRED' ? lineup.source : 'API',
    };
  });

  const statistics: NormalizedStatistic[] = (stored.statistics ?? []).map((statistic) => ({
    teamId: statistic.teamId,
    possession: statistic.possession ?? undefined,
    shotsOnTarget: statistic.shotsOnTarget ?? undefined,
    shotsOffTarget: statistic.shotsOffTarget ?? undefined,
    corners: statistic.corners ?? undefined,
    offsides: statistic.offsides ?? undefined,
    fouls: statistic.fouls ?? undefined,
  }));

  const events: NormalizedMatchEvent[] = (stored.events ?? []).map((event) => ({
    id: event.id,
    type: event.type as NormalizedMatchEvent['type'],
    minute: event.minute,
    extraMinute: event.extraMinute ?? undefined,
    playerId: event.playerId ?? undefined,
    player: event.playerName ?? undefined,
    assistPlayer: event.assistName ?? undefined,
    teamId: event.teamId,
    detail: event.detail ?? undefined,
  }));

  return {
    ...base,
    venue: stored.venue?.name,
    venueDetail: stored.venue
      ? {
          id: stored.venue.id,
          name: stored.venue.name,
          city: stored.venue.city ?? undefined,
          capacity: stored.venue.capacity ?? undefined,
        }
      : undefined,
    referee: stored.referee ? { id: stored.referee.id, name: stored.referee.name } : undefined,
    attendance: typeof stored.attendance === 'number' ? stored.attendance : undefined,
    channels,
    commentators,
    lineups,
    events,
    statistics,
    lineupStatus: lineups.length > 0 ? 'CONFIRMED' : 'PENDING',
    availability: {
      events: events.length ? 'AVAILABLE' : 'PENDING',
      lineups: lineups.length > 0 ? 'CONFIRMED' : 'PENDING',
      statistics: statistics.length ? 'AVAILABLE' : 'PENDING',
      broadcast: channels.length || commentators.length ? 'AVAILABLE' : 'PENDING',
    },
  };
}
