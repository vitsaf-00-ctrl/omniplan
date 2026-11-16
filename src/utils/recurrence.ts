// Recurring tasks — "next copy on completion" model.
//
// A recurring task never pre-generates future instances. When an instance is
// marked done, exactly one next instance is created (see useTaskStore). This
// makes duplicates impossible and keeps "stop repeating" trivial.

export type RecurringType = 'daily' | 'weekdays' | 'weekly' | 'monthly';

const RECURRING_TYPES: ReadonlySet<string> = new Set(['daily', 'weekdays', 'weekly', 'monthly']);

export function normalizeRecurringType(t: string | undefined | null): RecurringType {
  return t && RECURRING_TYPES.has(t) ? (t as RecurringType) : 'weekly';
}

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

/**
 * The occurrence right after `from` (time of day is preserved).
 * Monthly keeps the original day-of-month and clamps to the month's last day,
 * so Jan 31 → Feb 28 (or 29), not Mar 3.
 */
export function nextOccurrence(from: Date, type: RecurringType, anchorDay = from.getDate()): Date {
  const next = new Date(from);
  switch (type) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekdays':
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly': {
      next.setDate(1); // avoid overflow while changing month
      next.setMonth(next.getMonth() + 1);
      const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
      next.setDate(Math.min(anchorDay, lastDay));
      break;
    }
  }
  return next;
}

/**
 * Date for the instance to create when the task due on `taskDate` is completed.
 * Always strictly after today, so finishing an overdue daily task schedules
 * tomorrow, not another day in the past.
 */
export function nextInstanceDate(taskDate: Date, type: RecurringType, now: Date = new Date()): Date {
  const today = startOfDay(now);
  const anchorDay = taskDate.getDate();
  let next = nextOccurrence(taskDate, type, anchorDay);
  // Hard cap protects against malformed dates far in the past.
  for (let i = 0; i < 1000 && startOfDay(next) <= today; i++) {
    next = nextOccurrence(next, type, anchorDay);
  }
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
