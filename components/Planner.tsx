'use client';

import dynamic from 'next/dynamic';
import { useCallback, useMemo, useRef, useState } from 'react';
import EventForm, { DEFAULT_FORM, type FormValues } from './EventForm';
import PlanTabs from './PlanTabs';
import DemoBanner from './DemoBanner';
import PlanLoader from './PlanLoader';
import { EVENT_TYPES, type EventType } from '../types/plan';
import { parseFormValues, type FormErrors } from './EventForm';
import { planRequestSchema } from '../lib/schema';
import { formatIsoDate } from '../lib/utils';
import type { PlanResponse } from '../types/plan';
import { printPlanAsText } from '../lib/exportPlan';

// Lazy load: the chat panel ships only after a plan exists.
const RefineChat = dynamic(() => import('./RefineChat'), {
  ssr: false,
  loading: () => <div className="h-24 rounded-xl bg-slate-100" aria-hidden="true" />,
});

type Phase = 'idle' | 'loading' | 'done';
type ChatMessage = { role: 'user' | 'ai'; text: string };

const GENERATED_PLACEHOLDER = 'Generating your plan…';

/** Clickable example prefills shown in the empty state before first generation. */
const EXAMPLE_PREFILLS: { label: string; values: FormValues }[] = [
  {
    label: '💒 Wedding · 150 guests · Pune',
    values: { ...DEFAULT_FORM, eventType: 'WEDDING', eventName: 'Sample Wedding', guestCount: '150', budget: '800000', city: 'Pune' },
  },
  {
    label: '🎂 Birthday · 40 guests · Bengaluru',
    values: { ...DEFAULT_FORM, eventType: 'BIRTHDAY', eventName: 'Aarav turns 7', guestCount: '40', budget: '60000', city: 'Bengaluru' },
  },
  {
    label: '🤝 Community · 200 guests · Mumbai',
    values: { ...DEFAULT_FORM, eventType: 'COMMUNITY', eventName: 'Community Food Drive', guestCount: '200', budget: '150000', city: 'Mumbai' },
  },
];

/** Maps `/planner?type=…` queries onto form values so linked tiles prefill. */
function prefillFromQuery(type: string | undefined): FormValues | null {
  if (!type) return null;
  const normalized = type.trim().toUpperCase() as EventType;
  if (!EVENT_TYPES.includes(normalized)) return null;
  if (normalized === 'OTHER') return { ...DEFAULT_FORM, eventType: 'OTHER' };
  const match = EXAMPLE_PREFILLS.find((example) => example.values.eventType === normalized);
  return match ? match.values : { ...DEFAULT_FORM, eventType: normalized };
}

/** Top-level client state machine: form → POST /api/plan → tabs + refine chat. */
export default function Planner({ initialEventType }: { initialEventType?: string }) {
  const [values, setValues] = useState<FormValues>(
    () => prefillFromQuery(initialEventType) ?? DEFAULT_FORM,
  );
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [phase, setPhase] = useState<Phase>('idle');
  const [planResult, setPlanResult] = useState<PlanResponse | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const busy = phase === 'loading';

  const fetchPlan = useCallback(
    async (mode: 'generate' | 'refine', refinement?: string) => {
      const checks = parseFormValues(values);
      if (!checks.ok) {
        setFormErrors(checks.errors);
        setStatusMessage('Please fix the highlighted form errors before generating a plan.');
        return;
      }
      setFormErrors({});

      // Abort any in-flight request before starting a new one (efficiency).
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const payload = {
        mode,
        eventType: values.eventType,
        eventName: values.eventName,
        date: values.date,
        guestCount: Number(values.guestCount),
        budget: Number(values.budget),
        city: values.city,
        theme: values.theme,
        notes: values.notes,
        ...(refinement ? { refinement } : {}),
        ...(planResult && mode === 'refine' ? { currentPlan: planResult.plan } : {}),
      };
      const parsed = planRequestSchema.safeParse(payload);
      if (!parsed.success) {
        setStatusMessage('Please fix the highlighted form errors before generating a plan.');
        return;
      }

      setPhase('loading');
      setStatusMessage(GENERATED_PLACEHOLDER);
      if (refinement) {
        setChat((history) => [...history, { role: 'user', text: refinement }]);
      }

      try {
        const response = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(parsed.data),
          signal: controller.signal,
        });
        const data: unknown = await response.json().catch(() => null);
        if (!response.ok || !data) {
          const message = (data as { error?: unknown } | null)?.error;
          setStatusMessage(
            typeof message === 'string'
              ? message
              : 'Could not generate a plan. Check your connection and try again.',
          );
          setPhase(planResult ? 'done' : 'idle');
          if (refinement) {
            setChat((history) => [...history, { role: 'ai', text: 'Sorry, that refinement failed to apply.' }]);
          }
          return;
        }

        const result = data as PlanResponse;
        setPlanResult(result);
        setPhase('done');
        setChat((history) =>
          refinement ? [...history, { role: 'ai', text: 'Plan updated.' }] : history,
        );
        setStatusMessage(
          result.demoMode
            ? `Demo plan ready. Planned for ${formatIsoDate(values.date)}, ${values.guestCount} guests in ${values.city}.`
            : `AI plan ready. Planned for ${formatIsoDate(values.date)}, ${values.guestCount} guests in ${values.city}.`,
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return; // superseded by newer request
        setStatusMessage('Could not generate a plan. Check your connection and try again.');
        setPhase(planResult ? 'done' : 'idle');
      }
    },
    [values, planResult],
  );

  const recap = useMemo(() => {
    const checks = parseFormValues(values);
    if (!checks.ok) return null;
    return `Event date: ${formatIsoDate(values.date)} · Guests: ${values.guestCount} · Budget: ₹${Number(
      values.budget,
    ).toLocaleString('en-IN')} · City: ${values.city}`;
  }, [values]);

  async function copyAsText(): Promise<void> {
    if (!planResult) return;
    try {
      await navigator.clipboard.writeText(printPlanAsText(planResult.plan, values));
      setStatusMessage('Plan copied to the clipboard as text.');
    } catch {
      setStatusMessage('The clipboard is unavailable in this browser. Use the print option instead.');
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Left: sticky event form */}
      <div className="md:col-span-5">
        <div className="space-y-4 md:sticky md:top-24">
          <EventForm values={values} onChange={setValues} onSubmit={() => fetchPlan('generate')} disabled={busy} />

          {/* Polite status region for loading/completion announcements. */}
          <p aria-live="polite" className="text-sm text-slate-700" data-testid="status-message">
            {statusMessage}
          </p>

          {Object.keys(formErrors).length > 0 && (
            <p role="alert" className="text-sm font-medium text-red-700" data-testid="form-level-error">
              There are problems with the event form — see the messages above each field.
            </p>
          )}

          {recap && <p className="text-xs text-slate-500">{recap}</p>}
        </div>
      </div>

      {/* Right: results, empty state, loader */}
      <div className="space-y-6 md:col-span-7">
        {/* First generation: staged loader. A refinement keeps the plan visible
            (dimmed) with a compact loader row above it. */}
        {phase === 'loading' && !planResult && <PlanLoader />}
        {phase === 'loading' && planResult && <PlanLoader compact />}

        {!planResult && phase !== 'loading' && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Your plan will appear here</h2>
            <p className="mt-1 text-sm text-slate-600">
              Fill in the form and press Generate — or start from an example:
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {EXAMPLE_PREFILLS.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => setValues(example.values)}
                  className="no-print rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-brand-600 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {planResult && (
          <div
            className={`space-y-4 transition-opacity ${
              phase === 'loading' ? 'pointer-events-none select-none opacity-50' : ''
            }`}
          >
            {planResult.demoMode && (
              <DemoBanner reason={planResult.demoReason ?? 'Showing a deterministic sample plan.'} />
            )}

            <div className="space-y-4">
            <PlanTabs plan={planResult.plan} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={copyAsText}
                className="no-print rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                📋 Copy as text
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              >
                🖨️ Print / Save PDF
              </button>
            </div>

            <RefineChat
              messages={chat}
              onSubmit={(refinement) => fetchPlan('refine', refinement)}
              busy={busy}
            />
            </div>
          </div>
      )}
      </div>
    </div>
  );
}
