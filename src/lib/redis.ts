// src/lib/redis.ts
import { reportCaughtError } from '@/lib/ops/caught';
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error("Missing Upstash Redis environment variables");
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function safeRedisGet<T>(key: string, ms = 1200): Promise<T | null> {
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

export async function cachedJson<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = await safeRedisGet<T>(key);
  if (hit !== null && hit !== undefined) return hit;
  const fresh = await load();
  await safeRedisSet(key, fresh, { ex: ttlSeconds });
  return fresh;
}

export async function safeRedisSet(key: string, value: unknown, options?: { ex: number }) {
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

// Rate limiter: 100 requests per 10 seconds per IP
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
});

export const writeRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(8, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/write",
});

export const searchRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(40, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/search",
});

export const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(12, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/auth",
});
