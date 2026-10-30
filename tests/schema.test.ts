import { describe, expect, it } from 'vitest';
import { apiPlanResponseSchema, LIMITS, planRequestSchema, planResponseSchema } from '../lib/schema';

function futureDate(daysAhead = 60): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const baseRequest = {
  eventType: 'WEDDING',
  eventName: 'Sharma–Iyer Wedding',
  date: futureDate(),
  guestCount: 120,
  budget: 500_000,
  city: 'Bengaluru',
  theme: 'pastel floral',
  notes: 'vegetarian only',
};

describe('planRequestSchema (generate mode)', () => {
  it('accepts a valid request', () => {
    const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown event type enum', () => {
    const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, eventType: 'HOUSEWARMING' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toMatch(/event type/i);
  });

  it('rejects dates in the past', () => {
    const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, date: '2020-01-01' });
    expect(result.success).toBe(false);
  });

  it('rejects dates beyond the 730-day horizon', () => {
    const result = planRequestSchema.safeParse({
      mode: 'generate',
      ...baseRequest,
      date: futureDate(LIMITS.maxHorizonDays + 5),
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date strings', () => {
    const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, date: '31-02-2025' });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer, too-low and too-high budgets', () => {
    for (const budget of [999, 1.5, LIMITS.maxBudget + 1, 'lot']) {
      const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, budget });
      expect(result.success).toBe(false);
    }
  });

  it('rejects guest counts outside 1..10000 and flags values above the limit', () => {
    expect(planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, guestCount: 0 }).success).toBe(false);
    expect(planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, guestCount: 10_001 }).success).toBe(false);
    expect(
      planRequestSchema.safeParse({
        mode: 'generate',
        ...baseRequest,
        guestCount: LIMITS.maxGuests,
      }).success,
    ).toBe(true);
  });

  it('rejects over-long strings for name, city, theme and notes', () => {
    expect(
      planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, eventName: 'x'.repeat(LIMITS.eventName + 1) })
        .success,
    ).toBe(false);
    expect(
      planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, city: 'x'.repeat(LIMITS.city + 1) }).success,
    ).toBe(false);
    expect(
      planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, theme: 'x'.repeat(LIMITS.theme + 1) }).success,
    ).toBe(false);
    expect(
      planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, notes: 'x'.repeat(LIMITS.notes + 1) }).success,
    ).toBe(false);
  });

  it('rejects a generate request containing a refinement', () => {
    const result = planRequestSchema.safeParse({ mode: 'generate', ...baseRequest, refinement: 'change everything' });
    expect(result.success).toBe(false);
  });
});

describe('planRequestSchema (refine mode)', () => {
  const refineBase = { ...baseRequest };

  it('accepts refine mode with refinement text', () => {
    const result = planRequestSchema.safeParse({ mode: 'refine', ...refineBase, refinement: 'Make it evening-only' });
    expect(result.success).toBe(true);
  });

  it('requires a refinement in refine mode', () => {
    const result = planRequestSchema.safeParse({ mode: 'refine', ...refineBase });
    expect(result.success).toBe(false);
  });

  it('rejects over-long refinements', () => {
    const result = planRequestSchema.safeParse({
      mode: 'refine',
      ...refineBase,
      refinement: 'x'.repeat(LIMITS.refinement + 1),
    });
    expect(result.success).toBe(false);
  });

  it('accepts past plan snapshots only when well-formed', () => {
    const goodPlan = validPlanResponse();
    const result = planRequestSchema.safeParse({
      mode: 'refine',
      ...refineBase,
      refinement: 'ok fine',
      currentPlan: goodPlan,
    });
    expect(result.success).toBe(true);

    const badPlan = { ...goodPlan, budget: { categories: [] } };
    const bad = planRequestSchema.safeParse({
      mode: 'refine',
      ...refineBase,
      refinement: 'ok fine',
      currentPlan: badPlan,
    });
    expect(bad.success).toBe(false);
  });
});

function validPlanResponse() {
  return {
    budget: {
      categories: [{ name: 'Venue', amount: 5000, percentage: 50, tip: 'Book early' }],
    },
    timeline: [{ daysBefore: 30, title: 'Book venue', description: 'Pay advance' }],
    vendors: [{ category: 'Venue', items: ['Capacity for 120 guests?'] }],
    ideas: [{ title: 'Colour story', detail: 'Use one palette', kind: 'theme' }],
  };
}

describe('planResponseSchema (LLM JSON contract)', () => {
  it('accepts a well-formed LLM payload', () => {
    expect(planResponseSchema.safeParse(validPlanResponse()).success).toBe(true);
  });

  it('rejects empty budget, timeline, vendor or idea arrays', () => {
    for (const mutate of [
      (plan: ReturnType<typeof validPlanResponse>) => ({ ...plan, timeline: [] }),
      (plan: ReturnType<typeof validPlanResponse>) => ({ ...plan, vendors: [] }),
      (plan: ReturnType<typeof validPlanResponse>) => ({ ...plan, ideas: [] }),
    ]) {
      expect(planResponseSchema.safeParse(mutate(validPlanResponse())).success).toBe(false);
    }
  });

  it('coerces an unknown idea kind to "other" instead of failing', () => {
    const plan = validPlanResponse();
    const loose = { ...plan, ideas: [{ ...plan.ideas[0], kind: 'surprise' }] };
    const result = planResponseSchema.safeParse(loose);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.ideas[0]?.kind).toBe('other');
  });
});

describe('apiPlanResponseSchema', () => {
  it('accepts a complete sanitized API response', () => {
    const result = apiPlanResponseSchema.safeParse({
      plan: {
        budget: {
          total: 5000,
          categories: [{ name: 'Venue', amount: 5000, percentage: 100, tip: 'Book early' }],
        },
        timeline: [{ daysBefore: 30, date: '2027-01-01', title: 'Book venue', description: 'Pay advance' }],
        vendors: [{ category: 'Venue', items: ['Capacity for 120 guests?'] }],
        ideas: [{ title: 'Colour story', detail: 'Use one palette', kind: 'theme' }],
      },
      demoMode: false,
    });

    expect(result.success).toBe(true);
  });

  it('rejects malformed plans before the client renders them', () => {
    const result = apiPlanResponseSchema.safeParse({
      plan: { budget: { total: 5000, categories: [] } },
      demoMode: false,
    });

    expect(result.success).toBe(false);
  });
});
