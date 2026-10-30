import { describe, expect, it } from 'vitest';import {
  REQUIRED_IDEA_COUNT,
  buildTimelineFromOffsets,
  reconcileBudget,
  reconcileIdeas,
  repairSum,
} from '../lib/sanitize';
import { buildFallbackPlan } from '../lib/fallback';
import type { PlanRequest } from '../types/plan';

const request: PlanRequest = {
  eventType: 'BIRTHDAY',
  eventName: 'Aarav turns 7',
  date: '2099-06-15',
  guestCount: 40,
  budget: 120_000,
  city: 'Jaipur',
  theme: 'jungle safari',
  notes: '',
};

describe('reconcileBudget', () => {
  it('rescales amounts so they sum exactly to the total', () => {
    const raw = [
      { name: 'Venue', amount: 30_000, percentage: 25, tip: 'a' },
      { name: 'Catering', amount: 25_000, percentage: 25, tip: 'b' },
      { name: 'Decor', amount: 20_000, percentage: 20, tip: 'c' },
      { name: 'Miscellaneous', amount: 20_000, percentage: 30, tip: 'd' }, // 95k vs total 120k
    ];
    const result = reconcileBudget(raw, request.budget);
    const sum = result.categories.reduce((total, category) => total + category.amount, 0);
    expect(sum).toBe(120_000);
    expect(result.total).toBe(120_000);
  });

  it('keeps amounts as non-negative integers and recomputes truthful percentages', () => {
    const raw = [
      { name: 'A', amount: 100, percentage: 50, tip: 'a' },
      { name: 'B', amount: 100, percentage: 50, tip: 'b' },
    ];
    const result = reconcileBudget(raw, 999);
    for (const category of result.categories) {
      expect(Number.isInteger(category.amount)).toBe(true);
      expect(category.amount).toBeGreaterThanOrEqual(0);
      // percentage reflects the rescaled amount, not the raw claim
      expect(category.percentage).toBeCloseTo((category.amount / 999) * 100, 1);
    }
  });

  it('spreads evenly when the model returns all-zero amounts', () => {
    const raw = [
      { name: 'A', amount: 0, percentage: 0, tip: 'a' },
      { name: 'B', amount: 0, percentage: 0, tip: 'b' },
    ];
    const result = reconcileBudget(raw, 1000);
    const sum = result.categories.reduce((total, category) => total + category.amount, 0);
    expect(sum).toBe(1000);
    expect(result.categories[0]?.amount).toBeGreaterThan(0);
  });
});

describe('repairSum', () => {
  it('forces an exact sum by absorbing drift into the largest entry', () => {
    expect(repairSum([1000, 500, 500], 2001)).toEqual([1001, 500, 500]);
    const fixed = repairSum([700, 600, 700], 1234);
    expect(fixed.reduce((a, b) => a + b, 0)).toBe(1234);
    expect(fixed.every((amount) => amount >= 0)).toBe(true);
  });

  it('never lets amounts go negative even under extreme drift', () => {
    const fixed = repairSum([1, 1, 1], 1_000_000);
    expect(fixed.reduce((a, b) => a + b, 0)).toBe(1_000_000);
    expect(fixed.every((amount) => amount >= 0)).toBe(true);
  });
});

describe('buildTimelineFromOffsets', () => {
  it('derives ISO dates from the event date and daysBefore, sorted chronologically', () => {
    const result = buildTimelineFromOffsets(
      [
        { daysBefore: 10, title: 'B', description: 'b' },
        { daysBefore: 30, title: 'A', description: 'a' },
        { daysBefore: 0, title: 'Event day', description: 'party' },
      ],
      request.date,
    );
    expect(result.map((milestone) => milestone.title)).toEqual(['A', 'B', 'Event day']);
    expect(result[0]?.date).toBe('2099-05-16');
    expect(result[2]?.date).toBe('2099-06-15');
  });

  it('clamps negative or absurd offsets into the valid 0-540 range', () => {
    const result = buildTimelineFromOffsets(
      [
        { daysBefore: -5, title: 'Time travel', description: 'nope' },
        { daysBefore: 900, title: 'Too far', description: 'nope' },
      ],
      request.date,
    );
    expect(result.every((milestone) => milestone.daysBefore >= 0 && milestone.daysBefore <= 540)).toBe(true);
  });
});

describe('reconcileIdeas', () => {
  const fallbackIdeas = () => buildFallbackPlan(request).ideas;

  it('pads a short idea list to exactly 5 using deterministic fallback ideas', () => {
    const result = reconcileIdeas(fallbackIdeas().slice(0, 2) as never, request);
    expect(result).toHaveLength(REQUIRED_IDEA_COUNT);
    // No duplicate titles introduced by padding.
    expect(new Set(result.map((idea) => idea.title)).size).toBe(REQUIRED_IDEA_COUNT);
  });

  it('truncates over-long idea lists to exactly 5', () => {
    const overflow = [
      ...fallbackIdeas(),
      ...fallbackIdeas().map((idea) => ({ ...idea, title: `${idea.title} 2` })),
    ] as never;
    expect(reconcileIdeas(overflow, request)).toHaveLength(REQUIRED_IDEA_COUNT);
  });
});
