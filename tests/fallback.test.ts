import { describe, expect, it } from 'vitest';
import { buildFallbackPlan } from '../lib/fallback';
import type { PlanRequest } from '../types/plan';

function futureIsoDate(daysAhead: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const request: PlanRequest = {
  eventType: 'WEDDING',
  eventName: 'A & B Wedding',
  date: futureIsoDate(200),
  guestCount: 150,
  budget: 750_123,
  city: 'Pune',
  theme: 'marigold x retro',
  notes: 'both families vegetarian',
};

describe('buildFallbackPlan', () => {
  const plan = buildFallbackPlan(request);

  it('budget amounts sum exactly to the requested total', () => {
    const sum = plan.budget.categories.reduce((total, category) => total + category.amount, 0);
    expect(sum).toBe(request.budget);
    expect(plan.budget.total).toBe(request.budget);
  });

  it('budget amounts are all positive integers', () => {
    for (const category of plan.budget.categories) {
      expect(category.amount).toBeGreaterThan(0);
      expect(Number.isInteger(category.amount)).toBe(true);
    }
  });

  it('produces exactly 5 ideas spanning theme, activity and food kinds', () => {
    expect(plan.ideas).toHaveLength(5);
    const kinds = new Set(plan.ideas.map((idea) => idea.kind));
    expect(kinds.has('theme')).toBe(true);
    expect(kinds.has('activity')).toBe(true);
    expect(kinds.has('food')).toBe(true);
  });

  it('timeline dates all fall on/before the event date, in chronological order', () => {
    expect(plan.timeline).toHaveLength(10);
    for (const milestone of plan.timeline) {
      expect(milestone.daysBefore).toBeGreaterThanOrEqual(0);
      expect(milestone.date.localeCompare(request.date)).toBeLessThanOrEqual(0);
    }
    for (let index = 1; index < plan.timeline.length; index++) {
      const current = plan.timeline[index]?.date ?? '';
      const previous = plan.timeline[index - 1]?.date ?? '';
      expect(current.localeCompare(previous)).toBeGreaterThanOrEqual(0);
    }
  });

  it('is deterministic — same input, identical plan', () => {
    expect(buildFallbackPlan(request)).toEqual(buildFallbackPlan(request));
  });

  it('compresses the timeline when the event date is very close', () => {
    const soon = buildFallbackPlan({ ...request, date: futureIsoDate(3) });
    for (const milestone of soon.timeline) {
      expect(milestone.daysBefore).toBeLessThanOrEqual(3);
    }
    // Still ends at the event day and keeps every milestone on/before the date.
    expect(soon.timeline[soon.timeline.length - 1]?.daysBefore).toBe(0);
  });

  it('personalizes vendor questions and ideas with user inputs', () => {
    const json = JSON.stringify(plan);
    expect(json).toContain('Pune');
    expect(json).toContain('150');
    expect(json).toContain('A & B Wedding');
  });

  it('works for every event type with amounts summing to the budget', () => {
    for (const eventType of ['WEDDING', 'BIRTHDAY', 'COMMUNITY', 'OTHER'] as const) {
      const p = buildFallbackPlan({ ...request, eventType });
      const sum = p.budget.categories.reduce((total, category) => total + category.amount, 0);
      expect(sum).toBe(request.budget);
    }
  });
});
