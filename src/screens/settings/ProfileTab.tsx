import { useState } from 'react';
import { User, Check } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function ProfileTab() {
  const { user } = useAppStore();
  const [name, setName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [lang, setLang] = useState('uk');
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {user?.photoURL
            ? <img src={user.photoURL} alt="" className="w-16 h-16 rounded-2xl object-cover"/>
            : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {(user?.email || 'U').slice(0, 1).toUpperCase()}
              </div>
          }
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
            <User className="w-3 h-3 text-white"/>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">{user?.displayName || user?.email || 'Користувач'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Натисни іконку щоб змінити фото</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ім'я</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Ваше ім'я"
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com"
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Мова інтерфейсу</label>
          <select value={lang} onChange={e => setLang(e.target.value)}
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
            <option value="uk">🇺🇦 Українська</option>
            <option value="en">🇬🇧 English</option>
            <option value="ru">🇷🇺 Русский</option>
          </select>
        </div>
      </div>

      <button onClick={save}
        className={`w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2
          ${saved ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
        {saved && <Check className="w-4 h-4"/>}
        {saved ? 'Збережено!' : 'Save Changes'}
      </button>
    </div>
  );
}
