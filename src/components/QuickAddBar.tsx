import { useState, useRef } from 'react';
import { CornerDownLeft, Plus, Calendar, Clock, Repeat, Flag } from 'lucide-react';
import { useTaskStore, PROJECTS, getProjectColor } from '../store/useTaskStore';
import { useToastStore } from '../store/useToastStore';
import { parseTaskInput } from '../utils/parseTaskInput';

interface Props {
  date?: Date;
  defaultProject?: string;
  placeholder?: string;
}

export function QuickAddBar({ date, defaultProject, placeholder = 'Нова задача... (завтра о 14:00 #ACAT !high)' }: Props) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(defaultProject || PROJECTS[0].name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskStore();
  const addToast = useToastStore(s => s.addToast);
  const projectNames = PROJECTS.map(p => p.name);

  const parsed = title.trim()
    ? parseTaskInput(title, new Date(), projectNames)
    : null;

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const p = parseTaskInput(trimmed, new Date(), projectNames);
    const resolvedProject = p.project || project;

    addTask({
      title: p.title || trimmed,
      project: resolvedProject,
      status: 'todo',
      date: p.date || date || new Date(),
      tagColor: getProjectColor(resolvedProject),
      someday: false,
      priority: p.priority,
      time: p.time,
      recurring: p.recurring,
      recurringType: p.recurringType as any,
      notifyAtTime: p.time ? true : undefined,
    });

    addToast({ type: 'success', message: `«${p.title || trimmed}» додано` });
    setTitle('');
    inputRef.current?.focus();
  };

  return (
    <div className="w-full mb-3 shrink-0">
      <div
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        onClick={() => inputRef.current?.focus()}
      >
        <Plus className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0"/>
        <input
          ref={inputRef}
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); submit(); }
            if (e.key === 'Escape') { setTitle(''); inputRef.current?.blur(); }
          }}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent outline-none text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-600 min-w-0"
        />
        <select
          value={project}
          onChange={e => setProject(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-transparent border-none outline-none cursor-pointer shrink-0 max-w-[80px] truncate"
        >
          {PROJECTS.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
        </select>
        <button
          onClick={e => { e.stopPropagation(); submit(); }}
          disabled={!title.trim()}
          className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-25 transition-colors shrink-0"
          title="Додати (Enter)"
        >
          <CornerDownLeft className="w-3 h-3"/>
        </button>
      </div>

      {/* Preview row — only shown when parser detected something */}
      {parsed && (parsed.date || parsed.time || parsed.priority || parsed.project || parsed.recurring) && (
        <div className="flex items-center gap-3 mt-1.5 px-3 text-[10px] text-slate-400 dark:text-slate-500 flex-wrap">
          {parsed.date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3"/>
              {parsed.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' })}
            </span>
          )}
          {parsed.time && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3"/>
              {parsed.time}
            </span>
          )}
          {parsed.recurring && (
            <span className="flex items-center gap-1">
              <Repeat className="w-3 h-3"/>
              {parsed.recurringType === 'daily' ? 'щодня'
                : parsed.recurringType === 'weekdays' ? 'по буднях'
                : parsed.recurringType === 'monthly' ? 'щомісяця'
                : 'щотижня'}
            </span>
          )}
          {parsed.priority && (
            <span className={`flex items-center gap-1 font-bold ${parsed.priority === 'high' ? 'text-rose-400' : parsed.priority === 'medium' ? 'text-amber-400' : 'text-slate-400'}`}>
              <Flag className="w-3 h-3"/>
              {parsed.priority === 'high' ? 'Висока' : parsed.priority === 'medium' ? 'Середня' : 'Низька'}
            </span>
          )}
          {parsed.project && (
            <span className="text-indigo-400 font-bold">#{parsed.project}</span>
          )}
        </div>
      )}
    </div>
  );
}
