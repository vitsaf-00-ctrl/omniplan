import type { Task } from './types.js';

// Mirrors taskToDoc() / docToTask() in src/lib/taskFirestore.ts, but for the
// Admin SDK: Dates are written as-is (stored as Timestamps) and Timestamps are
// read via .toDate(). Keep the field list in sync with the client.

const STATUSES = new Set(['todo', 'in_progress', 'done']);
const COLORS = new Set(['blue', 'indigo', 'purple', 'emerald', 'amber', 'rose', 'slate']);
const PRIORITIES = new Set(['high', 'medium', 'low']);

function toDate(v: unknown): Date {
  const d = v && typeof (v as { toDate?: unknown }).toDate === 'function'
    ? (v as { toDate(): Date }).toDate()
    : v instanceof Date ? v
    : v ? new Date(v as string) : new Date();
  return isNaN(d.getTime()) ? new Date() : d;
}

export function taskToData(task: Task): Record<string, unknown> {
  return {
    title: task.title,
    project: task.project,
    status: task.status,
    date: new Date(task.date),
    someday: task.someday ?? false,
    tagColor: task.tagColor,
    notes: task.notes ?? '',
    recurring: task.recurring ?? false,
    recurringType: task.recurringType || null,
    recurringParentId: task.recurringParentId || null,
    recurringNextId: task.recurringNextId || null,
    order: task.order ?? null,
    notifyAtTime: task.notifyAtTime ?? false,
    googleCalendarSync: task.googleCalendarSync ?? false,
    subtasks: (task.subtasks ?? []).map(st => ({
      id: st.id,
      title: st.title,
      done: st.done,
      date: st.date ? new Date(st.date) : null,
    })),
    createdAt: new Date(task.createdAt),
    priority: task.priority ?? null,
    time: task.time ?? '',
  };
}

export function dataToTask(id: string, raw: Record<string, unknown>): Task {
  const status = raw.status as string;
  const color = raw.tagColor as string;
  const priority = raw.priority as string;
  return {
    id,
    title: String(raw.title ?? ''),
    project: String(raw.project ?? ''),
    status: STATUSES.has(status) ? (status as Task['status']) : 'todo',
    date: toDate(raw.date),
    someday: Boolean(raw.someday),
    tagColor: COLORS.has(color) ? (color as Task['tagColor']) : 'slate',
    notes: (raw.notes as string) || undefined,
    recurring: (raw.recurring as boolean) || undefined,
    recurringType: (raw.recurringType as string) || undefined,
    recurringParentId: (raw.recurringParentId as string) || undefined,
    recurringNextId: (raw.recurringNextId as string) || undefined,
    order: typeof raw.order === 'number' ? raw.order : undefined,
    notifyAtTime: (raw.notifyAtTime as boolean) || undefined,
    googleCalendarSync: (raw.googleCalendarSync as boolean) || undefined,
    subtasks: ((raw.subtasks as unknown[]) ?? []).map(st => {
      const s = st as Record<string, unknown>;
      return { id: String(s.id), title: String(s.title), done: Boolean(s.done), date: s.date ? toDate(s.date) : undefined };
    }),
    createdAt: toDate(raw.createdAt),
    priority: PRIORITIES.has(priority) ? (priority as Task['priority']) : undefined,
    time: (raw.time as string) || undefined,
  };
}
