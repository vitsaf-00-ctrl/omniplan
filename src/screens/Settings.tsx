import { useState, useEffect } from 'react';
import { User, Palette, Bell, Link, Shield, Sun, Moon, Send, Mail, Check, Eye, EyeOff, Calendar, Slack, Chrome, Users, X, Clock, Wrench, Keyboard } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import {
  sendInvite, subscribeToSentInvites, subscribeToReceivedInvites,
  respondToInvite, type Invite,
} from '../lib/taskFirestore';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { getAuth } from 'firebase/auth';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

type Tab = 'profile' | 'appearance' | 'notifications' | 'integrations' | 'security' | 'team' | 'maintenance' | 'shortcuts';

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`}/>
    </button>
  );
}

function ProfileTab() {
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

function AppearanceTab() {
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
  const { settings, updateSettings } = useTaskStore();
  const [emailAlerts, setEmailAlerts] = useState(settings.notifyEmail);
  const [desktopAlerts, setDesktopAlerts] = useState(false);

  const testTelegram = async () => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return alert('Введіть токен і Chat ID');
    try {
      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: settings.telegramChatId, text: '✅ OmniPlan підключено!' }),
      });
      alert('Повідомлення надіслано!');
    } catch { alert('Помилка. Перевірте токен і Chat ID.'); }
  };

  return (
    <div className="space-y-4">
      {[
        { label: 'Email сповіщення', desc: 'Отримувати нагадування на пошту', on: emailAlerts, toggle: () => { setEmailAlerts(!emailAlerts); updateSettings({ notifyEmail: !emailAlerts }); } },
        { label: 'Desktop сповіщення', desc: 'Спливаючі сповіщення в браузері', on: desktopAlerts, toggle: () => setDesktopAlerts(!desktopAlerts) },
      ].map(item => (
        <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-white">{item.label}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
          </div>
          <Toggle on={item.on} onChange={item.toggle}/>
        </div>
      ))}

      {settings.notifyEmail && (
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Email адреса</label>
          <input type="email" value={settings.email} onChange={e => updateSettings({ email: e.target.value })}
            placeholder="your@email.com"
            className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
        </div>
      )}

      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-blue-500"/>
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-white">Telegram</p>
              <p className="text-[10px] text-slate-400">Бот нагадувань</p>
            </div>
          </div>
          <Toggle on={settings.notifyTelegram} onChange={() => updateSettings({ notifyTelegram: !settings.notifyTelegram })}/>
        </div>
        {settings.notifyTelegram && (
          <>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bot Token</label>
              <input type="text" value={settings.telegramBotToken} onChange={e => updateSettings({ telegramBotToken: e.target.value })}
                placeholder="1234567890:AAF..." className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Chat ID</label>
              <input type="text" value={settings.telegramChatId} onChange={e => updateSettings({ telegramChatId: e.target.value })}
                placeholder="-1001234567890" className="w-full text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-700 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
            </div>
            <button onClick={testTelegram} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-black py-2.5 rounded-xl uppercase tracking-widest transition-all">
              Надіслати тест
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function IntegrationsTab() {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const integrations = [
    { id: 'gcal', name: 'Google Calendar', desc: 'Синхронізація подій і задач', icon: Calendar, color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' },
    { id: 'slack', name: 'Slack', desc: 'Сповіщення в канали Slack', icon: Slack, color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800' },
    { id: 'teams', name: 'Microsoft Teams', desc: 'Інтеграція з Teams', icon: Chrome, color: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' },
    { id: 'outlook', name: 'Outlook', desc: 'Синхронізація з поштою та календарем', icon: Mail, color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' },
  ];

  return (
    <div className="space-y-3">
      {integrations.map(item => {
        const Icon = item.icon;
        const isConnected = !!connected[item.id];
        return (
          <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border ${item.color}`}>
            <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm shrink-0">
              <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300"/>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-800 dark:text-white">{item.name}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
            </div>
            <button onClick={() => setConnected(c => ({ ...c, [item.id]: !c[item.id] }))}
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all shrink-0
                ${isConnected ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
              {isConnected ? '✓ Connected' : 'Connect'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function SecurityTab() {
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

function TeamTab() {
  const { user } = useAppStore();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [sentInvites, setSentInvites] = useState<Invite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<Invite[]>([]);

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeToSentInvites(user.uid, setSentInvites);
    const u2 = user.email ? subscribeToReceivedInvites(user.email, setReceivedInvites) : () => {};
    return () => { u1(); u2(); };
  }, [user?.uid]);

  const handleInvite = async () => {
    if (!email.trim() || !user) return;
    if (email.toLowerCase() === user.email?.toLowerCase()) { setError('Не можна запросити себе'); return; }
    setSending(true); setError('');
    try {
      await sendInvite(user.uid, user.email || '', email.trim());
      setEmail(''); setSent(true); setTimeout(() => setSent(false), 3000);
    } catch {
      setError('Помилка надсилання. Спробуйте ще раз.');
    } finally { setSending(false); }
  };

  const statusBadge = (s: Invite['status']) => ({
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-500',
  }[s]);
  const statusLabel = (s: Invite['status']) => ({ pending: 'Очікує', accepted: 'Прийнято', rejected: 'Відхилено' }[s]);

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Запросити учасника</h4>
        <div className="flex gap-2">
          <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="email@example.com"
            className="flex-1 text-sm border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
          <button onClick={handleInvite} disabled={!email.trim() || sending}
            className={`px-4 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-40
              ${sent ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
            {sent ? <><Check className="w-4 h-4"/> Надіслано!</> : sending ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> : <><Send className="w-4 h-4"/> Запросити</>}
          </button>
        </div>
        {error && <p className="text-xs text-rose-500 mt-1.5 font-semibold">{error}</p>}
        <p className="text-[10px] text-slate-400 mt-2">Запрошена особа отримає доступ до ваших спільних проєктів.</p>
      </div>

      {receivedInvites.length > 0 && (
        <div>
          <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Запрошення до вас</h4>
          <div className="space-y-2">
            {receivedInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-black text-sm shrink-0">
                  {inv.fromEmail.slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{inv.fromEmail}</p>
                  <p className="text-[10px] text-slate-400">запрошує вас до спільної роботи</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => respondToInvite(inv.id, 'accepted')}
                    className="px-3 py-1.5 text-[10px] font-black uppercase bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                    Прийняти
                  </button>
                  <button onClick={() => respondToInvite(inv.id, 'rejected')}
                    className="p-1.5 text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors">
                    <X className="w-4 h-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
          Надіслані запрошення {sentInvites.length > 0 && `(${sentInvites.length})`}
        </h4>
        {sentInvites.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30"/>
            <p className="text-sm font-semibold">Ще немає запрошень</p>
            <p className="text-xs mt-1">Запросіть колег до спільної роботи</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sentInvites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-black text-sm shrink-0">
                  {inv.toEmail.slice(0,1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{inv.toEmail}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-300"/>
                    <p className="text-[10px] text-slate-400">
                      {format(inv.createdAt, 'd MMM yyyy', { locale: uk })}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusBadge(inv.status)}`}>
                  {statusLabel(inv.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MaintenanceTab() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const INVALID_DATE_STRINGS = ['2026-05-17', '1970-01-01'];

  const isInvalidDate = (date: any): boolean => {
    if (!date) return true;
    const ms = date?.toMillis ? date.toMillis() : (date?.seconds ?? 0) * 1000;
    const d = new Date(ms);
    const year = d.getFullYear();
    const isoStr = d.toISOString().slice(0, 10);
    if (year <= 1970) return true;
    if (INVALID_DATE_STRINGS.includes(isoStr)) return true;
    return false;
  };


  const [isCleaningJune, setIsCleaningJune] = useState(false);
  const [juneResult, setJuneResult] = useState<string | null>(null);

  const cleanJuneAndMay27 = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    setIsCleaningJune(true);
    setJuneResult(null);
    try {
      const tasksRef = collection(db, 'users', auth.currentUser.uid, 'tasks');
      const snapshot = await getDocs(tasksRef);
      const toDelete: string[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const ms = data.date?.toMillis ? data.date.toMillis() : (data.date?.seconds ?? 0) * 1000;
        const d = new Date(ms);
        const isJune2026 = d.getFullYear() === 2026 && d.getMonth() === 5;
        const isMay27 = d.getFullYear() === 2026 && d.getMonth() === 4 && d.getDate() === 27;
        if (isJune2026 || isMay27) toDelete.push(docSnap.id);
      });
      for (let i = 0; i < toDelete.length; i += 500) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + 500).forEach(id => batch.delete(doc(tasksRef, id)));
        await batch.commit();
      }
      const msg = toDelete.length > 0 ? 'Видалено ' + toDelete.length + ' задач (червень 2026 + 27.05).' : 'Задач не знайдено.';
      setJuneResult(msg);
    } catch (e) {
      console.error(e);
      setJuneResult('Помилка. Перевір консоль.');
    } finally {
      setIsCleaningJune(false);
    }
  };

  const cleanInvalidTasks = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    setIsCleaning(true);
    setResult(null);
    try {
      const tasksRef = collection(db, 'users', auth.currentUser.uid, 'tasks');
      const snapshot = await getDocs(tasksRef);
      const invalidIds: string[] = [];

      snapshot.forEach((docSnap) => {
        if (isInvalidDate(docSnap.data().date)) {
          invalidIds.push(docSnap.id);
        }
      });

      for (let i = 0; i < invalidIds.length; i += 500) {
        const batch = writeBatch(db);
        invalidIds.slice(i, i + 500).forEach(id => batch.delete(doc(tasksRef, id)));
        await batch.commit();
      }

      setResult(invalidIds.length > 0
        ? `✅ Видалено ${invalidIds.length} задач з некоректною датою.`
        : '✅ Некоректних задач не знайдено.');
    } catch (e) {
      console.error(e);
      setResult('❌ Помилка. Перевір консоль.');
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl space-y-3">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Очистити задачі з некоректною датою</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
            Видаляє задачі з датами:<br/>
            • <span className="font-mono">1970-01-01</span> — помилка при збереженні<br/>
            • <span className="font-mono">17.05.2026</span> — помилка при імпорті<br/>
            Дію не можна скасувати.
          </p>
        </div>
        <button
          onClick={cleanInvalidTasks}
          disabled={isCleaning}
          className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isCleaning
            ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Очищення...</>
            : '🗑 Видалити некоректні задачі'}
        </button>
        {result && (
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
            {result}
          </p>
        )}
      </div>
    </div>
  );
}


function ShortcutsTab() {
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

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Профіль', icon: User },
  { id: 'appearance', label: 'Вигляд', icon: Palette },
  { id: 'notifications', label: 'Сповіщення', icon: Bell },
  { id: 'integrations', label: 'Інтеграції', icon: Link },
  { id: 'security', label: 'Безпека', icon: Shield },
  { id: 'team', label: 'Команда', icon: Users },
  { id: 'maintenance', label: 'Технічне', icon: Wrench },
  { id: 'shortcuts', label: 'Гарячі клавіші', icon: Keyboard },
];

export function Settings() {
  const [active, setActive] = useState<Tab>('profile');
  const [isCleaningDupes, setIsCleaningDupes] = useState(false);
  const [dupeResult, setDupeResult] = useState<string | null>(null);

  const cleanJuneDuplicates = async () => {
    const auth = getAuth();
    if (auth.currentUser === null) return;
    setIsCleaningDupes(true);
    setDupeResult(null);
    try {
      const tasksRef = collection(db, 'users', auth.currentUser.uid, 'tasks');
      const snapshot = await getDocs(tasksRef);
      const juneTasks: {id: string; title: string; date: string}[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const ms = data.date?.toMillis ? data.date.toMillis() : (data.date?.seconds ?? 0) * 1000;
        const d = new Date(ms);
        if (d.getFullYear() === 2026 && d.getMonth() === 5) {
          juneTasks.push({id: docSnap.id, title: data.title, date: d.toISOString().slice(0,10)});
        }
      });
      const seen = new Map();
      const dupeIds: string[] = [];
      juneTasks.forEach(t => {
        const key = t.title + '_' + t.date;
        if (seen.has(key)) { dupeIds.push(t.id); } else { seen.set(key, t.id); }
      });
      for (let i = 0; i < dupeIds.length; i += 500) {
        const batch = writeBatch(db);
        dupeIds.slice(i, i + 500).forEach(id => batch.delete(doc(tasksRef, id)));
        await batch.commit();
      }
      const msg = dupeIds.length > 0 ? 'Видалено ' + dupeIds.length + ' дублікатів на червень.' : 'Дублікатів не знайдено.';
      setDupeResult(msg);
    } catch (e) {
      console.error(e);
      setDupeResult('Помилка. Перевір консоль.');
    } finally {
      setIsCleaningDupes(false);
    }
  };


  return (
    <div className="flex flex-col md:flex-row h-full gap-4 overflow-hidden">
      <div className="shrink-0 md:w-44">
        <div className="flex gap-1 overflow-x-auto pb-1 md:hidden">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all shrink-0
                  ${active === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                <Icon className="w-3.5 h-3.5"/>{t.label}
              </button>
            );
          })}
        </div>
        <div className="hidden md:flex flex-col gap-0.5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActive(t.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left w-full
                  ${active === t.id ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                <Icon className="w-4 h-4 shrink-0"/>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto md:mx-0">
          <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4">
            {TABS.find(t => t.id === active)?.label}
          </h3>
          {active === 'profile' && <ProfileTab/>}
          {active === 'appearance' && <AppearanceTab/>}
          {active === 'notifications' && <NotificationsTab/>}
          {active === 'integrations' && <IntegrationsTab/>}
          {active === 'security' && <SecurityTab/>}
          {active === 'team' && <TeamTab/>}
          {active === 'maintenance' && <MaintenanceTab/>}
          {active === 'shortcuts' && <ShortcutsTab/>}
        </div>
      </div>
    </div>
  );
}