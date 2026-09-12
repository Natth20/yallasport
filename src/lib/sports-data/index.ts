import { SportsDataProvider } from './interface';
import { DevelopmentProvider } from './providers/development-provider';
import { ApiFootballProvider } from './providers/api-football';
import { CachedSportsDataProvider } from './cached-provider';
import { isLiveSportsApi } from './config';

/**
 * Live API-Football when a real key is present.
 * Otherwise an empty provider — never mock fixtures.
 */
const apiKey = process.env.SPORTS_API_KEY;

const baseProvider: SportsDataProvider = isLiveSportsApi() && apiKey
  ? new ApiFootballProvider(apiKey)
  : new DevelopmentProvider();

export const sportsData: SportsDataProvider = new CachedSportsDataProvider(baseProvider);

if (typeof window === 'undefined') {
  const isLive = isLiveSportsApi();
  console.log('------------------------------------------------');
  console.log(isLive ? '🟢 [SYSTEM] DATA SOURCE: LIVE API ACTIVE' : '⚪ [SYSTEM] DATA SOURCE: EMPTY — no live key');
  console.log(`🚀 [SYSTEM] PROVIDER: ${isLive ? (process.env.SPORTS_API_PROVIDER || 'apisports') : 'empty'} `);
  console.log('------------------------------------------------');
}
