// src/lib/sports-data/interface.ts
import { 
  NormalizedMatch, 
  NormalizedMatchDetail, 
  NormalizedTeam, 
  NormalizedStanding,
  NormalizedLeagueSeason,
  NormalizedScorer,
} from './types';

export interface SportsDataProvider {
  getLiveMatches(): Promise<NormalizedMatch[]>;
  getMatchById(id: string): Promise<NormalizedMatchDetail>;
  getTeamById(id: string): Promise<NormalizedTeam>;
  getStandings(leagueId: string, season: string): Promise<NormalizedStanding[]>;
  getTopScorers(leagueId: string, season: string): Promise<NormalizedScorer[]>;
  getH2H(team1Id: string, team2Id: string): Promise<NormalizedMatch[]>;
  getMatchesByDate(date: string): Promise<NormalizedMatch[]>;
  getLeagueArchive(leagueId: string): Promise<NormalizedLeagueSeason[]>;
}
