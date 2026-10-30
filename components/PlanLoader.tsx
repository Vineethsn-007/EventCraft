'use client';

import { useEffect, useState } from 'react';

/** Status lines rotate while /api/plan is generating, so the wait feels alive. */
const STAGES = [
  'Reading your event details…',
  'Balancing the budget…',
  'Plotting the timeline…',
  'Listing vendors to book…',
  'Sharpening the ideas…',
];

const STAGE_MS = 1600;

interface PlanLoaderProps {
  /** Compact row shown above an existing plan while a refinement runs. */
  compact?: boolean;
}

/**
 * Plan-generation loading state: a coral ring spinner plus rotating stage
 * text (role="status" so it is announced), over a shimmering skeleton that
 * mirrors the upcoming results layout. Honors prefers-reduced-motion via
 * the globals.css override.
 */
export default function PlanLoader({ compact = false }: PlanLoaderProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStageIndex((index) => (index + 1) % STAGES.length);
    }, STAGE_MS);
    return () => window.clearInterval(timer);
  }, []);

  const stage = STAGES[stageIndex] ?? STAGES[0] ?? '';

  if (compact) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="plan-loader"
        className="no-print flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
      >
        <span className="loader-spinner loader-spinner-sm shrink-0" aria-hidden="true" />
        <span className="stage-text text-sm font-medium">{stage}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="plan-loader"
      className="no-print rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="loader-spinner shrink-0" aria-hidden="true" />
        <p className="stage-text text-sm font-semibold">{stage}</p>
        <p className="text-xs text-slate-500">Generating a full plan — budget, timeline, vendors and ideas.</p>
      </div>

      {/* Skeleton preview of the results layout, shimmering in step. */}
      <div className="mt-6 space-y-3" aria-hidden="true">
        <div className="shimmer h-6 w-40 rounded" />
        <div className="shimmer h-3 w-full rounded-full" />
        <div className="shimmer h-3 w-5/6 rounded-full" />
        <div className="shimmer h-3 w-3/5 rounded-full" />
        <div className="shimmer h-3 w-2/3 rounded-full" />
        <div className="grid grid-cols-2 gap-3">
          <div className="shimmer h-16 rounded" />
          <div className="shimmer h-16 rounded" />
        </div>
      </div>
    </div>
  );
}
