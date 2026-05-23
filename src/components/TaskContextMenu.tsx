import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useTaskStore, Task, TaskStatus } from '../store/useTaskStore';


interface Props {
  x: number;
  y: number;
  task: Task;
  onClose: () => void;
}

export function TaskContextMenu({ x, y, task, onClose }: Props) {
  const { setActiveView, setTaskModalOpen, setEditingTask, setFocusTaskId, setSelectedDate, setClipboard, clearClipboard, clipboardTaskId, clipboardMode } = useAppStore();
  const { moveTaskToDate, duplicateTask, deleteTask, updateTask } = useTaskStore();
  const dup = duplicateTask;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showStatus, setShowStatus] = useState(false);

  const left = Math.max(0, Math.min(x, window.innerWidth - 215));
  const top = Math.max(0, Math.min(y, window.innerHeight - 380));

  const statuses: { v: TaskStatus; l: string; emoji: string }[] = [
    { v: 'todo', l: 'Заплановано', emoji: '⬜' },
    { v: 'in_progress', l: 'В процесі', emoji: '🔄' },
    { v: 'done', l: 'Готово', emoji: '✅' },
  ];

  const handleAddTask = () => {
    setSelectedDate(new Date(task.date));
    setEditingTask(null);
    setTaskModalOpen(true);
    onClose();
  };

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
          onClick={handleAddTask}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          ➕ Додати задачу на цей день
        </button>

        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

        {/* Status submenu */}
        <button
          onClick={() => setShowStatus(!showStatus)}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between"
        >
          <span>🏷 Змінити статус</span>
          <span className="text-slate-400">{showStatus ? '▲' : '▼'}</span>
        </button>

        {showStatus && (
          <div className="bg-slate-50 dark:bg-slate-700/50 border-t border-slate-100 dark:border-slate-700">
            {statuses.map(s => (
              <button
                key={s.v}
                onClick={() => { updateTask(task.id, { status: s.v }); onClose(); }}
                className={`w-full text-left px-5 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 font-medium flex items-center gap-2
                  ${task.status === s.v ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-300'}`}
              >
                <span>{s.emoji}</span>
                <span>{s.l}</span>
                {task.status === s.v && <span className="ml-auto text-indigo-500">✓</span>}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

        <button
          onClick={() => { setClipboard(task.id, 'copy'); onClose(); }}
          className={`w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium ${clipboardTaskId === task.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}
        >
          📋 Копіювати (Ctrl+C)
        </button>

        {clipboardTaskId && (
          <button
            onClick={() => {
              if (clipboardMode === 'copy') dup(clipboardTaskId);
              else moveTaskToDate(clipboardTaskId, new Date(task.date));
              clearClipboard();
              onClose();
            }}
            className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 font-medium"
          >
            📥 Вставити на цю дату
          </button>
        )}

        <button
          onClick={() => { duplicateTask(task.id); onClose(); }}
          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium"
        >
          🔁 Дублювати
        </button>

        <button
          onClick={() => { const tm = new Date(); tm.setDate(tm.getDate() + 1); moveTaskToDate(task.id, tm); onClose(); }}
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
