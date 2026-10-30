import type {
  BudgetBreakdown,
  Idea,
  Plan,
  PlanRequest,
  TimelineMilestone,
  VendorGroup,
} from '../types/plan';
import type { PlanResponseInput } from './schema';
import { buildFallbackPlan } from './fallback';
import { addDaysIso } from './utils';

export const REQUIRED_IDEA_COUNT = 5;

/**
 * Converted to a sanitized, UI-safe `Plan`:
 * - budget amounts rescaled so they sum exactly to the requested total
 * - timeline dates computed server-side from `daysBefore` (model never dates)
 * - idea list padded/truncated to exactly 5 using deterministic fallback ideas
 */
export function sanitizePlanResponse(raw: PlanResponseInput, request: PlanRequest): Plan {
  return {
    budget: reconcileBudget(raw.budget.categories, request.budget),
    timeline: buildTimelineFromOffsets(raw.timeline, request.date),
    vendors: raw.vendors.map(
      (group): VendorGroup => ({
        category: group.category,
        items: group.items,
      }),
    ),
    ideas: reconcileIdeas(raw.ideas, request),
  };
}

/**
 * Forces an exact sum: positive drift is absorbed by the largest entry; excess
 * is removed from the largest entries until the sum matches `total` exactly.
 * Amounts never go negative, because inputs are non-negative by schema.
 */
export function repairSum(amounts: number[], total: number): number[] {
  if (amounts.length === 0) return amounts;
  const next = [...amounts];
  let diff = total - next.reduce((a, b) => a + b, 0);
  if (diff === 0) return next;

  if (diff > 0) {
    const largestIndex = next.indexOf(Math.max(...next));
    const safeIndex = largestIndex === -1 ? 0 : largestIndex;
    next[safeIndex] = (next[safeIndex] ?? 0) + diff;
    return next;
  }

  // Negative drift: shave the excess off the largest entries, largest first.
  let excess = -diff;
  for (let index = next.length - 1; index >= 0 && excess > 0; index--) {
    const take = Math.min(next[index] ?? 0, excess);
    next[index] = (next[index] ?? 0) - take;
    excess -= take;
  }
  return next;
}

/**
 * Rescales budget amounts (proportionally) and recomputes percentages so that
 * amounts sum exactly to `total` regardless of LLM rounding errors.
 */
export function reconcileBudget(
  categories: PlanResponseInput['budget']['categories'],
  total: number,
): BudgetBreakdown {
  const sum = categories.reduce((acc, category) => acc + category.amount, 0);

  let rescaled: number[];
  if (sum <= 0 || categories.length === 0) {
    // Degenerate output: distribute evenly so the contract still holds.
    rescaled = categories.map(() => Math.floor(total / Math.max(categories.length, 1)));
    rescaled = repairSum(rescaled, total);
  } else {
    rescaled = categories.map((category) => Math.round((category.amount / sum) * total));
    rescaled = repairSum(rescaled, total);
  }

  return {
    total,
    categories: categories.map((category, index) => ({
      name: category.name,
      amount: rescaled[index] ?? 0,
      percentage: Math.round(((rescaled[index] ?? 0) / total) * 1000) / 10,
      tip: category.tip,
    })),
  };
}

/** Computes real ISO dates from `daysBefore` offsets and sorts chronologically. */
export function buildTimelineFromOffsets(
  milestones: PlanResponseInput['timeline'],
  eventDate: string,
): TimelineMilestone[] {
  return milestones
    .map((milestone) => ({
      daysBefore: Math.max(0, Math.min(milestone.daysBefore, 540)),
      date: addDaysIso(eventDate, Math.max(0, Math.min(milestone.daysBefore, 540))),
      title: milestone.title,
      description: milestone.description,
    }))
    .sort((a, b) => b.daysBefore - a.daysBefore); // earliest date first
}

/**
 * Pads (or truncates) the idea list to exactly 5 items. Padding entries come
 * from the deterministic fallback generator so the contract always holds.
 */
export function reconcileIdeas(rawIdeas: PlanResponseInput['ideas'], request: PlanRequest): Idea[] {
  const trimmed = rawIdeas.slice(0, REQUIRED_IDEA_COUNT);
  if (trimmed.length >= REQUIRED_IDEA_COUNT) return trimmed;
  const padding = buildFallbackPlan(request).ideas.filter(
    (idea) => !trimmed.some((existing) => existing.title === idea.title),
  );
  return [...trimmed, ...padding].slice(0, REQUIRED_IDEA_COUNT);
}
