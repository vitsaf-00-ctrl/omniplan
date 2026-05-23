import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUndoRedo } from './useUndoRedo';

export function useKeyboardShortcuts() {
  const { setTaskModalOpen, setEditingTask, setSelectedDate, setClipboard, clearClipboard, clipboardTaskId, clipboardMode, setSelectedTaskId, setConfirmDialog } = useAppStore();
  const { tasks, deleteTask, duplicateTask, moveTask, moveTaskToDate, getTaskById } = useTaskStore();
  const { undo, redo } = useUndoRedo();
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    (window as any).__setKeyboardSelectedId = (id: string | null) => {
      selectedIdRef.current = id;
      setSelectedTaskId(id);
    };
    (window as any).__notifySelectedId = (id: string | null) => {
      selectedIdRef.current = id;
      setSelectedTaskId(id);
    };
    return () => {
      delete (window as any).__setKeyboardSelectedId;
      delete (window as any).__notifySelectedId;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' ||
        active?.tagName === 'SELECT' || (active as HTMLElement)?.isContentEditable;
      if (isInput) return;

      const selectedId = selectedIdRef.current;
      const selectedTask = selectedId ? getTaskById(selectedId) : null;

      // Ctrl+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // N — нова задача
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setEditingTask(null);
        setSelectedDate(new Date());
        setTaskModalOpen(true);
        return;
      }

      // Escape — зняти виділення
      if (e.key === 'Escape') {
        selectedIdRef.current = null;
        (window as any).__notifySelectedId?.(null);
        return;
      }

      if (!selectedTask || !selectedId) return;

      // Enter — редагувати
      if (e.key === 'Enter') {
        e.preventDefault();
        setEditingTask(selectedTask);
        setTaskModalOpen(true);
        return;
      }

      // Space — cycle status: todo → in_progress → done → todo
      if (e.key === ' ') {
        e.preventDefault();
        const next: Record<string, 'todo' | 'in_progress' | 'done'> = { todo: 'in_progress', in_progress: 'done', done: 'todo' };
        moveTask(selectedId, next[selectedTask.status] ?? 'todo');
        return;
      }

      // Delete — видалити
      if (e.key === 'Delete') {
        e.preventDefault();
        setConfirmDialog({
          message: `Видалити «${selectedTask.title}»?`,
          onConfirm: () => {
            deleteTask(selectedId);
            selectedIdRef.current = null;
            (window as any).__notifySelectedId?.(null);
          },
        });
        return;
      }

      // Ctrl+C — копіювати
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        setClipboard(selectedId, 'copy');
        return;
      }

      // Ctrl+X — вирізати
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        setClipboard(selectedId, 'cut');
        return;
      }

      // Ctrl+V — вставити (без дня — дублює на ту ж дату)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (!clipboardTaskId) return;
        duplicateTask(clipboardTaskId);
        if (clipboardMode === 'cut') {
          deleteTask(clipboardTaskId);
          clearClipboard();
        }
        return;
      }

      // T — на сьогодні
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        moveTaskToDate(selectedId, new Date());
        return;
      }

      // M — на завтра
      if (e.key === 'm' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        moveTaskToDate(selectedId, tomorrow);
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tasks, clipboardTaskId, clipboardMode]);
}
