import { LayoutGrid, List, Circle, Clock, CheckCircle2, Plus, Repeat, Table, GripVertical, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useTaskStore, Task, TaskStatus } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { TaskContextMenu } from '../components/TaskContextMenu';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const TAG: Record<string,string> = {
  blue:'bg-blue-50 text-blue-700', indigo:'bg-indigo-50 text-indigo-700',
  purple:'bg-purple-50 text-purple-700', emerald:'bg-emerald-50 text-emerald-700',
  amber:'bg-amber-50 text-amber-700', rose:'bg-rose-50 text-rose-700', slate:'bg-slate-100 text-slate-600',
};
const DOT: Record<string,string> = {
  blue:'bg-blue-400',indigo:'bg-indigo-400',purple:'bg-purple-400',
  emerald:'bg-emerald-400',amber:'bg-amber-400',rose:'bg-rose-400',slate:'bg-slate-400',
};

type Ctx = { x: number; y: number; task: Task };

function TaskCard({ task, isSelected, onSelect, onDoubleClick, onContextMenu, noDrag = false }: {
  task: Task;
  isSelected: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  noDrag?: boolean;
}) {
  const isIP = task.status === 'in_progress';
  const sub = task.subtasks || [], subDone = sub.filter(s => s.done).length;
  const cardCls = `rounded-xl shadow-sm border-b-2 transition-all cursor-pointer select-none
    ${isIP ? 'bg-amber-50 dark:bg-amber-900/20 border-b-amber-400 ring-2 ring-amber-300/30'
      : task.status === 'done' ? 'bg-slate-50 dark:bg-slate-800/50 border-b-emerald-400 opacity-70'
      : isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-b-indigo-400 ring-2 ring-indigo-200'
      : 'bg-white dark:bg-slate-800 border-b-indigo-200 hover:shadow-md'}`;
  return (
    <div
      onContextMenu={e => { e.preventDefault(); onContextMenu(e); }}
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      style={{ touchAction: noDrag ? 'pan-y' : 'none' }}
      className={cardCls}
    >
      {/* Mobile: compact 2-row layout, no status label, no grip */}
      <div className="md:hidden px-3 py-2.5">
        <div className="flex items-start gap-2.5">
          <div className="shrink-0 mt-0.5">
            {task.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/>
              : isIP ? <Clock className="w-4 h-4 text-amber-500 animate-pulse"/>
              : <Circle className="w-4 h-4 text-slate-300"/>}
          </div>
          <p className={`flex-1 text-sm font-semibold leading-snug min-w-0 ${task.status === 'done' ? 'line-through text-slate-400' : isIP ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-white'}`}>
            {task.title}
          </p>
          <button onClick={e => { e.stopPropagation(); onContextMenu(e); }}
            className="shrink-0 p-1 -mr-1 rounded text-slate-400 hover:text-slate-600">
            <MoreVertical className="w-4 h-4"/>
          </button>
        </div>
        <div className="flex items-center gap-2 mt-1 ml-[26px]">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${TAG[task.tagColor] || TAG.slate}`}>{task.project}</span>
          {task.recurring && <Repeat className="w-2.5 h-2.5 text-slate-300"/>}
          <span className="text-[10px] text-slate-400 ml-auto">{format(new Date(task.date),'d MMM',{locale:uk})}</span>
        </div>
        {sub.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 ml-[26px]">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden flex-1">
              <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round((subDone/sub.length)*100)}%`}}/>
            </div>
            <span className="text-[9px] text-slate-400 font-bold">{subDone}/{sub.length}</span>
          </div>
        )}
      </div>

      {/* Desktop: full layout with status label + grip */}
      <div className="hidden md:block p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          {task.status === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-500"/>
            : isIP ? <Clock className="w-3 h-3 text-amber-500 animate-pulse"/>
            : <Circle className="w-3 h-3 text-slate-300"/>}
          <span className={`text-[9px] font-black tracking-widest uppercase flex-1 ${isIP ? 'text-amber-600' : task.status === 'done' ? 'text-emerald-600' : 'text-slate-400'}`}>
            {task.status === 'done' ? 'ГОТОВО' : isIP ? 'В ПРОЦЕСІ' : 'ЗАПЛАНОВАНО'}
          </span>
          {task.recurring && <Repeat className="w-2.5 h-2.5 text-slate-300"/>}
          <button onClick={e => { e.stopPropagation(); onContextMenu(e); }}
            className="p-0.5 rounded text-slate-200 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-3.5 h-3.5"/>
          </button>
          <GripVertical className="w-3 h-3 text-slate-200 opacity-50"/>
        </div>
        <p className={`text-sm font-semibold mb-2 leading-snug ${task.status === 'done' ? 'line-through text-slate-400' : isIP ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-white'}`}>
          {task.title}
        </p>
        {sub.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden flex-1">
              <div className="h-full bg-emerald-500 rounded-full" style={{width:`${Math.round((subDone/sub.length)*100)}%`}}/>
            </div>
            <span className="text-[9px] text-slate-400 font-bold">{subDone}/{sub.length}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${TAG[task.tagColor] || TAG.slate}`}>{task.project}</span>
          <span className="text-[9px] text-slate-400">{format(new Date(task.date),'d MMM',{locale:uk})}</span>
        </div>
      </div>
    </div>
  );
}


function TableView({ tasks, onEdit, onMove }: { tasks:Task[]; onEdit:(t:Task)=>void; onMove:(id:string,s:TaskStatus)=>void }) {
  const [ctx, setCtx] = useState<Ctx | null>(null);
  return (
    <>
      {ctx && <TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={() => setCtx(null)}/>}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-full">Назва</th>
              <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Статус</th>
              <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap hidden sm:table-cell">Проєкт</th>
              <th className="text-left px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap hidden md:table-cell">Дата</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const isIP = t.status === 'in_progress', sub = t.subtasks || [], subDone = sub.filter(s => s.done).length;
              return (
                <tr key={t.id}
                  className={`border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors group
                    ${isIP ? 'bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50' : t.status === 'done' ? 'opacity-50 hover:bg-slate-50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                  onDoubleClick={() => onEdit(t)}
                  onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, task: t }); }}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[t.tagColor] || 'bg-slate-400'}`}/>
                      <span className={`font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : isIP ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-white'}`}>{t.title}</span>
                      {t.recurring && <Repeat className="w-3 h-3 text-slate-300"/>}
                      {sub.length > 0 && <span className="text-[9px] text-slate-400 font-bold">✓{subDone}/{sub.length}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={e => { e.stopPropagation(); onMove(t.id, t.status === 'done' ? 'todo' : t.status === 'in_progress' ? 'done' : 'in_progress'); }}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 whitespace-nowrap
                        ${isIP ? 'bg-amber-100 text-amber-700' : t.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {t.status === 'done' ? <><CheckCircle2 className="w-3 h-3"/> Готово</> : isIP ? <><Clock className="w-3 h-3 animate-pulse"/> В процесі</> : <><Circle className="w-3 h-3"/> Заплановано</>}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 hidden sm:table-cell">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${TAG[t.tagColor] || TAG.slate}`}>{t.project}</span>
                  </td>
                  <td className="px-3 py-2.5 hidden md:table-cell">
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{format(new Date(t.date),'d MMM yyyy',{locale:uk})}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function ProjectBoard() {
  const [view, setView] = useState<'board'|'list'|'table'>('board');
  const { getFilteredTasks, moveTask, activeProjectFilter } = useTaskStore();
  const { setTaskModalOpen, setEditingTask } = useAppStore();
  const all = getFilteredTasks();
  const backlog = all.filter(t => t.status === 'todo');
  const inprog = all.filter(t => t.status === 'in_progress');
  const done = all.filter(t => t.status === 'done');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [mobileTab, setMobileTab] = useState<TaskStatus>('todo');

  // Column order state — each key is a TaskStatus
  const [colOrder, setColOrder] = useState<Record<string, string[]>>({
    todo: [], in_progress: [], done: [],
  });

  // Reset order when project filter changes so stale order from another project doesn't bleed through
  useEffect(() => {
    setColOrder({
      todo: backlog.map(t => t.id),
      in_progress: inprog.map(t => t.id),
      done: done.map(t => t.id),
    });
  }, [activeProjectFilter]);

  // Merge to preserve manual order when tasks are added or deleted within the current filter
  useEffect(() => {
    const merge = (existing: string[], current: string[]) => {
      const set = new Set(current);
      return [
        ...existing.filter(id => set.has(id)),
        ...current.filter(id => !existing.includes(id)),
      ];
    };
    setColOrder(prev => ({
      todo: merge(prev.todo, backlog.map(t => t.id)),
      in_progress: merge(prev.in_progress, inprog.map(t => t.id)),
      done: merge(prev.done, done.map(t => t.id)),
    }));
  }, [all.length]);

  const edit = (t: Task) => { setEditingTask(t); setTaskModalOpen(true); };

  const getColTasks = (status: TaskStatus, base: Task[]): Task[] => {
    const order = colOrder[status];
    if (!order || order.length === 0) return base;
    const map = new Map(base.map(t => [t.id, t]));
    const ordered = order.map(id => map.get(id)).filter(Boolean) as Task[];
    const inOrder = new Set(order);
    base.forEach(t => { if (!inOrder.has(t.id)) ordered.push(t); });
    return ordered;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStatus = source.droppableId as TaskStatus;
    const dstStatus = destination.droppableId as TaskStatus;

    if (srcStatus !== dstStatus) {
      // Cross-column → change status
      moveTask(draggableId, dstStatus);
      setColOrder(prev => ({
        ...prev,
        [srcStatus]: prev[srcStatus].filter(id => id !== draggableId),
        [dstStatus]: [
          ...prev[dstStatus].slice(0, destination.index),
          draggableId,
          ...prev[dstStatus].slice(destination.index),
        ],
      }));
    } else {
      // Same column → reorder
      const next = [...colOrder[srcStatus]];
      const [removed] = next.splice(source.index, 1);
      next.splice(destination.index, 0, removed);
      setColOrder(prev => ({ ...prev, [srcStatus]: next }));
    }
  };

  const cols = [
    { status: 'todo' as TaskStatus, title: 'Беклог', tasks: getColTasks('todo', backlog), badge: 'bg-slate-200 text-slate-600' },
    { status: 'in_progress' as TaskStatus, title: 'В процесі', tasks: getColTasks('in_progress', inprog), badge: 'bg-amber-100 text-amber-700' },
    { status: 'done' as TaskStatus, title: 'Завершено', tasks: getColTasks('done', done), badge: 'bg-emerald-100 text-emerald-700' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden" onClick={() => setSelectedId(null)}>
      {ctx && <TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={() => setCtx(null)}/>}

      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">{activeProjectFilter ? `# ${activeProjectFilter}` : 'Поточний спринт'}</h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{all.length}</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={e => { e.stopPropagation(); setEditingTask(null); setTaskModalOpen(true); }}
              className="flex items-center gap-1 text-[10px] font-black text-white bg-indigo-600 hover:bg-indigo-700 px-2.5 py-1.5 rounded-lg uppercase">
              <Plus className="w-3 h-3"/> Задача
            </button>
            <div className="flex gap-0.5 bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg">
              <button onClick={() => setView('list')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${view === 'list' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}><List className="w-3 h-3"/></button>
              <button onClick={() => setView('board')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${view === 'board' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500'}`}><LayoutGrid className="w-3 h-3"/></button>
              <button onClick={() => setView('table')} className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 ${view === 'table' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'}`}><Table className="w-3 h-3"/></button>
            </div>
          </div>
        </div>

        {view === 'board' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Mobile tabs */}
            <div className="flex md:hidden shrink-0 border-b border-slate-200 dark:border-slate-700 mb-2">
              {cols.map(col => (
                <button key={col.status} onClick={() => setMobileTab(col.status)}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wide flex items-center justify-center gap-1.5 transition-all
                    ${mobileTab === col.status ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  {col.title}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mobileTab === col.status ? 'bg-indigo-100 text-indigo-700' : col.badge}`}>
                    {col.tasks.length}
                  </span>
                </button>
              ))}
            </div>
            {/* Mobile single column */}
            <div className="flex-1 md:hidden overflow-y-auto space-y-2">
              {cols.find(c => c.status === mobileTab)!.tasks.map(t => (
                <TaskCard key={t.id} task={t} noDrag
                  isSelected={selectedId === t.id}
                  onSelect={() => setSelectedId(t.id === selectedId ? null : t.id)}
                  onDoubleClick={() => edit(t)}
                  onContextMenu={e => setCtx({ x: e.clientX, y: e.clientY, task: t })}/>
              ))}
              {cols.find(c => c.status === mobileTab)!.tasks.length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm font-semibold">Задач немає</div>
              )}
            </div>
            {/* Desktop kanban with DnD */}
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="hidden md:flex flex-1 overflow-x-auto overflow-y-hidden">
                <div className="flex gap-3 h-full" style={{minWidth:'780px'}}>
                  {cols.map(col => (
                    <div key={col.status} className="flex-1 bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-y-auto min-h-0 min-w-[240px]">
                      <div className="flex items-center justify-between mb-3 px-1 shrink-0">
                        <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">{col.title}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>{col.tasks.length}</span>
                      </div>
                      <Droppable droppableId={col.status}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.droppableProps}
                            className={`flex-1 space-y-2 min-h-[40px] rounded-lg transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                            {col.tasks.map((t, i) => (
                              <Draggable key={t.id} draggableId={t.id} index={i}>
                                {(prov, snap) => (
                                  <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                                    className={`group ${snap.isDragging ? 'opacity-80 shadow-xl' : ''}`}>
                                    <TaskCard task={t}
                                      isSelected={selectedId === t.id}
                                      onSelect={() => setSelectedId(t.id === selectedId ? null : t.id)}
                                      onDoubleClick={() => edit(t)}
                                      onContextMenu={e => setCtx({ x: e.clientX, y: e.clientY, task: t })}/>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {col.tasks.length === 0 && !snapshot.isDraggingOver && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Circle className="w-7 h-7 text-slate-200 dark:text-slate-700 mb-2"/>
                                <p className="text-xs text-slate-300 dark:text-slate-600 font-semibold">Немає задач</p>
                                <p className="text-[10px] text-slate-200 dark:text-slate-700 mt-0.5">Перетягніть сюди</p>
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </div>
            </DragDropContext>
          </div>
        )}

        {view === 'list' && (
          <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto">
            {all.map(t => (
              <div key={t.id}
                onContextMenu={e => { e.preventDefault(); setCtx({ x: e.clientX, y: e.clientY, task: t }); }}
                onClick={e => { e.stopPropagation(); setSelectedId(t.id === selectedId ? null : t.id); }}
                onDoubleClick={e => { e.stopPropagation(); edit(t); }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none
                  ${t.status === 'in_progress' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
                    : selectedId === t.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-indigo-200'}`}>
                {t.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0"/> : t.status === 'in_progress' ? <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0"/> : <Circle className="w-4 h-4 text-slate-300 shrink-0"/>}
                <p className={`flex-1 text-sm font-semibold ${t.status === 'done' ? 'line-through text-slate-400' : t.status === 'in_progress' ? 'text-amber-900 dark:text-amber-100' : 'text-slate-800 dark:text-white'}`}>{t.title}</p>
                {t.recurring && <Repeat className="w-3 h-3 text-slate-300 shrink-0"/>}
                {(t.subtasks || []).length > 0 && <span className="text-[9px] text-slate-400 font-bold">✓{(t.subtasks || []).filter(s => s.done).length}/{(t.subtasks || []).length}</span>}
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${TAG[t.tagColor] || TAG.slate}`}>{t.project}</span>
                <span className="text-[10px] text-slate-400 shrink-0 hidden sm:block">{format(new Date(t.date),'d MMM',{locale:uk})}</span>
              </div>
            ))}
          </div>
        )}

        {view === 'table' && <TableView tasks={all} onEdit={edit} onMove={moveTask}/>}
      </div>
    </div>
  );
}
