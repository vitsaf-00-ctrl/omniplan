import { useState, useRef, useEffect } from 'react';
import { Menu, Plus, Bell, Target, Search } from 'lucide-react';
import { useAppStore } from '@/src/store/useAppStore';
import { useTaskStore } from '@/src/store/useTaskStore';

const TITLES: Record<string, string> = {
  today: 'Мій день', calendar: 'Календар', board: 'Дошка',
  tasks: 'Мої завдання', settings: 'Налаштування', stats: 'Статистика', focus: 'Фокус',
};

export function Header() {
  const { setMobileMenuOpen, activeView, setTaskModalOpen, setEditingTask, setActiveView, setSearchOpen } = useAppStore();
  const { tasks } = useTaskStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toDateString();
  const notifs = tasks
    .filter(t => t.notifyAtTime && t.time && t.status !== 'done' && !t.someday
      && new Date(t.date).toDateString() === todayStr)
    .slice(0, 10);
  const unread = notifs.filter(t => !readIds.has(t.id)).length;

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen]);

  const markAllRead = () => {
    setReadIds(new Set(notifs.map(t => t.id)));
    setNotifOpen(false);
  };

  return (
    <header className="h-11 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 shrink-0">
      <div className="flex items-center gap-2">
        <button className="lg:hidden text-slate-500 p-1" onClick={() => setMobileMenuOpen(true)}>
          <Menu className="w-5 h-5"/>
        </button>
        <h2 className="text-sm font-bold text-slate-800 dark:text-white">{TITLES[activeView] || activeView}</h2>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Search button */}
        <button onClick={() => setSearchOpen(true)}
          className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg transition-all">
          <Search className="w-3.5 h-3.5"/>
          <span className="text-[11px] text-slate-400">Ctrl+F</span>
        </button>
        <button onClick={() => setSearchOpen(true)}
          className="sm:hidden p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <Search className="w-[18px] h-[18px]"/>
        </button>

        {/* Focus button */}
        <button onClick={() => setActiveView('focus')}
          className="hidden sm:flex items-center gap-1.5 text-[10px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-100 transition-all uppercase tracking-widest">
          <Target className="w-3.5 h-3.5"/> Фокус
        </button>

        {/* Notification bell */}
        <div className="relative" ref={panelRef}>
          <button onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <Bell className="w-4.5 h-4.5 w-[18px] h-[18px]"/>
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[200] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-xs font-black text-slate-700 dark:text-white">Нагадування</span>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] text-indigo-600 font-bold hover:underline">
                    Позначити всі
                  </button>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifs.length === 0 && (
                  <div className="text-center py-8">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2"/>
                    <p className="text-xs text-slate-400">Немає нагадувань</p>
                    <p className="text-[10px] text-slate-300 mt-0.5">Увімкни нагадування для задач</p>
                  </div>
                )}
                {notifs.map(t => {
                  const isRead = readIds.has(t.id);
                  return (
                    <div key={t.id} onClick={() => setReadIds(s => new Set([...s, t.id]))}
                      className={`flex items-start gap-3 px-3 py-2.5 border-b border-slate-50 dark:border-slate-700/50 last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${isRead ? 'opacity-50' : ''}`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${isRead ? 'bg-slate-300' : 'bg-amber-400'}`}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{t.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-slate-400">{t.project}</span>
                          {t.time && <>
                            <span className="text-slate-300">·</span>
                            <span className="text-[10px] text-amber-500 font-bold">{t.time}</span>
                          </>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add task */}
        <button onClick={() => { setEditingTask(null); setTaskModalOpen(true); }}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg transition-all">
          <Plus className="w-3.5 h-3.5"/><span className="hidden sm:inline">Задача</span>
        </button>
      </div>
    </header>
  );
}
