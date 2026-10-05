// src/lib/redis.ts
import { reportCaughtError } from '@/lib/ops/caught';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder_token',
});

const isRealRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export async function safeRedisGet<T>(key: string, ms = 1200): Promise<T | null> {
  if (!isRealRedis) return null;
  try {
    return await Promise.race([
      redis.get<T>(key),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), ms);
      }),
    ]);
  } catch (error) {
    reportCaughtError('redis.get', error);
    return null;
  }
}

// In-memory instant cache map (Key -> { data, expiresAt })
const memoryCache = new Map<string, { data: unknown; expiresAt: number }>();

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const now = Date.now();
  
  // 1. Instant In-Memory Cache Check (0ms)
  const memHit = memoryCache.get(key);
  if (memHit && memHit.expiresAt > now) {
    return memHit.data as T;
  }

  // 2. Redis Cache Check
  try {
    const hit = await safeRedisGet<T>(key);
    if (hit !== null && hit !== undefined) {
      memoryCache.set(key, { data: hit, expiresAt: now + ttlSeconds * 1000 });
      return hit;
    }
  } catch {
    // ignore cache read failure
  }

  // 3. Fresh Query
  const fresh = await load();
  if (fresh !== undefined && fresh !== null) {
    memoryCache.set(key, { data: fresh, expiresAt: now + ttlSeconds * 1000 });
    if (isRealRedis) {
      safeRedisSet(key, fresh, { ex: ttlSeconds }).catch(() => {});
    }
  }
  return fresh;
}

export async function safeRedisSet(key: string, value: unknown, options?: { ex: number }) {
  if (!isRealRedis) return;
  try {
    await Promise.race([
      redis.set(key, value, options),
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1200);
      }),
    ]);
  } catch (error) {
    reportCaughtError('redis.set', error);
  }
}

const fallbackRatelimit = {
  limit: async () => ({
    success: true,
    limit: 100,
    remaining: 99,
    reset: 0,
    pending: Promise.resolve(),
  }),
} as unknown as Ratelimit;

// Rate limiters with safe fallback if Redis is unavailable
export const ratelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "10 s"),
      analytics: true,
      prefix: "@upstash/ratelimit",
    })
  : fallbackRatelimit;

export const writeRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/write",
    })
  : fallbackRatelimit;

export const searchRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/search",
    })
  : fallbackRatelimit;

export const authRatelimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(12, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    })
  : fallbackRatelimit;

