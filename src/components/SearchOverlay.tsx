import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, CheckCircle2, Circle, Clock, Tag } from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';
import { useTaskStore, Task } from '@/src/store/useTaskStore';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

const STATUS_ICON = {
  done: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0"/>,
  in_progress: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0"/>,
  todo: <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0"/>,
};

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
};

function scoreTask(task: Task, q: string): number {
  const lq = q.toLowerCase();
  if (task.title.toLowerCase().includes(lq)) return 3;
  if (task.project.toLowerCase().includes(lq)) return 2;
  if (task.notes?.toLowerCase().includes(lq)) return 1;
  return 0;
}

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, setEditingTask, setTaskModalOpen } = useAppStore();
  const { tasks } = useTaskStore();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results = query.trim().length < 1
    ? []
    : tasks
        .map(t => ({ task: t, score: scoreTask(t, query.trim()) }))
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score || a.task.title.localeCompare(b.task.title))
        .map(x => x.task)
        .slice(0, 12);

  useEffect(() => { setCursor(0); }, [query]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setCursor(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [searchOpen]);

  const openTask = useCallback((task: Task) => {
    setSearchOpen(false);
    setEditingTask(task);
    setTaskModalOpen(true);
  }, [setSearchOpen, setEditingTask, setTaskModalOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setSearchOpen(false); return; }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCursor(c => Math.min(c + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCursor(c => Math.max(c - 1, 0));
      } else if (e.key === 'Enter' && results[cursor]) {
        openTask(results[cursor]);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchOpen, results, cursor, openTask]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[cursor] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  if (!searchOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[12vh] bg-black/40 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) setSearchOpen(false); }}
    >
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <Search className="w-4.5 h-4.5 w-[18px] h-[18px] text-slate-400 shrink-0"/>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Пошук задач..."
            className="flex-1 text-sm bg-transparent text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X className="w-4 h-4"/>
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">Esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div ref={listRef} className="max-h-80 overflow-y-auto py-1">
            {results.map((task, i) => (
              <button
                key={task.id}
                onMouseEnter={() => setCursor(i)}
                onClick={() => openTask(task)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  i === cursor
                    ? 'bg-indigo-50 dark:bg-indigo-900/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }`}
              >
                {STATUS_ICON[task.status]}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400 truncate">{task.project}</span>
                    <span className="text-slate-300 dark:text-slate-600">·</span>
                    <span className="text-[11px] text-slate-400">
                      {format(new Date(task.date), 'd MMM', { locale: uk })}
                    </span>
                    {task.priority && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${PRIORITY_DOT[task.priority]}`}/>
                      </>
                    )}
                    {task.someday && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <Tag className="w-3 h-3 text-slate-400"/>
                      </>
                    )}
                  </div>
                </div>
                {i === cursor && (
                  <kbd className="shrink-0 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">Enter</kbd>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.trim().length >= 1 && results.length === 0 && (
          <div className="py-10 text-center">
            <Search className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2"/>
            <p className="text-sm text-slate-400">Нічого не знайдено</p>
            <p className="text-xs text-slate-300 dark:text-slate-500 mt-0.5">Спробуй інший запит</p>
          </div>
        )}

        {/* Hint */}
        {query.trim().length === 0 && (
          <div className="px-4 py-3 flex items-center gap-4 text-[11px] text-slate-400">
            <span><kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">↑↓</kbd> навігація</span>
            <span><kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Enter</kbd> відкрити</span>
            <span><kbd className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">Esc</kbd> закрити</span>
          </div>
        )}
      </div>
    </div>
  );
}
