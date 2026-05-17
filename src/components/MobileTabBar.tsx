import { useState } from 'react';
import { Sun, Calendar, Columns, CheckSquare, MoreHorizontal, BarChart2, Target, Settings, X } from 'lucide-react';
import { useAppStore, ActiveView } from '../store/useAppStore';

const MAIN_TABS: { view: ActiveView; icon: typeof Sun; label: string }[] = [
  { view: 'today', icon: Sun, label: 'День' },
  { view: 'calendar', icon: Calendar, label: 'Календар' },
  { view: 'board', icon: Columns, label: 'Дошка' },
  { view: 'tasks', icon: CheckSquare, label: 'Завдання' },
];

const MORE_ITEMS: { view: ActiveView; icon: typeof BarChart2; label: string; desc: string }[] = [
  { view: 'stats', icon: BarChart2, label: 'Статистика', desc: 'Аналітика та графіки' },
  { view: 'focus', icon: Target, label: 'Фокус', desc: 'Pomodoro таймер' },
  { view: 'settings', icon: Settings, label: 'Налаштування', desc: 'Профіль та вигляд' },
];

export function MobileTabBar() {
  const { activeView, setActiveView } = useAppStore();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = ['stats', 'focus', 'settings'].includes(activeView);

  return (
    <>
      {/* Bottom sheet overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/50"/>
          <div className="absolute bottom-16 left-0 right-0 bg-white dark:bg-slate-800 rounded-t-2xl border-t border-slate-200 dark:border-slate-700 p-4 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Ще</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-4 h-4"/>
              </button>
            </div>
            <div className="space-y-1">
              {MORE_ITEMS.map(item => {
                const Icon = item.icon;
                const active = activeView === item.view;
                return (
                  <button key={item.view} onClick={() => { setActiveView(item.view); setMoreOpen(false); }}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl transition-colors text-left
                      ${active ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-indigo-600' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`}/>
                    </div>
                    <div>
                      <p className={`text-sm font-bold ${active ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-800 dark:text-white'}`}>{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex items-center safe-area-bottom">
        {MAIN_TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeView === tab.view;
          return (
            <button key={tab.view} onClick={() => { setActiveView(tab.view); setMoreOpen(false); }}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative">
              <Icon className={`w-5 h-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`}/>
              <span className={`text-[9px] font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{tab.label}</span>
              {active && <div className="absolute bottom-0 w-8 h-0.5 bg-indigo-600 rounded-t-full"/>}
            </button>
          );
        })}
        <button onClick={() => setMoreOpen(!moreOpen)}
          className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors relative">
          <MoreHorizontal className={`w-5 h-5 ${isMoreActive || moreOpen ? 'text-indigo-600' : 'text-slate-400'}`}/>
          <span className={`text-[9px] font-bold ${isMoreActive || moreOpen ? 'text-indigo-600' : 'text-slate-400'}`}>Ще</span>
        </button>
      </nav>
    </>
  );
}
