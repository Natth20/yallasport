// src/lib/redis.ts
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
  } catch {
    return null;
  }
}

export async function safeRedisSet(key: string, value: unknown, options?: { ex: number }) {
  try {
    await Promise.race([
      redis.set(key, value, options),
      new Promise<void>((resolve) => {
        setTimeout(() => resolve(), 1200);
      }),
    ]);
  } catch {
    // Cache writes must never block page rendering.
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
