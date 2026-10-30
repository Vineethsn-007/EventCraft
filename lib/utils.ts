/** Small pure helpers shared by lib and UI. No side effects, no dependencies. */

/** Formats an integer INR amount like `₹1,50,000`. */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Parses `yyyy-mm-dd` as a UTC date, or returns null when malformed. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject rollovers such as 2024-02-31 (month would advance past the input).
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

/** Today's date as `yyyy-mm-dd` in UTC. */
export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Whole days between two `yyyy-mm-dd` dates (to - from). */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/** Returns `yyyy-mm-dd` exactly `days` (may be negative) before `iso`. */
export function addDaysIso(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  if (!date) throw new Error(`Invalid ISO date: ${iso}`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

/** Human-friendly date, e.g. `12 Mar 2026` — UTC-based for determinism. */
export function formatIsoDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (!date) return iso;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Tiny djb2 hash → base36 string; used to fingerprint plans for checklist storage. */
export function hashString(input: string): string {
  let hash = 5381;
  for (let index = 0; index < input.length; index++) {
    hash = (hash * 33) ^ input.charCodeAt(index);
  }
  return (hash >>> 0).toString(36);
}
