import { useState, useRef } from 'react';
import { CheckCircle2, Clock, Circle, Repeat, Plus, Search, ChevronDown, Sparkles, GripVertical, Archive } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTaskStore, Task, TaskStatus, Priority, PROJECTS } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { TaskContextMenu } from '../components/TaskContextMenu';
import { QuickAddBar } from '../components/QuickAddBar';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const TAG: Record<string,string> = {
  blue:'bg-blue-50 text-blue-700 border-blue-200', indigo:'bg-indigo-50 text-indigo-700 border-indigo-200',
  purple:'bg-purple-50 text-purple-700 border-purple-200', emerald:'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber:'bg-amber-50 text-amber-700 border-amber-200', rose:'bg-rose-50 text-rose-700 border-rose-200',
  slate:'bg-slate-100 text-slate-600 border-slate-200',
};
const DOT: Record<string,string> = {
  blue:'bg-blue-400', indigo:'bg-indigo-400', purple:'bg-purple-400',
  emerald:'bg-emerald-400', amber:'bg-amber-400', rose:'bg-rose-400', slate:'bg-slate-400',
};

type Ctx = { x: number; y: number; task: Task };

function TaskRow({ task, isSelected, onSelect, onDoubleClick, onContextMenu }: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const { moveTask } = useTaskStore();
  const isIP = task.status === 'in_progress';
  const subtasks = task.subtasks || [];
  const subDone = subtasks.filter(s => s.done).length;

  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const touchOrigin = useRef({ x: 0, y: 0 });
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]; touchOrigin.current = { x: t.clientX, y: t.clientY };
    longPressTimer.current = setTimeout(() => onContextMenu(touchOrigin.current.x, touchOrigin.current.y), 500);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    if ((Math.abs(t.clientX - touchOrigin.current.x) > 8 || Math.abs(t.clientY - touchOrigin.current.y) > 8) && longPressTimer.current) {
      clearTimeout(longPressTimer.current); longPressTimer.current = null;
    }
  };
  const handleTouchEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group select-none
        ${isIP ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
          : isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-400 dark:border-indigo-500'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'}
        ${isSelected ? 'ring-2 ring-indigo-400 ring-inset' : ''}`}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={onDoubleClick}
      onContextMenu={e => { e.preventDefault(); onContextMenu(e.clientX, e.clientY); }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        onClick={e => { e.stopPropagation(); moveTask(task.id, task.status === 'done' ? 'todo' : task.status === 'in_progress' ? 'done' : 'in_progress'); }}
        className="shrink-0"
      >
        {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/>
          : isIP ? <Clock className="w-5 h-5 text-amber-500 animate-pulse"/>
          : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors"/>}
      </button>
      <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[task.tagColor] || 'bg-slate-400'}`}/>
      {task.priority && (
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`}/>
      )}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-slate-400' : isIP ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-white'}`}>
          {task.title}
        </p>
        {subtasks.length > 0 && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-12">
              <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round((subDone/subtasks.length)*100)}%`}}/>
            </div>
            <span className="text-[9px] text-slate-400 font-bold">{subDone}/{subtasks.length}</span>
          </div>
        )}
      </div>
      {task.recurring && <Repeat className="w-3 h-3 text-slate-300 shrink-0"/>}
      <span className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${TAG[task.tagColor] || TAG.slate}`}>{task.project}</span>
      {!task.someday && (
        <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{format(new Date(task.date),'d MMM',{locale:uk})}</span>
      )}
      <GripVertical className="w-4 h-4 text-slate-200 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"/>
    </div>
  );
}

function SomedaySection() {
  const { getSomedayTasks, moveTaskToDate } = useTaskStore();
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const [open, setOpen] = useState(false);
  const tasks = getSomedayTasks();
  if (tasks.length === 0) return null;

  return (
    <div className="border border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4"/>
          <span className="text-sm font-black uppercase tracking-wide">Колись</span>
          <span className="text-xs font-bold bg-purple-200 dark:bg-purple-800 px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
          <p className="text-[10px] text-slate-400 font-medium">Задачі без конкретної дати. Клікни щоб призначити день.</p>
          {tasks.map(t => (
            <div key={t.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer hover:border-purple-300 transition-all group"
              onDoubleClick={() => { setEditingTask(t); setTaskModalOpen(true); }}>
              <Circle className="w-4 h-4 text-slate-300 shrink-0"/>
              <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[t.tagColor] || 'bg-slate-400'}`}/>
              <p className="flex-1 text-sm font-semibold text-slate-800 dark:text-white truncate">{t.title}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${TAG[t.tagColor] || TAG.slate}`}>{t.project}</span>
              <button
                onClick={e => { e.stopPropagation(); moveTaskToDate(t.id, new Date()); }}
                className="opacity-0 group-hover:opacity-100 text-[9px] bg-indigo-600 text-white px-2 py-1 rounded-lg font-bold uppercase transition-all">
                Сьогодні
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DateGroup({ dateKey, tasks }: { dateKey: string; tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const label = format(new Date(dateKey), 'EEEE, d MMMM', { locale: uk });
  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold capitalize text-slate-500">{label}</span>
          <span className="text-[9px] text-slate-400">{tasks.length}</span>
        </div>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="p-2 space-y-1">
          {tasks.map(t => (
            <div key={t.id}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              onDoubleClick={() => { setEditingTask(t); setTaskModalOpen(true); }}>
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/>
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[t.tagColor] || 'bg-slate-400'}`}/>
              <span className="text-xs font-medium line-through text-slate-400 flex-1 truncate">{t.title}</span>
              <span className="text-[9px] text-slate-300 shrink-0 hidden sm:block">{t.project}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MonthGroup({ label, tasks }: { label: string; tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  const byDate: Record<string, Task[]> = {};
  tasks.forEach(t => {
    const k = format(new Date(t.date), 'yyyy-MM-dd');
    (byDate[k] ??= []).push(t);
  });
  const dateKeys = Object.keys(byDate).sort().reverse();
  return (
    <div className="border border-slate-100 dark:border-slate-700 rounded-lg overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-3 py-2 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold capitalize text-slate-600 dark:text-slate-300">{label}</span>
          <span className="text-[9px] font-bold text-slate-400">{tasks.length} завд.</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="p-2 space-y-1.5">
          {dateKeys.map(dk => <DateGroup key={dk} dateKey={dk} tasks={byDate[dk]}/>)}
        </div>
      )}
    </div>
  );
}

function ArchiveSection({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false);
  if (tasks.length === 0) return null;
  const byMonth: Record<string, { label: string; tasks: Task[] }> = {};
  tasks.forEach(t => {
    const k = format(new Date(t.date), 'yyyy-MM');
    const label = format(new Date(t.date), 'LLLL yyyy', { locale: uk });
    if (!byMonth[k]) byMonth[k] = { label, tasks: [] };
    byMonth[k].tasks.push(t);
  });
  const monthKeys = Object.keys(byMonth).sort().reverse();
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden mt-2">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-2">
          <Archive className="w-4 h-4 text-slate-400"/>
          <span className="text-sm font-black uppercase tracking-wide">Архів</span>
          <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">{tasks.length}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-white dark:bg-slate-900">
          {monthKeys.map(k => <MonthGroup key={k} label={byMonth[k].label} tasks={byMonth[k].tasks}/>)}
        </div>
      )}
    </div>
  );
}

export function MyTasks() {
  const { tasks, activeProjectFilter, moveTaskToDate } = useTaskStore();
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const [statusFilter, setStatusFilter] = useState<TaskStatus|'all'>('all');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority|'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  // Maps dateKey (yyyy-MM-dd) → ordered task IDs (from DnD)
  const [groupOrder, setGroupOrder] = useState<Record<string, string[]>>({});

  const filtered = tasks.filter(t => {
    if (t.someday) return false;
    if (t.status === 'done') return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (projectFilter !== 'all' && t.project !== projectFilter) return false;
    if (activeProjectFilter && t.project !== activeProjectFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const archiveTasks = tasks.filter(t => {
    if (t.status !== 'done') return false;
    if (projectFilter !== 'all' && t.project !== projectFilter) return false;
    if (activeProjectFilter && t.project !== activeProjectFilter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const o: Record<TaskStatus,number> = {in_progress:0,todo:1,done:2};
    if (o[a.status] !== o[b.status]) return o[a.status] - o[b.status];
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  // Group by ISO date key
  const grouped: Record<string, Task[]> = {};
  sorted.forEach(t => {
    const k = format(new Date(t.date), 'yyyy-MM-dd');
    (grouped[k] ??= []).push(t);
  });

  const groupKeys = Object.keys(grouped).sort();
  const totalDone = archiveTasks.length;

  const getDisplayTasks = (dateKey: string): Task[] => {
    const base = grouped[dateKey] || [];
    const order = groupOrder[dateKey];
    if (!order) return base;
    const baseMap = new Map(base.map(t => [t.id, t]));
    const ordered = order.map(id => baseMap.get(id)).filter(Boolean) as Task[];
    // append any new tasks not in order
    const inOrder = new Set(order);
    base.forEach(t => { if (!inOrder.has(t.id)) ordered.push(t); });
    return ordered;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId !== destination.droppableId) {
      // Move task to different date and insert at the drop index in the destination group
      const dstKey = destination.droppableId;
      moveTaskToDate(draggableId, new Date(dstKey + 'T00:00:00'));
      const currentDst = getDisplayTasks(dstKey).map(t => t.id);
      const next = [...currentDst];
      next.splice(destination.index, 0, draggableId);
      setGroupOrder(prev => ({ ...prev, [dstKey]: next }));
    } else {
      // Reorder within same day
      const dateKey = source.droppableId;
      const current = getDisplayTasks(dateKey).map(t => t.id);
      const next = [...current];
      const [removed] = next.splice(source.index, 1);
      next.splice(destination.index, 0, removed);
      setGroupOrder(prev => ({ ...prev, [dateKey]: next }));
    }
  };

  const openEdit = (task: Task) => { setEditingTask(task); setTaskModalOpen(true); };

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={() => setSelectedId(null)}>
      {ctx && <TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={() => setCtx(null)}/>}

      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-black text-slate-800 dark:text-white">{activeProjectFilter ? `# ${activeProjectFilter}` : 'Мої завдання'}</h2>
          <p className="text-[10px] text-slate-400">{totalDone} з {filtered.length} виконано</p>
        </div>
        <button
          onClick={e => { e.stopPropagation(); setEditingTask(null); setTaskModalOpen(true); }}
          className="flex items-center gap-1.5 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-xl uppercase tracking-widest">
          <Plus className="w-3.5 h-3.5"/> Задача
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{width:`${Math.round((totalDone/filtered.length)*100)}%`}}/>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3" onClick={e => e.stopPropagation()}>
        <div className="relative flex-1 min-w-[140px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..."
            className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
        </div>
        <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
          {(['all','todo','in_progress'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-2 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${statusFilter === s ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}>
              {s === 'all' ? 'Всі' : s === 'todo' ? 'Заплановано' : 'В процесі'}
            </button>
          ))}
        </div>
        {/* Priority chips */}
        <div className="flex gap-1">
          {(['all','high','medium','low'] as const).map(p => {
            const styles: Record<string, string> = {
              all: priorityFilter === 'all' ? 'bg-slate-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400',
              high: priorityFilter === 'high' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
              medium: priorityFilter === 'medium' ? 'bg-amber-400 text-white' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
              low: priorityFilter === 'low' ? 'bg-slate-400 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
            };
            const dots: Record<string, string> = { high:'bg-rose-500', medium:'bg-amber-400', low:'bg-slate-300' };
            return (
              <button key={p} onClick={() => setPriorityFilter(p)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all ${styles[p]}`}>
                {p !== 'all' && <span className={`w-1.5 h-1.5 rounded-full ${priorityFilter === p ? 'bg-white/80' : dots[p]}`}/>}
                {p === 'all' ? 'Пріоритет' : p === 'high' ? 'Вис.' : p === 'medium' ? 'Сер.' : 'Низ.'}
              </button>
            );
          })}
        </div>

        {/* Project chips — horizontal scroll on mobile */}
        {!activeProjectFilter && (
          <div className="flex gap-1 overflow-x-auto pb-0.5 no-scrollbar w-full">
            <button onClick={() => setProjectFilter('all')}
              className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all shrink-0 ${projectFilter === 'all' ? 'bg-slate-700 text-white dark:bg-slate-300 dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200'}`}>
              Всі
            </button>
            {PROJECTS.map(p => {
              const isActive = projectFilter === p.name;
              const colorMap: Record<string, { base: string; active: string }> = {
                blue:    { base: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',       active: 'bg-blue-500 text-white' },
                indigo:  { base: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400', active: 'bg-indigo-500 text-white' },
                purple:  { base: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400', active: 'bg-purple-500 text-white' },
                emerald: { base: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400', active: 'bg-emerald-500 text-white' },
                amber:   { base: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',   active: 'bg-amber-500 text-white' },
                rose:    { base: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',       active: 'bg-rose-500 text-white' },
                slate:   { base: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',     active: 'bg-slate-500 text-white' },
              };
              const c = colorMap[p.color] || colorMap.slate;
              return (
                <button key={p.id} onClick={() => setProjectFilter(isActive ? 'all' : p.name)}
                  className={`text-[10px] font-bold px-2 py-1.5 rounded-lg transition-all shrink-0 ${isActive ? c.active : c.base + ' hover:opacity-80'}`}>
                  {p.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <QuickAddBar defaultProject={activeProjectFilter || undefined} placeholder="Нова задача на сьогодні..." />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-y-auto space-y-5 pr-0.5" onClick={e => e.stopPropagation()}>
          {groupKeys.length === 0 && (() => {
            const hasAnyTasks = tasks.filter(t => !t.someday && t.status !== 'done').length > 0;
            return hasAnyTasks ? (
              <div className="text-center py-14">
                <Search className="w-10 h-10 text-slate-100 dark:text-slate-700 mx-auto mb-3"/>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Нічого не знайдено</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">Спробуйте змінити фільтри або пошуковий запит</p>
              </div>
            ) : (
              <div className="text-center py-14">
                <CheckCircle2 className="w-12 h-12 text-slate-100 dark:text-slate-700 mx-auto mb-4"/>
                <p className="text-sm font-bold text-slate-400 dark:text-slate-500">Завдань поки немає</p>
                <p className="text-xs text-slate-300 dark:text-slate-600 mt-1 mb-4">Додайте першу задачу, щоб почати</p>
                <button
                  onClick={e => { e.stopPropagation(); setEditingTask(null); setTaskModalOpen(true); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5"/> Додати задачу
                </button>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-3">або натисніть <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-mono">N</kbd></p>
              </div>
            );
          })()}

          {groupKeys.map(dateKey => {
            const dayTasks = getDisplayTasks(dateKey);
            const label = format(new Date(dateKey), 'EEEE, d MMMM', {locale: uk});
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest capitalize">{label}</span>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700"/>
                  <span className="text-[9px] font-bold text-slate-300">{dayTasks.length}</span>
                </div>
                <Droppable droppableId={dateKey}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-1.5 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10 p-1' : ''}`}
                    >
                      {dayTasks.map((t, index) => (
                        <Draggable key={t.id} draggableId={t.id} index={index}>
                          {(prov, snap) => (
                            <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                              className={snap.isDragging ? 'opacity-80 shadow-lg' : ''}>
                              <TaskRow
                                task={t}
                                isSelected={selectedId === t.id}
                                onSelect={() => setSelectedId(t.id === selectedId ? null : t.id)}
                                onDoubleClick={() => openEdit(t)}
                                onContextMenu={(x, y) => setCtx({ x, y, task: t })}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}

          <SomedaySection/>
          <ArchiveSection tasks={archiveTasks}/>
        </div>
      </DragDropContext>
    </div>
  );
}
