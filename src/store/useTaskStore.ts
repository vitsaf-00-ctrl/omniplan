import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import type { TemporalState } from 'zundo';
import { fsSetTask, fsDeleteTask, fsBatchSync } from '../lib/taskFirestore';
import { useToastStore } from './useToastStore';
import { useSyncStore } from './useSyncStore';
import { nextInstanceDate, normalizeRecurringType, isSameDay } from '../utils/recurrence';

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TagColor = 'blue' | 'indigo' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
  date?: Date;
}

export interface Task {
  id: string;
  title: string;
  project: string;
  status: TaskStatus;
  date: Date;
  someday?: boolean;
  tagColor: TagColor;
  notes?: string;
  recurring?: boolean;
  recurringType?: string;
  recurringParentId?: string;
  /** Id of the instance created when this one was completed (for undo). */
  recurringNextId?: string;
  order?: number;
  notifyAtTime?: boolean;
  googleCalendarSync?: boolean;
  subtasks?: SubTask[];
  createdAt: Date;
  priority?: Priority;
  time?: string;
}

export interface Project { id: string; name: string; color: TagColor; }

const PC: Record<string, TagColor> = {
  'ДІС':'blue','AI officer':'indigo','Трейд':'purple','Навчання':'emerald',
  'Орлі':'amber','Хайфом':'blue','ACAT':'emerald','ЯС':'rose','Кабін':'slate',
  'Моє':'emerald','Розробка':'indigo',
};
// ⚠️ Seed/default list only. For rendering project pickers, filters or chips
// ALWAYS read the live list from the store: `useTaskStore(s => s.projects)`,
// otherwise user-added projects (Firestore) won't show up. See Sidebar/TaskModal.
export const PROJECTS: Project[] = [
  {id:'ai-officer',name:'AI officer',color:'indigo'},
  {id:'dis',name:'ДІС',color:'blue'},
  {id:'haifom',name:'Хайфом',color:'blue'},
  {id:'acat',name:'ACAT',color:'emerald'},
  {id:'treid',name:'Трейд',color:'purple'},
  {id:'orli',name:'Орлі',color:'amber'},
  {id:'yas',name:'ЯС',color:'rose'},
  {id:'kabin',name:'Кабін',color:'slate'},
  {id:'moye',name:'Моє',color:'emerald'},
  {id:'navchannia',name:'Навчання',color:'emerald'},
  {id:'rozrobka',name:'Розробка',color:'indigo'},
];
export function getProjectColor(p: string): TagColor { return PC[p] || 'slate'; }

const uid = (prefix = '') => `${prefix}${crypto.randomUUID()}`;

function syncTask(get: () => TaskStore, taskId: string): void {
  const attempt = () => {
    const { userId, tasks } = get();
    if (!userId) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    useSyncStore.getState().markSaving(taskId);
    fsSetTask(userId, task)
      .then(() => useSyncStore.getState().markSaved(taskId))
      .catch(e => {
        console.error('[Firestore] syncTask error', e);
        useSyncStore.getState().markError(taskId, attempt);
        useToastStore.getState().addToast({
          type: 'error',
          message: 'Помилка збереження. Перевірте з\'єднання.',
          action: { label: 'Повторити', onClick: attempt },
        });
      });
  };
  attempt();
}

function syncDelete(userId: string, taskId: string): void {
  const attempt = () => {
    useSyncStore.getState().markSaving(taskId);
    fsDeleteTask(userId, taskId)
      .then(() => useSyncStore.getState().markSaved(taskId))
      .catch(e => {
        console.error('[Firestore] syncDelete error', e);
        useSyncStore.getState().markError(taskId, attempt);
        useToastStore.getState().addToast({
          type: 'error',
          message: 'Помилка видалення. Перевірте з\'єднання.',
          action: { label: 'Повторити', onClick: attempt },
        });
      });
  };
  attempt();
}

type SetTasks = (fn: (s: TaskStore) => Partial<TaskStore>) => void;

/**
 * Recurring "next copy on completion": called after a task's status changed.
 * - not done → done on a recurring task: create exactly one next instance.
 * - done → not done: remove the instance created on completion, if untouched.
 */
function handleRecurringTransition(get: () => TaskStore, set: SetTasks, prev: Task, newStatus: TaskStatus): void {
  if (prev.status === newStatus) return;

  if (newStatus === 'done' && prev.recurring && !prev.someday) {
    const parentId = prev.recurringParentId || prev.id;
    const nextDate = nextInstanceDate(new Date(prev.date), normalizeRecurringType(prev.recurringType));
    const existing = get().tasks.find(t =>
      t.id !== prev.id && !t.someday && isSameDay(new Date(t.date), nextDate) &&
      ((t.recurringParentId || t.id) === parentId || (t.title === prev.title && t.project === prev.project)),
    );
    if (existing) return; // already scheduled (e.g. older pre-generated copy)

    const id = uid('rec_');
    const next: Task = {
      ...prev,
      id,
      date: nextDate,
      status: 'todo',
      someday: false,
      createdAt: new Date(),
      recurringParentId: parentId,
      recurringNextId: undefined,
      order: undefined,
      subtasks: prev.subtasks?.length
        ? prev.subtasks.map(st => ({ id: uid('sub_'), title: st.title, done: false }))
        : undefined,
    };
    set(s => ({
      tasks: [...s.tasks.map(t => t.id === prev.id ? { ...t, recurringNextId: id } : t), next],
    }));
    syncTask(get, id);
    syncTask(get, prev.id);
    return;
  }

  if (prev.status === 'done' && prev.recurringNextId) {
    const next = get().tasks.find(t => t.id === prev.recurringNextId);
    const untouched = next && next.status === 'todo' && !next.subtasks?.some(st => st.done);
    set(s => ({
      tasks: s.tasks
        .filter(t => !(untouched && t.id === prev.recurringNextId))
        .map(t => t.id === prev.id ? { ...t, recurringNextId: undefined } : t),
    }));
    const { userId } = get();
    if (untouched && userId && next) syncDelete(userId, next.id);
    syncTask(get, prev.id);
  }
}

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  activeProjectFilter: string | null;
  settings: { notifyDesktop:boolean; };

  // Firestore sync state
  userId: string | null;
  isFirestoreLoaded: boolean;
  setUserId: (uid: string | null) => void;
  setTasks: (tasks: Task[]) => void;
  setFirestoreLoaded: (v: boolean) => void;
  setProjects: (projects: Project[]) => void;
  deleteProject: (id: string) => void;

  addTask: (task: Omit<Task,'id'|'createdAt'>) => string;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, newStatus: TaskStatus) => void;
  moveTaskToDate: (id: string, newDate: Date) => void;
  copyTaskToDate: (id: string, newDate: Date) => void;
  importTasks: (tasks: Omit<Task,'id'|'createdAt'>[]) => void;
  addProject: (name: string) => void;
  setActiveProjectFilter: (p: string | null) => void;
  updateSettings: (s: Partial<TaskStore['settings']>) => void;

  addSubtask: (taskId: string, title: string, date?: Date) => void;
  toggleSubtask: (taskId: string, subId: string) => void;
  deleteSubtask: (taskId: string, subId: string) => void;
  updateSubtask: (taskId: string, subId: string, updates: Partial<SubTask>) => void;

  duplicateTask: (id: string) => string;

  getTaskById: (id: string) => Task | undefined;
  getTasksForDay: (date: Date) => Task[];
  getFilteredTasks: () => Task[];
  getSomedayTasks: () => Task[];
  getTodayTasks: () => Task[];
  getWeekStats: () => { total:number; done:number; dueToday:number; dueTomorrow:number; percentage:number };
}

export const useTaskStore = create<TaskStore>()(
  temporal(
    (set, get) => ({
  tasks: [],
  projects: PROJECTS,
  activeProjectFilter: null,
  settings: { notifyDesktop:false },
  userId: null,
  isFirestoreLoaded: false,

  // ── Firestore sync ─────────────────────────────────────────────────────────
  setUserId: (uid) => set({ userId: uid }),
  setTasks: (tasks) => set({ tasks, isFirestoreLoaded: true }),
  setFirestoreLoaded: (v) => set({ isFirestoreLoaded: v }),
  setProjects: (projects) => set({ projects }),
  deleteProject: (id) => set(s => ({ projects: s.projects.filter(p => p.id !== id) })),

  // ── Mutations ──────────────────────────────────────────────────────────────
  addTask: (task) => {
    const id = uid('task_');
    const newTask: Task = { ...task, id, createdAt: new Date() };
    set(s => ({ tasks: [...s.tasks, newTask] }));
    syncTask(get, id);
    return id;
  },

  updateTask: (id, updates) => {
    const prev = get().tasks.find(t => t.id===id);
    set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,...updates} : t) }));
    syncTask(get, id);
    if (prev && updates.status) {
      // Recurrence settings may have changed in the same update (TaskModal save).
      handleRecurringTransition(get, set, { ...prev, ...updates, status: prev.status }, updates.status);
    }
  },

  deleteTask: (id) => {
    set(s => ({ tasks: s.tasks.filter(t => t.id!==id) }));
    const { userId } = get();
    if (userId) syncDelete(userId, id);
  },

  moveTask: (id, newStatus) => {
    const prev = get().tasks.find(t => t.id===id);
    set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,status:newStatus} : t) }));
    syncTask(get, id);
    if (prev) handleRecurringTransition(get, set, prev, newStatus);
  },

  moveTaskToDate: (id, newDate) => {
    set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,date:newDate,someday:false} : t) }));
    syncTask(get, id);
  },

  copyTaskToDate: (id, newDate) => {
    const task = get().tasks.find(t => t.id===id);
    if (!task) return;
    const newTask: Task = { ...task, id:uid('task_'), date:newDate, status:'todo', someday:false, createdAt:new Date(), recurringNextId: undefined };
    set(s => ({ tasks: [...s.tasks, newTask] }));
    syncTask(get, newTask.id);
  },

  importTasks: (tasks) => {
    const newTasks = tasks.map(t => ({ ...t, id:uid('import_'), createdAt:new Date() }));
    set(s => ({ tasks: [...s.tasks, ...newTasks] }));
    const { userId } = get();
    if (!userId) return;
    const ids = newTasks.map(t => t.id);
    ids.forEach(id => useSyncStore.getState().markSaving(id));
    const attempt = () => {
      fsBatchSync(userId, newTasks, [])
        .then(() => ids.forEach(id => useSyncStore.getState().markSaved(id)))
        .catch(e => {
          console.error('[Firestore] importTasks error', e);
          ids.forEach(id => useSyncStore.getState().markError(id, attempt));
          useToastStore.getState().addToast({
            type: 'error',
            message: 'Помилка імпорту. Перевірте з\'єднання.',
            action: { label: 'Повторити', onClick: attempt },
          });
        });
    };
    attempt();
  },

  addProject: (name) => {
    const colors: TagColor[] = ['blue','indigo','purple','emerald','amber','rose'];
    set(s => ({ projects: [...s.projects, { id:uid(), name, color: colors[s.projects.length%colors.length] }] }));
  },

  setActiveProjectFilter: (p) => set({ activeProjectFilter: p }),
  updateSettings: (s) => set(st => ({ settings: {...st.settings, ...s} })),

  addSubtask: (taskId, title, date) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id===taskId ? {
        ...t,
        subtasks: [...(t.subtasks||[]), { id:uid('sub_'), title, done:false, date }]
      } : t)
    }));
    syncTask(get, taskId);
  },

  toggleSubtask: (taskId, subId) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id===taskId ? {
        ...t,
        subtasks: (t.subtasks||[]).map(st => st.id===subId ? {...st,done:!st.done} : st)
      } : t)
    }));
    syncTask(get, taskId);
  },

  deleteSubtask: (taskId, subId) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id===taskId ? {
        ...t,
        subtasks: (t.subtasks||[]).filter(st => st.id!==subId)
      } : t)
    }));
    syncTask(get, taskId);
  },

  updateSubtask: (taskId, subId, updates) => {
    set(s => ({
      tasks: s.tasks.map(t => t.id===taskId ? {
        ...t,
        subtasks: (t.subtasks||[]).map(st => st.id===subId ? {...st,...updates} : st)
      } : t)
    }));
    syncTask(get, taskId);
  },

  duplicateTask: (id) => {
    const task = get().tasks.find(t => t.id===id);
    if (!task) return '';
    const newId = uid('task_');
    const newTask: Task = { ...task, id: newId, status: 'todo', createdAt: new Date(), recurringNextId: undefined };
    set(s => ({ tasks: [...s.tasks, newTask] }));
    syncTask(get, newId);
    return newId;
  },

  // ── Selectors ──────────────────────────────────────────────────────────────
  getTaskById: (id) => get().tasks.find(t => t.id===id),

  getTasksForDay: (date) => {
    const { tasks, activeProjectFilter } = get();
    return tasks.filter(t => {
      if (t.someday) return false;
      const d = new Date(t.date);
      const same = d.getFullYear()===date.getFullYear() && d.getMonth()===date.getMonth() && d.getDate()===date.getDate();
      if (!same) return false;
      if (activeProjectFilter && t.project!==activeProjectFilter) return false;
      return true;
    }).sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  },

  getFilteredTasks: () => {
    const { tasks, activeProjectFilter } = get();
    const filtered = tasks.filter(t => !t.someday);
    return activeProjectFilter ? filtered.filter(t => t.project===activeProjectFilter) : filtered;
  },

  getSomedayTasks: () => {
    const { tasks, activeProjectFilter } = get();
    const someday = tasks.filter(t => t.someday);
    return activeProjectFilter ? someday.filter(t => t.project===activeProjectFilter) : someday;
  },

  getTodayTasks: () => {
    const today = new Date();
    return get().getTasksForDay(today);
  },

  getWeekStats: () => {
    const { tasks } = get();
    const now = new Date();
    const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0);
    const we = new Date(ws); we.setDate(ws.getDate()+6);
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
    const wt = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d>=ws && d<=we; });
    const done = wt.filter(t => t.status==='done').length;
    const dueToday = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d.toDateString()===now.toDateString() && t.status!=='done'; }).length;
    const dueTomorrow = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d.toDateString()===tomorrow.toDateString() && t.status!=='done'; }).length;
    return { total:wt.length, done, dueToday, dueTomorrow, percentage: wt.length>0 ? Math.round((done/wt.length)*100) : 0 };
  },
    }),
    {
      partialize: (state) => ({ tasks: state.tasks }),
      limit: 50,
    }
  )
);

export const useTemporalStore = <T>(selector: (state: TemporalState<{ tasks: Task[] }>) => T): T =>
  useStore(useTaskStore.temporal, selector);
