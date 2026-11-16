import { useEffect, useRef, useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useAppStore, type TaskColorMode } from '../store/useAppStore';
import { THEME_OPTIONS, type ThemePreview } from '../lib/themes';

/** Small swatch: canvas / sidebar halves with an accent dot. */
function Swatch({ p }: { p: ThemePreview }) {
  return (
    <span className="relative w-5 h-5 rounded-full overflow-hidden shrink-0 flex" style={{ border: `1px solid ${p.border}` }}>
      <span className="w-1/2 h-full" style={{ background: p.sidebar }} />
      <span className="w-1/2 h-full" style={{ background: p.canvas }} />
      <span className="absolute w-2 h-2 rounded-full right-0.5 bottom-0.5" style={{ background: p.accent }} />
    </span>
  );
}

export const COLOR_MODE_OPTIONS: { id: TaskColorMode; label: string; hint: string }[] = [
  { id: 'project', label: 'Проєкт', hint: 'Колір плашки = колір проєкту' },
  { id: 'status', label: 'Статус', hint: 'Заплановано / в роботі / готово, проєкт — міткою' },
];

/** Segmented control: colour task pills by project or by status. */
export function TaskColorModeToggle({ compact }: { compact?: boolean }) {
  const { taskColorMode, setTaskColorMode } = useAppStore();
  return (
    <div className={`grid grid-cols-2 gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 ${compact ? '' : 'max-w-xs'}`}>
      {COLOR_MODE_OPTIONS.map(o => {
        const active = taskColorMode === o.id;
        return (
          <button key={o.id} onClick={() => setTaskColorMode(o.id)} title={o.hint} aria-pressed={active}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${active ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'}`}>
            {o.id === 'project'
              ? <span className="flex -space-x-0.5"><span className="w-2 h-2 rounded-full bg-blue-500"/><span className="w-2 h-2 rounded-full bg-tag-indigo-500"/><span className="w-2 h-2 rounded-full bg-emerald-500"/></span>
              : <span className="flex -space-x-0.5"><span className="w-2 h-2 rounded-full bg-planned-500"/><span className="w-2 h-2 rounded-full bg-progress-600"/><span className="w-2 h-2 rounded-full bg-slate-300"/></span>}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Header button that opens a quick theme picker. */
export function ThemeSwitcher() {
  const { theme, setTheme } = useAppStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(o => !o)} title="Тема" aria-label="Тема" aria-haspopup="menu" aria-expanded={open}
        className={`p-1.5 rounded-lg transition-colors ${open ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
        <Palette className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[200] p-1">
          <p className="px-2.5 pt-1.5 pb-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">Тема</p>
          {THEME_OPTIONS.map(t => {
            const active = theme === t.id;
            return (
              <button key={t.id} role="menuitemradio" aria-checked={active}
                onClick={() => { setTheme(t.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-semibold transition-colors ${active ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <Swatch p={t.preview} />
                <span className="flex-1">{t.label}</span>
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
          <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1.5 px-1.5 pb-1.5">
            <p className="px-1 pb-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Колір задач</p>
            <TaskColorModeToggle compact/>
          </div>
        </div>
      )}
    </div>
  );
}
