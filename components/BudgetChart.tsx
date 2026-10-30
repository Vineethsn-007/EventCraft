import type { BudgetCategory } from '../types/plan';
import { formatINR } from '../lib/utils';

interface BudgetChartProps {
  categories: BudgetCategory[];
  total: number;
}

const BAR_COLORS = [
  'bg-brand-600',
  'bg-emerald-600',
  'bg-sky-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-violet-600',
  'bg-teal-600',
  'bg-slate-600',
  'bg-orange-600',
  'bg-cyan-700',
  'bg-fuchsia-700',
  'bg-lime-700',
];

/** Pure-CSS horizontal bar chart with a visually hidden data table alternative. */
export default function BudgetChart({ categories, total }: BudgetChartProps) {
  const summary = categories
    .map((cat) => `${cat.name} ${formatINR(cat.amount)} (${cat.percentage}%)`)
    .join('; ');

  return (
    <section aria-label="Budget breakdown">
      <h3 className="text-md font-semibold">
        Budget breakdown — total {formatINR(total)}
      </h3>
      <p className="mt-1 text-xs text-slate-600">
        Amounts sum to exactly {formatINR(total)}. Bars are styled with plain CSS — no charting library.
      </p>

      <ul className="print-block mt-4 space-y-3" role="img" aria-label={`Budget by category: ${summary}`}>
        {categories.map((category, index) => (
          <li key={category.name}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm">
              <span className="font-medium">{category.name}</span>
              <span className="text-slate-700">
                {formatINR(category.amount)} · {category.percentage}%
              </span>
            </div>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                style={{ width: `${Math.max((category.amount / total) * 100, 0.5)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-600">💡 {category.tip}</p>
          </li>
        ))}
      </ul>

      {/* Screen-reader / print alternative to the bars */}
      <table className="sr-only">
        <caption>Budget by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Amount (INR)</th>
            <th scope="col">Percentage</th>
            <th scope="col">Tip</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.name}>
              <th scope="row">{category.name}</th>
              <td>{category.amount}</td>
              <td>{category.percentage}%</td>
              <td>{category.tip}</td>
            </tr>
          ))}
          <tr>
            <th scope="row">Total</th>
            <td>{total}</td>
            <td>100%</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
