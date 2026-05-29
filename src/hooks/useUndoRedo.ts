import { useTaskStore, useTemporalStore, Task } from '../store/useTaskStore';
import { fsBatchSync } from '../lib/taskFirestore';
import { useToastStore } from '../store/useToastStore';

function syncDiff(userId: string, prev: Task[], next: Task[]): Promise<void> {
  const prevMap = new Map(prev.map(t => [t.id, t]));
  const nextMap = new Map(next.map(t => [t.id, t]));
  const toSet: Task[] = [];
  const toDelete: string[] = [];
  for (const [id, task] of nextMap) {
    const p = prevMap.get(id);
    if (!p || JSON.stringify(p) !== JSON.stringify(task)) toSet.push(task);
  }
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) toDelete.push(id);
  }
  return fsBatchSync(userId, toSet, toDelete);
}

export function useUndoRedo() {
  const { undo, redo, pastStates, futureStates } = useTemporalStore(s => s);
  const userId = useTaskStore(s => s.userId);

  const onSyncError = (e: unknown) => {
    console.error('[Firestore] undo/redo sync error', e);
    useToastStore.getState().addToast({ type: 'error', message: 'Помилка збереження. Перевірте з\'єднання.' });
  };

  const handleUndo = () => {
    const prev = useTaskStore.getState().tasks;
    undo();
    const next = useTaskStore.getState().tasks;
    if (userId) syncDiff(userId, prev, next).catch(onSyncError);
  };

  const handleRedo = () => {
    const prev = useTaskStore.getState().tasks;
    redo();
    const next = useTaskStore.getState().tasks;
    if (userId) syncDiff(userId, prev, next).catch(onSyncError);
  };

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
