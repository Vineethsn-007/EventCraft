import { z } from 'zod';
import { planRequestSchema } from '@/lib/schema';
import { checkRateLimit } from '@/lib/rateLimit';
import { createPlan } from '@/lib/groq';

export const runtime = 'nodejs';

/** Requests larger than this are rejected before parsing. */
const MAX_BODY_BYTES = 64_000;

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return headers.get('x-real-ip') ?? 'unknown';
}

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

/** Maps a schema failure to one safe, human-readable message (no internals). */
function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue ? `Invalid request: ${issue.message}` : 'Invalid request.';
}

export async function POST(request: Request): Promise<Response> {
  try {
    const verdict = checkRateLimit(getClientIp(request.headers));
    if (!verdict.allowed) {
      return Response.json(
        { error: 'Too many plans requested. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(verdict.retryAfterSeconds ?? 60) } },
      );
    }

    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
      return badRequest('Request body too large.');
    }

    let raw: unknown;
    try {
      raw = JSON.parse(body);
    } catch {
      return badRequest('Request body must be valid JSON.');
    }

    const parsed = planRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return badRequest(firstIssueMessage(parsed.error));
    }

    const { plan, demoMode, demoReason } = await createPlan(parsed.data);
    return Response.json({ plan, demoMode, ...(demoReason ? { demoReason } : {}) });
  } catch {
    // Deliberately opaque: no stack traces or internal details leak out.
    return Response.json({ error: 'Unexpected server error. Please try again.' }, { status: 500 });
  }
}
