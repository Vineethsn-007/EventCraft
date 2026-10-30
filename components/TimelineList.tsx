import type { TimelineMilestone } from '../types/plan';
import { formatIsoDate } from '../lib/utils';

interface TimelineListProps {
  milestones: TimelineMilestone[];
}

/** Milestones dated server-side working backward from the event date. */
export default function TimelineList({ milestones }: TimelineListProps) {
  return (
    <section aria-label="Event timeline">
      <h3 className="text-md font-semibold">Working-backward timeline</h3>
      <p className="mt-1 text-xs text-slate-600">Milestones are ordered from the first task to the event day.</p>
      <ol className="print-block mt-4 space-y-0">
        {milestones.map((milestone, index) => (
          <li key={`${milestone.date}-${index}`} className="relative border-l-2 border-brand-600 pb-5 pl-5">
            <span
              aria-hidden="true"
              className="absolute -left-[9px] top-1 block h-4 w-4 rounded-full border-2 border-white bg-brand-600"
            />
            <p className="text-sm font-semibold">
              {formatIsoDate(milestone.date)}
              <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-800" data-testid="days-before">
                {milestone.daysBefore === 0
                  ? 'Event day'
                  : `${milestone.daysBefore} day${milestone.daysBefore === 1 ? '' : 's'} before`}
              </span>
            </p>
            <p className="text-sm font-medium">{milestone.title}</p>
            <p className="mt-0.5 text-sm text-slate-600">{milestone.description}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
