export type FrontCrest = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
};

export type FrontMatch = {
  id: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  minute: number | null;
  kickoffAt: string;
  homeTeam: FrontCrest;
  awayTeam: FrontCrest;
  league: FrontCrest & { country?: string | null };
};

export type FrontStory = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  image: string | null;
  category: string;
  publishedAt: string;
  sourceName: string | null;
};

export type FrontPulse = {
  matches: number;
  live: number;
  goals: number;
  yellow: number;
  red: number;
  todayKey: string;
};

export type FrontStandingRow = {
  rank: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff?: number;
  points: number;
  zone: string | null;
  team: FrontCrest;
};

export type FrontTable = {
  league: FrontCrest & { country?: string | null; externalId?: string | null };
  seasonId: string;
  rows: FrontStandingRow[];
};

export type FrontScorer = {
  name: string;
  slug: string | null;
  photoUrl: string | null;
  value: number;
};

export type FrontTransfer = {
  id: string;
  date: string;
  fee: string | null;
  fromTeam: string | null;
  toTeam: string | null;
  fromLogo: string | null;
  toLogo: string | null;
  playerName: string;
  playerSlug: string;
  playerPhoto: string | null;
};

export type FrontClip = {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  channelTitle: string;
  publishedAt: string;
};

export type FrontTapeGoal = {
  id: string;
  minute: number;
  player: string;
  slug: string | null;
  matchId: string;
  home: string;
  away: string;
};

export type FrontBroadcast = {
  id: string;
  channelName: string;
  channelLogo: string | null;
  kickoffAt: string;
  homeName: string;
  awayName: string;
  matchId: string;
  leagueName: string;
};

export type FrontFavorite = {
  kind: 'TEAM' | 'LEAGUE' | 'PLAYER';
  name: string;
  slug: string;
  logoUrl: string | null;
};
