import { useState, useEffect, useRef } from 'react';
import { X, Repeat, Trash2, Bell, ExternalLink, Plus, Check, Calendar } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, PROJECTS, getProjectColor, TaskStatus, SubTask, Priority } from '../store/useTaskStore';
import { format } from 'date-fns';

export function TaskModal() {
  const { isTaskModalOpen, setTaskModalOpen, editingTask, setEditingTask, selectedDate } = useAppStore();
  const { tasks, addTask, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask, updateSubtask } = useTaskStore();

  const [title, setTitle] = useState('');
  const [project, setProject] = useState(PROJECTS[0].name);
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [date, setDate] = useState(format(new Date(2026,4,15),'yyyy-MM-dd'));
  const [someday, setSomeday] = useState(false);
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [reminder, setReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [gcal, setGcal] = useState(false);
  const [priority, setPriority] = useState<Priority | null>(null);
  const [taskTime, setTaskTime] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  const [localSubtasks, setLocalSubtasks] = useState<SubTask[]>([]);

  useEffect(() => {
    if (!isTaskModalOpen) return;
    if (editingTask) {
      setTitle(editingTask.title); setProject(editingTask.project); setStatus(editingTask.status);
      setDate(format(new Date(editingTask.date),'yyyy-MM-dd')); setNotes(editingTask.notes||'');
      setRecurring(editingTask.recurring||false); setReminder(editingTask.reminderEnabled||false);
      setReminderTime(editingTask.reminderTime||'09:00'); setGcal(editingTask.googleCalendarSync||false);
      setSomeday(editingTask.someday||false); setPriority(editingTask.priority||null);
      setTaskTime(editingTask.time||''); setLocalSubtasks([]);
    } else {
      setTitle(''); setProject(PROJECTS[0].name); setStatus('todo');
      setDate(format(selectedDate||new Date(2026,4,15),'yyyy-MM-dd'));
      setNotes(''); setRecurring(false); setReminder(false); setReminderTime('09:00'); setGcal(false); setSomeday(false);
      setPriority(null); setTaskTime(''); setLocalSubtasks([]);
    }
    setNewSubtask('');
  }, [isTaskModalOpen, editingTask, selectedDate]);

  // ESC closes modal with unsaved-changes guard (all fields)
  const stateRef = useRef({ title, notes, project, status, date, someday, recurring, reminder, reminderTime, priority, taskTime, localSubtasks, editingTask, isTaskModalOpen });
  stateRef.current = { title, notes, project, status, date, someday, recurring, reminder, reminderTime, priority, taskTime, localSubtasks, editingTask, isTaskModalOpen };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || !stateRef.current.isTaskModalOpen) return;
      const { title, notes, project, status, date, someday, recurring, reminder, reminderTime, priority, taskTime, localSubtasks, editingTask } = stateRef.current;
      const hasChanges = editingTask
        ? title !== editingTask.title
          || notes !== (editingTask.notes || '')
          || project !== editingTask.project
          || status !== editingTask.status
          || date !== format(new Date(editingTask.date), 'yyyy-MM-dd')
          || someday !== (editingTask.someday || false)
          || recurring !== (editingTask.recurring || false)
          || reminder !== (editingTask.reminderEnabled || false)
          || reminderTime !== (editingTask.reminderTime || '09:00')
          || priority !== (editingTask.priority || null)
          || taskTime !== (editingTask.time || '')
        : title.trim() !== ''
          || notes.trim() !== ''
          || project !== PROJECTS[0].name
          || status !== 'todo'
          || someday
          || recurring
          || reminder
          || priority !== null
          || taskTime !== ''
          || localSubtasks.length > 0;
      if (hasChanges) {
        if (window.confirm('Є незбережені зміни. Закрити без збереження?')) {
          setTaskModalOpen(false); setEditingTask(null);
        }
      } else {
        setTaskModalOpen(false); setEditingTask(null);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (!isTaskModalOpen) return null;

  const close = () => { setTaskModalOpen(false); setEditingTask(null); };

  const submit = () => {
    if (!title.trim()) return;
    const data = {
      title:title.trim(), project, status,
      date: new Date(date+'T00:00:00'),
      tagColor: getProjectColor(project),
      notes:notes.trim(), recurring, someday,
      reminderEnabled:reminder, reminderTime, googleCalendarSync:gcal,
      priority: priority || undefined, time: taskTime || undefined,
    };
    if (editingTask) updateTask(editingTask.id, data);
    else addTask({ ...data, subtasks: localSubtasks.length > 0 ? localSubtasks : undefined });
    close();
  };

  const handleGcal = () => {
    const d = date.replace(/-/g,'');
    window.open(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${d}/${d}`,'_blank');
    setGcal(true);
  };

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    if (editingTask) {
      addSubtask(editingTask.id, newSubtask.trim());
    } else {
      setLocalSubtasks(prev => [...prev, { id: `local_${Date.now()}`, title: newSubtask.trim(), done: false }]);
    }
    setNewSubtask('');
  };

  const toggleLocalSubtask = (id: string) =>
    setLocalSubtasks(prev => prev.map(st => st.id === id ? { ...st, done: !st.done } : st));
  const deleteLocalSubtask = (id: string) =>
    setLocalSubtasks(prev => prev.filter(st => st.id !== id));

  // Read live subtasks from store so changes (add/toggle/delete) are reflected instantly
  const liveTask = editingTask ? tasks.find(t => t.id === editingTask.id) || null : null;
  const subtasks = editingTask ? (liveTask?.subtasks || []) : localSubtasks;
  const subtasksDone = subtasks.filter(s => s.done).length;

  const statuses: {v:TaskStatus;l:string;c:string}[] = [
    {v:'todo',l:'Заплановано',c:'bg-slate-100 text-slate-700'},
    {v:'in_progress',l:'В процесі',c:'bg-amber-100 text-amber-700'},
    {v:'done',l:'Готово',c:'bg-emerald-100 text-emerald-700'},
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={e=>e.target===e.currentTarget&&close()}>
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <h2 className="text-sm font-black text-slate-800 dark:text-white">{editingTask?'Редагувати':'Нове завдання'}</h2>
          <div className="flex items-center gap-1">
            <button onClick={handleGcal} title="Google Calendar" className={`p-1.5 rounded-lg transition-colors ${gcal?'bg-blue-100 text-blue-600':'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}><ExternalLink className="w-4 h-4"/></button>
            <button onClick={()=>setReminder(!reminder)} title="Нагадування" className={`p-1.5 rounded-lg transition-colors ${reminder?'bg-amber-100 text-amber-600':'text-slate-400 hover:bg-slate-100 hover:text-amber-600'}`}><Bell className="w-4 h-4"/></button>
            <button onClick={close} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400"><X className="w-4 h-4"/></button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto flex-1">
          <input type="text" placeholder="Назва завдання..." value={title} onChange={e=>setTitle(e.target.value)}
            className="w-full text-base font-semibold placeholder-slate-300 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 bg-white dark:bg-slate-700 dark:text-white"/>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Проєкт</label>
              <select value={project} onChange={e=>setProject(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                {PROJECTS.map(p=><option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Дата</label>
              <input type="date" value={date} onChange={e=>setDate(e.target.value)} disabled={someday}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 bg-white dark:bg-slate-700 dark:text-white focus:outline-none disabled:opacity-40"/>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-2/5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Час задачі</label>
              <input type="time" value={taskTime} onChange={e=>setTaskTime(e.target.value)}
                className="w-full text-sm font-semibold border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-2 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
            </div>
            <div className="flex-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Пріоритет</label>
              <div className="flex gap-1">
                {([['high','🔴','Високий'],['medium','🟡','Середній'],['low','🔵','Низький']] as [Priority,string,string][]).map(([p,emoji,label])=>(
                  <button key={p} type="button" onClick={()=>setPriority(priority===p?null:p)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 ${priority===p?p==='high'?'bg-red-100 border-red-400 text-red-700':p==='medium'?'bg-amber-100 border-amber-400 text-amber-700':'bg-blue-100 border-blue-400 text-blue-700':'border-slate-200 dark:border-slate-600 text-slate-400 hover:border-slate-300'}`}>
                    <span>{emoji}</span><span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Someday toggle */}
          <div onClick={()=>setSomeday(!someday)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${someday?'border-purple-400 bg-purple-50 dark:bg-purple-900/20':'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
            <Calendar className={`w-4 h-4 ${someday?'text-purple-500':'text-slate-400'}`}/>
            <p className={`text-xs font-bold flex-1 ${someday?'text-purple-700 dark:text-purple-400':'text-slate-500'}`}>Колись — без конкретної дати</p>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${someday?'border-purple-500 bg-purple-500':'border-slate-300'}`}>
              {someday&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
            </div>
          </div>

          {/* Status */}
          <div className="flex gap-1.5">
            {statuses.map(s=>(
              <button key={s.v} onClick={()=>setStatus(s.v)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${status===s.v?`${s.c} ring-2 ring-offset-1 ring-indigo-400`:'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'}`}>
                {s.l}
              </button>
            ))}
          </div>

          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Нотатка..." rows={2}
            className="w-full text-sm placeholder-slate-300 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>

          {/* Reminder */}
          {reminder && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl p-3">
              <Bell className="w-4 h-4 text-amber-500 shrink-0"/>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex-1">Нагадати о</span>
              <input type="time" value={reminderTime} onChange={e=>setReminderTime(e.target.value)}
                className="text-sm font-bold text-amber-700 border border-amber-200 rounded-lg px-2 py-1 bg-white"/>
            </div>
          )}

          {/* Recurring */}
          <div onClick={()=>setRecurring(!recurring)}
            className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${recurring?'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20':'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
            <Repeat className={`w-4 h-4 ${recurring?'text-indigo-500':'text-slate-400'}`}/>
            <p className={`text-xs font-bold flex-1 ${recurring?'text-indigo-700 dark:text-indigo-400':'text-slate-500'}`}>Повторюване щотижня</p>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${recurring?'border-indigo-500 bg-indigo-500':'border-slate-300'}`}>
              {recurring&&<div className="w-1.5 h-1.5 rounded-full bg-white"/>}
            </div>
          </div>

          {/* Subtasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                Підзадачі {subtasks.length>0&&`(${subtasksDone}/${subtasks.length})`}
              </label>
              {subtasks.length>0 && (
                <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-16">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{width:`${Math.round((subtasksDone/subtasks.length)*100)}%`}}/>
                </div>
              )}
            </div>
            <div className="space-y-1.5 mb-2">
              {subtasks.map(st=>(
                <div key={st.id} className="flex items-center gap-2 group">
                  <button onClick={()=>editingTask?toggleSubtask(editingTask.id,st.id):toggleLocalSubtask(st.id)}
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all ${st.done?'bg-emerald-500 border-emerald-500':'border-slate-300 hover:border-indigo-400'}`}>
                    {st.done&&<Check className="w-2.5 h-2.5 text-white"/>}
                  </button>
                  <span className={`flex-1 text-sm ${st.done?'line-through text-slate-400':'text-slate-700 dark:text-slate-200'}`}>{st.title}</span>
                  {st.date&&<span className="text-[9px] text-slate-400">{format(new Date(st.date),'d MMM')}</span>}
                  <button onClick={()=>editingTask?deleteSubtask(editingTask.id,st.id):deleteLocalSubtask(st.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                    <X className="w-3 h-3"/>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newSubtask} onChange={e=>setNewSubtask(e.target.value)}
                onKeyDown={e=>{ if(e.key==='Enter') handleAddSubtask(); }}
                placeholder="+ Додати підзадачу..."
                className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 dark:text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
              <button onClick={handleAddSubtask} className="bg-indigo-600 text-white px-3 rounded-lg hover:bg-indigo-700 transition-colors">
                <Plus className="w-4 h-4"/>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex gap-2 shrink-0">
          {editingTask&&<button onClick={()=>{deleteTask(editingTask.id);close();}} className="p-2.5 rounded-xl border-2 border-rose-100 text-rose-500 hover:bg-rose-50 hover:border-rose-300 transition-all"><Trash2 className="w-4 h-4"/></button>}
          <button onClick={close} className="flex-1 py-2.5 rounded-xl text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 uppercase tracking-widest">Скасувати</button>
          <button onClick={submit} disabled={!title.trim()} className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 uppercase tracking-widest">
            {editingTask?'Зберегти':'Додати'}
          </button>
        </div>
      </div>
    </div>
  );
}
