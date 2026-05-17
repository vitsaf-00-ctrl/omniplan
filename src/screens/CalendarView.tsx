import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Upload, Plus, Repeat, Clock, CheckCircle2, Circle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

import { format, startOfWeek, addDays, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek, isSameMonth, addMonths } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTaskStore, Task } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { ImportModal } from '../components/ImportModal';
import { TaskContextMenu } from '../components/TaskContextMenu';

const TODAY = new Date(2026, 4, 15);

const HOUR_PX = 60;
const TL_START = 8;
const TL_END = 22;
const TL_HOURS = TL_END - TL_START + 1; // 15 rows

const TL_COLORS: Record<string,string> = {
  blue:'border-blue-500 bg-blue-500/20 text-blue-900 dark:text-blue-100',
  indigo:'border-indigo-500 bg-indigo-500/20 text-indigo-900 dark:text-indigo-100',
  purple:'border-purple-500 bg-purple-500/20 text-purple-900 dark:text-purple-100',
  emerald:'border-emerald-500 bg-emerald-500/20 text-emerald-900 dark:text-emerald-100',
  amber:'border-amber-400 bg-amber-400/20 text-amber-900 dark:text-amber-100',
  rose:'border-rose-500 bg-rose-500/20 text-rose-900 dark:text-rose-100',
  slate:'border-slate-400 bg-slate-400/20 text-slate-700 dark:text-slate-200',
};

const PILL_COLORS: Record<string,string> = {
  blue:'bg-blue-500 text-white', indigo:'bg-indigo-500 text-white',
  purple:'bg-purple-500 text-white', emerald:'bg-emerald-500 text-white',
  amber:'bg-amber-400 text-white', rose:'bg-rose-500 text-white', slate:'bg-slate-400 text-white',
};
const PILL_DONE = 'bg-slate-200 text-slate-400 line-through';
const PILL_IP = 'bg-amber-400 text-white ring-2 ring-amber-300';

const TAG_BG: Record<string,string> = {
  blue:'border-l-blue-500 bg-blue-50 text-blue-900',
  indigo:'border-l-indigo-500 bg-indigo-50 text-indigo-900',
  purple:'border-l-purple-500 bg-purple-50 text-purple-900',
  emerald:'border-l-emerald-500 bg-emerald-50 text-emerald-900',
  amber:'border-l-amber-500 bg-amber-100 text-amber-900',
  rose:'border-l-rose-500 bg-rose-50 text-rose-900',
  slate:'border-l-slate-400 bg-slate-50 text-slate-700',
};

type Ctx = { x: number; y: number; task: Task };

// Monday-style pill task
function TaskPill({ task, compact }: { task:Task; compact?:boolean }) {
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const { moveTask } = useTaskStore();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const isDone = task.status==='done', isIP = task.status==='in_progress';
  const pill = isDone ? PILL_DONE : isIP ? PILL_IP : PILL_COLORS[task.tagColor]||PILL_COLORS.slate;

  return (
    <>
      <div draggable onDragStart={e=>e.dataTransfer.setData('taskId',task.id)}
        onDoubleClick={e=>{e.stopPropagation();setEditingTask(task);setTaskModalOpen(true);}}
        onClick={e=>{e.stopPropagation();moveTask(task.id,isDone?'todo':'done');}}
        onContextMenu={e=>{e.preventDefault();e.stopPropagation();setCtx({x:e.clientX,y:e.clientY,task});}}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate cursor-pointer select-none flex items-center gap-1 ${pill}`}
        title={task.title}>
        {isIP&&<Clock className="w-2.5 h-2.5 shrink-0 animate-pulse"/>}
        {task.recurring&&<Repeat className="w-2.5 h-2.5 shrink-0 opacity-70"/>}
        <span className="truncate">{task.title}</span>
      </div>
      {ctx&&<TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={()=>setCtx(null)}/>}
    </>
  );
}

function MonthTaskDot({ task }: { task: Task }) {
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const { moveTask } = useTaskStore();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const isDone = task.status === 'done', isIP = task.status === 'in_progress';
  const pill = isDone ? PILL_DONE : isIP ? PILL_IP : (PILL_COLORS[task.tagColor] || PILL_COLORS.slate);
  return (
    <>
      <div
        draggable
        onDragStart={e => { e.stopPropagation(); e.dataTransfer.setData('taskId', task.id); }}
        onDoubleClick={e => { e.stopPropagation(); setEditingTask(task); setTaskModalOpen(true); }}
        onClick={e => { e.stopPropagation(); moveTask(task.id, isDone ? 'todo' : 'done'); }}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setCtx({x:e.clientX,y:e.clientY,task}); }}
        title={task.title}
        className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold truncate cursor-pointer select-none flex items-center gap-1 ${pill}`}
      >
        {isIP && <Clock className="w-2.5 h-2.5 shrink-0 animate-pulse"/>}
        {task.recurring && <Repeat className="w-2.5 h-2.5 shrink-0 opacity-70"/>}
        <span className="truncate">{task.title}</span>
      </div>
      {ctx && <TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={() => setCtx(null)}/>}
    </>
  );
}

// Week view task card
function WeekTaskCard({ task }: { task:Task }) {
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const { moveTask, moveTaskToDate } = useTaskStore();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const isDone = task.status==='done', isIP = task.status==='in_progress';
  const DOT: Record<string,string> = {blue:'bg-blue-400',indigo:'bg-indigo-400',purple:'bg-purple-400',emerald:'bg-emerald-400',amber:'bg-amber-400',rose:'bg-rose-400',slate:'bg-slate-400'};

  // Long-press (mobile) and touch-drag state
  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const touchDragging = useRef(false);
  const touchOrigin = useRef({x:0, y:0});

  const openModal = () => { setEditingTask(task); setTaskModalOpen(true); };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchDragging.current = false;
    const t = e.touches[0];
    touchOrigin.current = {x: t.clientX, y: t.clientY};
    longPressTimer.current = setTimeout(() => setCtx({ x: touchOrigin.current.x, y: touchOrigin.current.y, task }), 500);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const moved = Math.abs(t.clientX - touchOrigin.current.x) > 8 || Math.abs(t.clientY - touchOrigin.current.y) > 8;
    if (moved && longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
      touchDragging.current = true;
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
    if (touchDragging.current) {
      const t = e.changedTouches[0];
      const el = document.elementFromPoint(t.clientX, t.clientY);
      const dayEl = el?.closest('[data-week-day]') as HTMLElement|null;
      if (dayEl?.dataset.weekDay) moveTaskToDate(task.id, new Date(Number(dayEl.dataset.weekDay)));
    }
    touchDragging.current = false;
  };

  return (
    <>
      <div
        onDoubleClick={openModal}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={e=>{e.preventDefault();setCtx({x:e.clientX,y:e.clientY,task});}}
        className="flex items-center gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-1 transition-colors select-none">
        <button onClick={e=>{e.stopPropagation();moveTask(task.id,task.status==='done'?'todo':'done');}} className="shrink-0">
          {isDone?<CheckCircle2 className="w-4 h-4 text-emerald-500"/>:isIP?<Clock className="w-4 h-4 text-amber-500 animate-pulse"/>:<Circle className="w-4 h-4 text-slate-300"/>}
        </button>
        <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[task.tagColor]||'bg-slate-400'}`}/>
        <p className={`text-xs font-medium flex-1 truncate ${isDone?'line-through text-slate-400':isIP?'text-amber-800':'text-slate-700 dark:text-slate-200'}`}>{task.title}</p>
        {task.recurring&&<Repeat className="w-2.5 h-2.5 text-slate-300 shrink-0"/>}
      </div>
      {ctx&&<TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={()=>setCtx(null)}/>}
    </>
  );
}

// Day view
function DayView({ day, onPrev, onNext }: { day:Date; onPrev:()=>void; onNext:()=>void }) {
  const { getTasksForDay, moveTask } = useTaskStore();
  const { setTaskModalOpen, setEditingTask, setSelectedDate } = useAppStore();
  const { moveTaskToDate: storeMove } = useTaskStore();
  const tasks = getTasksForDay(day);
  const isToday = isSameDay(day, TODAY);

  const hours = Array.from({length:16},(_,i)=>i+7); // 7:00 - 22:00

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 shrink-0">
        <button onClick={onPrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
        <div className="text-center">
          <p className={`text-sm font-black capitalize ${isToday?'text-indigo-600':'text-slate-800 dark:text-white'}`}>{format(day,'EEEE',{locale:uk})}</p>
          <p className="text-xs text-slate-400">{format(day,'d MMMM yyyy',{locale:uk})}</p>
        </div>
        <button onClick={onNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronRight className="w-4 h-4"/></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tasks.length===0&&<div className="text-center py-8 text-slate-400 text-sm">Задач на цей день немає</div>}
        {tasks.map(t=>(
          <div key={t.id} className={`p-3 rounded-xl border-l-4 hover:shadow-md transition-all ${TAG_BG[t.tagColor]||TAG_BG.slate} ${t.status==='done'?'opacity-60':''}`}
            onDoubleClick={()=>{setEditingTask(t);setTaskModalOpen(true);}}>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={e=>{e.stopPropagation();moveTask(t.id,t.status==='done'?'todo':'done');}} className="shrink-0">
                {t.status==='done'?<CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/>:t.status==='in_progress'?<Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse"/>:<Circle className="w-3.5 h-3.5 text-slate-300 hover:text-emerald-500 transition-colors"/>}
              </button>
              {t.recurring&&<Repeat className="w-3 h-3 opacity-50"/>}
              <button onClick={()=>{setEditingTask(t);setTaskModalOpen(true);}} className="text-[10px] opacity-50 hover:opacity-100 ml-auto font-bold">редаг.</button>
            </div>
            <p className={`text-sm font-semibold ${t.status==='done'?'line-through':''}`}>{t.title}</p>
            <p className="text-[10px] opacity-60 font-bold mt-0.5">{t.project}</p>
            {t.subtasks&&t.subtasks.length>0&&(
              <p className="text-[10px] opacity-60 mt-1">✓ {t.subtasks.filter(s=>s.done).length}/{t.subtasks.length}</p>
            )}
          </div>
        ))}
        <button onClick={()=>{setSelectedDate(day);setEditingTask(null);setTaskModalOpen(true);}}
          className="w-full p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-semibold flex items-center justify-center gap-2">
          <Plus className="w-4 h-4"/> Додати задачу
        </button>
      </div>
    </div>
  );
}

function TimelineView({ day, onPrev, onNext }: { day: Date; onPrev: ()=>void; onNext: ()=>void }) {
  const { getTasksForDay } = useTaskStore();
  const { setTaskModalOpen, setEditingTask, setSelectedDate } = useAppStore();

  const hours = Array.from({ length: TL_HOURS }, (_, i) => i + TL_START);
  const isToday = isSameDay(day, TODAY);
  const allTasks = getTasksForDay(day);
  const timeless = allTasks.filter(t => !t.someday && !t.time && (!t.reminderTime || !t.reminderTime.trim()));
  const timed = allTasks.filter(t => !t.someday && !!(t.time || t.reminderTime));

  const now = new Date();
  const nowTop = (now.getHours() - TL_START) * HOUR_PX + (now.getMinutes() / 60) * HOUR_PX;
  const showNow = isToday && now.getHours() >= TL_START && now.getHours() <= TL_END;

  const timeToTop = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h - TL_START) * HOUR_PX + (m / 60) * HOUR_PX;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Day navigation header */}
      <div className="shrink-0 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onPrev} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
          <div className="text-center">
            <p className={`text-sm font-black capitalize ${isToday ? 'text-indigo-600' : 'text-slate-800 dark:text-white'}`}>
              {format(day, 'EEEE', { locale: uk })}
            </p>
            <p className="text-xs text-slate-400">{format(day, 'd MMMM yyyy', { locale: uk })}</p>
          </div>
          <button onClick={onNext} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronRight className="w-4 h-4"/></button>
        </div>
      </div>

      {/* "Без часу" strip */}
      {timeless.length > 0 && (
        <div className="shrink-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/30 px-4 py-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Без часу</p>
          <div className="flex flex-wrap gap-1">
            {timeless.map(t => (
              <div key={t.id}
                onClick={() => { setEditingTask(t); setTaskModalOpen(true); }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border-l-[3px] ${TL_COLORS[t.tagColor] || TL_COLORS.slate}`}>
                {t.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add task shortcut */}
      <div className="shrink-0 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
        <button onClick={() => { setSelectedDate(day); setEditingTask(null); setTaskModalOpen(true); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">
          <Plus className="w-3.5 h-3.5"/> Додати задачу
        </button>
      </div>

      {/* Scrollable timeline — single day */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{height:`${TL_HOURS * HOUR_PX}px`}}>
          <div className="w-14 shrink-0 relative select-none">
            {hours.map(h => (
              <div key={h} className="absolute right-0 w-full flex justify-end pr-2"
                style={{top:`${(h - TL_START) * HOUR_PX - 7}px`}}>
                <span className="text-[9px] text-slate-400 font-bold">{String(h).padStart(2,'0')}:00</span>
              </div>
            ))}
          </div>
          <div className={`flex-1 relative ${isToday ? 'bg-indigo-50/20 dark:bg-indigo-900/5' : ''}`}
            onClick={() => { setSelectedDate(day); setEditingTask(null); setTaskModalOpen(true); }}>
            {hours.map(h => (
              <div key={h} className="absolute w-full border-t border-slate-100 dark:border-slate-700/50"
                style={{top:`${(h - TL_START) * HOUR_PX}px`}}/>
            ))}
            {hours.map(h => (
              <div key={`half-${h}`} className="absolute w-full border-t border-dashed border-slate-50 dark:border-slate-700/20"
                style={{top:`${(h - TL_START) * HOUR_PX + HOUR_PX / 2}px`}}/>
            ))}
            {timed.map(t => {
              const timeStr = t.time || t.reminderTime || '';
              const [h] = timeStr.split(':').map(Number);
              if (!timeStr || h < TL_START || h > TL_END) return null;
              const top = timeToTop(timeStr);
              const col = TL_COLORS[t.tagColor] || TL_COLORS.slate;
              const isDone = t.status === 'done';
              return (
                <div key={t.id}
                  onClick={e => { e.stopPropagation(); setEditingTask(t); setTaskModalOpen(true); }}
                  className={`absolute left-2 right-2 rounded-lg border-l-[3px] px-2.5 py-1.5 cursor-pointer hover:brightness-95 transition-all shadow-sm ${col} ${isDone ? 'opacity-50' : ''}`}
                  style={{top:`${top}px`, minHeight:'44px', zIndex:1}}>
                  <p className={`text-xs font-bold leading-tight ${isDone ? 'line-through' : ''}`}>{t.title}</p>
                  <p className="text-[10px] opacity-60 font-medium mt-0.5">{t.time || t.reminderTime} · {t.project}</p>
                  {t.subtasks && t.subtasks.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 h-1 bg-black/10 rounded-full overflow-hidden">
                        <div className="h-full bg-current opacity-60 rounded-full" style={{width:`${Math.round((t.subtasks.filter(s=>s.done).length/t.subtasks.length)*100)}%`}}/>
                      </div>
                      <span className="text-[8px] opacity-60 font-bold shrink-0">{t.subtasks.filter(s=>s.done).length}/{t.subtasks.length}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {showNow && (
              <div className="absolute w-full flex items-center pointer-events-none z-20" style={{top:`${nowTop}px`}}>
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 -ml-1 shadow-sm"/>
                <div className="flex-1 h-[2px] bg-red-500"/>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Month picker
function MonthPicker({ current, onSelect, onClose }: { current:Date; onSelect:(d:Date)=>void; onClose:()=>void }) {
  const [year, setYear] = useState(current.getFullYear());
  const months = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-72" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={()=>setYear(y=>y-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
          <span className="font-black text-slate-800 dark:text-white">{year}</span>
          <button onClick={()=>setYear(y=>y+1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {months.map((m,i)=>(
            <button key={i} onClick={()=>{onSelect(new Date(year,i,1));onClose();}}
              className={`py-2 rounded-lg text-xs font-bold transition-colors ${current.getMonth()===i&&current.getFullYear()===year?'bg-indigo-600 text-white':'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(TODAY);
  const [viewMode, setViewMode] = useState<'month'|'week'|'timeline'|'day'>('month');
  const [dayDate, setDayDate] = useState(TODAY);
  const [importOpen, setImportOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  // BUG-07: local week-view task order per day (timestamp → task id array)
  const [weekOrder, setWeekOrder] = useState<Record<number, string[]>>({});

  const { getTasksForDay, moveTaskToDate, copyTaskToDate, activeProjectFilter } = useTaskStore();
  const { setTaskModalOpen, setEditingTask, setSelectedDate, clipboardTaskId, clipboardMode, clearClipboard } = useAppStore();
  const { moveTaskToDate: storeMove, copyTaskToDate: storeCopy } = useTaskStore();

  const weekStart = startOfWeek(currentDate,{weekStartsOn:1});
  const weekDays = Array.from({length:7}).map((_,i)=>addDays(weekStart,i));
  const monthDays = eachDayOfInterval({start:startOfWeek(startOfMonth(currentDate),{weekStartsOn:1}),end:endOfWeek(endOfMonth(currentDate),{weekStartsOn:1})});

  const todayWeekMonday = startOfWeek(TODAY,{weekStartsOn:1});
  const weekRowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode === 'month') weekRowRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [viewMode, currentDate]);

  const handleDrop = (e:React.DragEvent, day:Date) => { e.preventDefault(); const id=e.dataTransfer.getData('taskId'); if(id) storeMove(id,day); };
  const handleDayPaste = (day:Date) => { if(clipboardTaskId){clipboardMode==='copy'?storeCopy(clipboardTaskId,day):storeMove(clipboardTaskId,day);clearClipboard();} };
  const openNew = (day:Date) => { if(clipboardTaskId){handleDayPaste(day);}else{setSelectedDate(day);setEditingTask(null);setTaskModalOpen(true);} };

  const prevLabel = viewMode==='month'
    ? format(currentDate,'LLLL yyyy',{locale:uk})
    : (viewMode==='day' || viewMode==='timeline')
    ? format(dayDate,'d MMMM',{locale:uk})
    : `${format(weekStart,'d MMM',{locale:uk})} – ${format(addDays(weekStart,6),'d MMM',{locale:uk})}`;

  const prev = () => {
    if(viewMode==='month') setCurrentDate(d=>addMonths(d,-1));
    else if(viewMode==='day' || viewMode==='timeline') setDayDate(d=>addDays(d,-1));
    else setCurrentDate(d=>addDays(d,-7));
  };
  const next = () => {
    if(viewMode==='month') setCurrentDate(d=>addMonths(d,1));
    else if(viewMode==='day' || viewMode==='timeline') setDayDate(d=>addDays(d,1));
    else setCurrentDate(d=>addDays(d,7));
  };

  if (viewMode==='day') return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
          {(['month','week','timeline','day'] as const).map(m=>(
            <button key={m} onClick={()=>setViewMode(m)} className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode===m?'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm':'text-slate-500'}`}>
              {m==='month'?'Місяць':m==='week'?'Тиждень':m==='timeline'?'Таймлайн':'День'}
            </button>
          ))}
        </div>
        <button onClick={()=>setImportOpen(true)} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1.5 rounded-lg"><Upload className="w-3.5 h-3.5"/></button>
      </div>
      <ImportModal isOpen={importOpen} onClose={()=>setImportOpen(false)}/>
      <DayView day={dayDate} onPrev={prev} onNext={next}/>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-1.5">
          <button onClick={prev} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
          <button onClick={()=>setMonthPickerOpen(true)} className="text-sm font-bold text-slate-700 dark:text-white hover:text-indigo-600 px-1 capitalize min-w-[100px] text-center">
            {prevLabel}
          </button>
          <button onClick={next} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"><ChevronRight className="w-4 h-4"/></button>
        </div>
        <div className="flex items-center gap-1.5">
          {activeProjectFilter&&<span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg hidden sm:block"># {activeProjectFilter}</span>}
          <div className="flex bg-slate-100 dark:bg-slate-700 p-0.5 rounded-lg">
            {(['month','week','timeline','day'] as const).map(m=>(
              <button key={m} onClick={()=>{ setViewMode(m); if(m==='day'||m==='timeline') setDayDate(TODAY); }}
                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${viewMode===m?'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm':'text-slate-500'}`}>
                {m==='month'?'Місяць':m==='week'?'Тиждень':m==='timeline'?'Таймлайн':'День'}
              </button>
            ))}
          </div>
          <button onClick={()=>{setSelectedDate(TODAY);setEditingTask(null);setTaskModalOpen(true);}} className="flex items-center gap-1 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg uppercase"><Plus className="w-3 h-3"/></button>
          <button onClick={()=>setImportOpen(true)} className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-200 p-1.5 rounded-lg"><Upload className="w-3.5 h-3.5"/></button>
          <button onClick={()=>setCurrentDate(TODAY)} className="hidden sm:block text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1.5 rounded-lg uppercase">Сьогодні</button>
        </div>
      </div>

      {monthPickerOpen&&<MonthPicker current={currentDate} onSelect={setCurrentDate} onClose={()=>setMonthPickerOpen(false)}/>}
      <ImportModal isOpen={importOpen} onClose={()=>setImportOpen(false)}/>

      {viewMode==='timeline' ? (
        <div className="flex-1 overflow-hidden">
          <TimelineView day={dayDate} onPrev={prev} onNext={next}/>
        </div>
      ) : viewMode==='week' ? (
        // WEEK — horizontal scroll on mobile, 120px min per column, DnD for reordering
        (() => {
          const getWeekColTasks = (day: Date): Task[] => {
            const base = getTasksForDay(day);
            const order = weekOrder[day.getTime()];
            if (!order) return base;
            const map = new Map(base.map(t => [t.id, t]));
            const ordered = order.map(id => map.get(id)).filter(Boolean) as Task[];
            const inOrder = new Set(order);
            base.forEach(t => { if (!inOrder.has(t.id)) ordered.push(t); });
            return ordered;
          };
          const onWeekDragEnd = (result: DropResult) => {
            if (!result.destination) return;
            const srcTs = Number(result.source.droppableId);
            const dstTs = Number(result.destination.droppableId);
            if (srcTs === dstTs && result.source.index === result.destination.index) return;
            if (srcTs !== dstTs) {
              storeMove(result.draggableId, new Date(dstTs));
              setWeekOrder(prev => {
                const srcOrder = (prev[srcTs] || getWeekColTasks(new Date(srcTs)).map(t => t.id)).filter(id => id !== result.draggableId);
                const dstOrder = [...(prev[dstTs] || getWeekColTasks(new Date(dstTs)).map(t => t.id)).filter(id => id !== result.draggableId)];
                dstOrder.splice(result.destination!.index, 0, result.draggableId);
                return { ...prev, [srcTs]: srcOrder, [dstTs]: dstOrder };
              });
            } else {
              const current = getWeekColTasks(new Date(srcTs)).map(t => t.id);
              const next = [...current];
              const [removed] = next.splice(result.source.index, 1);
              next.splice(result.destination.index, 0, removed);
              setWeekOrder(prev => ({ ...prev, [srcTs]: next }));
            }
          };
          return (
            <DragDropContext onDragEnd={onWeekDragEnd}>
              <div className="flex-1 overflow-auto">
                <div className="grid" style={{gridTemplateColumns:'repeat(7, minmax(180px, 1fr))'}}>
                  {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, TODAY);
                    const dayTasks = getWeekColTasks(day);
                    return (
                      <div key={i}
                        className={`border-r border-b border-slate-200 dark:border-slate-700 ${isToday?'bg-indigo-50/50 dark:bg-indigo-900/10':''}`}
                        onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,day)}>
                        <div className="p-2 cursor-pointer" onClick={() => openNew(day)}>
                          <p className={`text-xs font-black capitalize ${isToday?'text-indigo-600':'text-slate-500 dark:text-slate-400'}`}>{format(day,'EEEE',{locale:uk})}</p>
                          <p className={`text-lg font-black ${isToday?'text-indigo-600':'text-slate-800 dark:text-white'}`}>{format(day,'d')}</p>
                          {dayTasks.length>0&&<p className="text-[9px] text-slate-400">{dayTasks.length} завд.</p>}
                        </div>
                        <Droppable droppableId={String(day.getTime())}>
                          {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}
                              className={`px-2 pb-2 min-h-[20px] ${snapshot.isDraggingOver?'bg-indigo-50/50 dark:bg-indigo-900/10':''}`}>
                              {dayTasks.map((t, idx) => (
                                <Draggable key={t.id} draggableId={t.id} index={idx}>
                                  {(prov, snap) => (
                                    <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                      className={snap.isDragging?'opacity-80 shadow-md':''}
                                      onClick={e => e.stopPropagation()}>
                                      <WeekTaskCard task={t}/>
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
                </div>
              </div>
            </DragDropContext>
          );
        })()
      ) : (
        // MONTH — weekdays 2fr, weekends 1fr
        <div className="flex-1 overflow-auto">
          <div className="grid min-w-[360px]" style={{gridTemplateColumns:'repeat(5, 2fr) 1fr 1fr'}}>
            {(['Пн','Вт','Ср','Чт','Пт','Сб','Нд'] as const).map((l,i)=>{
              const isWknd = i >= 5;
              return (
                <div key={l} className={`text-center font-bold uppercase tracking-widest border-b border-r border-slate-200 dark:border-slate-700
                  ${isWknd
                    ? 'p-1 text-[8px] text-slate-400 bg-slate-100/70 dark:bg-slate-900/50'
                    : 'p-1.5 text-[9px] text-slate-500 bg-slate-50 dark:bg-slate-900/30'
                  }`}>{l}</div>
              );
            })}
            {monthDays.map((day,i)=>{
              const dayTasks=getTasksForDay(day), isToday=isSameDay(day,TODAY), isCurMonth=isSameMonth(day,currentDate);
              const isWknd = day.getDay()===0||day.getDay()===6;
              const isScrollAnchor = isSameDay(day, todayWeekMonday);
              return (
                <div key={i} ref={isScrollAnchor ? weekRowRef : undefined} onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e,day)} onClick={()=>openNew(day)}
                  className={`border-b border-r border-slate-200 dark:border-slate-700 flex flex-col cursor-pointer group transition-colors
                    ${isWknd
                      ? 'p-1 min-h-[60px] bg-slate-50/80 dark:bg-slate-900/20 hover:bg-slate-100/80 dark:hover:bg-slate-800/20'
                      : 'p-1.5 min-h-[80px] hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }
                    ${!isCurMonth?'opacity-40':''}
                    ${isToday?'ring-2 ring-inset ring-indigo-500':''}`}>
                  <div className="flex justify-between items-center mb-0.5">
                    <span className={`font-bold flex items-center justify-center rounded-full
                      ${isWknd ? 'text-[10px] w-4 h-4' : 'text-xs w-5 h-5'}
                      ${isToday?'bg-indigo-600 text-white':isCurMonth?'text-slate-500 dark:text-slate-300':'text-slate-300'}`}>
                      {format(day,'d')}
                    </span>
                    {dayTasks.length>0&&<span className={`font-black text-slate-400 ${isWknd?'text-[7px]':'text-[9px]'}`}>{dayTasks.length}</span>}
                  </div>
                  <div className="flex-1 space-y-px overflow-hidden">
                    {dayTasks.map(t=><MonthTaskDot key={t.id} task={t}/>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
