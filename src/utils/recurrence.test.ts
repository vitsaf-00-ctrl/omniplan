import { describe, it, expect } from 'vitest';
import { nextOccurrence, nextInstanceDate, normalizeRecurringType } from './recurrence';

const d = (s: string) => new Date(`${s}T00:00:00`);
const ymd = (x: Date) =>
  `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

describe('nextOccurrence', () => {
  it('daily → next day, across month end', () => {
    expect(ymd(nextOccurrence(d('2026-05-31'), 'daily'))).toBe('2026-06-01');
  });

  it('weekdays: Friday → Monday, Saturday → Monday, Monday → Tuesday', () => {
    expect(ymd(nextOccurrence(d('2026-05-29'), 'weekdays'))).toBe('2026-06-01'); // Fri
    expect(ymd(nextOccurrence(d('2026-05-30'), 'weekdays'))).toBe('2026-06-01'); // Sat
    expect(ymd(nextOccurrence(d('2026-06-01'), 'weekdays'))).toBe('2026-06-02'); // Mon
  });

  it('weekly → +7 days', () => {
    expect(ymd(nextOccurrence(d('2026-12-28'), 'weekly'))).toBe('2027-01-04');
  });

  it('monthly keeps day-of-month', () => {
    expect(ymd(nextOccurrence(d('2026-05-15'), 'monthly'))).toBe('2026-06-15');
  });

  it('monthly clamps 31st to the last day of shorter months', () => {
    expect(ymd(nextOccurrence(d('2026-01-31'), 'monthly'))).toBe('2026-02-28');
    expect(ymd(nextOccurrence(d('2028-01-31'), 'monthly'))).toBe('2028-02-29'); // leap year
    expect(ymd(nextOccurrence(d('2026-03-31'), 'monthly'))).toBe('2026-04-30');
  });

  it('monthly across year end', () => {
    expect(ymd(nextOccurrence(d('2026-12-10'), 'monthly'))).toBe('2027-01-10');
  });

  it('preserves time of day', () => {
    const n = nextOccurrence(new Date('2026-05-20T14:30:00'), 'daily');
    expect(n.getHours()).toBe(14);
    expect(n.getMinutes()).toBe(30);
  });
});

describe('nextInstanceDate', () => {
  const NOW = new Date('2026-05-20T10:00:00'); // Wednesday

  it('completing today’s daily task schedules tomorrow', () => {
    expect(ymd(nextInstanceDate(d('2026-05-20'), 'daily', NOW))).toBe('2026-05-21');
  });

  it('completing an overdue daily task schedules tomorrow, not the past', () => {
    expect(ymd(nextInstanceDate(d('2026-05-10'), 'daily', NOW))).toBe('2026-05-21');
  });

  it('overdue weekly keeps its weekday', () => {
    // Mon 2026-05-04 → first Monday after today is 2026-05-25
    expect(ymd(nextInstanceDate(d('2026-05-04'), 'weekly', NOW))).toBe('2026-05-25');
  });

  it('completing a future task early schedules after its own date', () => {
    expect(ymd(nextInstanceDate(d('2026-05-25'), 'weekly', NOW))).toBe('2026-06-01');
  });

  it('overdue monthly on the 31st keeps clamping to month end', () => {
    expect(ymd(nextInstanceDate(d('2026-01-31'), 'monthly', NOW))).toBe('2026-05-31');
  });

  it('weekdays completed on Friday schedules Monday', () => {
    const fri = new Date('2026-05-22T10:00:00');
    expect(ymd(nextInstanceDate(d('2026-05-22'), 'weekdays', fri))).toBe('2026-05-25');
  });
});

describe('normalizeRecurringType', () => {
  it('falls back to weekly for unknown values', () => {
    expect(normalizeRecurringType(undefined)).toBe('weekly');
    expect(normalizeRecurringType('yearly')).toBe('weekly');
    expect(normalizeRecurringType('daily')).toBe('daily');
  });
});
