import { useState } from 'react';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { getAuth } from 'firebase/auth';

export function MaintenanceTab() {
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
        if ((d.getFullYear() === 2026 && d.getMonth() === 5) || (d.getFullYear() === 2026 && d.getMonth() === 4 && d.getDate() === 27)) toDelete.push(docSnap.id);
      });
      for (let i = 0; i < toDelete.length; i += 500) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + 500).forEach(id => batch.delete(doc(tasksRef, id)));
        await batch.commit();
      }
      setJuneResult(toDelete.length > 0 ? 'Видалено ' + toDelete.length + ' задач.' : 'Задач не знайдено.');
    } catch (e) { console.error(e); setJuneResult('Помилка.'); }
    finally { setIsCleaningJune(false); }
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
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl space-y-3">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-white">Видалити задачі: червень 2026 та 27.05.2026</p>
          <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Видаляє всі задачі на червень 2026 і 27 травня 2026. Дію не можна скасувати.</p>
        </div>
        <button onClick={cleanJuneAndMay27} disabled={isCleaningJune} className="w-full py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
          {isCleaningJune ? <span>Очищення...</span> : <span>Видалити червень + 27.05</span>}
        </button>
        {juneResult && <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-lg px-3 py-2">{juneResult}</p>}
      </div>
    </div>
  );
}
