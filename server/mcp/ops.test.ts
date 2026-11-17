import './tz';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRepo } from './memoryRepo';
import * as ops from './ops';
import { ToolError, type Task } from './types';

const NOW = new Date(2026, 10, 17, 10, 0); // Tue 2026-11-17 10:00 (Kyiv)
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

function task(p: Partial<Task> & { id: string }): Task {
  return { title: 'T', project: 'ДІС', tagColor: 'blue', status: 'todo', date: d(2026, 11, 17), createdAt: d(2026, 11, 1), ...p };
}

let repo: MemoryRepo;
let ctx: ops.OpsContext;

beforeEach(() => {
  repo = new MemoryRepo([
    { id: 'ai', name: 'AI officer', color: 'indigo' },
    { id: 'dis', name: 'ДІС', color: 'blue' },
    { id: 'orli', name: 'Орлі', color: 'amber' },
  ]);
  ctx = { repo, now: () => new Date(NOW) };
});

describe('time zone', () => {
  it('runs in Europe/Kyiv', () => {
    expect(process.env.TZ).toBe('Europe/Kyiv');
    // Kyiv is UTC+2 in November: local midnight is 22:00 UTC the day before
    expect(d(2026, 11, 17).toISOString()).toBe('2026-11-16T22:00:00.000Z');
  });
});

describe('create_task', () => {
  it('defaults to today and the first project', async () => {
    const { created } = await ops.createTask(ctx, { title: 'Аналіз митних баз' });
    expect(created.date).toBe('2026-11-17');
    expect(created.weekday).toBe('вівторок');
    expect(created.project).toBe('AI officer');
    expect(created.status).toBe('todo');
    expect(repo.tasks.get(created.id)!.tagColor).toBe('indigo');
  });

  it('resolves project names loosely and sets its colour', async () => {
    const { created } = await ops.createTask(ctx, { title: 'Рахунок', project: '#орлі' });
    expect(created.project).toBe('Орлі');
    expect(repo.tasks.get(created.id)!.tagColor).toBe('amber');
  });

  it('rejects unknown projects and lists the real ones', async () => {
    await expect(ops.createTask(ctx, { title: 'x', project: 'Маркетинг' }))
      .rejects.toThrow(/Existing projects: AI officer, ДІС, Орлі/);
  });

  it('a time turns the reminder on by default', async () => {
    const a = await ops.createTask(ctx, { title: 'Дзвінок', date: '2026-11-18', time: '9:30' });
    expect(a.created).toMatchObject({ time: '09:30', remind: true, date: '2026-11-18' });
    const b = await ops.createTask(ctx, { title: 'Без нагадування', time: '15:00', remind: false });
    expect(b.created.remind).toBe(false);
  });

  it('validates dates and times', async () => {
    await expect(ops.createTask(ctx, { title: 'x', date: '2026-02-30' })).rejects.toBeInstanceOf(ToolError);
    await expect(ops.createTask(ctx, { title: 'x', date: '17.11.2026' })).rejects.toBeInstanceOf(ToolError);
    await expect(ops.createTask(ctx, { title: 'x', time: '25:00' })).rejects.toBeInstanceOf(ToolError);
  });

  it('creates recurring tasks with subtasks', async () => {
    const { created } = await ops.createTask(ctx, { title: 'SMM stories', project: 'ДІС', recurring: 'weekdays', subtasks: ['Фото', 'Текст'] });
    expect(created.recurring).toBe('weekdays');
    expect(created.subtasks.map(s => s.title)).toEqual(['Фото', 'Текст']);
  });
});

describe('list_tasks / get_agenda / search', () => {
  beforeEach(async () => {
    await repo.put(task({ id: 'old', title: 'Прострочена', date: d(2026, 11, 14) }));
    await repo.put(task({ id: 'olddone', title: 'Старa виконана', status: 'done', date: d(2026, 11, 13) }));
    await repo.put(task({ id: 'a', title: 'B о 14', date: d(2026, 11, 17), time: '14:00' }));
    await repo.put(task({ id: 'b', title: 'A о 9', date: d(2026, 11, 17), time: '09:00' }));
    await repo.put(task({ id: 'c', title: 'В роботі', date: d(2026, 11, 17), status: 'in_progress', project: 'Орлі', tagColor: 'amber' }));
    await repo.put(task({ id: 'tom', title: 'Завтра', date: d(2026, 11, 18), notes: 'про митні бази' }));
    await repo.put(task({ id: 'some', title: 'Колись', someday: true, date: d(2026, 11, 17) }));
  });

  it("lists today's tasks: in progress first, then by time; someday excluded", async () => {
    const r = await ops.listTasks(ctx, {});
    expect(r.tasks.map(t => t.id)).toEqual(['c', 'b', 'a']);
  });

  it('filters by range, project and status', async () => {
    expect((await ops.listTasks(ctx, { from: '2026-11-13', to: '2026-11-18', status: 'open' })).tasks.map(t => t.id))
      .toEqual(['old', 'c', 'b', 'a', 'tom']);
    expect((await ops.listTasks(ctx, { project: 'орлі' })).tasks.map(t => t.id)).toEqual(['c']);
    expect((await ops.listTasks(ctx, { include_someday: true })).tasks.map(t => t.id)).toContain('some');
    await expect(ops.listTasks(ctx, { from: '2026-11-18', to: '2026-11-17' })).rejects.toThrow(/before/);
  });

  it('agenda shows overdue open tasks and the next days', async () => {
    const r = await ops.getAgenda(ctx, { days: 2 });
    expect(r.today).toBe('2026-11-17');
    expect(r.overdue.map(t => t.id)).toEqual(['old']);
    expect(r.overdue[0].overdue).toBe(true);
    expect(r.days.map(x => [x.date, x.total])).toEqual([['2026-11-17', 3], ['2026-11-18', 1]]);
  });

  it('search matches notes, excludes done by default', async () => {
    expect((await ops.searchTasks(ctx, { query: 'митні' })).tasks.map(t => t.id)).toEqual(['tom']);
    expect((await ops.searchTasks(ctx, { query: 'виконана' })).count).toBe(0);
    expect((await ops.searchTasks(ctx, { query: 'виконана', include_done: true })).count).toBe(1);
  });
});

describe('update_task', () => {
  it('changes fields and clears time/priority', async () => {
    await repo.put(task({ id: 'x', time: '10:00', notifyAtTime: true, priority: 'high' }));
    const r = await ops.updateTask(ctx, { task_id: 'x', title: 'Нова назва', date: '2026-11-20', time: '', priority: 'none', project: 'Орлі' });
    expect(r.updated).toMatchObject({ title: 'Нова назва', date: '2026-11-20', time: null, remind: false, priority: null, project: 'Орлі' });
    expect(repo.tasks.get('x')!.tagColor).toBe('amber');
  });

  it('remind needs a time', async () => {
    await repo.put(task({ id: 'x' }));
    await expect(ops.updateTask(ctx, { task_id: 'x', remind: true })).rejects.toThrow(/needs a time/);
  });

  it('manages subtasks by title', async () => {
    await repo.put(task({ id: 'x', subtasks: [{ id: 's1', title: 'Фото', done: false }] }));
    let r = await ops.updateTask(ctx, { task_id: 'x', add_subtasks: ['Текст'], complete_subtasks: ['фото'] });
    expect(r.updated.subtasks.map(s => [s.title, s.done])).toEqual([['Фото', true], ['Текст', false]]);
    r = await ops.updateTask(ctx, { task_id: 'x', remove_subtasks: ['Фото'] });
    expect(r.updated.subtasks.map(s => s.title)).toEqual(['Текст']);
    await expect(ops.updateTask(ctx, { task_id: 'x', complete_subtasks: ['Нема'] })).rejects.toThrow(/not found/);
  });

  it('unknown id gives a helpful error', async () => {
    await expect(ops.updateTask(ctx, { task_id: 'nope', title: 'x' })).rejects.toThrow(/not found/);
  });
});

describe('recurrence (mirrors the app)', () => {
  it('completing a daily task creates exactly one copy for tomorrow', async () => {
    await repo.put(task({ id: 'p', title: 'SMM stories', recurring: true, recurringType: 'daily', subtasks: [{ id: 's', title: 'Фото', done: true }] }));
    const r = await ops.completeTask(ctx, 'p');
    expect(r.next_occurrence).toMatchObject({ date: '2026-11-18', status: 'todo', recurring: 'daily' });
    expect(r.next_occurrence!.subtasks.map(s => s.done)).toEqual([false]);
    const next = repo.tasks.get(r.next_occurrence!.id)!;
    expect(next.recurringParentId).toBe('p');
    expect(repo.tasks.get('p')!.recurringNextId).toBe(next.id);

    // completing again does nothing new
    const again = await ops.completeTask(ctx, 'p');
    expect(again.next_occurrence).toBeUndefined();
    expect(repo.tasks.size).toBe(2);
  });

  it('overdue weekly task schedules after today, keeping the weekday', async () => {
    await repo.put(task({ id: 'p', recurring: true, recurringType: 'weekly', date: d(2026, 11, 2) })); // Monday
    const r = await ops.completeTask(ctx, 'p');
    expect(r.next_occurrence!.date).toBe('2026-11-23');
  });

  it('skips when a copy (incl. legacy same-title copy) already exists that day', async () => {
    await repo.put(task({ id: 'p', title: 'SMM пост', recurring: true, recurringType: 'daily' }));
    await repo.put(task({ id: 'legacy', title: 'SMM пост', date: d(2026, 11, 18) }));
    const r = await ops.completeTask(ctx, 'p');
    expect(r.next_occurrence).toBeUndefined();
    expect(repo.tasks.size).toBe(2);
  });

  it('reopening removes the untouched copy', async () => {
    await repo.put(task({ id: 'p', recurring: true, recurringType: 'daily' }));
    const done = await ops.completeTask(ctx, 'p');
    const r = await ops.updateTask(ctx, { task_id: 'p', status: 'todo' });
    expect(r.removed_next_occurrence_id).toBe(done.next_occurrence!.id);
    expect(repo.tasks.size).toBe(1);
    expect(repo.tasks.get('p')!.recurringNextId).toBeUndefined();
  });

  it('stop_recurring stops the series and deletes future open copies', async () => {
    await repo.put(task({ id: 'p', date: d(2026, 11, 10), status: 'done', recurring: true, recurringType: 'daily', recurringNextId: 'c1' }));
    await repo.put(task({ id: 'c1', date: d(2026, 11, 17), recurring: true, recurringType: 'daily', recurringParentId: 'p' }));
    await repo.put(task({ id: 'c2', date: d(2026, 11, 19), recurring: true, recurringType: 'daily', recurringParentId: 'p' }));
    await repo.put(task({ id: 'c3', date: d(2026, 11, 20), status: 'done', recurring: true, recurringType: 'daily', recurringParentId: 'p' }));
    const r = await ops.stopRecurring(ctx, 'c1');
    expect(r.future_copies_deleted).toBe(1);
    expect(repo.tasks.has('c2')).toBe(false);
    for (const id of ['p', 'c1', 'c3']) expect(repo.tasks.get(id)!.recurring).toBeFalsy();
    // completing the remaining copy no longer spawns
    expect((await ops.completeTask(ctx, 'c1')).next_occurrence).toBeUndefined();
  });
});

describe('reschedule / delete', () => {
  it('moves several tasks at once and un-somedays them', async () => {
    await repo.put(task({ id: 'a' }));
    await repo.put(task({ id: 'b', someday: true }));
    const r = await ops.rescheduleTasks(ctx, { task_ids: ['a', 'b'], date: '2026-11-23' });
    expect(r.tasks.map(t => [t.date, t.someday])).toEqual([['2026-11-23', false], ['2026-11-23', false]]);
  });

  it('deletes', async () => {
    await repo.put(task({ id: 'a', title: 'Видалити' }));
    expect((await ops.deleteTask(ctx, 'a')).deleted.title).toBe('Видалити');
    expect(repo.tasks.size).toBe(0);
  });
});
