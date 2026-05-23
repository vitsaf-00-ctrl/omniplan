import { useState, useRef } from 'react';
import { CornerDownLeft, Plus } from 'lucide-react';
import { useTaskStore, PROJECTS, getProjectColor } from '../store/useTaskStore';
import { useToastStore } from '../store/useToastStore';

interface Props {
  date?: Date;
  defaultProject?: string;
  placeholder?: string;
}

export function QuickAddBar({ date, defaultProject, placeholder = 'Нова задача...' }: Props) {
  const [title, setTitle] = useState('');
  const [project, setProject] = useState(defaultProject || PROJECTS[0].name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskStore();
  const addToast = useToastStore(s => s.addToast);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      project,
      status: 'todo',
      date: date || new Date(),
      tagColor: getProjectColor(project),
      someday: false,
    });
    addToast({ type: 'success', message: `«${trimmed}» додано` });
    setTitle('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex items-center gap-2 w-full px-3 py-2.5 mb-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus-within:border-indigo-400 dark:focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shrink-0"
      onClick={() => inputRef.current?.focus()}>
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
  );
}
