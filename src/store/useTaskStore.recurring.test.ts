import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/taskFirestore', () => ({
  fsSetTask: vi.fn(() => Promise.resolve()),
  fsDeleteTask: vi.fn(() => Promise.resolve()),
  fsBatchSync: vi.fn(() => Promise.resolve()),
}));

import { useTaskStore, Task } from './useTaskStore';

const today = () => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; };
const addDays = (base: Date, n: number) => { const x = new Date(base); x.setDate(x.getDate() + n); return x; };
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function seed(task: Partial<Task>): string {
  return useTaskStore.getState().addTask({
    title: 'SMM stories', project: 'ДІС', status: 'todo', date: today(), tagColor: 'blue',
    ...task,
  } as Omit<Task, 'id' | 'createdAt'>);
}

const tasks = () => useTaskStore.getState().tasks;

describe('recurring: next copy on completion', () => {
  beforeEach(() => useTaskStore.setState({ tasks: [], userId: null }));

  it('completing a daily task creates exactly one copy for tomorrow', () => {
    const id = seed({ recurring: true, recurringType: 'daily' });
    useTaskStore.getState().moveTask(id, 'done');

    expect(tasks()).toHaveLength(2);
    const next = tasks().find(t => t.id !== id)!;
    expect(sameDay(new Date(next.date), addDays(today(), 1))).toBe(true);
    expect(next.status).toBe('todo');
    expect(next.recurringParentId).toBe(id);
    expect(tasks().find(t => t.id === id)!.recurringNextId).toBe(next.id);
  });

  it('copies keep the original parent id down the chain', () => {
    const id = seed({ recurring: true, recurringType: 'daily' });
    useTaskStore.getState().moveTask(id, 'done');
    const second = tasks().find(t => t.id !== id)!;
    useTaskStore.getState().moveTask(second.id, 'done');
    const third = tasks().find(t => t.id !== id && t.id !== second.id)!;
    expect(third.recurringParentId).toBe(id);
  });

  it('does not create a duplicate when a copy already exists on that day', () => {
    const id = seed({ recurring: true, recurringType: 'daily' });
    seed({ date: addDays(today(), 1) }); // same title/project — legacy pre-generated copy
    useTaskStore.getState().moveTask(id, 'done');
    expect(tasks()).toHaveLength(2);
  });

  it('un-completing removes the untouched copy', () => {
    const id = seed({ recurring: true, recurringType: 'weekly' });
    useTaskStore.getState().moveTask(id, 'done');
    useTaskStore.getState().moveTask(id, 'todo');
    expect(tasks()).toHaveLength(1);
    expect(tasks()[0].recurringNextId).toBeUndefined();
  });

  it('un-completing keeps the copy if it was already started', () => {
    const id = seed({ recurring: true, recurringType: 'weekly' });
    useTaskStore.getState().moveTask(id, 'done');
    const next = tasks().find(t => t.id !== id)!;
    useTaskStore.getState().moveTask(next.id, 'in_progress');
    useTaskStore.getState().moveTask(id, 'todo');
    expect(tasks()).toHaveLength(2);
  });

  it('marking done via updateTask (modal / context menu) also spawns', () => {
    const id = seed({ recurring: true, recurringType: 'monthly' });
    useTaskStore.getState().updateTask(id, { status: 'done' });
    expect(tasks()).toHaveLength(2);
  });

  it('turning recurrence on and completing in the same save spawns', () => {
    const id = seed({});
    useTaskStore.getState().updateTask(id, { status: 'done', recurring: true, recurringType: 'daily' });
    expect(tasks()).toHaveLength(2);
  });

  it('non-recurring and someday tasks never spawn', () => {
    const a = seed({});
    const b = seed({ title: 'B', recurring: true, recurringType: 'daily', someday: true });
    useTaskStore.getState().moveTask(a, 'done');
    useTaskStore.getState().moveTask(b, 'done');
    expect(tasks()).toHaveLength(2);
  });

  it('saving an already-done task again does not spawn a second copy', () => {
    const id = seed({ recurring: true, recurringType: 'daily' });
    useTaskStore.getState().moveTask(id, 'done');
    useTaskStore.getState().updateTask(id, { status: 'done', notes: 'x' });
    expect(tasks()).toHaveLength(2);
  });
});
