import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import * as ops from './ops.js';
import { ToolError } from './types.js';
import { TIME_ZONE } from './tz.js';

const INSTRUCTIONS = `OmniPlan is the user's personal task planner (UI language: Ukrainian).
- Time zone: ${TIME_ZONE}. Dates are YYYY-MM-DD, times are HH:MM (24h). Call get_agenda first if you need today's date.
- Each task belongs to an existing project (list_projects). Don't invent projects; if unsure, ask the user.
- Statuses: todo = "Заплановано", in_progress = "В процесі", done = "Готово".
- Recurring tasks: completing one automatically creates the next occurrence. To stop a series use stop_recurring.
- remind=true makes the OmniPlan app show a browser notification at the task's time (the app must be open).
- To change several tasks, first find their ids with list_tasks / search_tasks / get_agenda.
- Reply to the user in their language (usually Ukrainian).`;

const status = z.enum(['todo', 'in_progress', 'done']);
const priority = z.enum(['high', 'medium', 'low']);
const recurring = z.enum(['daily', 'weekdays', 'weekly', 'monthly']);
const ymd = z.string().describe('Date as YYYY-MM-DD');
const hhmm = z.string().describe('Time as HH:MM (24h)');

type Result = { content: { type: 'text'; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };

async function run(fn: () => Promise<object>): Promise<Result> {
  try {
    const data = await fn();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }], structuredContent: data as Record<string, unknown> };
  } catch (e) {
    const msg = e instanceof ToolError ? e.message : 'Internal error while accessing OmniPlan. Try again.';
    if (!(e instanceof ToolError)) console.error('[mcp] tool error', e);
    return { content: [{ type: 'text', text: msg }], isError: true };
  }
}

const READ = { readOnlyHint: true, openWorldHint: false } as const;
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: false } as const;

export function buildMcpServer(ctx: ops.OpsContext): McpServer {
  const server = new McpServer({ name: 'omniplan', title: 'OmniPlan', version: '1.0.0' }, { instructions: INSTRUCTIONS });

  server.registerTool('get_agenda', {
    title: 'Agenda: today, upcoming days, overdue',
    description: "Today's date and weekday, overdue open tasks, and tasks for today plus the next days. Start here for questions like 'what do I have today/this week' or 'what is overdue'.",
    inputSchema: { days: z.number().int().min(1).max(14).optional().describe('How many days starting today (default 1, max 14)') },
    annotations: READ,
  }, args => run(() => ops.getAgenda(ctx, args)));

  server.registerTool('list_tasks', {
    title: 'List tasks by date range',
    description: 'Tasks between two dates (inclusive), optionally filtered by project and status. Defaults to today. Max range 92 days.',
    inputSchema: {
      from: ymd.optional().describe('Start date YYYY-MM-DD (default: today)'),
      to: ymd.optional().describe('End date YYYY-MM-DD, inclusive (default: same as from)'),
      project: z.string().optional().describe('Project name'),
      status: z.enum(['todo', 'in_progress', 'done', 'open']).optional().describe('"open" = not done'),
      include_someday: z.boolean().optional().describe('Also include undated "someday" tasks'),
      limit: z.number().int().min(1).max(500).optional(),
    },
    annotations: READ,
  }, args => run(() => ops.listTasks(ctx, args)));

  server.registerTool('search_tasks', {
    title: 'Search tasks',
    description: 'Find tasks by text in title, notes, project or subtasks (case-insensitive). Excludes done tasks unless include_done.',
    inputSchema: {
      query: z.string().min(1),
      include_done: z.boolean().optional(),
      limit: z.number().int().min(1).max(100).optional(),
    },
    annotations: READ,
  }, args => run(() => ops.searchTasks(ctx, args)));

  server.registerTool('get_task', {
    title: 'Get one task',
    description: 'Full details of a task by id.',
    inputSchema: { task_id: z.string() },
    annotations: READ,
  }, ({ task_id }) => run(() => ops.getTask(ctx, task_id)));

  server.registerTool('list_projects', {
    title: 'List projects',
    description: 'All project names. Tasks must use one of these.',
    inputSchema: {},
    annotations: READ,
  }, () => run(() => ops.listProjects(ctx)));

  server.registerTool('create_task', {
    title: 'Create a task',
    description: 'Create a task. Without date it goes to today. A time turns on a reminder notification by default (remind=false to disable).',
    inputSchema: {
      title: z.string().min(1),
      date: ymd.optional().describe('YYYY-MM-DD (default: today)'),
      time: hhmm.optional(),
      remind: z.boolean().optional().describe('Browser notification at the time (default true when time is set)'),
      project: z.string().optional().describe('Existing project name (default: first project)'),
      priority: priority.optional(),
      notes: z.string().optional(),
      recurring: recurring.optional().describe('Repeat: daily, weekdays, weekly or monthly'),
      subtasks: z.array(z.string()).optional(),
      someday: z.boolean().optional().describe('Undated "someday" task'),
      status: status.optional(),
    },
    annotations: WRITE,
  }, args => run(() => ops.createTask(ctx, args)));

  server.registerTool('update_task', {
    title: 'Update a task',
    description: 'Change any fields of a task: title, date, time, reminder, project, priority, notes, status, recurrence, subtasks. Omitted fields stay unchanged. time "" removes the time; priority "none" and recurring "none" clear them; notes "" clears notes. Setting status done on a recurring task creates its next occurrence.',
    inputSchema: {
      task_id: z.string(),
      title: z.string().optional(),
      date: ymd.optional(),
      someday: z.boolean().optional(),
      time: z.string().optional().describe('HH:MM, or "" to remove'),
      remind: z.boolean().optional(),
      project: z.string().optional(),
      priority: z.enum(['high', 'medium', 'low', 'none']).optional(),
      notes: z.string().optional(),
      status: status.optional(),
      recurring: z.enum(['daily', 'weekdays', 'weekly', 'monthly', 'none']).optional(),
      add_subtasks: z.array(z.string()).optional(),
      complete_subtasks: z.array(z.string()).optional().describe('Subtask ids or exact titles'),
      reopen_subtasks: z.array(z.string()).optional().describe('Subtask ids or exact titles'),
      remove_subtasks: z.array(z.string()).optional().describe('Subtask ids or exact titles'),
    },
    annotations: WRITE,
  }, args => run(() => ops.updateTask(ctx, args)));

  server.registerTool('complete_task', {
    title: 'Mark a task done',
    description: 'Mark a task as done. For recurring tasks the next occurrence is created automatically.',
    inputSchema: { task_id: z.string() },
    annotations: { ...WRITE, idempotentHint: true },
  }, ({ task_id }) => run(() => ops.completeTask(ctx, task_id)));

  server.registerTool('reschedule_tasks', {
    title: 'Move tasks to a date',
    description: 'Move one or more tasks to another date in one step.',
    inputSchema: { task_ids: z.array(z.string()).min(1).max(100), date: ymd },
    annotations: { ...WRITE, idempotentHint: true },
  }, args => run(() => ops.rescheduleTasks(ctx, args)));

  server.registerTool('stop_recurring', {
    title: 'Stop a recurring series',
    description: 'Stop repeating: turns off recurrence for the whole series and deletes its future not-done copies. Past and done tasks are kept.',
    inputSchema: { task_id: z.string().describe('Any task of the series') },
    annotations: DESTRUCTIVE,
  }, ({ task_id }) => run(() => ops.stopRecurring(ctx, task_id)));

  server.registerTool('delete_task', {
    title: 'Delete a task',
    description: 'Permanently delete a task. Confirm with the user first unless they clearly asked to delete it.',
    inputSchema: { task_id: z.string() },
    annotations: DESTRUCTIVE,
  }, ({ task_id }) => run(() => ops.deleteTask(ctx, task_id)));

  return server;
}
