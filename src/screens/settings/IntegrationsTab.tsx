import { useEffect, useState } from 'react';
import { deleteField, doc, onSnapshot, serverTimestamp, setDoc, updateDoc, type Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import { Bot, Check, ChevronDown, Copy, KeyRound, Plus, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react';
import { db } from '../../lib/firebase';
import { formatToken, generateSecret, hashSecret, type McpTokenMeta } from '../../lib/mcpToken';
import { useAppStore } from '../../store/useAppStore';
import { useToastStore } from '../../store/useToastStore';

type ServerStatus = 'checking' | 'ready' | 'unconfigured' | 'unavailable';
interface TokenRow { hash: string; label: string; createdAt?: Date; lastUsedAt?: Date; hint?: string }

const ENDPOINT = '/api/mcp';
const toDate = (v: unknown) => (v as Timestamp | undefined)?.toDate?.();
const fmt = (d?: Date) => (d ? format(d, 'd MMM yyyy, HH:mm', { locale: uk }) : '—');

const EXAMPLES = [
  'Що в мене сьогодні і що прострочено?',
  'Створи на завтра о 10:00 задачу «Аналіз митних баз» в AI officer, нагадай мені',
  'Перенеси всі незакриті задачі ДІС з п’ятниці на понеділок',
  'Познач «SMM stories» виконаною',
  'Додай до задачі «Дашборд коригувати» підзадачі: графіки, фільтри, експорт',
];

function CopyButton({ text, label = 'Копіювати' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { void navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); }); }}
      className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors">
      {done ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5"/>}{done ? 'Скопійовано' : label}
    </button>
  );
}

function CodeLine({ value, secret }: { value: string; secret?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <code className={`flex-1 min-w-0 truncate text-[11px] font-mono px-2.5 py-2 rounded-lg border ${secret ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200' : 'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900/60 dark:border-slate-700 dark:text-slate-300'}`}>
        {value}
      </code>
      <CopyButton text={value}/>
    </div>
  );
}

function Steps({ title, open, onToggle, children }: { title: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-bold text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60">
        {title}<ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
      </button>
      {open && <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">{children}</div>}
    </div>
  );
}

export function IntegrationsTab() {
  const user = useAppStore(s => s.user);
  const addToast = useToastStore(s => s.addToast);
  const [status, setStatus] = useState<ServerStatus>('checking');
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [label, setLabel] = useState('Claude');
  const [busy, setBusy] = useState(false);
  const [revealed, setRevealed] = useState<{ token: string; label: string } | null>(null);
  const [openSteps, setOpenSteps] = useState<string | null>('claude');

  const origin = window.location.origin;
  const baseUrl = `${origin}${ENDPOINT}`;

  useEffect(() => {
    let cancelled = false;
    fetch(ENDPOINT, { headers: { accept: 'application/json' }, cache: 'no-store' })
      .then(r => r.json())
      .then(j => { if (!cancelled) setStatus(j?.configured ? 'ready' : 'unconfigured'); })
      .catch(() => { if (!cancelled) setStatus('unavailable'); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, 'users', user.uid), snap => {
      const map = (snap.get('mcpTokens') ?? {}) as Record<string, McpTokenMeta>;
      setTokens(Object.entries(map)
        .map(([hash, m]) => ({ hash, label: m.label, hint: m.hint, createdAt: toDate(m.createdAt), lastUsedAt: toDate(m.lastUsedAt) }))
        .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)));
    }, err => console.error('[integrations] tokens', err));
  }, [user]);

  const createToken = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const secret = generateSecret();
      const hash = await hashSecret(secret);
      const name = label.trim() || 'ШІ-асистент';
      await setDoc(doc(db, 'users', user.uid), {
        mcpTokens: { [hash]: { label: name, hint: secret.slice(0, 4), createdAt: serverTimestamp() } },
      }, { merge: true });
      setRevealed({ token: formatToken(user.uid, secret), label: name });
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Не вдалося створити токен. Перевірте правила Firestore для users/{uid}.' });
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (row: TokenRow) => {
    if (!user || !window.confirm(`Відкликати доступ «${row.label}»? ШІ одразу втратить доступ до задач.`)) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { [`mcpTokens.${row.hash}`]: deleteField() });
      addToast({ type: 'success', message: `Доступ «${row.label}» відкликано` });
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Не вдалося відкликати токен' });
    }
  };

  const tokenUrl = revealed ? `${baseUrl}?token=${revealed.token}` : `${baseUrl}?token=<ваш токен>`;
  const tokenValue = revealed?.token ?? '<ваш токен>';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400"/>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 dark:text-white">ШІ-асистенти: Claude і ChatGPT</p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Підключіть OmniPlan як конектор — і асистент зможе переглядати, створювати, змінювати й закривати ваші задачі прямо з чату.
          </p>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${
          status === 'ready' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : status === 'checking' ? 'bg-slate-100 text-slate-500 dark:bg-slate-700'
          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
          {status === 'ready' ? '● Сервер працює' : status === 'checking' ? 'Перевірка…' : status === 'unconfigured' ? '● Сервер не налаштований' : '● Сервер недоступний'}
        </span>
      </div>

      {status === 'unconfigured' && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-2 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5"><TriangleAlert className="w-4 h-4"/> Одноразове налаштування сервера</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Firebase Console → ⚙ Project settings → <b>Service accounts</b> → <b>Generate new private key</b>. Завантажиться JSON-файл.</li>
            <li>Vercel → проєкт omniplan → <b>Settings → Environment Variables</b> → додайте <code className="font-mono">FIREBASE_SERVICE_ACCOUNT</code>, значення — весь вміст JSON-файлу. Середовище: Production.</li>
            <li>Vercel → <b>Deployments</b> → останній деплой → <b>Redeploy</b>.</li>
          </ol>
          <p>Цей ключ дає повний доступ до бази — нікому його не пересилайте і не додавайте в репозиторій.</p>
        </div>
      )}
      {status === 'unavailable' && (
        <p className="text-[11px] text-slate-500">Сервер /api/mcp не відповідає. Він працює лише на опублікованому сайті (Vercel), не в локальному режимі розробки.</p>
      )}

      {/* Revealed token */}
      {revealed && (
        <div className="rounded-xl border-2 border-indigo-300 dark:border-indigo-700 bg-indigo-50/60 dark:bg-indigo-900/20 p-4 space-y-3">
          <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-indigo-600"/> Токен «{revealed.label}» створено
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Скопіюйте зараз — повторно його показати неможливо. Якщо загубите, просто створіть новий.
          </p>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Адреса для Claude (з токеном)</p>
            <CodeLine value={tokenUrl} secret/>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Окремо: адреса і токен (для ChatGPT)</p>
            <CodeLine value={baseUrl}/>
            <CodeLine value={revealed.token} secret/>
          </div>
          <button onClick={() => setRevealed(null)} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white">Я зберіг — сховати</button>
        </div>
      )}

      {/* Tokens */}
      <div className="space-y-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Доступи</p>
        {tokens.length === 0 && <p className="text-[11px] text-slate-500">Ще немає жодного токена.</p>}
        {tokens.map(t => (
          <div key={t.hash} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0"/>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                {t.label} {t.hint && <span className="text-[10px] font-mono text-slate-400">· ключ {t.hint}…</span>}
              </p>
              <p className="text-[10px] text-slate-500">Створено {fmt(t.createdAt)} · Останнє використання: {t.lastUsedAt ? fmt(t.lastUsedAt) : 'ще не використовувався'}</p>
            </div>
            <button onClick={() => revoke(t)} title="Відкликати"
              className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
              <Trash2 className="w-3.5 h-3.5"/> Відкликати
            </button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Назва (Claude, ChatGPT…)" maxLength={40}
            className="flex-1 min-w-0 text-sm px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30"/>
          <button onClick={createToken} disabled={busy || !user}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50">
            <Plus className="w-4 h-4"/> Створити токен
          </button>
        </div>
        <p className="text-[10px] text-slate-400">Створюйте окремий токен для кожного асистента — тоді кожен можна відкликати незалежно.</p>
      </div>

      {/* How to connect */}
      <div className="space-y-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Як підключити</p>
        <Steps title="Claude (claude.ai, десктоп, мобільний)" open={openSteps === 'claude'} onToggle={() => setOpenSteps(o => o === 'claude' ? null : 'claude')}>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Створіть токен вище з назвою «Claude».</li>
            <li>У Claude: <b>Customize → Connectors → + Add → Add custom connector</b>.</li>
            <li>Назва: <b>OmniPlan</b>. URL — адреса з токеном:</li>
          </ol>
          <CodeLine value={tokenUrl} secret={!!revealed}/>
          <ol className="list-decimal pl-5 space-y-1" start={4}>
            <li><b>Continue</b> → Authentication: <b>No sign in</b> → <b>Add</b>.</li>
            <li>У чаті: <b>+</b> → <b>Connectors</b> → увімкніть OmniPlan.</li>
          </ol>
          <p className="text-slate-500">Альтернатива без токена в адресі: URL <code className="font-mono">{baseUrl}</code> і в «Request headers» заголовок <code className="font-mono">Authorization: Bearer {'<токен>'}</code>.</p>
        </Steps>
        <Steps title="ChatGPT (Plus і вище, Developer mode)" open={openSteps === 'chatgpt'} onToggle={() => setOpenSteps(o => o === 'chatgpt' ? null : 'chatgpt')}>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Створіть токен вище з назвою «ChatGPT».</li>
            <li>У ChatGPT: <b>Settings → Apps &amp; Connectors → Advanced settings</b> → увімкніть <b>Developer mode</b>.</li>
            <li><b>Settings → Apps &amp; Connectors → Create</b>. Назва: <b>OmniPlan</b>. Connector URL:</li>
          </ol>
          <CodeLine value={baseUrl}/>
          <ol className="list-decimal pl-5 space-y-1" start={4}>
            <li>Authentication: <b>Token</b>, вставте токен:</li>
          </ol>
          <CodeLine value={tokenValue} secret={!!revealed}/>
          <ol className="list-decimal pl-5 space-y-1" start={5}>
            <li><b>Create</b>. У чаті згадуйте OmniPlan у запиті; ChatGPT попросить підтвердження перед кожною зміною.</li>
          </ol>
          <p className="text-slate-500">Меню ChatGPT для конекторів ще в беті й може змінюватися.</p>
        </Steps>
      </div>

      {/* Examples */}
      <div className="space-y-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Що можна попросити</p>
        <ul className="space-y-1.5">
          {EXAMPLES.map(e => (
            <li key={e} className="text-xs text-slate-600 dark:text-slate-300 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">«{e}»</li>
          ))}
        </ul>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Нагадування: якщо в задачі є час, OmniPlan покаже сповіщення браузера (вкладка має бути відкрита, а сповіщення — увімкнені в «Сповіщеннях»).
        </p>
      </div>
    </div>
  );
}
