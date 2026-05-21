import { useState } from 'react';
import { Sun, Moon, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function AppearanceTab() {
  const { theme, toggleTheme } = useAppStore();
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
          {([{ id: 'light', icon: Sun, label: 'Світла' }, { id: 'dark', icon: Moon, label: 'Темна' }] as const).map(t => {
            const Icon = t.icon;
            const active = theme === t.id;
            return (
              <button key={t.id} onClick={() => { if (theme !== t.id) toggleTheme(); }}
                className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all ${active ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                <Icon className={`w-6 h-6 ${active ? 'text-indigo-600' : 'text-slate-400'}`}/>
                <span className={`text-xs font-bold ${active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}>{t.label}</span>
                {active && <div className="w-2 h-2 rounded-full bg-indigo-600"/>}
              </button>
            );
          })}
        </div>
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
