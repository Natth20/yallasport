export type EventCategory = 'LIVE' | 'MATCH_EVENT' | 'NEWS' | 'MAJOR_EVENT' | 'TRANSFER';

export type DataSourceStatus = 'AVAILABLE' | 'PENDING' | 'STALE' | 'UNAVAILABLE' | 'ERROR';

export interface SourceHealth {
  name: string;
  category: EventCategory;
  status: DataSourceStatus;
  lastChecked: Date;
  count: number;
  message?: string;
}

export interface UnifiedEvent {
  id: string; // Unique deduplication key
  type: EventCategory;
  title: string;
  subtitle?: string;
  timestamp: string; // ISO string
  minute?: number | string | null;
  badge: {
    text: string;
    textEn: string;
    color: string;
    isPulse?: boolean;
  };
  sourceName: string;
  sourceStatus: DataSourceStatus;
  links: {
    match?: string;
    news?: string;
    league?: string;
    team?: string;
    player?: string;
    transfer?: string;
  };
  media?: {
    image?: string | null;
    crestHome?: string | null;
    crestAway?: string | null;
    leagueLogo?: string | null;
  };
  details?: {
    homeScore?: number | null;
    awayScore?: number | null;
    homeTeamName?: string;
    awayTeamName?: string;
    leagueName?: string;
    playerName?: string | null;
    teamName?: string | null;
    fromTeam?: string | null;
    toTeam?: string | null;
    fee?: string | null;
    venue?: string | null;
  };
}

export interface EventsResponse {
  events: UnifiedEvent[];
  sources: SourceHealth[];
  timestamp: string;
  totalCount: number;
}
