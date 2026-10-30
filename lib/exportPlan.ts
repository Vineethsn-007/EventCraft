import type { EventType, Plan } from '../types/plan';
import { formatINR, formatIsoDate } from './utils';

/** The event fields needed for the text export; form fields arrive as strings. */
interface ExportEventFields {
  eventType: EventType;
  eventName: string;
  date: string;
  guestCount: number | string;
  budget: number | string;
  city: string;
  theme: string;
}

/** Renders the full plan as readable plain text for the clipboard. */
export function printPlanAsText(plan: Plan, request: ExportEventFields): string {
  const guests = Number(request.guestCount) || 0;
  const budget = Number(request.budget) || 0;
  const lines: string[] = [];

  lines.push(`EventCraft AI — Plan for \"${request.eventName}\" (${request.eventType})`);
  lines.push(`Date: ${formatIsoDate(request.date)} · Guests: ${guests} · City: ${request.city}`);
  lines.push(`Total budget: ${formatINR(budget)}`);
  if (request.theme) lines.push(`Theme: ${request.theme}`);
  lines.push('');

  lines.push('== BUDGET ==');
  for (const category of plan.budget.categories) {
    lines.push(`- ${category.name}: ${formatINR(category.amount)} (${category.percentage}%) — ${category.tip}`);
  }
  lines.push('');

  lines.push('== TIMELINE ==');
  for (const milestone of plan.timeline) {
    lines.push(`- ${formatIsoDate(milestone.date)} (${milestone.daysBefore}d before): ${milestone.title}`);
    lines.push(`  ${milestone.description}`);
  }
  lines.push('');

  lines.push('== VENDOR CHECKLIST ==');
  for (const group of plan.vendors) {
    lines.push(`[${group.category}]`);
    for (const item of group.items) lines.push(`  [ ] ${item}`);
  }
  lines.push('');

  lines.push('== IDEAS ==');
  plan.ideas.forEach((idea, index) => {
    lines.push(`${index + 1}. ${idea.title} (${idea.kind})`);
    lines.push(`   ${idea.detail}`);
  });

  return lines.join('\n');
}
