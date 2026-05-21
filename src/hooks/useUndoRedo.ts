import { useTaskStore, useTemporalStore, Task } from '../store/useTaskStore';
import { fsSetTask, fsDeleteTask } from '../lib/taskFirestore';

function syncDiff(userId: string, prev: Task[], next: Task[]) {
  const prevMap = new Map(prev.map(t => [t.id, t]));
  const nextMap = new Map(next.map(t => [t.id, t]));
  for (const [id, task] of nextMap) {
    const p = prevMap.get(id);
    if (!p || JSON.stringify(p) !== JSON.stringify(task)) fsSetTask(userId, task);
  }
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) fsDeleteTask(userId, id);
  }
}

export function useUndoRedo() {
  const { undo, redo, pastStates, futureStates } = useTemporalStore(s => s);
  const userId = useTaskStore(s => s.userId);

  const handleUndo = () => {
    const prev = useTaskStore.getState().tasks;
    undo();
    const next = useTaskStore.getState().tasks;
    if (userId) syncDiff(userId, prev, next);
  };

  const handleRedo = () => {
    const prev = useTaskStore.getState().tasks;
    redo();
    const next = useTaskStore.getState().tasks;
    if (userId) syncDiff(userId, prev, next);
  };

  return {
    undo: handleUndo,
    redo: handleRedo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  };
}
