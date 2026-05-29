import type { Priority } from '../store/useTaskStore';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface ParseResult {
  title: string;
  date?: Date;
  time?: string;
  priority?: Priority;
  project?: string;
  recurring?: boolean;
  recurringType?: 'daily' | 'weekdays' | 'weekly' | 'monthly';
}

// ─── Day-of-week helpers ──────────────────────────────────────────────────────

// Negative lookbehind (?<!о) prevents "понеділок" from matching Sunday pattern
const DAY_STEMS: [RegExp, number][] = [
  [/(?<!о)неділ/iu, 0],  // неділя — but NOT по-неділок
  [/понеділ/iu, 1],
  [/вівтор/iu, 2],
  [/серед/iu, 3],
  [/четвер/iu, 4],
  [/п[''']ятн/iu, 5],
  [/субот/iu, 6],
];

function matchDayOfWeek(token: string): number | null {
  for (const [re, day] of DAY_STEMS) {
    if (re.test(token)) return day;
  }
  return null;
}

/** Next occurrence of targetDay strictly after `from` (at least 1 day ahead). */
function nextOccurrence(from: Date, targetDay: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = ((targetDay - d.getDay() + 7) % 7) || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

// ─── Individual extractors ────────────────────────────────────────────────────

function extractProject(s: string, knownProjects: string[]): { project?: string; rest: string } {
  const match = s.match(/#([\wА-ЯҐЄІЇа-яґєії]+)/u);
  if (!match) return { rest: s };
  const token = match[1].toLowerCase();
  const found = knownProjects.find(p =>
    p.toLowerCase().startsWith(token) || p.toLowerCase() === token,
  );
  return { project: found, rest: s.replace(match[0], '').trim() };
}

function extractPriority(s: string): { priority?: Priority; rest: string } {
  const map: Record<string, Priority> = {
    '!high': 'high', '!важливо': 'high', '!висока': 'high',
    '!срочно': 'high', '!критично': 'high',
    '!medium': 'medium', '!середня': 'medium', '!середній': 'medium', '!звичайна': 'medium',
    '!low': 'low', '!низька': 'low', '!нижча': 'low', '!потім': 'low',
  };
  const re = /!(high|medium|low|важливо|висока|срочно|критично|середня|середній|звичайна|низька|нижча|потім)(?=\s|$)/iu;
  const match = s.match(re);
  if (!match) return { rest: s };
  return { priority: map[match[0].toLowerCase()], rest: s.replace(match[0], '').trim() };
}

function extractTime(s: string): { time?: string; rest: string } {
  // 1) "о 14:00" / "у 14:00" — preposition followed by space then digits
  //    Use (?:^|\s) to anchor at word start without relying on \b for Cyrillic
  const prepRe = /(?:^|\s)[оуОУ]\s+(\d{1,2})[-:](\d{2})(?=\s|$)/u;
  const prepMatch = s.match(prepRe);
  if (prepMatch) {
    const h = parseInt(prepMatch[1], 10);
    const m = parseInt(prepMatch[2], 10);
    if (h <= 23 && m <= 59) {
      return {
        time: `${String(h).padStart(2, '0')}:${prepMatch[2]}`,
        rest: s.replace(prepMatch[0], ' ').replace(/\s{2,}/g, ' ').trim(),
      };
    }
  }

  // 2) Bare "14:00" / "09:30"
  const bareRe = /(?:^|\s)(\d{1,2})[-:](\d{2})(?=\s|$)/u;
  const bareMatch = s.match(bareRe);
  if (bareMatch) {
    const h = parseInt(bareMatch[1], 10);
    const m = parseInt(bareMatch[2], 10);
    if (h <= 23 && m <= 59) {
      return {
        time: `${String(h).padStart(2, '0')}:${bareMatch[2]}`,
        rest: s.replace(bareMatch[0], ' ').replace(/\s{2,}/g, ' ').trim(),
      };
    }
  }

  return { rest: s };
}

// Match a Ukrainian day word (stem) anywhere in a token
function dayFromToken(token: string): number | null {
  return matchDayOfWeek(token);
}

function extractRecurring(s: string, now: Date): {
  recurring?: boolean;
  recurringType?: ParseResult['recurringType'];
  date?: Date;
  rest: string;
} {
  // щодня / кожного дня / кожен день
  if (/щодня|кожного\s+дня|кожен\s+день/iu.test(s)) {
    return {
      recurring: true, recurringType: 'daily',
      date: new Date(now),
      rest: s.replace(/щодня|кожного\s+дня|кожен\s+день/iu, '').trim(),
    };
  }

  // по буднях / кожного робочого дня / будні
  if (/по\s+буднях|кожного\s+робочого\s+дня|будні/iu.test(s)) {
    return {
      recurring: true, recurringType: 'weekdays',
      date: new Date(now),
      rest: s.replace(/по\s+буднях|кожного\s+робочого\s+дня|будні/iu, '').trim(),
    };
  }

  // щотижня / кожного тижня / кожен тиждень
  if (/щотижня|кожного\s+тижня|кожен\s+тиждень/iu.test(s)) {
    return {
      recurring: true, recurringType: 'weekly',
      date: new Date(now),
      rest: s.replace(/щотижня|кожного\s+тижня|кожен\s+тиждень/iu, '').trim(),
    };
  }

  // щомісяця / кожного місяця
  if (/щомісяця|кожного\s+місяця/iu.test(s)) {
    return {
      recurring: true, recurringType: 'monthly',
      date: new Date(now),
      rest: s.replace(/щомісяця|кожного\s+місяця/iu, '').trim(),
    };
  }

  // кожного/кожної {day} — "кожного вівторка", "кожної п'ятниці"
  // Use \S+ instead of \w+ to match Cyrillic words
  const weeklyLongRe = /кожн\S*\s+(\S+)/iu;
  const weeklyLongMatch = s.match(weeklyLongRe);
  if (weeklyLongMatch) {
    const day = dayFromToken(weeklyLongMatch[1]);
    if (day !== null) {
      return {
        recurring: true, recurringType: 'weekly',
        date: nextOccurrence(now, day),
        rest: s.replace(weeklyLongMatch[0], '').trim(),
      };
    }
  }

  // що{день} — щопонеділка, щоп'ятниці, щосереди
  // Use \S+ to capture full Cyrillic word after що
  const weeklyShortRe = /що([пвчсн][''ʼ]?\S+)/iu;
  const weeklyShortMatch = s.match(weeklyShortRe);
  if (weeklyShortMatch) {
    const day = dayFromToken(weeklyShortMatch[1]);
    if (day !== null) {
      return {
        recurring: true, recurringType: 'weekly',
        date: nextOccurrence(now, day),
        rest: s.replace(weeklyShortMatch[0], '').trim(),
      };
    }
  }

  return { rest: s };
}

function extractDate(s: string, now: Date): { date?: Date; rest: string } {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (/після\s+завтра/iu.test(s)) {
    const d = new Date(today); d.setDate(d.getDate() + 2);
    return { date: d, rest: s.replace(/після\s+завтра/iu, '').trim() };
  }
  if (/сьогодні/iu.test(s)) {
    return { date: new Date(today), rest: s.replace(/сьогодні/iu, '').trim() };
  }
  if (/завтра/iu.test(s)) {
    const d = new Date(today); d.setDate(d.getDate() + 1);
    return { date: d, rest: s.replace(/завтра/iu, '').trim() };
  }

  // "наступного понеділка" / "наступній середі" — two-word phrase
  // Use \S+ to capture Cyrillic day word
  const nextRe = /наступн\S*\s+(\S+)/iu;
  const nextMatch = s.match(nextRe);
  if (nextMatch) {
    const day = dayFromToken(nextMatch[1]);
    if (day !== null) {
      return { date: nextOccurrence(today, day), rest: s.replace(nextMatch[0], '').trim() };
    }
  }

  // "в/у понеділок" / "у вівторок"
  // Anchor with (?:^|\s) to avoid matching mid-word
  const inDayRe = /(?:^|\s)[уUвВ]\s+(\S+)/iu;
  const inDayMatch = s.match(inDayRe);
  if (inDayMatch) {
    const day = dayFromToken(inDayMatch[1]);
    if (day !== null) {
      return {
        date: nextOccurrence(today, day),
        rest: s.replace(inDayMatch[0], ' ').replace(/\s{2,}/g, ' ').trim(),
      };
    }
  }

  // bare day name — "понеділок", "п'ятниця", "середа" etc.
  // Match isolated day tokens (preceded and followed by space or boundary)
  const bareRe = /(?:^|\s)(понеділ\S*|вівтор\S*|серед[аиіу]\S*|четвер\S*|п[''']ятн\S*|субот\S*|неділ\S*)(?=\s|$)/iu;
  const bareMatch = s.match(bareRe);
  if (bareMatch) {
    const day = dayFromToken(bareMatch[1]);
    if (day !== null) {
      return {
        date: nextOccurrence(today, day),
        rest: s.replace(bareMatch[0], ' ').replace(/\s{2,}/g, ' ').trim(),
      };
    }
  }

  return { rest: s };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/**
 * Parse a natural-language Ukrainian task string into structured fields.
 *
 * @param input          Raw user input, e.g. "Подзвонити Івану завтра о 14:00 #ACAT !high"
 * @param now            Reference "now" — injectable for tests (default: current time).
 * @param knownProjects  Project names used for `#tag` resolution.
 */
export function parseTaskInput(
  input: string,
  now = new Date(),
  knownProjects: string[] = [],
): ParseResult {
  if (!input.trim()) return { title: '' };

  let rest = input.trim();
  const result: ParseResult = { title: '' };

  // Order matters: project + priority first (unambiguous), then time, recurring, date
  const proj = extractProject(rest, knownProjects);
  if (proj.project) result.project = proj.project;
  rest = proj.rest;

  const prio = extractPriority(rest);
  if (prio.priority) result.priority = prio.priority;
  rest = prio.rest;

  const timeResult = extractTime(rest);
  if (timeResult.time) result.time = timeResult.time;
  rest = timeResult.rest;

  // Recurring before one-off date so "щоп'ятниці" wins over bare day names
  const rec = extractRecurring(rest, now);
  if (rec.recurring) {
    result.recurring = true;
    result.recurringType = rec.recurringType;
    if (rec.date) result.date = rec.date;
  }
  rest = rec.rest;

  if (!result.date) {
    const dateResult = extractDate(rest, now);
    if (dateResult.date) result.date = dateResult.date;
    rest = dateResult.rest;
  }

  result.title = rest.replace(/\s{2,}/g, ' ').trim();
  if (!result.title) result.title = input.trim();

  return result;
}
