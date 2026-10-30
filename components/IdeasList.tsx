import type { Idea } from '../types/plan';

interface IdeasListProps {
  ideas: Idea[];
}

const KIND_LABEL: Record<Idea['kind'], string> = {
  theme: 'Theme',
  activity: 'Activity',
  food: 'Food',
  other: 'Idea',
};

/** The plan's five personalized ideas across theme, activities and food. */
export default function IdeasList({ ideas }: IdeasListProps) {
  return (
    <section aria-label="Personalized ideas">
      <h3 className="text-md font-semibold">5 personalized ideas</h3>
      <ul className="print-block mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {ideas.map((idea, index) => (
          <li key={index} className="rounded-lg border border-slate-200 p-3">
            <p>
              <span className="mr-1" aria-hidden="true">
                {idea.kind === 'food' ? '🍽️' : idea.kind === 'activity' ? '🎪' : '🎨'}
              </span>
              <span className="font-semibold text-slate-900">{idea.title}</span>
              <span className="ml-2 rounded bg-brand-50 px-1.5 py-0.5 text-xs text-brand-800">
                {KIND_LABEL[idea.kind]}
              </span>
            </p>
            <p className="mt-1 text-sm text-slate-600">{idea.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
