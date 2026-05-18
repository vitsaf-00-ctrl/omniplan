import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, Task } from '../store/useTaskStore';

const TOMORROW = new Date(Date.now() + 86400000);

interface Props {
  x: number;
  y: number;
  task: Task;
  onClose: () => void;
}

export function TaskContextMenu({ x, y, task, onClose }: Props) {
  const { setActiveView, setTaskModalOpen, setEditingTask, setFocusTaskId } = useAppStore();
  const { moveTask, moveTaskToDate, duplicateTask, deleteTask } = useTaskStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const left = Math.min(x, window.innerWidth - 215);
  const top = Math.min(y, window.innerHeight - 280);

  return (
    <div className="fixed inset-0 z-[200]" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        className="absolute bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 py-1 min-w-[200px] overflow-hidden text-xs"
        style={{ left, top }}
        onMouseDown={e => e.stopPropagation()}
      >
        <button
          onClick={() => { setFocusTaskId(task.id); setActiveView('focus'); onClose(); }}
          className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-bold"
        >
          ▶ Запустити у Фокусі
        </button>

        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

        <button
          onClick={() => { setEditingTask(task); setTaskModalOpen(true); onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          ✏️ Редагувати
        </button>

        <button
          onClick={() => { moveTask(task.id, task.status === 'done' ? 'todo' : 'done'); onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          {task.status === 'done' ? '↩️ Скасувати виконання' : '✅ Позначити як виконано'}
        </button>

        <button
          onClick={() => { duplicateTask(task.id); onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          📋 Дублювати
        </button>

        <button
          onClick={() => { moveTaskToDate(task.id, TOMORROW); onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          ➡️ Перенести на завтра
        </button>

        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full text-left px-3 py-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500 font-medium"
          >
            🗑️ Видалити
          </button>
        ) : (
          <div className="px-3 py-2 bg-rose-50 dark:bg-rose-900/20">
            <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold mb-2">Підтвердити видалення?</p>
            <div className="flex gap-2">
              <button
                onClick={() => { deleteTask(task.id); onClose(); }}
                className="flex-1 text-[10px] font-bold bg-rose-500 text-white px-2 py-1.5 rounded-lg"
              >
                Так
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 text-[10px] font-bold bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 px-2 py-1.5 rounded-lg"
              >
                Ні
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
