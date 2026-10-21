// src/lib/redis.ts
import { reportCaughtError } from '@/lib/ops/caught';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder_token',
});

const isRealRedis = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

const globalForCache = globalThis as unknown as {
  memoryCache?: Map<string, { data: unknown; expiresAt: number }>;
  redisCircuitBreakerUntil?: number;
};

const memoryCache = (globalForCache.memoryCache ??= new Map());

export function isRedisHealthy(): boolean {
  if (!isRealRedis) return false;
  const until = globalForCache.redisCircuitBreakerUntil ?? 0;
  return Date.now() > until;
}

export function tripRedisCircuitBreaker(seconds = 300) {
  globalForCache.redisCircuitBreakerUntil = Date.now() + seconds * 1000;
}

export async function safeRedisGet<T>(key: string, ms = 150): Promise<T | null> {
  if (!isRedisHealthy()) return null;
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<'TIMEOUT'>((resolve) => {
      timer = setTimeout(() => resolve('TIMEOUT'), ms);
    });

    const res = await Promise.race([
      redis.get<T>(key),
      timeoutPromise,
    ]);

    clearTimeout(timer!);

    if (res === 'TIMEOUT') {
      // Redis is too slow (> ms), trip circuit breaker immediately
      tripRedisCircuitBreaker(300);
      return null;
    }
    return res as T | null;
  } catch (error) {
    tripRedisCircuitBreaker(300);
    reportCaughtError('redis.get', error);
    return null;
  }
}

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

  // 2. Redis Cache Check (only if healthy)
  if (isRedisHealthy()) {
    try {
      const hit = await safeRedisGet<T>(key);
      if (hit !== null && hit !== undefined) {
        memoryCache.set(key, { data: hit, expiresAt: now + ttlSeconds * 1000 });
        return hit;
      }
    } catch {
      // ignore cache read failure
    }
  }

  // 3. Fresh Query
  const fresh = await load();
  if (fresh !== undefined && fresh !== null) {
    memoryCache.set(key, { data: fresh, expiresAt: now + ttlSeconds * 1000 });
    if (isRedisHealthy()) {
      safeRedisSet(key, fresh, { ex: ttlSeconds }).catch(() => {});
    }
  }
  return fresh;
}

export async function safeRedisSet(key: string, value: unknown, options?: { ex: number }, ms = 150) {
  if (!isRedisHealthy()) return;
  try {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<'TIMEOUT'>((resolve) => {
      timer = setTimeout(() => resolve('TIMEOUT'), ms);
    });

    const res = await Promise.race([
      redis.set(key, value, options),
      timeoutPromise,
    ]);

    clearTimeout(timer!);

    if (res === 'TIMEOUT') {
      tripRedisCircuitBreaker(300);
    }
  } catch (error) {
    tripRedisCircuitBreaker(300);
    reportCaughtError('redis.set', error);
  }
}

export async function fastCacheGet<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const memHit = memoryCache.get(key);
  if (memHit && memHit.expiresAt > now) {
    return memHit.data as T;
  }
  if (isRedisHealthy()) {
    try {
      const hit = await safeRedisGet<T>(key);
      if (hit !== null && hit !== undefined) {
        memoryCache.set(key, { data: hit, expiresAt: now + 60 * 1000 });
        return hit;
      }
    } catch {}
  }
  return null;
}

export async function fastCacheSet(key: string, value: unknown, ttlSeconds = 120): Promise<void> {
  const now = Date.now();
  memoryCache.set(key, { data: value, expiresAt: now + ttlSeconds * 1000 });
  if (isRedisHealthy()) {
    safeRedisSet(key, value, { ex: ttlSeconds }).catch(() => {});
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
export const ratelimit = isRealRedis
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

