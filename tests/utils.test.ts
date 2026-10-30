import { describe, expect, it } from 'vitest';
import { addDaysIso, daysBetween, formatINR, formatIsoDate, hashString, parseIsoDate } from '../lib/utils';

describe('parseIsoDate', () => {
  it('accepts valid dates and rejects malformed ones', () => {
    expect(parseIsoDate('2026-03-01')).not.toBeNull();
    expect(parseIsoDate('2027-02-30')).toBeNull(); // Feb 30 rolls over
    expect(parseIsoDate('01-03-2026')).toBeNull();
    expect(parseIsoDate('2026-13-01')).toBeNull();
  });
});

describe('addDaysIso / daysBetween', () => {
  it('subtracts days working backward, crossing month boundaries', () => {
    expect(addDaysIso('2026-03-01', 1)).toBe('2026-02-28');
    expect(addDaysIso('2026-01-01', 0)).toBe('2026-01-01');
    expect(daysBetween('2026-01-01', '2026-01-31')).toBe(30);
  });
});

describe('formatINR', () => {
  it('formats whole INR with Indian digit grouping', () => {
    expect(formatINR(150000)).toContain('1,50,000');
    expect(formatINR(0)).toContain('0');
  });
});

describe('formatIsoDate', () => {
  it('renders a human-friendly date', () => {
    expect(formatIsoDate('2026-03-01')).toMatch(/1 Mar 2026/);
  });
});

describe('hashString', () => {
  it('is stable and input-sensitive', () => {
    expect(hashString('abc')).toBe(hashString('abc'));
    expect(hashString('abc')).not.toBe(hashString('abd'));
  });
});
