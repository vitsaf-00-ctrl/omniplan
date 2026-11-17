import { randomUUID } from 'node:crypto';
import { nextInstanceDate, normalizeRecurringType, type RecurringType } from '../../src/utils/recurrence.js';
import { addDays, parseTime, parseYmd, startOfDay, WEEKDAYS_UK, ymd } from './dates.js';
import { ToolError, type Priority, type ProjectRecord, type SubTask, type Task, type TaskRepo, type TaskStatus } from './types.js';

export interface OpsContext {
  repo: TaskRepo;
  now: () => Date;
}

const STATUS_LABEL: Record<TaskStatus, string> = { todo: 'Заплановано', in_progress: 'В процесі', done: 'Готово' };
const STATUS_ORDER: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };
const MAX_RANGE_DAYS = 92;

// ─── Views ────────────────────────────────────────────────────────────────────

export interface TaskView {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  status_label: string;
  date: string | null;
  weekday: string | null;
  someday: boolean;
  time: string | null;
  remind: boolean;
  priority: Priority | null;
  recurring: RecurringType | null;
  overdue: boolean;
  notes: string | null;
  subtasks: { id: string; title: string; done: boolean }[];
}

export function toView(t: Task, today: Date): TaskView {
  const d = new Date(t.date);
  return {
    id: t.id,
    title: t.title,
    project: t.project,
    status: t.status,
    status_label: STATUS_LABEL[t.status],
    date: t.someday ? null : ymd(d),
    weekday: t.someday ? null : WEEKDAYS_UK[d.getDay()],
    someday: !!t.someday,
    time: t.time || null,
    remind: !!(t.notifyAtTime && t.time),
    priority: t.priority ?? null,
    recurring: t.recurring ? normalizeRecurringType(t.recurringType) : null,
    overdue: t.status !== 'done' && !t.someday && startOfDay(d) < today,
    notes: t.notes || null,
    subtasks: (t.subtasks ?? []).map(s => ({ id: s.id, title: s.title, done: s.done })),
  };
}

function sortTasks(a: Task, b: Task): number {
  const da = startOfDay(new Date(a.date)).getTime(), db = startOfDay(new Date(b.date)).getTime();
  if (da !== db) return da - db;
  if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  const ta = a.time || '99:99', tb = b.time || '99:99';
  if (ta !== tb) return ta < tb ? -1 : 1;
  return (a.order ?? 1e9) - (b.order ?? 1e9);
}

const todayOf = (ctx: OpsContext) => startOfDay(ctx.now());

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function resolveProject(ctx: OpsContext, name: string | undefined): Promise<ProjectRecord> {
  const projects = await ctx.repo.listProjects();
  if (projects.length === 0) throw new ToolError('No projects found. Create a project in OmniPlan first.');
  if (!name || !name.trim()) return projects[0];
  const q = name.trim().replace(/^#/, '').toLowerCase();
  const exact = projects.find(p => p.name.toLowerCase() === q);
  if (exact) return exact;
  const partial = projects.filter(p => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
  if (partial.length === 1) return partial[0];
  throw new ToolError(
    `Project "${name}" not found${partial.length > 1 ? ' (ambiguous)' : ''}. Existing projects: ${projects.map(p => p.name).join(', ')}.`,
  );
}

export async function listProjects(ctx: OpsContext) {
  const projects = await ctx.repo.listProjects();
  return { projects: projects.map(p => ({ name: p.name, color: p.color })) };
}

// ─── Reading ──────────────────────────────────────────────────────────────────

export interface ListInput {
  from?: string; to?: string; project?: string;
  status?: TaskStatus | 'open'; include_someday?: boolean; limit?: number;
}

export async function listTasks(ctx: OpsContext, input: ListInput) {
  const today = todayOf(ctx);
  const from = input.from ? parseYmd(input.from, 'from') : today;
  const to = input.to ? parseYmd(input.to, 'to') : from;
  if (to < from) throw new ToolError('"to" must not be before "from"');
  if ((to.getTime() - from.getTime()) / 86_400_000 > MAX_RANGE_DAYS) {
    throw new ToolError(`Date range is limited to ${MAX_RANGE_DAYS} days`);
  }
  let tasks = (await ctx.repo.listBetween(from, addDays(to, 1))).filter(t => !t.someday);
  if (input.include_someday) tasks = tasks.concat((await ctx.repo.listAll()).filter(t => t.someday));
  if (input.project) {
    const p = await resolveProject(ctx, input.project);
    tasks = tasks.filter(t => t.project === p.name);
  }
  if (input.status === 'open') tasks = tasks.filter(t => t.status !== 'done');
  else if (input.status) tasks = tasks.filter(t => t.status === input.status);
  tasks.sort(sortTasks);
  const limit = input.limit ?? 200;
  return {
    today: ymd(today),
    from: ymd(from),
    to: ymd(to),
    count: tasks.length,
    truncated: tasks.length > limit,
    tasks: tasks.slice(0, limit).map(t => toView(t, today)),
  };
}

export async function getAgenda(ctx: OpsContext, input: { days?: number }) {
  const now = ctx.now();
  const today = startOfDay(now);
  const days = Math.min(Math.max(input.days ?? 1, 1), 14);
  const [past, upcoming] = await Promise.all([
    ctx.repo.listBetween(new Date(2000, 0, 1), today),
    ctx.repo.listBetween(today, addDays(today, days)),
  ]);
  const overdue = past.filter(t => !t.someday && t.status !== 'done').sort(sortTasks);
  const byDay = Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i);
    const tasks = upcoming.filter(t => !t.someday && ymd(new Date(t.date)) === ymd(day)).sort(sortTasks);
    return {
      date: ymd(day),
      weekday: WEEKDAYS_UK[day.getDay()],
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      tasks: tasks.map(t => toView(t, today)),
    };
  });
  return {
    now: `${ymd(now)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    today: ymd(today),
    weekday: WEEKDAYS_UK[today.getDay()],
    overdue: overdue.map(t => toView(t, today)),
    days: byDay,
  };
}

export async function searchTasks(ctx: OpsContext, input: { query: string; include_done?: boolean; limit?: number }) {
  const q = input.query.trim().toLowerCase();
  if (!q) throw new ToolError('query must not be empty');
  const today = todayOf(ctx);
  const hits = (await ctx.repo.listAll()).filter(t =>
    (input.include_done || t.status !== 'done') &&
    [t.title, t.notes ?? '', t.project, ...(t.subtasks ?? []).map(s => s.title)].some(s => s.toLowerCase().includes(q)),
  );
  hits.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const limit = input.limit ?? 30;
  return { count: hits.length, truncated: hits.length > limit, tasks: hits.slice(0, limit).map(t => toView(t, today)) };
}

async function mustGet(ctx: OpsContext, id: string): Promise<Task> {
  const t = await ctx.repo.get(id);
  if (!t) throw new ToolError(`Task "${id}" not found. Use list_tasks or search_tasks to find the id.`);
  return t;
}

export async function getTask(ctx: OpsContext, id: string) {
  return { task: toView(await mustGet(ctx, id), todayOf(ctx)) };
}

// ─── Recurrence ("next copy on completion", mirrors useTaskStore) ─────────────

interface TransitionResult {
  /** Fields to set on the task whose status changed. */
  patch: Partial<Task>;
  spawned?: Task;
  removedId?: string;
}

async function recurringTransition(ctx: OpsContext, prev: Task, newStatus: TaskStatus): Promise<TransitionResult> {
  if (prev.status === newStatus) return { patch: {} };

  if (newStatus === 'done' && prev.recurring && !prev.someday) {
    const parentId = prev.recurringParentId || prev.id;
    const nextDate = nextInstanceDate(new Date(prev.date), normalizeRecurringType(prev.recurringType), ctx.now());
    const dayStart = startOfDay(nextDate);
    const sameDay = await ctx.repo.listBetween(dayStart, addDays(dayStart, 1));
    const existing = sameDay.find(t =>
      t.id !== prev.id && !t.someday &&
      ((t.recurringParentId || t.id) === parentId || (t.title === prev.title && t.project === prev.project)),
    );
    if (existing) return { patch: {} };
    const next: Task = {
      ...prev,
      id: `rec_${randomUUID()}`,
      date: nextDate,
      status: 'todo',
      someday: false,
      createdAt: ctx.now(),
      recurringParentId: parentId,
      recurringNextId: undefined,
      order: undefined,
      subtasks: prev.subtasks?.length
        ? prev.subtasks.map(st => ({ id: `sub_${randomUUID()}`, title: st.title, done: false }))
        : undefined,
    };
    return { patch: { recurringNextId: next.id }, spawned: next };
  }

  if (prev.status === 'done' && prev.recurringNextId) {
    const next = await ctx.repo.get(prev.recurringNextId);
    const untouched = next && next.status === 'todo' && !next.subtasks?.some(st => st.done);
    return { patch: { recurringNextId: undefined }, removedId: untouched ? next.id : undefined };
  }
  return { patch: {} };
}

// ─── Writing ──────────────────────────────────────────────────────────────────

const RECURRING_VALUES = ['daily', 'weekdays', 'weekly', 'monthly'] as const;

export interface CreateInput {
  title: string; date?: string; someday?: boolean; time?: string; remind?: boolean;
  project?: string; priority?: Priority; notes?: string;
  recurring?: RecurringType; subtasks?: string[]; status?: TaskStatus;
}

export async function createTask(ctx: OpsContext, input: CreateInput) {
  const title = input.title.trim();
  if (!title) throw new ToolError('title must not be empty');
  const today = todayOf(ctx);
  const project = await resolveProject(ctx, input.project);
  const time = input.time !== undefined ? parseTime(input.time) : '';
  const someday = !!input.someday;
  const task: Task = {
    id: `task_${randomUUID()}`,
    title,
    project: project.name,
    tagColor: project.color,
    status: input.status ?? 'todo',
    date: someday ? today : input.date ? parseYmd(input.date) : today,
    someday,
    createdAt: ctx.now(),
    time: time || undefined,
    // A time usually means "remind me then" — default on unless told otherwise.
    notifyAtTime: time ? (input.remind ?? true) : undefined,
    priority: input.priority,
    notes: input.notes?.trim() || undefined,
    recurring: input.recurring ? true : undefined,
    recurringType: input.recurring,
    subtasks: input.subtasks?.filter(s => s.trim()).map(s => ({ id: `sub_${randomUUID()}`, title: s.trim(), done: false })),
  };
  await ctx.repo.put(task);
  return { created: toView(task, today) };
}

export interface UpdateInput {
  task_id: string;
  title?: string; date?: string; someday?: boolean; time?: string; remind?: boolean;
  project?: string; priority?: Priority | 'none'; notes?: string; status?: TaskStatus;
  recurring?: RecurringType | 'none';
  add_subtasks?: string[]; complete_subtasks?: string[]; reopen_subtasks?: string[]; remove_subtasks?: string[];
}

function matchSubtasks(subtasks: SubTask[], refs: string[], field: string): Set<string> {
  const ids = new Set<string>();
  for (const ref of refs) {
    const r = ref.trim().toLowerCase();
    const hit = subtasks.find(s => s.id === ref) ?? subtasks.find(s => s.title.toLowerCase() === r);
    if (!hit) throw new ToolError(`${field}: subtask "${ref}" not found. Existing: ${subtasks.map(s => `"${s.title}"`).join(', ') || 'none'}`);
    ids.add(hit.id);
  }
  return ids;
}

export async function updateTask(ctx: OpsContext, input: UpdateInput) {
  const prev = await mustGet(ctx, input.task_id);
  const today = todayOf(ctx);
  const next: Task = { ...prev, subtasks: prev.subtasks ? [...prev.subtasks] : undefined };

  if (input.title !== undefined) {
    if (!input.title.trim()) throw new ToolError('title must not be empty');
    next.title = input.title.trim();
  }
  if (input.date !== undefined) { next.date = parseYmd(input.date); next.someday = false; }
  if (input.someday !== undefined) next.someday = input.someday;
  if (input.time !== undefined) {
    const t = parseTime(input.time);
    next.time = t || undefined;
    if (!t) next.notifyAtTime = undefined;
    else if (input.remind === undefined && !prev.time) next.notifyAtTime = true;
  }
  if (input.remind !== undefined) {
    if (input.remind && !next.time) throw new ToolError('remind needs a time (HH:MM) on the task');
    next.notifyAtTime = input.remind || undefined;
  }
  if (input.project !== undefined) {
    const p = await resolveProject(ctx, input.project);
    next.project = p.name;
    next.tagColor = p.color;
  }
  if (input.priority !== undefined) next.priority = input.priority === 'none' ? undefined : input.priority;
  if (input.notes !== undefined) next.notes = input.notes.trim() || undefined;
  if (input.recurring !== undefined) {
    if (input.recurring === 'none') { next.recurring = undefined; next.recurringType = undefined; }
    else { next.recurring = true; next.recurringType = input.recurring; }
  }

  let subtasks = next.subtasks ?? [];
  if (input.complete_subtasks?.length) {
    const ids = matchSubtasks(subtasks, input.complete_subtasks, 'complete_subtasks');
    subtasks = subtasks.map(s => ids.has(s.id) ? { ...s, done: true } : s);
  }
  if (input.reopen_subtasks?.length) {
    const ids = matchSubtasks(subtasks, input.reopen_subtasks, 'reopen_subtasks');
    subtasks = subtasks.map(s => ids.has(s.id) ? { ...s, done: false } : s);
  }
  if (input.remove_subtasks?.length) {
    const ids = matchSubtasks(subtasks, input.remove_subtasks, 'remove_subtasks');
    subtasks = subtasks.filter(s => !ids.has(s.id));
  }
  if (input.add_subtasks?.length) {
    subtasks = subtasks.concat(input.add_subtasks.filter(s => s.trim())
      .map(s => ({ id: `sub_${randomUUID()}`, title: s.trim(), done: false })));
  }
  next.subtasks = subtasks.length ? subtasks : undefined;

  let spawned: Task | undefined;
  let removedId: string | undefined;
  if (input.status !== undefined && input.status !== prev.status) {
    // Evaluate recurrence with the new settings but the old status (same as the app).
    const r = await recurringTransition(ctx, { ...next, status: prev.status }, input.status);
    Object.assign(next, r.patch);
    next.status = input.status;
    spawned = r.spawned;
    removedId = r.removedId;
  }

  if (spawned) await ctx.repo.put(spawned);
  await ctx.repo.put(next);
  if (removedId) await ctx.repo.remove(removedId);

  return {
    updated: toView(next, today),
    ...(spawned ? { next_occurrence: toView(spawned, today) } : {}),
    ...(removedId ? { removed_next_occurrence_id: removedId } : {}),
  };
}

export async function completeTask(ctx: OpsContext, taskId: string) {
  return updateTask(ctx, { task_id: taskId, status: 'done' });
}

export async function rescheduleTasks(ctx: OpsContext, input: { task_ids: string[]; date: string }) {
  if (!input.task_ids.length) throw new ToolError('task_ids must not be empty');
  const date = parseYmd(input.date);
  const today = todayOf(ctx);
  const tasks = await Promise.all(input.task_ids.map(id => mustGet(ctx, id)));
  for (const t of tasks) await ctx.repo.put({ ...t, date, someday: false });
  return { moved: tasks.length, date: ymd(date), tasks: tasks.map(t => toView({ ...t, date, someday: false }, today)) };
}

export async function deleteTask(ctx: OpsContext, taskId: string) {
  const t = await mustGet(ctx, taskId);
  await ctx.repo.remove(t.id);
  return { deleted: toView(t, todayOf(ctx)) };
}

/** Same as "Зупинити повторення" in the app: stops the whole series. */
export async function stopRecurring(ctx: OpsContext, taskId: string) {
  const task = await mustGet(ctx, taskId);
  const today = todayOf(ctx);
  const parentId = task.recurringParentId || task.id;
  const [parent, children] = await Promise.all([ctx.repo.get(parentId), ctx.repo.listByParent(parentId)]);
  const series = new Map<string, Task>();
  for (const t of [parent, ...children, task]) if (t) series.set(t.id, t);

  const deleted: string[] = [];
  let stopped = 0;
  for (const t of series.values()) {
    const isFutureOpen = t.id !== task.id && startOfDay(new Date(t.date)) > today && t.status !== 'done';
    if (isFutureOpen) { await ctx.repo.remove(t.id); deleted.push(t.id); }
    else if (t.recurring || t.recurringNextId) {
      await ctx.repo.put({ ...t, recurring: undefined, recurringNextId: undefined });
      stopped++;
    }
  }
  return { stopped_series_of: task.title, tasks_updated: stopped, future_copies_deleted: deleted.length };
}

export { RECURRING_VALUES };
