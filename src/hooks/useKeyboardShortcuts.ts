import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore } from '../store/useTaskStore';
import { useUndoRedo } from './useUndoRedo';
import { useToastStore } from '../store/useToastStore';

export function useKeyboardShortcuts() {
  const { setTaskModalOpen, setEditingTask, setSelectedDate, setClipboard, clearClipboard, clipboardTaskId, clipboardMode, setSelectedTaskId, setConfirmDialog, setSearchOpen } = useAppStore();
  const { deleteTask, duplicateTask, moveTask, moveTaskToDate, getTaskById } = useTaskStore();
  const { undo, redo, canUndo, canRedo } = useUndoRedo();
  const addToast = useToastStore(s => s.addToast);
  const selectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    window.__setKeyboardSelectedId = (id: string | null) => {
      selectedIdRef.current = id;
      setSelectedTaskId(id);
    };
    window.__notifySelectedId = (id: string | null) => {
      selectedIdRef.current = id;
      setSelectedTaskId(id);
    };
    return () => {
      delete window.__setKeyboardSelectedId;
      delete window.__notifySelectedId;
    };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+F — відкрити пошук (завжди, навіть у полі вводу)
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      const active = document.activeElement;
      const isInput = active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' ||
        active?.tagName === 'SELECT' || (active as HTMLElement)?.isContentEditable;
      if (isInput) return;

      const selectedId = selectedIdRef.current;
      const selectedTask = selectedId ? getTaskById(selectedId) : null;

      // Ctrl+Z — undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) { undo(); addToast({ type: 'info', message: 'Скасовано' }); }
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) { redo(); addToast({ type: 'info', message: 'Повторено' }); }
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
        window.__notifySelectedId?.(null);
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
        const taskTitle = selectedTask.title;
        setConfirmDialog({
          message: `Видалити «${taskTitle}»?`,
          onConfirm: () => {
            deleteTask(selectedId);
            selectedIdRef.current = null;
            window.__notifySelectedId?.(null);
            addToast({ type: 'info', message: `Видалено «${taskTitle}»`, action: { label: 'Скасувати', onClick: undo } });
          },
        });
        return;
      }

      // Ctrl+C — копіювати
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        setClipboard(selectedId, 'copy');
        addToast({ type: 'info', message: `Скопійовано «${selectedTask.title}»` });
        return;
      }

      // Ctrl+X — вирізати
      if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
        e.preventDefault();
        setClipboard(selectedId, 'cut');
        addToast({ type: 'info', message: `Вирізано «${selectedTask.title}»` });
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
  }, [clipboardTaskId, clipboardMode, canUndo, canRedo, undo, redo]);
}
