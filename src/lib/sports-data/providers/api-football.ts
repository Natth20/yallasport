import { sportsApiFetch } from '../provider-http';
import type { SportsDataProvider } from '../interface';
import { 
  NormalizedMatch, 
  NormalizedMatchDetail, 
  NormalizedTeam, 
  NormalizedStanding,
  NormalizedLineup,
  MatchStatus,
  NormalizedScorer
} from '../types';

interface ApiTeam {
  id: number;
  name: string;
  logo?: string;
}

interface ApiFixture {
  fixture: {
    id: number;
    date: string;
    referee?: string;
    status: { short: string; elapsed?: number };
    venue: { id?: number; name?: string; city?: string };
    attendance?: number | null;
  };
  teams: { home: ApiTeam; away: ApiTeam };
  league: ApiTeam & { round?: string; country?: string; season?: number };
  goals: { home: number | null; away: number | null };
}

interface ApiPlayerEntry {
  player: { id?: number; name?: string; number?: number; pos?: string; grid?: string };
}

interface ApiLineup {
  team: ApiTeam;
  formation?: string;
  startXI?: ApiPlayerEntry[];
  substitutes?: ApiPlayerEntry[];
  coach?: { id?: number; name: string };
}

interface ApiEvent {
  id?: number;
  type: string;
  detail?: string;
  time: { elapsed: number; extra?: number };
  player?: { id?: number; name?: string };
  assist?: { name?: string };
  team: ApiTeam;
}

interface ApiTeamStatistics {
  team: ApiTeam;
  statistics?: Array<{ type: string; value: string | number | null }>;
}

interface ApiStanding {
  rank: number;
  team: ApiTeam;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
  points: number;
}

interface ApiTeamResponse {
  team: ApiTeam;
}

interface ApiStandingsResponse {
  league: { standings: ApiStanding[][] };
}

interface ApiSeason {
  year: number;
  start: string;
  end: string;
  current: boolean;
}

interface ApiLeagueResponse {
  seasons: ApiSeason[];
}

interface ApiEnvelope<T> {
  response: T[];
}

interface ApiScorer {
  player: {
    id: number;
    name: string;
    photo: string;
  };
  statistics: {
    team: {
      name: string;
    };
    goals: {
      total: number;
    };
  }[];
}

/**
 * ApiFootballProvider - Implementation for API-Football (RapidAPI).
 * Maps external API responses to our internal Normalized types.
 */
export class ApiFootballProvider implements SportsDataProvider {
  constructor(_apiKey: string) {}

  private async fetch<T>(endpoint: string): Promise<ApiEnvelope<T>> {
    const data = await sportsApiFetch<ApiEnvelope<T>>(endpoint);
    return data ?? { response: [] };
  }

  async getRaw<T = unknown>(path: string): Promise<T | null> {
    return sportsApiFetch<T>(path);
  }

  private mapStatus(status: string): MatchStatus {
    const mapping: Record<string, MatchStatus> = {
      'TBD': 'NOT_STARTED',
      'NS': 'NOT_STARTED',
      '1H': 'LIVE',
      'HT': 'HALFTIME',
      '2H': 'LIVE',
      'ET': 'LIVE',
      'BT': 'LIVE',
      'P': 'LIVE',
      'SUSP': 'LIVE',
      'INT': 'LIVE',
      'FT': 'FINISHED',
      'AET': 'FINISHED',
      'PEN': 'FINISHED',
      'PST': 'POSTPONED',
      'CANC': 'CANCELLED',
      'ABD': 'CANCELLED',
      'AWD': 'FINISHED',
      'WO': 'FINISHED'
    };
    return mapping[status] || 'NOT_STARTED';
  }

  private mapFixture(fixture: ApiFixture): NormalizedMatch {
    return {
      id: String(fixture.fixture.id),
      externalId: String(fixture.fixture.id),
      homeTeam: {
        id: String(fixture.teams.home.id),
        externalId: String(fixture.teams.home.id),
        name: fixture.teams.home.name,
        slug: fixture.teams.home.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: fixture.teams.home.logo,
      },
      awayTeam: {
        id: String(fixture.teams.away.id),
        externalId: String(fixture.teams.away.id),
        name: fixture.teams.away.name,
        slug: fixture.teams.away.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: fixture.teams.away.logo,
      },
      league: {
        id: String(fixture.league.id),
        externalId: String(fixture.league.id),
        name: fixture.league.name,
        slug: fixture.league.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: fixture.league.logo,
        country: fixture.league.country,
      },
      status: this.mapStatus(fixture.fixture.status.short),
      homeScore: fixture.goals.home ?? undefined,
      awayScore: fixture.goals.away ?? undefined,
      minute: fixture.fixture.status.elapsed,
      kickoffAt: new Date(fixture.fixture.date),
      venue: fixture.fixture.venue.name,
      round: fixture.league.round || undefined,
    };
  }

  async getLiveMatches(): Promise<NormalizedMatch[]> {
    const data = await this.fetch<ApiFixture>('/fixtures?live=all');
    if (!data.response) return [];

    return data.response.map((fixture) => this.mapFixture(fixture));
  }

  async getMatchById(id: string): Promise<NormalizedMatchDetail> {
    const [fixtureData, eventsData, lineupsData, statisticsData] = await Promise.all([
      this.fetch<ApiFixture>(`/fixtures?id=${id}`),
      this.fetch<ApiEvent>(`/fixtures/events?fixture=${id}`),
      this.fetch<ApiLineup>(`/fixtures/lineups?fixture=${id}`),
      this.fetch<ApiTeamStatistics>(`/fixtures/statistics?fixture=${id}`),
    ]);
    if (!fixtureData.response || fixtureData.response.length === 0) {
      throw new Error('Match not found');
    }
    const f = fixtureData.response[0];
    const status = this.mapStatus(f.fixture.status.short);

    const mapPlayer = (entry: ApiPlayerEntry, isSubstitute = false) => ({
      id: String(entry.player?.id ?? ''),
      name: entry.player?.name ?? 'Unknown',
      number: entry.player?.number ?? undefined,
      position: entry.player?.pos ?? undefined,
      grid: entry.player?.grid ?? undefined,
      isSubstitute,
    });

    const lineups: NormalizedLineup[] = lineupsData.response.map((lineup) => ({
      teamId: String(lineup.team.id),
      formation: lineup.formation || undefined,
      players: (lineup.startXI || []).map((player) => mapPlayer(player)),
      bench: (lineup.substitutes || []).map((player) => mapPlayer(player, true)),
      coach: lineup.coach ? { id: String(lineup.coach.id), name: lineup.coach.name } : undefined,
      status: 'CONFIRMED' as const,
      source: 'API' as const,
    }));

    const statistics = statisticsData.response.map((teamStats) => {
      const value = (type: string) =>
        teamStats.statistics?.find((stat) => stat.type === type)?.value;
      const number = (type: string) => {
        const parsed = Number.parseFloat(String(value(type) ?? '').replace('%', ''));
        return Number.isFinite(parsed) ? parsed : undefined;
      };
      return {
        teamId: String(teamStats.team.id),
        possession: number('Ball Possession'),
        shotsOnTarget: number('Shots on Goal'),
        shotsOffTarget: number('Shots off Goal'),
        corners: number('Corner Kicks'),
        fouls: number('Fouls'),
        offsides: number('Offsides'),
        passes: number('Total passes'),
        passAccuracy: number('Passes %'),
        expectedGoals: number('expected_goals'),
      };
    });

    return {
      id: String(f.fixture.id),
      externalId: String(f.fixture.id),
      homeTeam: {
        id: String(f.teams.home.id),
        externalId: String(f.teams.home.id),
        name: f.teams.home.name,
        slug: f.teams.home.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: f.teams.home.logo
      },
      awayTeam: {
        id: String(f.teams.away.id),
        externalId: String(f.teams.away.id),
        name: f.teams.away.name,
        slug: f.teams.away.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: f.teams.away.logo
      },
      league: {
        id: String(f.league.id),
        externalId: String(f.league.id),
        name: f.league.name,
        slug: f.league.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: f.league.logo,
        country: f.league.country,
      },
      status,
      homeScore: f.goals.home ?? undefined,
      awayScore: f.goals.away ?? undefined,
      minute: f.fixture.status.elapsed,
      kickoffAt: new Date(f.fixture.date),
      round: f.league.round || undefined,
      venue: f.fixture.venue.name,
      venueDetail: f.fixture.venue?.name ? {
        id: f.fixture.venue.id ? String(f.fixture.venue.id) : undefined,
        name: f.fixture.venue.name,
        city: f.fixture.venue.city || undefined,
      } : undefined,
      referee: f.fixture.referee ? { name: f.fixture.referee } : undefined,
      attendance: typeof f.fixture.attendance === 'number' ? f.fixture.attendance : undefined,
      events: eventsData.response.map((event) => ({
        id: event.id ? String(event.id) : undefined,
        type: event.type === 'Goal'
          ? event.detail?.includes('Own Goal') ? 'OWN_GOAL' : event.detail?.includes('Penalty') ? 'PENALTY' : 'GOAL'
          : event.type === 'Card'
            ? event.detail?.includes('Yellow') ? 'YELLOW_CARD' : 'RED_CARD'
            : event.type === 'Var' ? 'VAR' : 'SUBSTITUTION',
        minute: event.time.elapsed,
        extraMinute: event.time.extra || undefined,
        playerId: event.player?.id ? String(event.player.id) : undefined,
        player: event.player?.name || undefined,
        assistPlayer: event.assist?.name || undefined,
        teamId: String(event.team.id),
        detail: event.detail,
      })),
      lineups,
      statistics,
      channels: [],
      lineupStatus: lineups.length > 0 ? 'CONFIRMED' : 'PENDING',
      availability: {
        events: eventsData.response?.length ? 'AVAILABLE' : 'PENDING',
        lineups: lineups.length > 0 ? 'CONFIRMED' : 'PENDING',
        statistics: statistics.length ? 'AVAILABLE' : 'PENDING',
        broadcast: 'PENDING',
      },
    };
  }

  async getTeamById(id: string): Promise<NormalizedTeam> {
    const data = await this.fetch<ApiTeamResponse>(`/teams?id=${id}`);
    if (!data.response || data.response.length === 0) {
      throw new Error('Team not found');
    }
    const t = data.response[0];
    return {
      id: String(t.team.id),
      externalId: String(t.team.id),
      name: t.team.name,
      slug: t.team.name.toLowerCase().replace(/\s+/g, '-'),
      logoUrl: t.team.logo
    };
  }

  async getStandings(leagueId: string, season: string): Promise<NormalizedStanding[]> {
    const data = await this.fetch<ApiStandingsResponse>(`/standings?league=${leagueId}&season=${season}`);
    if (!data.response || data.response.length === 0) return [];
    
    const standings = data.response[0].league.standings[0];
    return standings.map((s) => ({
      rank: s.rank,
      team: {
        id: String(s.team.id),
        externalId: String(s.team.id),
        name: s.team.name,
        slug: s.team.name.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: s.team.logo
      },
      played: s.all.played,
      won: s.all.win,
      drawn: s.all.draw,
      lost: s.all.lose,
      goalsFor: s.all.goals.for,
      goalsAgainst: s.all.goals.against,
      points: s.points
    }));
  }

  async getTopScorers(leagueId: string, season: string): Promise<NormalizedScorer[]> {
    const data = await this.fetch<ApiScorer>(`/players/topscorers?league=${leagueId}&season=${season}`);
    if (!data.response) return [];
    
    return data.response.map((scorer) => ({
      player: {
        id: String(scorer.player.id),
        name: scorer.player.name,
        slug: scorer.player.name.toLowerCase().replace(/\s+/g, '-'),
        photoUrl: scorer.player.photo,
      },
      teamName: scorer.statistics[0]?.team.name,
      goals: scorer.statistics[0]?.goals.total || 0,
    }));
  }

  async getH2H(team1Id: string, team2Id: string): Promise<NormalizedMatch[]> {
    const data = await this.fetch<ApiFixture>(`/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=10`);
    if (!data.response) return [];
    
    return data.response.map((fixture) => this.mapFixture(fixture));
  }

  async getMatchesByDate(date: string): Promise<NormalizedMatch[]> {
    const data = await this.fetch<ApiFixture>(`/fixtures?date=${date}`);
    if (!data.response) return [];
    
    return data.response.map((fixture) => this.mapFixture(fixture));
  }

  async getLeagueArchive(leagueId: string): Promise<ApiSeason[]> {
    // API-Football has seasons endpoint
    const data = await this.fetch<ApiLeagueResponse>(`/leagues?id=${leagueId}`);
    if (!data.response || !data.response[0]) return [];
    
    return data.response[0].seasons.map((s) => ({
      year: s.year,
      start: s.start,
      end: s.end,
      current: s.current
    }));
  }
}
