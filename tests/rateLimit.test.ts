import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkRateLimit, rateLimitConfig, resetRateLimiter } from '../lib/rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimiter();
  });

  it(`allows the first ${rateLimitConfig.maxRequests} requests in a window`, () => {
    for (let index = 0; index < rateLimitConfig.maxRequests; index++) {
      expect(checkRateLimit('ip-a').allowed).toBe(true);
    }
  });

  it('blocks request number N+1 with a retry-after hint', () => {
    for (let index = 0; index < rateLimitConfig.maxRequests; index++) {
      checkRateLimit('ip-a');
    }
    const blocked = checkRateLimit('ip-a');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('resets the window after it elapses', () => {
    for (let index = 0; index < rateLimitConfig.maxRequests; index++) {
      checkRateLimit('ip-a');
    }
    expect(checkRateLimit('ip-a').allowed).toBe(false);

    vi.advanceTimersByTime(rateLimitConfig.windowMs + 1);
    expect(checkRateLimit('ip-a').allowed).toBe(true);
  });

  it('tracks clients independently', () => {
    for (let index = 0; index < rateLimitConfig.maxRequests; index++) {
      checkRateLimit('ip-a');
    }
    expect(checkRateLimit('ip-a').allowed).toBe(false);
    expect(checkRateLimit('ip-b').allowed).toBe(true);
  });

  it('remembers the reset time across blocked attempts', () => {
    for (let index = 0; index < rateLimitConfig.maxRequests; index++) {
      checkRateLimit('ip-a');
    }
    const blockedOnce = checkRateLimit('ip-a');
    vi.advanceTimersByTime(30_000); // half-way through the window
    const blockedAgain = checkRateLimit('ip-a');
    expect(blockedAgain.retryAfterSeconds).toBeLessThan(blockedOnce.retryAfterSeconds ?? Infinity);
  });
});
