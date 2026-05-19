import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';

export function useKeyboardShortcuts() {
  const { setTaskModalOpen, setEditingTask, setSelectedDate } = useAppStore();
  const { tasks, deleteTask, duplicateTask, moveTask, moveTaskToDate, getTaskById } = useTaskStore();
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    (window as any).__setKeyboardSelectedId = (id: string | null) => {
      selectedIdRef.current = id;
    };
    (window as any).__notifySelectedId = (id: string | null) => {
      selectedIdRef.current = id;
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

      // Space — toggle done
      if (e.key === ' ') {
        e.preventDefault();
        moveTask(selectedId, selectedTask.status === 'done' ? 'todo' : 'done');
        return;
      }

      // Delete — видалити
      if (e.key === 'Delete') {
        e.preventDefault();
        if (window.confirm(`Видалити «${selectedTask.title}»?`)) {
          deleteTask(selectedId);
          selectedIdRef.current = null;
          (window as any).__notifySelectedId?.(null);
        }
        return;
      }

      // Ctrl+C — копіювати
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        (window as any).__clipboardTaskId = selectedId;
        (window as any).__clipboardCut = false;
        return;
      }

      // Ctrl+X — вирізати
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        (window as any).__clipboardTaskId = selectedId;
        (window as any).__clipboardCut = true;
        return;
      }

      // Ctrl+V — вставити
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        const clipId = (window as any).__clipboardTaskId;
        if (!clipId) return;
        duplicateTask(clipId);
        if ((window as any).__clipboardCut) {
          deleteTask(clipId);
          (window as any).__clipboardTaskId = null;
          (window as any).__clipboardCut = false;
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
  }, [tasks]);
}
