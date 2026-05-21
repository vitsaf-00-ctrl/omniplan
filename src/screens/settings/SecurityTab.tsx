import { useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';

export function SecurityTab() {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCur, setShowCur] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (!cur || !next || next !== confirm) return;
    setSaved(true);
    setCur(''); setNext(''); setConfirm('');
    setTimeout(() => setSaved(false), 2000);
  };

  const sessions = [
    { device: 'Chrome · Windows 11', location: 'Київ, Україна', time: 'Зараз', current: true },
    { device: 'Safari · iPhone 15', location: 'Київ, Україна', time: '2 год тому', current: false },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Зміна паролю</h4>
        <div className="space-y-3">
          {[
            { label: 'Поточний пароль', val: cur, set: setCur, show: showCur, toggle: () => setShowCur(!showCur) },
            { label: 'Новий пароль', val: next, set: setNext, show: false, toggle: () => {} },
            { label: 'Підтвердити новий пароль', val: confirm, set: setConfirm, show: false, toggle: () => {} },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{f.label}</label>
              <div className="relative">
                <input type={f.show || i > 0 ? 'text' : 'password'} value={f.val} onChange={e => f.set(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 pr-10 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
                {i === 0 && (
                  <button type="button" onClick={f.toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {f.show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {next && confirm && next !== confirm && (
            <p className="text-xs text-rose-500 font-semibold">Паролі не збігаються</p>
          )}
          <button onClick={save} disabled={!cur || !next || next !== confirm}
            className={`w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
              ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40'}`}>
            {saved && <Check className="w-4 h-4"/>}
            {saved ? 'Пароль змінено!' : 'Змінити пароль'}
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Активні сесії</h4>
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.current ? 'bg-emerald-500' : 'bg-slate-300'}`}/>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{s.device}</p>
                <p className="text-[10px] text-slate-400">{s.location} · {s.time}</p>
              </div>
              {s.current
                ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">Поточна</span>
                : <button className="text-[10px] font-bold text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors">Завершити</button>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
