export function ShortcutsTab() {
  const groups = [
    {
      title: 'Задачі',
      shortcuts: [
        { keys: ['N'], desc: 'Створити нову задачу' },
        { keys: ['Enter'], desc: 'Редагувати виділену задачу' },
        { keys: ['Space'], desc: 'Позначити як виконано / скасувати' },
        { keys: ['Delete'], desc: 'Видалити виділену задачу' },
        { keys: ['Escape'], desc: 'Зняти виділення' },
      ]
    },
    {
      title: 'Буфер обміну',
      shortcuts: [
        { keys: ['Ctrl', 'C'], desc: 'Копіювати задачу' },
        { keys: ['Ctrl', 'X'], desc: 'Вирізати задачу' },
        { keys: ['Ctrl', 'V'], desc: 'Вставити задачу' },
      ]
    },
    {
      title: 'Швидке перенесення',
      shortcuts: [
        { keys: ['T'], desc: 'Перенести на сьогодні' },
        { keys: ['M'], desc: 'Перенести на завтра' },
      ]
    },
    {
      title: 'Навігація',
      shortcuts: [
        { keys: ['Tab'], desc: 'Наступна задача' },
        { keys: ['Shift', 'Tab'], desc: 'Попередня задача' },
        { keys: ['↑'], desc: 'Вгору по списку' },
        { keys: ['↓'], desc: 'Вниз по списку' },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Гарячі клавіші працюють коли курсор не знаходиться в полі вводу. Виділіть задачу кліком щоб активувати дії з нею.
      </p>
      {groups.map(group => (
        <div key={group.title}>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{group.title}</h4>
          <div className="space-y-1.5">
            {group.shortcuts.map((s, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                <span className="text-sm text-slate-700 dark:text-slate-200">{s.desc}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {s.keys.map((k, j) => (
                    <span key={j} className="flex items-center gap-1">
                      <kbd className="px-2 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm text-slate-700 dark:text-slate-200 font-mono">
                        {k}
                      </kbd>
                      {j < s.keys.length - 1 && <span className="text-slate-400 text-[10px]">+</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
