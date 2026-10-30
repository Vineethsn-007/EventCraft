import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Route handler tests with the Groq SDK mocked — no network, no API key
 * required. Every scenario asserts on { plan, demoMode } and status codes.
 */

const createMock = vi.fn();

vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      chat = { completions: { create: createMock } };
      constructor(options?: { apiKey?: string }) {
        if (!options?.apiKey) throw new Error('No API key provided');
      }
    },
  };
});

import { POST } from '../app/api/plan/route';
import { resetGroqClient } from '../lib/groq';
import { resetRateLimiter } from '../lib/rateLimit';

function requestBody(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    mode: 'generate',
    eventType: 'WEDDING',
    eventName: 'Sharma–Iyer Wedding',
    // Must satisfy the ≤730-day horizon at any time these tests run.
    date: new Date(Date.now() + 60 * 86_400_000).toISOString().slice(0, 10),
    guestCount: 120,
    budget: 500_000,
    city: 'Bengaluru',
    theme: 'pastel floral',
    notes: '',
    ...overrides,
  });
}

function makeRequest(body: string, ip = '1.2.3.4'): Request {
  return new Request('http://localhost:3000/api/plan', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body,
  });
}

const goodLLMJson = JSON.stringify({
  budget: {
    categories: [
      { name: 'Venue', amount: 200_000, percentage: 40, tip: 'Book early' },
      { name: 'Catering', amount: 300_000, percentage: 60, tip: 'Tasting first' },
    ],
  },
  timeline: [
    { daysBefore: 30, title: 'Book caterer', description: 'Tasting' },
    { daysBefore: 0, title: 'Event day', description: 'Enjoy' },
  ],
  vendors: [{ category: 'Venue', items: ['Capacity for 120 guests?'] }],
  ideas: Array.from({ length: 5 }, (_unused, index) => ({
    title: `Idea ${index + 1}`,
    detail: 'Details',
    kind: 'theme',
  })),
});

beforeEach(() => {
  createMock.mockReset();
  vi.stubEnv('GROQ_API_KEY', 'test-key');
  resetGroqClient();
  resetRateLimiter();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetRateLimiter();
});

describe('POST /api/plan', () => {
  it('returns a sanitized AI plan on the happy path', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: goodLLMJson } }],
    });

    const response = await POST(makeRequest(requestBody()));
    const body = (await response.json()) as { demoMode: boolean; plan: { budget: { total: number } } };

    expect(response.status).toBe(200);
    expect(body.demoMode).toBe(false);
    // Sanitiser guarantees amounts sum exactly to the requested total.
    expect(body.plan.budget.total).toBe(500_000);
    expect(createMock).toHaveBeenCalledTimes(1);
    // Model/temperature contract.
    const calledWith = createMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(calledWith.model).toBe('llama-3.3-70b-versatile');
    expect(calledWith.temperature).toBe(0.7);
    expect(calledWith.response_format).toEqual({ type: 'json_object' });
  });

  it('retries once on invalid JSON then falls back to the demo plan', async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: 'not-json-at-all' } }],
    });

    const response = await POST(makeRequest(requestBody()));
    const body = (await response.json()) as { demoMode: boolean; demoReason?: string };

    expect(response.status).toBe(200);
    expect(body.demoMode).toBe(true);
    expect(createMock).toHaveBeenCalledTimes(2); // one retry
    expect(body.demoReason).toMatch(/unavailable|service/i);
  });

  it('falls back to the demo plan when Groq throws (network/API failure)', async () => {
    createMock.mockRejectedValue(new Error('ECONNRESET'));

    const response = await POST(makeRequest(requestBody()));
    const body = (await response.json()) as { demoMode: boolean; plan: Record<string, unknown> };

    expect(response.status).toBe(200);
    expect(body.demoMode).toBe(true);
    expect(body.plan).toHaveProperty('budget');
    expect(body.plan).toHaveProperty('timeline');
    expect(body.plan).toHaveProperty('vendors');
    expect(body.plan).toHaveProperty('ideas');
  });

  it('returns a demo plan without calling Groq when no API key is configured', async () => {
    vi.stubEnv('GROQ_API_KEY', '');
    resetGroqClient();

    const response = await POST(makeRequest(requestBody()));
    const body = (await response.json()) as { demoMode: boolean; demoReason?: string };

    expect(response.status).toBe(200);
    expect(body.demoMode).toBe(true);
    expect(body.demoReason).toMatch(/not configured/i);
    expect(createMock).not.toHaveBeenCalled();
  });

  it('rejects invalid bodies with 400 and a safe message', async () => {
    const notJson = await POST(makeRequest('{oops'));
    expect(notJson.status).toBe(400);

    const badEnum = await POST(makeRequest(requestBody({ eventType: 'ANNIVERSARY' })));
    expect(badEnum.status).toBe(400);

    const negative = await POST(makeRequest(requestBody({ budget: -5 })));
    expect(negative.status).toBe(400);

    for (const response of [notJson, badEnum, negative]) {
      const { error } = (await response.json()) as { error: string };
      expect(error).not.toMatch(/stack|at \w+ \(|node_modules/);
      expect(error).toMatch(/invalid request|json|budget|event type/i);
    }
  });

  it('rejects refine mode without a refinement message', async () => {
    const response = await POST(makeRequest(requestBody({ mode: 'refine' })));
    expect(response.status).toBe(400);
  });

  it('returns a full AI plan in refine mode with the current plan as context', async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: goodLLMJson } }] });
    // currentPlan must itself satisfy the plan schema (as sanitized plans do).
    const currentPlan = JSON.parse(goodLLMJson);
    const response = await POST(
      makeRequest(requestBody({ mode: 'refine', refinement: 'make it cheaper', currentPlan })),
    );
    const body = (await response.json()) as { demoMode: boolean };
    expect(response.status).toBe(200);
    expect(body.demoMode).toBe(false);
    const calledWith = createMock.mock.calls[0]?.[0] as { messages: Array<{ content: string }> };
    expect(JSON.stringify(calledWith.messages)).toContain('make it cheaper');
  });

  it('rate limits per client IP with 429 and Retry-After', async () => {
    // Exhaust the window for one IP.
    let last!: Response;
    for (let index = 0; index < 12; index++) {
      last = await POST(makeRequest(requestBody(), '5.5.5.5'));
    }
    expect(last.status).toBe(429);
    expect(last.headers.get('retry-after')).toBeTruthy();

    // A different IP is unaffected.
    const other = await POST(makeRequest(requestBody(), '5.5.5.6'));
    expect(other.status).not.toBe(429);
  });

  it('never leaks stack traces in unexpected-failure responses', async () => {
    // Force JSON.parse on an unreachable request path: no API key issue here;
    // simulate a catastrophic Response.json failure instead.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const boom = makeRequest(requestBody());
    vi.spyOn(boom, 'text').mockRejectedValue(new Error('stream exploded'));

    const response = await POST(boom);
    const { error } = (await response.json()) as { error: string };
    expect(response.status).toBe(500);
    expect(error).toBe('Unexpected server error. Please try again.');
    spy.mockRestore();
  });
});
