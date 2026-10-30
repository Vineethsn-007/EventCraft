/** Core domain types for EventCraft AI. */

export const EVENT_TYPES = ['WEDDING', 'BIRTHDAY', 'COMMUNITY', 'OTHER'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

/** Date in ISO `yyyy-mm-dd` form (UTC-based, no timezone drift). */
export type IsoDate = string;

export interface PlanRequest {
  eventType: EventType;
  eventName: string;
  date: IsoDate;
  guestCount: number;
  budget: number; // total budget in INR
  city: string;
  theme: string;
  notes: string;
}

export interface BudgetCategory {
  name: string;
  amount: number; // INR, integers
  percentage: number; // 0-100, one decimal
  tip: string;
}

export interface BudgetBreakdown {
  categories: BudgetCategory[];
  total: number; // always equals the requested budget
}

/** Milestone whose date is computed server-side from `daysBefore` and the event date. */
export interface TimelineMilestone {
  date: IsoDate;
  daysBefore: number;
  title: string;
  description: string;
}

export interface VendorGroup {
  category: string;
  /**
   * Items to verify/cask — checklist rows. Ticked state is keyed by
   * `${groupIndex}:${itemIndex}` so a refined plan starts fresh.
   */
  items: string[];
}

export interface Idea {
  title: string;
  detail: string;
  kind: 'theme' | 'activity' | 'food' | 'other';
}

export interface Plan {
  budget: BudgetBreakdown;
  timeline: TimelineMilestone[];
  vendors: VendorGroup[];
  ideas: Idea[];
}

/** What the API returns. `demoMode` marks deterministic fallback plans. */
export interface PlanResponse {
  plan: Plan;
  demoMode: boolean;
  demoReason?: string;
}
