// src/lib/sports-data/types.ts

export type MatchStatus = 'NOT_STARTED' | 'LIVE' | 'HALFTIME' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';

export interface NormalizedMatch {
  id: string;
  externalId: string;
  homeTeam: NormalizedTeam;
  awayTeam: NormalizedTeam;
  league: NormalizedLeague;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  minute?: number;
  kickoffAt: Date;
  venue?: string;
  round?: string;
}

export interface NormalizedMatchDetail extends NormalizedMatch {
  events: NormalizedMatchEvent[];
  lineups: NormalizedLineup[];
  statistics: NormalizedStatistic[];
  channels: NormalizedChannel[];
  commentators?: NormalizedCommentator[];
  referee?: { id?: string; name: string };
  venueDetail?: { id?: string; name: string; city?: string; capacity?: number };
  lineupStatus?: 'CONFIRMED' | 'PREDICTED' | 'PENDING' | 'UNAVAILABLE';
  availability?: MatchDataAvailability;
}

export interface NormalizedTeam {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  logoUrl?: string;
}

export interface NormalizedLeague {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  country?: string;
}

export interface NormalizedMatchEvent {
  id?: string;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION' | 'VAR' | 'PENALTY' | 'OWN_GOAL';
  minute: number;
  extraMinute?: number;
  playerId?: string;
  player?: string;
  assistPlayer?: string;
  teamId: string;
  detail?: string;
}

export interface NormalizedLineupPlayer {
  id: string;
  name: string;
  number?: number;
  position?: string;
  grid?: string;
  isSubstitute?: boolean;
}

export interface NormalizedLineup {
  teamId: string;
  formation?: string;
  players: NormalizedLineupPlayer[];
  bench?: NormalizedLineupPlayer[];
  coach?: { id?: string; name: string };
  status?: 'CONFIRMED' | 'PREDICTED';
  source?: 'API' | 'EDITORIAL' | 'INFERRED';
}

export interface NormalizedStatistic {
  teamId: string;
  possession?: number;
  shotsOnTarget?: number;
  shotsOffTarget?: number;
  corners?: number;
  fouls?: number;
  offsides?: number;
  passes?: number;
  passAccuracy?: number;
  expectedGoals?: number;
}

export interface NormalizedChannel {
  id: string;
  name: string;
  logoUrl?: string;
  country?: string;
}

export interface NormalizedCommentator {
  name: string;
  role?: 'MAIN' | 'CO_COMMENTATOR';
  language?: string;
}

export interface MatchDataAvailability {
  events: 'AVAILABLE' | 'PENDING' | 'UNSUPPORTED';
  lineups: 'CONFIRMED' | 'PREDICTED' | 'PENDING' | 'UNSUPPORTED';
  statistics: 'AVAILABLE' | 'PENDING' | 'UNSUPPORTED';
  broadcast: 'AVAILABLE' | 'PENDING';
}

export interface DataFreshness {
  syncedAt: string | null;
  cachedAt?: string;
  source: 'LIVE' | 'CACHE' | 'EMPTY' | 'MOCK';
  staleAfterSeconds: number;
}

export interface LiveMatchesPayload {
  matches: NormalizedMatch[];
  freshness: DataFreshness;
}

export interface NormalizedLeagueSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
}

export interface NormalizedStanding {
  rank: number;
  team: NormalizedTeam;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}

export interface NormalizedScorer {
  player: {
    id: string;
    name: string;
    slug: string;
    photoUrl?: string;
  };
  teamName?: string;
  goals: number;
}
