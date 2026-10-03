import { swallow, reportCaughtError } from '@/lib/ops/caught';
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

function rawCacheTtl(path: string) {
  if (/live/i.test(path)) return 15;
  if (/standings|topscorers|topassists|topyellow|topred|players\/top/i.test(path)) return 300;
  if (/transfers/i.test(path)) return 180;
  if (/players\?search=/i.test(path)) return 180;
  if (/players|teams|coachs|leagues/i.test(path)) return 3600;
  if (/fixtures/i.test(path)) return 60;
  return 120;
}

export class CachedSportsDataProvider implements SportsDataProvider {
  private baseProvider: SportsDataProvider;
  private CACHE_TTL = 15; // live fixtures
  private LONG_CACHE_TTL = 3600; // player / team profile payloads
  private TABLE_TTL = 300; // standings / scorers

  constructor(baseProvider: SportsDataProvider) {
    this.baseProvider = baseProvider;
  }

  async getLiveMatches(): Promise<NormalizedMatch[]> {
    const cacheKey = 'live_matches';
    try {
      const fresh = await withBudget(this.baseProvider.getLiveMatches(), []);
      if (fresh.length > 0) {
        const syncedAt = new Date().toISOString();
        const source = isLiveSportsApi() ? 'LIVE' : 'EMPTY';
        const envelope: LiveMatchesPayload = {
          matches: fresh,
          freshness: { syncedAt, cachedAt: syncedAt, source, staleAfterSeconds: 120 },
        };
        await Promise.all([
          safeRedisSet(cacheKey, fresh, { ex: this.CACHE_TTL }),
          safeRedisSet('sports:live:all', envelope, { ex: 300 }),
          safeRedisSet('sports:meta:live', { syncedAt, matchCount: fresh.length, fixtureCount: fresh.length, source }, { ex: 300 }),
        ]);
        return fresh;
      }
    } catch (error) {
      reportCaughtError("src/lib/sports-data/cached-provider.ts:71", error);
      // Degraded: last trusted cache below.
    }
    const cached = await safeRedisGet<NormalizedMatch[]>(cacheKey);
    return cached ? cached.map(hydrateMatch) : [];
  }

  async getMatchById(id: string): Promise<NormalizedMatchDetail> {
    const cacheKey = `match_${id}`;
    const cached = await safeRedisGet<NormalizedMatchDetail>(cacheKey);
    if (cached) return hydrateMatch(cached);

    const fresh = await withBudget(
      this.baseProvider.getMatchById(id).catch(swallow("src/lib/sports-data/cached-provider.ts:83", null)),
      null as NormalizedMatchDetail | null,
      12000,
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
      this.baseProvider.getTeamById(id).catch(swallow("src/lib/sports-data/cached-provider.ts:98", null)),
      null as NormalizedTeam | null
    );
    if (!fresh) throw new Error('Team not found');
    await safeRedisSet(cacheKey, fresh, { ex: this.LONG_CACHE_TTL });
    return fresh;
  }

  async getStandings(leagueId: string, season: string): Promise<NormalizedStanding[]> {
    const cacheKey = `standings_v2_${leagueId}_${season}`;
    const cached = await safeRedisGet<NormalizedStanding[]>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(this.baseProvider.getStandings(leagueId, season), [], 12000);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: this.TABLE_TTL });
    }
    return fresh;
  }

  async getTopScorers(leagueId: string, season: string): Promise<NormalizedScorer[]> {
    const cacheKey = `topscorers_${leagueId}_${season}`;
    const cached = await safeRedisGet<NormalizedScorer[]>(cacheKey);
    if (cached) return cached;

    const fresh = await withBudget(this.baseProvider.getTopScorers(leagueId, season), []);
    if (fresh.length > 0) {
      await safeRedisSet(cacheKey, fresh, { ex: this.TABLE_TTL });
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
    try {
      const fresh = await withBudget(this.baseProvider.getMatchesByDate(date), []);
      if (fresh.length > 0) {
        await safeRedisSet(cacheKey, fresh, { ex: 300 });
        return fresh;
      }
    } catch (error) {
      reportCaughtError("src/lib/sports-data/cached-provider.ts:151", error);
      // Degraded
    }
    const cached = await safeRedisGet<NormalizedMatch[]>(cacheKey);
    return cached ? cached.map(hydrateMatch) : [];
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

  async getRaw<T = unknown>(path: string): Promise<T | null> {
    const cacheKey = `sports:raw:${path}`;
    const ttl = rawCacheTtl(path);
    const cached = await safeRedisGet<T>(cacheKey);
    if (cached != null) {
      const rows = (cached as { response?: unknown[] } | null)?.response;
      const emptySearch = /players\?search=/i.test(path) && Array.isArray(rows) && rows.length === 0;
      const emptyLedger =
        (/\/transfers\?/i.test(path) || /\/players\/top/i.test(path) || /\/players\?id=/i.test(path)) &&
        Array.isArray(rows) &&
        rows.length === 0;
      if (!emptySearch && !emptyLedger) return cached;
    }
    try {
      const budget =
        /players\?(search|id)=/i.test(path) ||
        /\/transfers\?/i.test(path) ||
        /\/players\/top/i.test(path) ||
        /\/standings/i.test(path) ||
        /\/fixtures\?id=/i.test(path) ||
        /\/fixtures\/(events|lineups|statistics)/i.test(path)
          ? 12000
          : 3500;
      const fresh = await withBudget(this.baseProvider.getRaw<T>(path), null as T | null, budget);
      const rows = (fresh as { response?: unknown[] } | null)?.response;
      const emptySearch = /players\?search=/i.test(path) && Array.isArray(rows) && rows.length === 0;
      const emptyBoard =
        (/\/players\/top/i.test(path) || /\/transfers\?/i.test(path) || /\/players\?id=/i.test(path)) &&
        Array.isArray(rows) &&
        rows.length === 0;
      if (fresh != null && !emptySearch && !emptyBoard) {
        await safeRedisSet(cacheKey, fresh, { ex: ttl });
        await safeRedisSet(`sports:raw:meta:${path}`, { syncedAt: new Date().toISOString() }, { ex: ttl });
        return fresh;
      }
    } catch (error) {
      reportCaughtError("src/lib/sports-data/cached-provider.ts:179", error);
    }
    return cached ?? null;
  }
}
