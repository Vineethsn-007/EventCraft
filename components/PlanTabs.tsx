'use client';

import { useCallback, useRef, useState, type KeyboardEvent } from 'react';
import type { Plan } from '../types/plan';
import { hashString } from '../lib/utils';
import BudgetChart from './BudgetChart';
import TimelineList from './TimelineList';
import VendorChecklist from './VendorChecklist';
import IdeasList from './IdeasList';

/** Tabs follow the ARIA tabs pattern: roving focus, arrow keys, Home/End. */
const TAB_KEYS = ['budget', 'timeline', 'vendors', 'ideas'] as const;
export type TabKey = (typeof TAB_KEYS)[number];

const TAB_LABELS: Record<TabKey, string> = {
  budget: '💰 Budget',
  timeline: '🗓️ Timeline',
  vendors: '✅ Vendors',
  ideas: '💡 Ideas',
};

interface PlanTabsProps {
  plan: Plan;
}

export default function PlanTabs({ plan }: PlanTabsProps) {
  const [active, setActive] = useState<TabKey>('budget');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = useCallback(
    (delta: 1 | -1) => {
      const index = TAB_KEYS.indexOf(active);
      const next = TAB_KEYS[(index + delta + TAB_KEYS.length) % TAB_KEYS.length];
      if (next) {
        setActive(next);
        tabRefs.current[TAB_KEYS.indexOf(next)]?.focus();
      }
    },
    [active],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActive('budget');
        tabRefs.current[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        setActive('ideas');
        tabRefs.current[TAB_KEYS.length - 1]?.focus();
        break;
      default:
        break;
    }
  }

  return (
    <div>
      <div role="tablist" aria-label="Plan sections" className="no-print flex flex-wrap gap-2" onKeyDown={handleKeyDown}>
        {TAB_KEYS.map((key, index) => (
          <button
            key={key}
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            role="tab"
            id={`tab-${key}`}
            aria-selected={active === key}
            aria-controls={`panel-${key}`}
            tabIndex={active === key ? 0 : -1}
            onClick={() => setActive(key)}
            data-testid={`tab-${key}`}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${
              active === key ? 'bg-brand-600 text-on-primary' : 'bg-white text-slate-800 hover:bg-slate-100'
            } border border-slate-300`}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`panel-${active}`}
        aria-labelledby={`tab-${active}`}
        tabIndex={0}
        className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        {active === 'budget' && <BudgetChart categories={plan.budget.categories} total={plan.budget.total} />}
        {active === 'timeline' && <TimelineList milestones={plan.timeline} />}
        {active === 'vendors' && <VendorChecklist groups={plan.vendors} planKey={planFingerprint(plan)} />}
        {active === 'ideas' && <IdeasList ideas={plan.ideas} />}
      </div>
    </div>
  );
}

/** Stable fingerprint so vendor ticks reset when the vendor list changes. */
function planFingerprint(plan: Plan): string {
  return hashString(JSON.stringify(plan.vendors));
}
