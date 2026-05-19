import { useState, useRef } from 'react';
import { Plus, CheckCircle2, Clock, Circle, Repeat, Star, GripVertical, ChevronDown, Check } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { useTaskStore, Task, TaskStatus } from '../store/useTaskStore';
import { useAppStore } from '../store/useAppStore';
import { TaskContextMenu } from '../components/TaskContextMenu';

const TODAY = new Date();

const TAG: Record<string,string> = {
  blue:'bg-blue-100 text-blue-700', indigo:'bg-indigo-100 text-indigo-700',
  purple:'bg-purple-100 text-purple-700', emerald:'bg-emerald-100 text-emerald-700',
  amber:'bg-amber-100 text-amber-700', rose:'bg-rose-100 text-rose-700', slate:'bg-slate-100 text-slate-600',
};
const DOT: Record<string,string> = {
  blue:'bg-blue-400', indigo:'bg-indigo-400', purple:'bg-purple-400',
  emerald:'bg-emerald-400', amber:'bg-amber-400', rose:'bg-rose-400', slate:'bg-slate-400',
};

type Ctx = { x: number; y: number; task: Task };

function TodayTaskRow({ task, isSelected, isExpanded, onSelect, onEdit, onContextMenu, onToggleExpand }: {
  task: Task; isSelected: boolean; isExpanded: boolean;
  onSelect: () => void; onEdit: () => void;
  onContextMenu: (x: number, y: number) => void;
  onToggleExpand: () => void;
}) {
  const { moveTask, toggleSubtask } = useTaskStore();
  const isIP = task.status === 'in_progress';
  const hasSubtasks = !!task.subtasks?.length;

  const longPressTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  const touchOrigin = useRef({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchOrigin.current = { x: t.clientX, y: t.clientY };
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
    <div>
      <div
        className={`flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-700 group cursor-pointer px-1 rounded-lg transition-colors select-none
          ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        onClick={e => { e.stopPropagation(); onSelect(); }}
        onDoubleClick={e => { e.stopPropagation(); onEdit(); }}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onContextMenu(e.clientX, e.clientY); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button onClick={e => { e.stopPropagation(); moveTask(task.id, task.status === 'done' ? 'todo' : task.status === 'in_progress' ? 'done' : 'in_progress'); }} className="shrink-0">
          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/>
            : isIP ? <Clock className="w-5 h-5 text-amber-500 animate-pulse"/>
            : <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-400 transition-colors"/>}
        </button>
        <div className={`w-2 h-2 rounded-full shrink-0 ${DOT[task.tagColor] || 'bg-slate-400'}`}/>
        {task.priority && (
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-blue-400'}`}/>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${task.status === 'done' ? 'line-through text-slate-400' : isIP ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
          {hasSubtasks && (
            <p className="text-[10px] text-slate-400 mt-0.5">✓ {task.subtasks!.filter(s => s.done).length}/{task.subtasks!.length} підзадач</p>
          )}
        </div>
        {task.recurring && <Repeat className="w-3 h-3 text-slate-300 shrink-0"/>}
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${TAG[task.tagColor] || TAG.slate}`}>{task.project}</span>
        {hasSubtasks && (
          <button onClick={e => { e.stopPropagation(); onToggleExpand(); }} className="shrink-0 text-slate-400 hover:text-indigo-500 transition-colors p-0.5">
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}/>
          </button>
        )}
        <GripVertical className="w-4 h-4 text-slate-200 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"/>
      </div>
      {hasSubtasks && isExpanded && (
        <div className="ml-9 mr-2 mb-1 space-y-0.5">
          {task.subtasks!.map(st => (
            <div key={st.id} onClick={e => e.stopPropagation()} className="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <button onClick={e => { e.stopPropagation(); toggleSubtask(task.id, st.id); }}
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${st.done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-indigo-400'}`}>
                {st.done && <Check className="w-2.5 h-2.5 text-white"/>}
              </button>
              <span className={`text-xs flex-1 ${st.done ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>{st.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Today() {
  const { getTodayTasks, moveTask } = useTaskStore();
  const { setTaskModalOpen, setEditingTask, setSelectedDate } = useAppStore();
  const tasks = getTodayTasks();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const setSelected = (id: string | null) => {
    setSelectedId(id);
    (window as any).__setKeyboardSelectedId?.(id);
    (window as any).__notifySelectedId = setSelectedId;
  };
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [groupOrder, setGroupOrder] = useState<Record<string, string[]>>({});
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const todo = tasks.filter(t => t.status === 'todo');
  const inprog = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done');

  const todayTotal = tasks.length;
  const todayDone = done.length;
  const todayInprog = inprog.length;
  const todayPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  const toggleExpanded = (id: string) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const openEdit = (t: Task) => { setEditingTask(t); setTaskModalOpen(true); };
  const openNew = () => { setSelectedDate(TODAY); setEditingTask(null); setTaskModalOpen(true); };

  const getOrdered = (statusKey: string, base: Task[]): Task[] => {
    const order = groupOrder[statusKey];
    if (!order) return base;
    const map = new Map(base.map(t => [t.id, t]));
    const ordered = order.map(id => map.get(id)).filter(Boolean) as Task[];
    const inOrder = new Set(order);
    base.forEach(t => { if (!inOrder.has(t.id)) ordered.push(t); });
    return ordered;
  };

  const STATUS_KEYS: Record<string, TaskStatus> = {
    inprog: 'in_progress', todo: 'todo', done: 'done',
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (source.droppableId !== destination.droppableId) {
      const newStatus = STATUS_KEYS[destination.droppableId];
      if (newStatus) moveTask(draggableId, newStatus);
    } else {
      const key = source.droppableId;
      const base = key === 'inprog' ? inprog : key === 'todo' ? todo : done;
      const current = getOrdered(key, base).map(t => t.id);
      const next = [...current];
      const [removed] = next.splice(source.index, 1);
      next.splice(destination.index, 0, removed);
      setGroupOrder(prev => ({ ...prev, [key]: next }));
    }
  };

  const dayName = format(TODAY, 'EEEE', { locale: uk });
  const dayFull = format(TODAY, 'd MMMM yyyy', { locale: uk });

  const gradients = [
    'from-indigo-600 to-purple-600','from-blue-600 to-indigo-600','from-sky-500 to-blue-600',
    'from-violet-600 to-indigo-600','from-indigo-500 to-blue-500','from-purple-500 to-indigo-500','from-slate-600 to-slate-700',
  ];
  const grad = gradients[TODAY.getDay()];

  const orderedInprog = getOrdered('inprog', inprog);
  const orderedTodo = getOrdered('todo', todo);
  const orderedDone = getOrdered('done', done);

  return (
    <div className="flex flex-col h-full overflow-hidden" onClick={() => setSelectedId(null)}>
      {ctx && <TaskContextMenu x={ctx.x} y={ctx.y} task={ctx.task} onClose={() => setCtx(null)}/>}

      {/* Hero header */}
      <div className={`bg-gradient-to-br ${grad} rounded-2xl p-4 mb-3 text-white relative overflow-hidden shrink-0`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-2 right-4 text-8xl font-black text-white/20">{format(TODAY,'d')}</div>
        </div>
        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1 capitalize">{dayName}</p>
        <h1 className="text-2xl font-black mb-1">Мій день</h1>
        <p className="text-white/80 text-sm font-medium capitalize">{dayFull}</p>

        <div className="grid grid-cols-4 gap-1.5 mt-3">
          <div className="bg-white/20 rounded-lg px-1 py-1.5 text-center">
            <p className="text-base font-black">{todayTotal}</p>
            <p className="text-[8px] text-white/70 uppercase font-bold leading-tight">Всього</p>
          </div>
          <div className="bg-white/20 rounded-lg px-1 py-1.5 text-center">
            <p className="text-base font-black">{todayInprog}</p>
            <p className="text-[8px] text-white/70 uppercase font-bold leading-tight">В процесі</p>
          </div>
          <div className="bg-white/20 rounded-lg px-1 py-1.5 text-center">
            <p className="text-base font-black">{todayDone}</p>
            <p className="text-[8px] text-white/70 uppercase font-bold leading-tight">Виконано</p>
          </div>
          <div className="bg-white/20 rounded-lg px-1 py-1.5 text-center">
            <p className="text-base font-black">{todayPct}%</p>
            <p className="text-[8px] text-white/70 uppercase font-bold leading-tight">% Дня</p>
          </div>
        </div>
      </div>

      {/* Add task */}
      <button onClick={e => { e.stopPropagation(); openNew(); }}
        className="flex items-center gap-2 w-full p-3 mb-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all text-sm font-semibold shrink-0">
        <Plus className="w-4 h-4"/> Додати задачу на сьогодні
      </button>

      {/* Tasks with DnD */}
      <div className="flex-1 overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
            <p className="text-sm font-bold text-slate-400">На сьогодні задач немає</p>
            <p className="text-xs text-slate-300 mt-1">Додайте першу задачу!</p>
          </div>
        )}

        <DragDropContext onDragEnd={onDragEnd}>
          {inprog.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Clock className="w-3 h-3"/> В процесі ({inprog.length})
              </p>
              <Droppable droppableId="inprog">
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`rounded-xl px-3 border ${snapshot.isDraggingOver ? 'bg-amber-100/80 border-amber-300' : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800'}`}>
                    {orderedInprog.map((t, i) => (
                      <Draggable key={t.id} draggableId={t.id} index={i}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                            className={snap.isDragging ? 'opacity-80 shadow-lg' : ''}>
                            <TodayTaskRow task={t} isSelected={selectedId===t.id} isExpanded={expandedIds.has(t.id)}
                              onSelect={()=>setSelected(t.id===selectedId?null:t.id)} onEdit={()=>openEdit(t)}
                              onContextMenu={(x,y)=>setCtx({x,y,task:t})} onToggleExpand={()=>toggleExpanded(t.id)}/>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}

          {todo.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Заплановано ({todo.length})</p>
              <Droppable droppableId="todo">
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`rounded-xl px-3 border ${snapshot.isDraggingOver ? 'bg-indigo-50 border-indigo-200' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                    {orderedTodo.map((t, i) => (
                      <Draggable key={t.id} draggableId={t.id} index={i}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                            className={snap.isDragging ? 'opacity-80 shadow-lg' : ''}>
                            <TodayTaskRow task={t} isSelected={selectedId===t.id} isExpanded={expandedIds.has(t.id)}
                              onSelect={()=>setSelected(t.id===selectedId?null:t.id)} onEdit={()=>openEdit(t)}
                              onContextMenu={(x,y)=>setCtx({x,y,task:t})} onToggleExpand={()=>toggleExpanded(t.id)}/>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3"/> Виконано ({done.length})
              </p>
              <Droppable droppableId="done">
                {(provided, snapshot) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}
                    className={`rounded-xl px-3 border ${snapshot.isDraggingOver ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                    {orderedDone.map((t, i) => (
                      <Draggable key={t.id} draggableId={t.id} index={i}>
                        {(prov, snap) => (
                          <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}
                            className={snap.isDragging ? 'opacity-80 shadow-lg' : ''}>
                            <TodayTaskRow task={t} isSelected={selectedId===t.id} isExpanded={expandedIds.has(t.id)}
                              onSelect={()=>setSelected(t.id===selectedId?null:t.id)} onEdit={()=>openEdit(t)}
                              onContextMenu={(x,y)=>setCtx({x,y,task:t})} onToggleExpand={()=>toggleExpanded(t.id)}/>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          )}
        </DragDropContext>
      </div>
    </div>
  );
}
