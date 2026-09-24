import 'server-only';

import { isLiveSportsApi } from './config';
import { logApiRequest } from './request-log';

export function sportsApiTransport(): {
  key: string;
  baseUrl: string;
  headers: Record<string, string>;
} | null {
  const apiKey = process.env.SPORTS_API_KEY?.trim();
  if (!apiKey || !isLiveSportsApi()) return null;
  const provider = (process.env.SPORTS_API_PROVIDER || 'apisports').toLowerCase();
  if (provider === 'rapidapi') {
    return {
      key: 'rapidapi',
      baseUrl: 'https://api-football-v1.p.rapidapi.com/v3',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
      },
    };
  }
  return {
    key: 'apisports',
    baseUrl: 'https://v3.football.api-sports.io',
    headers: { 'x-apisports-key': apiKey },
  };
}

function headerInt(response: Response, names: string[]) {
  for (const name of names) {
    const raw = response.headers.get(name);
    if (!raw) continue;
    const value = Number.parseInt(raw, 10);
    if (Number.isFinite(value)) return value;
  }
  return null;
}

/** Sole outbound sports HTTP client. Pages and the browser must not call this. */
export async function sportsApiFetch<T>(path: string): Promise<T | null> {
  const transport = sportsApiTransport();
  if (!transport) return null;
  const urlPath = path.startsWith('/') ? path : `/${path}`;
  const started = Date.now();
  try {
    const response = await fetch(`${transport.baseUrl}${urlPath}`, {
      headers: transport.headers,
      cache: 'no-store',
      signal: AbortSignal.timeout(/players\?search=/i.test(urlPath) ? 9000 : 4000),
    });
    const durationMs = Date.now() - started;
    const quotaRemaining = headerInt(response, [
      'x-ratelimit-requests-remaining',
      'x-ratelimit-remaining',
    ]);
    const quotaLimit = headerInt(response, ['x-ratelimit-requests-limit', 'x-ratelimit-limit']);
    if (response.status === 429) {
      await logApiRequest({
        providerKey: transport.key,
        path: urlPath,
        status: 429,
        outcome: 'QUOTA',
        durationMs,
        error: 'quota or rate limit',
        quotaRemaining,
        quotaLimit,
      });
      return null;
    }
    if (!response.ok) {
      await logApiRequest({
        providerKey: transport.key,
        path: urlPath,
        status: response.status,
        outcome: 'ERROR',
        durationMs,
        error: `${response.status} ${response.statusText}`.slice(0, 180),
        quotaRemaining,
        quotaLimit,
      });
      return null;
    }
    const json = (await response.json()) as T;
    await logApiRequest({
      providerKey: transport.key,
      path: urlPath,
      status: response.status,
      outcome: 'OK',
      durationMs,
      quotaRemaining,
      quotaLimit,
    });
    return json;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await logApiRequest({
      providerKey: transport.key,
      path: urlPath,
      outcome: 'ERROR',
      durationMs: Date.now() - started,
      error: message.slice(0, 180),
    });
    return null;
  }
}
