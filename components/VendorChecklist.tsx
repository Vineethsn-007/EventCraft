'use client';

import { useEffect, useMemo, useState } from 'react';
import type { VendorGroup } from '../types/plan';

interface VendorChecklistProps {
  groups: VendorGroup[];
  /** Fingerprint of the plan's vendor list; ticks reset when it changes. */
  planKey: string;
}

const STORAGE_KEY = 'eventcraft:checklist';
type StoredTicks = Record<string, Record<string, boolean>>; // planKey → tick set

/** Ticked vendor items are keyed "groupIndex:itemIndex" and persisted per plan. */
function readTicks(planKey: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    const planMap = (parsed as StoredTicks | null)?.[planKey];
    return new Set(planMap ? Object.keys(planMap).filter((k) => planMap[k]) : []);
  } catch {
    return new Set();
  }
}

function writeTicks(planKey: string, ticks: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const all: StoredTicks = raw ? (JSON.parse(raw) as StoredTicks) : {};
    const entries: Record<string, boolean> = {};
    ticks.forEach((id) => {
      entries[id] = true;
    });
    all[planKey] = entries;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Storage unavailable (private mode) — ticks simply won't persist.
  }
}

/** Interactive checklist: tick items, see progress, state kept in localStorage. */
export default function VendorChecklist({ groups, planKey }: VendorChecklistProps) {
  const [ticks, setTicks] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setTicks(readTicks(planKey));
  }, [planKey]);

  const totals = useMemo(() => {
    const sum = groups.reduce((acc, group) => acc + group.items.length, 0);
    return { done: ticks.size, all: sum };
  }, [groups, ticks]);

  const percent = totals.all === 0 ? 0 : Math.round((totals.done / totals.all) * 100);

  function toggle(id: string) {
    setTicks((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeTicks(planKey, next);
      return next;
    });
  }

  return (
    <section aria-label="Vendor checklist">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-md font-semibold">Vendor checklist</h3>
        <p className="text-sm text-slate-700" data-testid="checklist-progress-text">
          {totals.done} of {totals.all} done
        </p>
      </div>

      <div
        className="mt-2 h-3 w-full overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Vendor checklist progress"
        data-testid="checklist-progressbar"
      >
        <div className="h-3 rounded-full bg-emerald-600 transition-[width]" style={{ width: `${percent}%` }} />
      </div>

      <div className="print-block mt-4 space-y-4">
        {groups.map((group, groupIndex) => (
          <div key={group.category} className="rounded-lg border border-slate-200 p-3">
            <h4 className="text-sm font-bold uppercase tracking-wide text-brand-800">{group.category}</h4>
            <ul className="mt-2 space-y-1">
              {group.items.map((item, itemIndex) => {
                const id = `${groupIndex}:${itemIndex}`;
                const checked = ticks.has(id);
                return (
                  <li key={id}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 rounded px-1 py-1 text-sm ${
                        checked ? 'text-slate-500 line-through' : 'text-slate-900'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(id)}
                        data-testid={`vendor-check-${groupIndex}-${itemIndex}`}
                        className="mt-0.5 h-4 w-4 rounded border-slate-400 accent-emerald-600"
                      />
                      <span>{item}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
