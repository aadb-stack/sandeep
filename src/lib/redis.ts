import { env } from "./env";

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
}

/**
 * Sliding-ish window rate limiter. Uses Upstash Redis when configured, and a
 * simple in-memory fixed window otherwise so local dev / CI exercise the same
 * call sites without a Redis instance.
 */
type Limiter = (identifier: string) => Promise<RateLimitResult>;

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

let limiterPromise: Promise<Limiter> | null = null;

function getLimiter(): Promise<Limiter> {
  if (!limiterPromise) limiterPromise = buildLimiter();
  return limiterPromise;
}

async function buildLimiter(): Promise<Limiter> {
  if (env.hasRedis) {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL as string,
      token: env.UPSTASH_REDIS_REST_TOKEN as string,
    });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
      prefix: "ai-sales-engineer",
    });
    return async (identifier: string) => {
      const res = await ratelimit.limit(identifier);
      return {
        success: res.success,
        remaining: res.remaining,
        limit: res.limit,
      };
    };
  }

  // In-memory fixed-window fallback.
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return async (identifier: string) => {
    const now = Date.now();
    const bucket = buckets.get(identifier);
    if (!bucket || bucket.resetAt < now) {
      buckets.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
      return { success: true, remaining: MAX_REQUESTS - 1, limit: MAX_REQUESTS };
    }
    bucket.count += 1;
    return {
      success: bucket.count <= MAX_REQUESTS,
      remaining: Math.max(0, MAX_REQUESTS - bucket.count),
      limit: MAX_REQUESTS,
    };
  };
}

export async function rateLimit(identifier: string): Promise<RateLimitResult> {
  const limiter = await getLimiter();
  return limiter(identifier);
}
