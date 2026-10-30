import Groq from 'groq-sdk';
import type { Plan, PlanRequest } from '../types/plan';
import { err, ok, type Result } from './result';
import {
  buildPrompt,
  buildRefinePrompt,
  type PlanContext,
} from './prompt';
import { planResponseSchema, type PlanResponseInput } from './schema';
import { sanitizePlanResponse } from './sanitize';
import { buildFallbackPlan, DEMO_REASONS } from './fallback';

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
export const GROQ_TEMPERATURE = 0.7;
/** max_tokens cap: a full plan is ~1200-2000 tokens; 3000 leaves safe headroom. */
export const GROQ_MAX_TOKENS = 3000;
export const GROQ_TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS ?? 30_000);

let cachedClient: Groq | null | undefined;

export function hasGroqKey(): boolean {
  return Boolean(process.env.GROQ_API_KEY?.trim());
}

/**
 * Lazily constructs the server-side Groq client (memoized). Returns null when
 * no key is configured — the caller then falls back to the demo plan. The key
 * is read ONLY here, on the server, and is never sent to the browser.
 */
export function getGroqClient(): Groq | null {
  if (cachedClient === undefined) {
    cachedClient = hasGroqKey()
      ? new Groq({ apiKey: process.env.GROQ_API_KEY as string })
      : null;
  }
  return cachedClient;
}

/** Test/seam helper: forget the memoized client so env changes are re-read. */
export function resetGroqClient(): void {
  cachedClient = undefined;
}

/** Description of what went wrong, for the demo-mode banner. */
export interface PlanOutcome {
  plan: Plan;
  demoMode: boolean;
  demoReason?: string;
}

/**
 * Produces a plan for the request. Never throws: any Groq/network/parse
 * failure degrades to the deterministic demo plan with `demoMode: true`.
 */
export async function createPlan(request: PlanRequest): Promise<PlanOutcome> {
  if (!hasGroqKey()) {
    return { plan: buildFallbackPlan(request), demoMode: true, demoReason: DEMO_REASONS.keyMissing };
  }

  const result = await generatePlanViaGroq(request);
  if (result.ok) {
    return { plan: result.value, demoMode: false };
  }
  return { plan: buildFallbackPlan(request), demoMode: true, demoReason: DEMO_REASONS.aiUnavailable };
}

async function generatePlanViaGroq(
  request: PlanRequest & { refinement?: string; currentPlan?: PlanContext },
): Promise<Result<Plan>> {
  const client = getGroqClient();
  if (!client) return err('Groq client unavailable');

  const refinement = request.refinement;
  const { system, user } =
    typeof refinement === 'string' && refinement.length > 0
      ? buildRefinePrompt(request, normalizeContext(request.currentPlan), refinement)
      : buildPrompt(request);

  // One compact call; one retry after a malformed/unparseable answer.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const completion = await client.chat.completions.create(
        {
          model: GROQ_MODEL,
          temperature: GROQ_TEMPERATURE,
          max_tokens: GROQ_MAX_TOKENS,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
        { signal: AbortSignal.timeout(GROQ_TIMEOUT_MS) },
      );
      const content = completion.choices[0]?.message?.content ?? '';
      const parsed = planResponseSchema.safeParse(JSON.parse(content));
      if (parsed.success) {
        return ok(sanitizePlanResponse(parsed.data as PlanResponseInput, request));
      }
    } catch {
      // JSON.parse throw, schema mismatch, network error or timeout → retry.
    }
  }
  return err('Groq did not return a valid plan JSON');
}

function normalizeContext(currentPlan: PlanContext | undefined): PlanContext {
  return (
    currentPlan ?? { budget: { categories: [] }, timeline: [], vendors: [], ideas: [] }
  );
}
