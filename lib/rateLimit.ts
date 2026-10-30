/**
 * In-memory, per-IP fixed-window rate limiter for /api/plan.
 *
 * Good enough for a single server instance; swap for Redis/Upstash when running
 * multiple replicas. The store is pruned lazily and hard-capped so a malicious
 * spread of IPs cannot grow memory unboundedly.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
/** Hard cap: beyond this many tracked IPs the oldest entries are evicted. */
const MAX_TRACKED_KEYS = 10_000;

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window resets
}

const store = new Map<string, Bucket>();

export interface RateLimitVerdict {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets; present only when blocked. */
  retryAfterSeconds?: number;
}

export function checkRateLimit(key: string): RateLimitVerdict {
  if (store.size >= MAX_TRACKED_KEYS) pruneStore(true);
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (now >= bucket.resetAt) {
    bucket.count = 1;
    bucket.resetAt = now + WINDOW_MS;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - bucket.count };
}

/** Drops expired buckets; `force` also evicts the oldest before pruning. */
function pruneStore(force: boolean): void {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now >= bucket.resetAt) store.delete(key);
  }
  if (store.size >= MAX_TRACKED_KEYS) return;
  if (force && store.size >= MAX_TRACKED_KEYS) {
    const oldestFirst = [...store.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of oldestFirst.slice(0, Math.floor(MAX_TRACKED_KEYS / 2))) {
      store.delete(key);
    }
  }
}

/** Test helper: empties the limiter store between cases. */
export function resetRateLimiter(): void {
  store.clear();
}

export const rateLimitConfig = {
  windowMs: WINDOW_MS,
  maxRequests: MAX_REQUESTS_PER_WINDOW,
} as const;
