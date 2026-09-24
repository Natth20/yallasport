// src/lib/sports-data/cached-provider.ts
import { SportsDataProvider } from './interface';
import { safeRedisGet, safeRedisSet } from '../redis';
import { 
  NormalizedMatch, 
  NormalizedMatchDetail, 
  NormalizedTeam, 
  NormalizedStanding,
  NormalizedScorer,
  LiveMatchesPayload,
  NormalizedLeagueSeason,
} from './types';
import { isLiveSportsApi } from './config';

const hydrateMatch = <T extends NormalizedMatch>(match: T): T => ({
  ...match,
  kickoffAt: new Date(match.kickoffAt),
});

async function withBudget<T>(task: Promise<T>, fallback: T, ms = 3500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<T>((resolve) => {
        timer = setTimeout(() => resolve(fallback), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export class CachedSportsDataProvider implements SportsDataProvider {
  private baseProvider: SportsDataProvider;
  private CACHE_TTL = 30; // 30 seconds for live data
  private LONG_CACHE_TTL = 3600; // 1 hour for static data

  constructor(baseProvider: SportsDataProvider) {
    this.baseProvider = baseProvider;
  }

  async getLiveMatches(): Promise<NormalizedMatch[]> {
    const cacheKey = 'live_matches';
    const cached = await safeRedisGet<NormalizedMatch[]>(cacheKey);
    if (cached) return cached.map(hydrateMatch);

    const fresh = await withBudget(this.baseProvider.getLiveMatches(), []);
    if (fresh.length === 0) return [];
    const syncedAt = new Date().toISOString();
    const source = isLiveSportsApi() ? 'LIVE' : 'EMPTY';
    const envelope: LiveMatchesPayload = {
      matches: fresh,
      freshness: { syncedAt, cachedAt: syncedAt, source, staleAfterSeconds: 120 },
    };
    await Promise.all([
      safeRedisSet(cacheKey, fresh, { ex: this.CACHE_TTL }),
      safeRedisSet('sports:live:all', envelope, { ex: 120 }),
      safeRedisSet('sports:meta:live', { syncedAt, matchCount: fresh.length, fixtureCount: fresh.length, source }, { ex: 300 }),
    ]);
    return fresh;
  }

  async getMatchById(id: string): Promise<NormalizedMatchDetail> {
    const cacheKey = `match_${id}`;
    const cached = await safeRedisGet<NormalizedMatchDetail>(cacheKey);
    if (cached) return hydrateMatch(cached);

    const fresh = await withBudget(
      this.baseProvider.getMatchById(id).catch(() => null),
      null as NormalizedMatchDetail | null
    );
    if (!fresh) throw new Error('Match not found');
    const ttl = fresh.status === 'FINISHED' ? this.LONG_CACHE_TTL : this.CACHE_TTL;
    await safeRedisSet(cacheKey, fresh, { ex: ttl });
    return fresh;
  }

  async getTeamById(id: string): Promise<NormalizedTeam> {
    const cacheKey = `team_${id}`;
    const cached = await safeRedisGet<NormalizedTeam>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(
      this.baseProvider.getTeamById(id).catch(() => null),
      null as NormalizedTeam | null
    );
    if (!fresh) throw new Error('Team not found');
    await safeRedisSet(cacheKey, fresh, { ex: this.LONG_CACHE_TTL });
    return fresh;
  }

  async getStandings(leagueId: string, season: string): Promise<NormalizedStanding[]> {
    const cacheKey = `standings_${leagueId}_${season}`;
    const cached = await safeRedisGet<NormalizedStanding[]>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(this.baseProvider.getStandings(leagueId, season), []);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: this.LONG_CACHE_TTL });
    }
    return fresh;
  }

  async getTopScorers(leagueId: string, season: string): Promise<NormalizedScorer[]> {
    const cacheKey = `topscorers_${leagueId}_${season}`;
    const cached = await safeRedisGet<NormalizedScorer[]>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(this.baseProvider.getTopScorers(leagueId, season), []);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: this.LONG_CACHE_TTL });
    }
    return fresh;
  }

  async getH2H(team1Id: string, team2Id: string): Promise<NormalizedMatch[]> {
    const cacheKey = `h2h_${team1Id}_${team2Id}`;
    const cached = await safeRedisGet<NormalizedMatch[]>(cacheKey);
    if (cached) return cached.map(hydrateMatch);

    const fresh = await withBudget(this.baseProvider.getH2H(team1Id, team2Id), []);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: this.LONG_CACHE_TTL });
    }
    return fresh;
  }

  async getMatchesByDate(date: string): Promise<NormalizedMatch[]> {
    const cacheKey = `matches_${date}`;
    const cached = await safeRedisGet<NormalizedMatch[]>(cacheKey);
    if (cached) return cached.map(hydrateMatch);

    const fresh = await withBudget(this.baseProvider.getMatchesByDate(date), []);
    if (fresh.length === 0) return [];
    await safeRedisSet(cacheKey, fresh, { ex: 300 });
    return fresh;
  }

  async getLeagueArchive(leagueId: string): Promise<NormalizedLeagueSeason[]> {
    const cacheKey = `archive_${leagueId}`;
    const cached = await safeRedisGet<NormalizedLeagueSeason[]>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(this.baseProvider.getLeagueArchive(leagueId), []);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: 86400 });
    }
    return fresh;
  }
}
