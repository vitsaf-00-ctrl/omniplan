import { AlertCircle, Loader2 } from 'lucide-react';
import { useSyncStore } from '../store/useSyncStore';

export function SyncIndicator({ taskId }: { taskId: string }) {
  const state = useSyncStore(s => s.states[taskId]);
  const retry = useSyncStore(s => s.retries[taskId]);

  if (state === 'saving') {
    return <Loader2 className="w-3 h-3 text-slate-400 animate-spin shrink-0" aria-label="Збереження..."/>;
  }

  if (state === 'error') {
    return (
      <button
        onClick={e => { e.stopPropagation(); retry?.(); }}
        title="Помилка збереження. Натисніть, щоб повторити"
        className="shrink-0 text-rose-500 hover:text-rose-600 transition-colors"
        aria-label="Помилка збереження — повторити"
      >
        <AlertCircle className="w-3.5 h-3.5"/>
      </button>
    );
  }

  return null;
}
