import { useState } from 'react';
import { Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { THEME_OPTIONS } from '../../lib/themes';
import { TaskColorModeToggle } from '../../components/ThemeSwitcher';



export function AppearanceTab() {
  const { theme, setTheme } = useAppStore();
  const [accent, setAccent] = useState<'blue' | 'green' | 'orange' | 'purple'>('blue');
  const [fontSize, setFontSize] = useState(1);
  const [density, setDensity] = useState<'compact' | 'standard' | 'relaxed'>('standard');

  const accents = [
    { id: 'blue' as const, label: 'Vibrant Blue', color: '#6366f1' },
    { id: 'green' as const, label: 'Green', color: '#10b981' },
    { id: 'orange' as const, label: 'Orange', color: '#f97316' },
    { id: 'purple' as const, label: 'Purple', color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Тема</label>
        <div className="grid grid-cols-2 gap-2">
          {THEME_OPTIONS.map(t => {
            const active = theme === t.id;
            const p = t.preview;
            return (
              <button key={t.id} onClick={() => setTheme(t.id)} aria-pressed={active}
                className={`text-left rounded-xl border-2 p-2 transition-all ${active ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                {/* Mini preview — fixed colours so each card shows its own theme */}
                <div className="flex h-16 rounded-lg overflow-hidden mb-2" style={{ background: p.canvas, border: `1px solid ${p.border}` }}>
                  <div className="w-1/4 p-1.5 space-y-1" style={{ background: p.sidebar }}>
                    <div className="h-1.5 rounded-full" style={{ background: p.accent, width: '70%' }}/>
                    <div className="h-1 rounded-full opacity-60" style={{ background: p.sidebarText }}/>
                    <div className="h-1 rounded-full opacity-40" style={{ background: p.sidebarText, width: '80%' }}/>
                  </div>
                  <div className="flex-1 p-1.5 space-y-1">
                    <div className="h-2 rounded w-1/2" style={{ background: p.text, fontFamily: p.serif ? 'serif' : undefined, opacity: 0.85 }}/>
                    <div className="rounded p-1 space-y-0.5" style={{ background: p.card, border: `1px solid ${p.border}` }}>
                      <div className="h-1 rounded-full opacity-50" style={{ background: p.text }}/>
                      <div className="h-1 rounded-full opacity-30 w-2/3" style={{ background: p.text }}/>
                    </div>
                    <div className="h-2 w-1/3 rounded" style={{ background: p.accent }}/>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-0.5">
                  <span className={`text-xs font-bold ${active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}>{t.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-auto"/>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Колір задач у календарі</label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
          «Статус»: заплановані — сталеві сині, в роботі — теракотові зі смугами, виконані — сірі; проєкт показано міткою праворуч.
        </p>
        <TaskColorModeToggle/>
      </div>

      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Колір акценту</label>
        <div className="grid grid-cols-2 gap-2">
          {accents.map(a => (
            <button key={a.id} onClick={() => setAccent(a.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all ${accent === a.id ? 'border-slate-400 dark:border-slate-300' : 'border-slate-200 dark:border-slate-600'}`}>
              <div className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: a.color }}/>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{a.label}</span>
              {accent === a.id && <Check className="w-4 h-4 text-slate-600 dark:text-white ml-auto shrink-0"/>}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">
          Розмір шрифту — <span className="text-indigo-600">{['Малий', 'Середній', 'Великий'][fontSize]}</span>
        </label>
        <input type="range" min={0} max={2} step={1} value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
          className="w-full accent-indigo-600"/>
        <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-bold uppercase">
          <span>Small</span><span>Medium</span><span>Large</span>
        </div>
      </div>

      <div>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Щільність</label>
        <div className="flex gap-2">
          {(['compact', 'standard', 'relaxed'] as const).map(d => (
            <button key={d} onClick={() => setDensity(d)}
              className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${density === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}>
              {d === 'compact' ? 'Compact' : d === 'standard' ? 'Standard' : 'Relaxed'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
