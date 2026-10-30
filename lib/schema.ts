import { z } from 'zod';
import { EVENT_TYPES } from '../types/plan';

// ─── String field limits (also enforced client-side for fast feedback) ────────

export const LIMITS = {
  eventName: 120,
  city: 80,
  theme: 200,
  notes: 500,
  refinement: 500,
  maxGuests: 10_000,
  minBudget: 1000, // INR
  maxBudget: 100_000_000, // 1 crore
  maxHorizonDays: 730, // event date must be within ~2 years
} as const;

// ─── Shared field schemas ─────────────────────────────────────────────────────

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter a valid date (yyyy-mm-dd).');

const futureIsoDateSchema = isoDateSchema.refine(
  (value) => {
    // Compare pure UTC date strings so this behaves identically on any host.
    const today = new Date().toISOString().slice(0, 10);
    return value >= today && value <= addDaysIsoForCheck(today, LIMITS.maxHorizonDays);
  },
  { error: `Event date must be between today and ${LIMITS.maxHorizonDays} days from now.` },
);

/** Free-standable addDays helper to avoid a circular import with utils. */
function addDaysIsoForCheck(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

// ─── Plan request API ─────────────────────────────────────────────────────────

const planShapeBase = {
  eventType: z.enum(EVENT_TYPES, {
    error: 'Choose an event type.',
  }),
  eventName: z
    .string({ error: 'Event name must be text.' })
    .trim()
    .min(2, 'Event name must be at least 2 characters.')
    .max(LIMITS.eventName, `Event name must be at most ${LIMITS.eventName} characters.`),
  date: futureIsoDateSchema,
  guestCount: z
    .number({ error: 'Guest count must be a number.' })
    .int('Guest count must be a whole number.')
    .min(1, 'Guest count must be at least 1.')
    .max(LIMITS.maxGuests, `Guest count must be at most ${LIMITS.maxGuests}.`),
  budget: z
    .number({ error: 'Budget must be a number.' })
    .int('Budget must be a whole number of INR.')
    .min(LIMITS.minBudget, `Budget must be at least ₹${LIMITS.minBudget.toLocaleString('en-IN')}.`)
    .max(LIMITS.maxBudget, 'Budget must be at most ₹10,00,00,000.'),
  city: z
    .string({ error: 'City must be text.' })
    .trim()
    .min(2, 'City must be at least 2 characters.')
    .max(LIMITS.city, `City must be at most ${LIMITS.city} characters.`),
  theme: z.string().trim().max(LIMITS.theme).optional().default(''),
  notes: z.string().trim().max(LIMITS.notes).optional().default(''),
};

const refineExtrasShape = {
  refinement: z
    .string({ error: 'Refinement message must be text.' })
    .trim()
    .min(2, 'Write at least 2 characters describing the change.')
    .max(LIMITS.refinement, `Refinement must be at most ${LIMITS.refinement} characters.`),
  currentPlan: z.lazy(() => planResponseSchema).optional(),
};

export const planRequestSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('generate') }).extend(planShapeBase).strict(),
  z.object({ mode: z.literal('refine') }).extend(planShapeBase).extend(refineExtrasShape).strict(),
]);

export type PlanRequestInput = z.infer<typeof planRequestSchema>;

export interface ClientFormInput extends Omit<PlanRequestInput, 'mode'> {
  mode: 'generate' | 'refine';
}

/** Client-side validation (no refine extras — used before a new generation). */
export const generateFormSchema = z.object(planShapeBase);

// ─── LLM response (strict contract for the model's JSON) ──────────────────────

const llmBudgetSchema = z.object({
  categories: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        amount: z.number().int().min(0).max(LIMITS.maxBudget),
        percentage: z.number().min(0).max(100),
        tip: z.string().trim().min(1).max(240),
      }),
    )
    .min(1)
    .max(12),
});

const timelineMilestoneSchema = z.object({
  daysBefore: z.number().int().min(0).max(540),
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(400),
});

const llmTimelineSchema = z.array(timelineMilestoneSchema).min(1).max(20);

const llmVendorsSchema = z
  .array(
    z.object({
      category: z.string().trim().min(1).max(60),
      items: z
        .array(z.string().trim().min(1).max(200))
        .min(1)
        .max(12),
    }),
  )
  .min(1)
  .max(12);

const llmIdeasSchema = z
  .array(
    z.object({
      title: z.string().trim().min(1).max(120),
      detail: z.string().trim().min(1).max(400),
      kind: z.enum(['theme', 'activity', 'food', 'other']).catch('other'),
    }),
  )
  .min(1)
  .max(10);

export const planResponseSchema = z.object({
  budget: llmBudgetSchema,
  timeline: llmTimelineSchema,
  vendors: llmVendorsSchema,
  ideas: llmIdeasSchema,
});

export type PlanResponseInput = z.infer<typeof planResponseSchema>;

export const apiPlanResponseSchema = z.object({
  plan: z.object({
    budget: llmBudgetSchema.extend({
      total: z.number().int().min(LIMITS.minBudget).max(LIMITS.maxBudget),
    }),
    timeline: z
      .array(timelineMilestoneSchema.extend({ date: isoDateSchema }))
      .min(1)
      .max(20),
    vendors: llmVendorsSchema,
    ideas: llmIdeasSchema,
  }),
  demoMode: z.boolean(),
  demoReason: z.string().optional(),
});
