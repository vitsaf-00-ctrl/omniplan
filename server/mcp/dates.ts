import { ToolError } from './types.js';

// All functions use the process time zone, set by ./tz.ts (Europe/Kyiv).

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HHMM_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const WEEKDAYS_UK = ['неділя', 'понеділок', 'вівторок', 'середа', 'четвер', "п'ятниця", 'субота'];

export function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

/** 'YYYY-MM-DD' → local midnight. Rejects impossible dates like 2026-02-30. */
export function parseYmd(s: string, field = 'date'): Date {
  const m = YMD_RE.exec(s.trim());
  if (!m) throw new ToolError(`${field} must be YYYY-MM-DD, got "${s}"`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    throw new ToolError(`${field} "${s}" is not a valid calendar date`);
  }
  return date;
}

export function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Normalises 'H:MM' / 'HH:MM' → 'HH:MM'; '' means "no time". */
export function parseTime(s: string): string {
  const t = s.trim();
  if (t === '') return '';
  const padded = /^\d:\d{2}$/.test(t) ? `0${t}` : t;
  if (!HHMM_RE.test(padded)) throw new ToolError(`time must be HH:MM (24h), got "${s}"`);
  return padded;
}
