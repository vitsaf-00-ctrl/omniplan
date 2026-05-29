import { useState } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAuth } from 'firebase/auth';

const INVALID_DATE_STRINGS = ['2026-05-17', '1970-01-01'];

function isInvalidDate(date: unknown): boolean {
  if (!date) return true;
  const ms = (date as any)?.toMillis ? (date as any).toMillis() : ((date as any)?.seconds ?? 0) * 1000;
  const d = new Date(ms);
  if (d.getFullYear() <= 1970) return true;
  if (INVALID_DATE_STRINGS.includes(d.toISOString().slice(0, 10))) return true;
  return false;
}

type BatchState = 'idle' | 'counting' | 'confirm' | 'running' | 'done';

function useBatchDelete(collect: (snapshot: ReturnType<typeof getDocs> extends Promise<infer T> ? T : never) => string[]) {
  const [state, setState] = useState<BatchState>('idle');
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const preview = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    setState('counting');
    setResult(null);
    try {
      const tasksRef = collection(db, 'users', auth.currentUser.uid, 'tasks');
      const snapshot = await getDocs(tasksRef);
      const ids = collect(snapshot as any);
      setCount(ids.length);
      setState(ids.length > 0 ? 'confirm' : 'done');
      if (ids.length === 0) setResult('Задач для видалення не знайдено.');
    } catch (e) {
      console.error(e);
      setState('idle');
      setResult('Помилка. Перевір консоль.');
    }
  };

  const run = async () => {
    const auth = getAuth();
    if (!auth.currentUser) return;
    setState('running');
    try {
      const tasksRef = collection(db, 'users', auth.currentUser.uid, 'tasks');
      const snapshot = await getDocs(tasksRef);
      const ids = collect(snapshot as any);
      for (let i = 0; i < ids.length; i += 500) {
        const batch = writeBatch(db);
        ids.slice(i, i + 500).forEach(id => batch.delete(doc(tasksRef, id)));
        await batch.commit();
      }
      setState('done');
      setResult(`Видалено ${ids.length} задач.`);
    } catch (e) {
      console.error(e);
      setState('idle');
      setResult('Помилка. Перевір консоль.');
    }
  };

  const reset = () => { setState('idle'); setResult(null); setCount(0); };

  return { state, count, result, preview, run, reset };
}

function BatchSection({ title, description, onCollect, color = 'rose' }: {
  title: string;
  description: React.ReactNode;
  onCollect: Parameters<typeof useBatchDelete>[0];
  color?: 'rose' | 'orange';
}) {
  const { state, count, result, preview, run, reset } = useBatchDelete(onCollect);
  const busy = state === 'counting' || state === 'running';
  const baseBtn = color === 'rose'
    ? 'bg-rose-600 hover:bg-rose-700'
    : 'bg-orange-500 hover:bg-orange-600';

  return (
    <div className={`p-4 ${color === 'rose' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800' : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'} border rounded-xl space-y-3`}>
      <div>
        <p className="text-sm font-bold text-slate-800 dark:text-white">{title}</p>
        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>

      {state === 'confirm' ? (
        <div className="space-y-2">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
            Буде видалено <span className="text-base">{count}</span> задач. Дію не можна скасувати.
          </p>
          <div className="flex gap-2">
            <button onClick={run} className={`flex-1 py-2 rounded-xl text-sm font-black uppercase tracking-widest ${baseBtn} text-white transition-all`}>
              Підтвердити видалення
            </button>
            <button onClick={reset} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all">
              Скасувати
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={state === 'idle' || state === 'done' ? preview : undefined}
          disabled={busy}
          className={`w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${baseBtn} text-white disabled:opacity-50 flex items-center justify-center gap-2`}
        >
          {busy
            ? <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/> Перевірка...</>
            : 'Перевірити та видалити'}
        </button>
      )}

      {result && (
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
          {result}
        </p>
      )}
    </div>
  );
}

export function MaintenanceTab() {
  return (
    <div className="space-y-5">
      <BatchSection
        title="Видалити авто-копії повторюваних задач"
        description={<>Видаляє всі авто-згенеровані екземпляри повторень (ID починається з <span className="font-mono">rec_</span>).<br/>Твої власні задачі не зачіпаються. Дію не можна скасувати.</>}
        onCollect={snapshot => {
          const ids: string[] = [];
          snapshot.forEach((d: any) => { if (d.id.startsWith('rec_')) ids.push(d.id); });
          return ids;
        }}
      />

      <BatchSection
        title="Очистити задачі з некоректною датою"
        description={<>Видаляє задачі з датами:<br/>• <span className="font-mono">1970-01-01</span> — помилка при збереженні<br/>• <span className="font-mono">17.05.2026</span> — помилка при імпорті<br/>Дію не можна скасувати.</>}
        onCollect={snapshot => {
          const ids: string[] = [];
          snapshot.forEach((d: any) => { if (isInvalidDate(d.data().date)) ids.push(d.id); });
          return ids;
        }}
      />

      <BatchSection
        title="Видалити задачі: червень 2026 та 27.05.2026"
        description="Видаляє всі задачі на червень 2026 і 27 травня 2026. Дію не можна скасувати."
        color="orange"
        onCollect={snapshot => {
          const ids: string[] = [];
          snapshot.forEach((d: any) => {
            const data = d.data();
            const ms = data.date?.toMillis ? data.date.toMillis() : (data.date?.seconds ?? 0) * 1000;
            const dt = new Date(ms);
            if ((dt.getFullYear() === 2026 && dt.getMonth() === 5) ||
                (dt.getFullYear() === 2026 && dt.getMonth() === 4 && dt.getDate() === 27)) ids.push(d.id);
          });
          return ids;
        }}
      />
    </div>
  );
}
