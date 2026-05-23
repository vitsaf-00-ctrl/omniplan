import { useAppStore } from '../store/useAppStore';

export function ConfirmDialog() {
  const { confirmDialog, setConfirmDialog } = useAppStore();
  if (!confirmDialog) return null;

  const close = () => setConfirmDialog(null);
  const confirm = () => { confirmDialog.onConfirm(); close(); };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm"
      onMouseDown={e => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-5">
        <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug mb-4">
          {confirmDialog.message}
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={close}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={confirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}
