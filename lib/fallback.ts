import type {
  BudgetCategory,
  BudgetBreakdown,
  EventType,
  Idea,
  Plan,
  PlanRequest,
  TimelineMilestone,
  VendorGroup,
} from '../types/plan';
import { addDaysIso, daysBetween, todayIsoDate } from './utils';

/**
 * Deterministic demo plans used when GROQ_API_KEY is missing or the LLM call
 * fails. Pure functions of the request — same input always yields the same plan,
 * so tests need no network and behavior is predictable for evaluators.
 */

// Percentages per event type; each list must sum to 100.
const BUDGET_MIX: Record<EventType, Array<{ name: string; percentage: number; tip: string }>> = {
  WEDDING: [
    { name: 'Venue', percentage: 35, tip: 'Book the venue first — it constrains every other vendor in the city.' },
    { name: 'Catering', percentage: 25, tip: 'Insist on a live tasting and per-plate rates including service tax in writing.' },
    { name: 'Decor', percentage: 12, tip: 'Ask which decor items are rented vs bought; rentals stretch the budget.' },
    { name: 'Photography', percentage: 10, tip: 'See full galleries, not just Instagram highlights, before signing.' },
    { name: 'Attire', percentage: 10, tip: 'Fit sessions take 2 visits — order garments at least 2 months early.' },
    { name: 'Music / Entertainment', percentage: 5, tip: 'Confirm power, sound-limits and curfew timings with the venue.' },
    { name: 'Miscellaneous', percentage: 3, tip: 'Keep a reserve for driver tips, GST and last-minute contingencies.' },
  ],
  BIRTHDAY: [
    { name: 'Venue', percentage: 30, tip: 'Party halls usually bill by the hour — pad the booking by 1 hour.' },
    { name: 'Catering', percentage: 25, tip: 'Confirm kids\' meals separately; they are usually cheaper per plate.' },
    { name: 'Decor', percentage: 15, tip: 'A theme backdrop + balloons bundle is often cheaper than à-la-carte items.' },
    { name: 'Entertainment', percentage: 12, tip: 'Magicians / DJs book up on weekends — confirm arrival and setup time.' },
    { name: 'Photography', percentage: 8, tip: 'A 2-3 hour shoot is enough for most birthdays; negotiate accordingly.' },
    { name: 'Return gifts & cake', percentage: 8, tip: 'Order the cake at least 5 days ahead for custom designs.' },
    { name: 'Miscellaneous', percentage: 2, tip: 'Keep a small reserve for transport, tips and extra supplies.' },
  ],
  COMMUNITY: [
    { name: 'Venue / Grounds', percentage: 30, tip: 'Public partnerships can subsidize grounds — ask the municipal office.' },
    { name: 'Catering', percentage: 25, tip: 'Bulk catering for 200+ is priced per tray — compare 3 quotes.' },
    { name: 'Decor & Stage', percentage: 12, tip: 'Stage safety and load-bearing is the vendor\'s responsibility — get it in writing.' },
    { name: 'AV & Music', percentage: 12, tip: 'Walkie-talkies and clear stage cues matter for large-multi-area events.' },
    { name: 'Outreach / Marketing', percentage: 10, tip: 'Neighbourhood WhatsApp groups are the cheapest, most effective channel.' },
    { name: 'Security & Sanitation', percentage: 6, tip: 'Varied footfall needs clean toilets on a schedule — contract separately.' },
    { name: 'Miscellaneous', percentage: 5, tip: 'Budget for volunteers: IDs, water, snacks and first-aid.' },
  ],
  OTHER: [
    { name: 'Venue', percentage: 32, tip: 'Cancel-confirm-date flexibility is worth negotiating for open-date events.' },
    { name: 'Catering', percentage: 25, tip: 'Ask about F&B minimums; they sometimes cover décor add-ons for free.' },
    { name: 'Decor & Rentals', percentage: 14, tip: 'Combo rental packages (tables+linens+lighting) beat itemised quotes.' },
    { name: 'Photography', percentage: 9, tip: 'Clarify who owns the photos and how many edited images you get.' },
    { name: 'Entertainment', percentage: 12, tip: 'Audience participation is content: book performers who involve guests.' },
    { name: 'Miscellaneous', percentage: 8, tip: 'Print a run-sheet: who calls whom, when, for every vendor.' },
  ],
};

/** Milestones working backward from the event date; `daysBefore` is scaled down for late bookings. */
const MILESTONE_TEMPLATE: Array<{ daysBefore: number; title: string; description: string }> = [
  { daysBefore: 120, title: 'Shortlist & book the venue', description: 'Compare 3 venue options on capacity, parking and in-house catering rules. Pay an advance only after dates align.' },
  { daysBefore: 90, title: 'Lock catering & photography', description: 'Finalize menu with a tasting; book photographers after reviewing complete galleries and ownership/rights terms.' },
  { daysBefore: 60, title: 'Book decor & entertainment', description: 'Share your theme; get a mock layout with measurements. Confirm sound curfew rules with the venue.' },
  { daysBefore: 45, title: 'Send invitations & vendor contracts', description: 'Make sure every vendor agrees to cancellation terms in writing before paying more than 50%.' },
  { daysBefore: 30, title: 'Confirm RSVPs & final headcount', description: 'Gentle reminders to non-responders; give caterers a preliminary count and a confirmation deadline.' },
  { daysBefore: 14, title: 'Menu, floor plan & run sheet', description: 'Freeze menu quantities, seating and vendor arrival schedule; walk through the venue layout with each vendor’s point person.' },
  { daysBefore: 7, title: 'Payments & logistics', description: 'Release final payments, arrange transport and hand out phone numbers *"who calls whom, when"* to organisers.' },
  { daysBefore: 3, title: 'Setup & full run-through', description: 'Decor installs, AV checks and lighting; do a complete walk-through of the schedule with everyone involved.' },
  { daysBefore: 1, title: 'Day-before checklist', description: 'Charge devices, print programs, assign a coordinator checklist and go over the last-minute punch list.' },
  { daysBefore: 0, title: 'Event day', description: 'Welcome guests, follow the run sheet, keep one point-person on hand for any vendor questions.' },
];

// Deterministic idea factory: same request always yields the same five ideas.
const IDEA_TEMPLATES: Array<(r: PlanRequest) => Idea> = [
  (r) => ({
    title: `${r.theme || 'Signature'} colour story`,
    detail: `Carry one theme colour plus gold or white through invitations, table linen, cake and the entry arch — a cohesive look for "${r.eventName}" without a big decor spike.`,
    kind: 'theme',
  }),
  (r) => ({
    title: `${r.city} flavour station`,
    detail: `Host a live counter serving a beloved ${r.city} specialty (chaat, kebabs, local sweets) so food becomes an experience, not just a course, for ${r.guestCount} guests.`,
    kind: 'food',
  }),
  (r) => ({
    title: 'Memory lane wall',
    detail: `Pin a timeline of photos and notes about "${r.eventName}" near the entrance; guests add wishes as they arrive and it doubles as natural decor.`,
    kind: 'activity',
  }),
  (r) => ({
    title: 'Fairy-light canopy moment',
    detail: 'Dim the hall for a 3-minute warm-light reveal in the middle of the evening — one high-impact, low-cost visual that photographs beautifully.',
    kind: 'theme',
  }),
  (r) => ({
    title: r.guestCount > 100 ? 'Rotating game tables' : 'Story and talent hour',
    detail:
      r.guestCount > 100
        ? 'Run 2-3 small game stations (tambola, trivia about the guests of honour, antakshari) so no queue ever forms and every group has somewhere to go.'
        : 'Open a 15-minute segment for short toasts, songs or a quiz about the guest of honour — keeps an intimate crowd engaged without extra vendors.',
    kind: 'activity',
  }),
];

function buildBudgetBreakdown(request: PlanRequest): BudgetBreakdown {
  const mix = BUDGET_MIX[request.eventType];
  let allocated = 0;
  const categories: BudgetCategory[] = mix.map((entry, index) => {
    // The final category absorbs rounding drift so amounts always sum to the budget.
    const isLast = index === mix.length - 1;
    const amount = isLast
      ? request.budget - allocated
      : Math.round((entry.percentage / 100) * request.budget);
    allocated += amount;
    return { name: entry.name, amount, percentage: entry.percentage, tip: entry.tip };
  });
  return { categories, total: request.budget };
}

function buildTimeline(request: PlanRequest): TimelineMilestone[] {
  const span = Math.max(daysBetween(todayIsoDate(), request.date), 0);
  const longest = MILESTONE_TEMPLATE[0]?.daysBefore ?? 120;
  const milestones = MILESTONE_TEMPLATE.map((milestone) => {
    // Late bookings compress the schedule proportionally instead of dating
    // milestones in the past.
    const daysBefore =
      span >= longest
        ? milestone.daysBefore
        : Math.min(span, Math.round((milestone.daysBefore / longest) * span));
    return { ...milestone, daysBefore };
  });
  milestones.sort((a, b) => b.daysBefore - a.daysBefore); // earliest date first
  return milestones.map((milestone) => ({
    date: addDaysIso(request.date, milestone.daysBefore),
    daysBefore: milestone.daysBefore,
    title: milestone.title,
    description: milestone.description,
  }));
}

function buildVendors(request: PlanRequest): VendorGroup[] {
  return [
    {
      category: 'Venue',
      items: [
        `Can the venue comfortably fit ${request.guestCount} guests plus catering and AV space?`,
        'What is included in the rate — chairs, tables, generator backup, cleaning, parking?',
        'What are the advance, cancellation and overtime rules, in writing?',
        'Are sounds, decor and catering restricted to in-house or empanelled vendors?',
      ],
    },
    {
      category: 'Catering',
      items: [
        `Is the per-plate price all-inclusive of service, GST and staff for ${request.guestCount} plates?`,
        'Can we do a full tasting before signing, with the same menu as the event?',
        'What is the policy on leftovers, and the penalty if the headcount drops late?',
        'Are live counters and service staff included, or billed separately?',
      ],
    },
    {
      category: 'Decor',
      items: [
        'Can we see photos of your full setups (not just staged social-media shots)?',
        'Which decor items are rented versus purchased, and what are the teardown charges?',
        'What happens if fresh flowers or specific materials are unavailable on the week?',
        'How early can setup start, and does that clash with venue timings?',
      ],
    },
    {
      category: 'Photography',
      items: [
        'May we see two or three full wedding galleries, not edited highlights?',
        'How many edited photos/videos are delivered, and who owns the raw files?',
        'Is there a published photo and video delivery turnaround time?',
        'Will the quoted team (lead + candid) be the exact team present that day?',
      ],
    },
    {
      category: 'Music & Entertainment',
      items: [
        'Do you have the venue-approved decibel cap and performance end time?',
        'Can we share a must-play and do-not-play list in advance?',
        'What is the backup plan if the DJ or performer falls sick or gear fails?',
        'Are emcee, lights and special effects part of the package or separate?',
      ],
    },
    {
      category: 'Logistics & Miscellaneous',
      items: [
        'Is overnight equipment storage at the venue possible or allowed?',
        'Who is the single point of contact and expected response time during the event?',
        'What insurance or damage-liability terms apply for each vendor?',
        `Do you have prior experience working events in ${request.city} at this scale?`,
      ],
    },
  ];
}

/** Builds the deterministic demo plan. Pure in `request`: same inputs → identical plan. */
export function buildFallbackPlan(request: PlanRequest): Plan {
  const ideas = IDEA_TEMPLATES.map((factory) => factory(request));
  return {
    budget: buildBudgetBreakdown(request),
    timeline: buildTimeline(request),
    vendors: buildVendors(request),
    ideas: ideas.slice(0, 5),
  };
}

/** Friendly reasons shown in the Demo mode banner. */
export const DEMO_REASONS = {
  keyMissing: 'GROQ_API_KEY is not configured on the server, so a deterministic sample plan is shown.',
  aiUnavailable: 'The AI planning service is unavailable right now, so a deterministic sample plan is shown.',
} as const;

