import { SportsDataProvider } from '../interface';
import {
  NormalizedMatch,
  NormalizedMatchDetail,
  NormalizedTeam,
  NormalizedStanding,
  NormalizedLeagueSeason,
} from '../types';

/**
 * Empty fallback — never invents fixtures, teams, or scores.
 */
export class DevelopmentProvider implements SportsDataProvider {
  async getLiveMatches(): Promise<NormalizedMatch[]> {
    return [];
  }

  async getMatchById(_id: string): Promise<NormalizedMatchDetail> {
    throw new Error('Match not found');
  }

  async getTeamById(_id: string): Promise<NormalizedTeam> {
    throw new Error('Team not found');
  }

  async getStandings(_leagueId: string, _season: string): Promise<NormalizedStanding[]> {
    return [];
  }

  async getH2H(_team1Id: string, _team2Id: string): Promise<NormalizedMatch[]> {
    return [];
  }

  async getMatchesByDate(_date: string): Promise<NormalizedMatch[]> {
    return [];
  }

  async getLeagueArchive(_leagueId: string): Promise<NormalizedLeagueSeason[]> {
    return [];
  }
}
