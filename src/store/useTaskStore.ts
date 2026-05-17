import { create } from 'zustand';

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
  someday?: boolean; // no specific date
  tagColor: TagColor;
  notes?: string;
  recurring?: boolean;
  reminderEnabled?: boolean;
  reminderTime?: string;
  googleCalendarSync?: boolean;
  subtasks?: SubTask[];
  createdAt: Date;
  priority?: Priority;
  time?: string; // "HH:MM" scheduled time
}

export interface Project { id: string; name: string; color: TagColor; }

const PC: Record<string, TagColor> = {
  'ДІС':'blue','AI officer':'indigo','Трейд':'purple','Навчання':'emerald',
  'Орлі':'amber','Хайфом':'blue','ACAT':'emerald','ЯС':'rose','Кабін':'slate',
  'Моє':'emerald','Розробка':'indigo',
};
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

const T = (id:string,title:string,project:string,status:TaskStatus,day:number,tagColor:TagColor,recurring?:boolean): Task => ({
  id,title,project,status,date:new Date(2026,4,day),tagColor,recurring,createdAt:new Date()
});

const INITIAL_TASKS: Task[] = [
  T('m1','Прибрати ціни','ДІС','done',11,'blue'),
  T('m2','Прибрати ціни','Трейд','done',11,'purple'),
  T('m3','SMM stories','ДІС','done',11,'blue',true),
  T('m4','SMM post','ДІС','done',11,'blue',true),
  T('m5','Міроненко закупки: підготовити','AI officer','done',11,'indigo'),
  T('m6','Залишки Аутлет: додавати','ДІС','done',11,'blue'),
  T('t1','SMM stories','ДІС','done',12,'blue',true),
  T('t2','Товари дня','ДІС','done',12,'blue',true),
  T('t3','Міроненко закупки: підготовити','AI officer','done',12,'indigo'),
  T('t4','ЛавЮ додати товари: тестити','ДІС','done',12,'blue'),
  T('t5','Поповнити рахунок','Орлі','done',12,'amber'),
  T('t6','Навчання RD','Навчання','done',12,'emerald',true),
  T('w1','SMM stories','ДІС','done',13,'blue',true),
  T('w2','SMM post','ДІС','done',13,'blue',true),
  T('w3','Товари дня','ДІС','done',13,'blue',true),
  T('w4','Коментарі на сайт','ДІС','done',13,'blue'),
  T('w5','Відео створити','Моє','done',13,'emerald'),
  T('th1','SMM stories','ДІС','done',14,'blue',true),
  T('th2','Коментарі на сайт','ДІС','done',14,'blue'),
  T('th3','Товари дня','ДІС','done',14,'blue',true),
  T('th4','ЛавЮ додати товари','ДІС','done',14,'blue'),
  T('th5','Обновить n8n','Розробка','todo',14,'indigo'),
  T('th6','Антигравіті вчити','Навчання','todo',14,'emerald'),
  T('th7','Створити дашборд Digital','ДІС','todo',14,'blue'),
  T('th8','Відібрати наступні пілоти','AI officer','in_progress',14,'indigo'),
  T('th9','Тестити Claude','AI officer','in_progress',14,'indigo'),
  T('th10','Навчання RD','Навчання','todo',14,'emerald',true),
  T('f1','Розробка ТЗ нагадувань','Хайфом','todo',15,'blue'),
  T('f2','SMM post','ДІС','todo',15,'blue',true),
  T('f3','SMM stories','ДІС','todo',15,'blue',true),
  T('m18_1','Змінити ціни','ДІС','todo',18,'blue'),
  T('m18_2','SMM post','ДІС','todo',18,'blue',true),
  T('m18_3','Vocabulary поповнити','AI officer','todo',18,'indigo'),
  T('m18_4','SMM stories: планування','ДІС','todo',18,'blue'),
  T('m18_5','Аналіз продажів за вихідні','Трейд','todo',18,'purple'),
  T('20_1','Оптимізація Firestore','ACAT','in_progress',20,'emerald'),
  T('21_1','Почистити гугл аналітікс','Трейд','todo',21,'purple'),
  T('22_1','Демо для клієнта','Трейд','todo',22,'purple'),
  T('25_1','Vocabulary перевірка','AI officer','todo',25,'indigo'),
  // Someday tasks
  { id:'s1', title:'Зробити онбординг для нових клієнтів', project:'ДІС', status:'todo', date:new Date(2026,4,15), someday:true, tagColor:'blue', createdAt:new Date() },
  { id:'s2', title:'Написати стратегію контенту на квартал', project:'AI officer', status:'todo', date:new Date(2026,4,15), someday:true, tagColor:'indigo', createdAt:new Date() },
  { id:'s3', title:'Налаштувати автоматичну аналітику', project:'ДІС', status:'todo', date:new Date(2026,4,15), someday:true, tagColor:'blue', createdAt:new Date() },
];

let nextId = 1000;
let nextSubId = 100;

interface TaskStore {
  tasks: Task[];
  projects: Project[];
  activeProjectFilter: string | null;
  settings: { telegramChatId:string; telegramBotToken:string; email:string; notifyTelegram:boolean; notifyEmail:boolean; };

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

  // Subtasks
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

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: INITIAL_TASKS,
  projects: PROJECTS,
  activeProjectFilter: null,
  settings: { telegramChatId:'', telegramBotToken:'', email:'', notifyTelegram:false, notifyEmail:false },

  addTask: (task) => {
    const id = `task_${Date.now()}_${nextId++}`;
    set(s => ({ tasks: [...s.tasks, { ...task, id, createdAt: new Date() }] }));
    return id;
  },
  updateTask: (id, updates) => set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,...updates} : t) })),
  deleteTask: (id) => set(s => ({ tasks: s.tasks.filter(t => t.id!==id) })),
  moveTask: (id, newStatus) => set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,status:newStatus} : t) })),
  moveTaskToDate: (id, newDate) => set(s => ({ tasks: s.tasks.map(t => t.id===id ? {...t,date:newDate,someday:false} : t) })),
  copyTaskToDate: (id, newDate) => {
    const task = get().tasks.find(t => t.id===id);
    if (!task) return;
    set(s => ({ tasks: [...s.tasks, {...task, id:`task_${Date.now()}_${nextId++}`, date:newDate, status:'todo', someday:false, createdAt:new Date()}] }));
  },
  importTasks: (tasks) => set(s => ({ tasks: [...s.tasks, ...tasks.map(t => ({...t, id:`import_${Date.now()}_${nextId++}`, createdAt:new Date()}))] })),
  addProject: (name) => {
    const colors: TagColor[] = ['blue','indigo','purple','emerald','amber','rose'];
    set(s => ({ projects: [...s.projects, { id:`proj_${Date.now()}`, name, color: colors[s.projects.length%colors.length] }] }));
  },
  setActiveProjectFilter: (p) => set({ activeProjectFilter: p }),
  updateSettings: (s) => set(st => ({ settings: {...st.settings, ...s} })),

  addSubtask: (taskId, title, date) => set(s => ({
    tasks: s.tasks.map(t => t.id===taskId ? {
      ...t,
      subtasks: [...(t.subtasks||[]), { id:`sub_${nextSubId++}`, title, done:false, date }]
    } : t)
  })),
  toggleSubtask: (taskId, subId) => set(s => ({
    tasks: s.tasks.map(t => t.id===taskId ? {
      ...t,
      subtasks: (t.subtasks||[]).map(st => st.id===subId ? {...st,done:!st.done} : st)
    } : t)
  })),
  deleteSubtask: (taskId, subId) => set(s => ({
    tasks: s.tasks.map(t => t.id===taskId ? {
      ...t,
      subtasks: (t.subtasks||[]).filter(st => st.id!==subId)
    } : t)
  })),
  updateSubtask: (taskId, subId, updates) => set(s => ({
    tasks: s.tasks.map(t => t.id===taskId ? {
      ...t,
      subtasks: (t.subtasks||[]).map(st => st.id===subId ? {...st,...updates} : st)
    } : t)
  })),

  duplicateTask: (id) => {
    const task = get().tasks.find(t => t.id===id);
    if (!task) return '';
    const newId = `task_${Date.now()}_${nextId++}`;
    set(s => ({ tasks: [...s.tasks, { ...task, id: newId, status: 'todo', createdAt: new Date() }] }));
    return newId;
  },

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
    const today = new Date(2026,4,15);
    return get().getTasksForDay(today);
  },

  getWeekStats: () => {
    const { tasks } = get();
    const now = new Date(2026,4,15);
    const ws = new Date(now); ws.setDate(now.getDate()-((now.getDay()+6)%7)); ws.setHours(0,0,0,0);
    const we = new Date(ws); we.setDate(ws.getDate()+6);
    const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
    const wt = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d>=ws && d<=we; });
    const done = wt.filter(t => t.status==='done').length;
    const dueToday = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d.toDateString()===now.toDateString() && t.status!=='done'; }).length;
    const dueTomorrow = tasks.filter(t => { const d=new Date(t.date); return !t.someday && d.toDateString()===tomorrow.toDateString() && t.status!=='done'; }).length;
    return { total:wt.length, done, dueToday, dueTomorrow, percentage: wt.length>0 ? Math.round((done/wt.length)*100) : 0 };
  },
}));
