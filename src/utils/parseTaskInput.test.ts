import { describe, it, expect } from 'vitest';
import { parseTaskInput } from './parseTaskInput';

// Fixed reference date: Wednesday 2026-05-27 (mid-week, good for testing)
const NOW = new Date('2026-05-27T10:00:00');
const PROJECTS = ['AI officer', 'ДІС', 'ACAT', 'Трейд', 'Орлі', 'ЯС', 'Навчання', 'Розробка', 'Моє'];

const parse = (s: string) => parseTaskInput(s, NOW, PROJECTS);

// ─── Title extraction ────────────────────────────────────────────────────────

describe('title', () => {
  it('returns full input as title when nothing matched', () => {
    expect(parse('Просто задача').title).toBe('Просто задача');
  });

  it('strips matched tokens from title', () => {
    expect(parse('Подзвонити Івану завтра').title).toBe('Подзвонити Івану');
  });

  it('handles multiple tokens stripped', () => {
    expect(parse('Звіт #ACAT завтра о 10:00 !high').title).toBe('Звіт');
  });

  it('falls back to original input when only tokens given', () => {
    const r = parse('завтра');
    expect(r.title).toBeTruthy(); // "завтра" alone → fallback to original
  });

  it('normalises extra spaces in title', () => {
    expect(parse('Оплатити рахунок сьогодні !high').title).toBe('Оплатити рахунок');
  });
});

// ─── Date parsing ────────────────────────────────────────────────────────────

describe('date', () => {
  it('сьогодні → today midnight', () => {
    const r = parse('Щось зробити сьогодні');
    expect(r.date).toBeDefined();
    expect(r.date!.toDateString()).toBe(NOW.toDateString());
  });

  it('завтра → tomorrow', () => {
    const r = parse('Задача завтра');
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 1);
    expect(r.date!.toDateString()).toBe(expected.toDateString());
  });

  it('після завтра → day after tomorrow', () => {
    const r = parse('Щось після завтра');
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 2);
    expect(r.date!.toDateString()).toBe(expected.toDateString());
  });

  it('в понеділок → next Monday (NOW is Wednesday)', () => {
    // Wed 27 May → next Monday = Jun 1
    const r = parse('Зустріч в понеділок');
    expect(r.date!.getDay()).toBe(1); // Monday
    expect(r.date! > NOW).toBe(true);
  });

  it('наступного понеділка → next Monday', () => {
    const r = parse('Зустріч наступного понеділка');
    expect(r.date!.getDay()).toBe(1);
    expect(r.date! > NOW).toBe(true);
  });

  it('п\'ятниця bare → next Friday', () => {
    const r = parse("Доповідь п'ятниця");
    expect(r.date!.getDay()).toBe(5);
    expect(r.date! > NOW).toBe(true);
  });

  it('next occurrence is always strictly in the future', () => {
    // NOW is Wednesday — "в середу" → next Wed, not today
    const r = parse('Задача в середу');
    expect(r.date! > NOW).toBe(true);
    expect(r.date!.getDay()).toBe(3);
  });

  it('no date token → date undefined', () => {
    expect(parse('Просто задача').date).toBeUndefined();
  });
});

// ─── Time parsing ────────────────────────────────────────────────────────────

describe('time', () => {
  it('о 14:00', () => {
    expect(parse('Зустріч о 14:00').time).toBe('14:00');
  });

  it('bare HH:MM', () => {
    expect(parse('Дзвінок 09:30').time).toBe('09:30');
  });

  it('single-digit hour', () => {
    expect(parse('Йога 8:00').time).toBe('08:00');
  });

  it('в 19:00', () => {
    expect(parse('Англійська в 19:00').time).toBe('19:00');
  });

  it('no time token → undefined', () => {
    expect(parse('Задача сьогодні').time).toBeUndefined();
  });

  it('invalid time ignored (hour > 23)', () => {
    expect(parse('Задача 25:00').time).toBeUndefined();
  });
});

// ─── Priority parsing ─────────────────────────────────────────────────────────

describe('priority', () => {
  it('!high → high', () => {
    expect(parse('Задача !high').priority).toBe('high');
  });

  it('!medium → medium', () => {
    expect(parse('Задача !medium').priority).toBe('medium');
  });

  it('!low → low', () => {
    expect(parse('Задача !low').priority).toBe('low');
  });

  it('!важливо → high', () => {
    expect(parse('Задача !важливо').priority).toBe('high');
  });

  it('!середня → medium', () => {
    expect(parse('Задача !середня').priority).toBe('medium');
  });

  it('!низька → low', () => {
    expect(parse('Задача !низька').priority).toBe('low');
  });

  it('no priority token → undefined', () => {
    expect(parse('Звичайна задача').priority).toBeUndefined();
  });
});

// ─── Project parsing ──────────────────────────────────────────────────────────

describe('project', () => {
  it('#ACAT → ACAT', () => {
    expect(parse('Задача #ACAT').project).toBe('ACAT');
  });

  it('#Навч → Навчання (prefix match)', () => {
    expect(parse('Урок #Навч').project).toBe('Навчання');
  });

  it('#ЯС → ЯС', () => {
    expect(parse('Звіт #ЯС').project).toBe('ЯС');
  });

  it('unknown # token → project undefined', () => {
    expect(parse('Задача #Неіснуючий').project).toBeUndefined();
  });

  it('no # → project undefined', () => {
    expect(parse('Задача').project).toBeUndefined();
  });
});

// ─── Recurring parsing ───────────────────────────────────────────────────────

describe('recurring', () => {
  it("щоп'ятниці → weekly friday", () => {
    const r = parse("Урок щоп'ятниці 19:00");
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekly');
    expect(r.date!.getDay()).toBe(5);
    expect(r.time).toBe('19:00');
    expect(r.title).toBe('Урок');
  });

  it('кожного вівторка → weekly tuesday', () => {
    const r = parse('Англійська кожного вівторка');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekly');
    expect(r.date!.getDay()).toBe(2);
  });

  it('щодня → daily', () => {
    const r = parse('Пробіжка щодня');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('daily');
  });

  it('кожного дня → daily', () => {
    const r = parse('Медитація кожного дня');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('daily');
  });

  it('по буднях → weekdays', () => {
    const r = parse('Standup по буднях 10:00');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekdays');
  });

  it('щотижня → weekly', () => {
    const r = parse('Огляд задач щотижня');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekly');
  });

  it('щомісяця → monthly', () => {
    const r = parse('Рахунки щомісяця');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('monthly');
  });

  it('щопонеділка → weekly monday', () => {
    const r = parse('Ретроспектива щопонеділка');
    expect(r.recurring).toBe(true);
    expect(r.date!.getDay()).toBe(1);
  });
});

// ─── Combined / full-phrase examples from spec ───────────────────────────────

describe('full phrases (spec examples)', () => {
  it('Подзвонити Івану завтра о 14:00', () => {
    const r = parse('Подзвонити Івану завтра о 14:00');
    expect(r.title).toBe('Подзвонити Івану');
    const expected = new Date(NOW);
    expected.setDate(expected.getDate() + 1);
    expect(r.date!.toDateString()).toBe(expected.toDateString());
    expect(r.time).toBe('14:00');
    expect(r.recurring).toBeUndefined();
  });

  it("Звіт щоп'ятниці 10:00", () => {
    const r = parse("Звіт щоп'ятниці 10:00");
    expect(r.title).toBe('Звіт');
    expect(r.time).toBe('10:00');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekly');
    expect(r.date!.getDay()).toBe(5); // Friday
  });

  it('Підготувати презентацію наступного понеділка #ACAT', () => {
    const r = parse('Підготувати презентацію наступного понеділка #ACAT');
    expect(r.title).toBe('Підготувати презентацію');
    expect(r.date!.getDay()).toBe(1);
    expect(r.project).toBe('ACAT');
  });

  it('Оплатити рахунок сьогодні !high', () => {
    const r = parse('Оплатити рахунок сьогодні !high');
    expect(r.title).toBe('Оплатити рахунок');
    expect(r.date!.toDateString()).toBe(NOW.toDateString());
    expect(r.priority).toBe('high');
  });

  it('Англійська кожного вівторка 19:00', () => {
    const r = parse('Англійська кожного вівторка 19:00');
    expect(r.title).toBe('Англійська');
    expect(r.time).toBe('19:00');
    expect(r.recurring).toBe(true);
    expect(r.recurringType).toBe('weekly');
    expect(r.date!.getDay()).toBe(2); // Tuesday
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('empty input → empty title, no fields', () => {
    const r = parse('');
    expect(r.title).toBe('');
    expect(r.date).toBeUndefined();
  });

  it('only spaces → empty title', () => {
    expect(parse('   ').title).toBe('');
  });

  it('unrecognised input keeps full text as title', () => {
    const r = parse('Зробити щось важливе для проєкту');
    expect(r.title).toBe('Зробити щось важливе для проєкту');
    expect(r.date).toBeUndefined();
    expect(r.priority).toBeUndefined();
  });

  it('time without date does not set date', () => {
    const r = parse('Задача о 10:00');
    expect(r.time).toBe('10:00');
    expect(r.date).toBeUndefined();
  });

  it('recurring takes precedence over one-off date', () => {
    const r = parse("Зустріч щоп'ятниці завтра"); // both signals present
    // recurring wins; "завтра" stays in title or is dropped
    expect(r.recurring).toBe(true);
  });
});
