import { useToastStore, Toast } from '../store/useToastStore';

const icons: Record<string, string> = {
  success: '✓',
  info: 'ℹ',
  error: '✕',
};

const colors: Record<string, string> = {
  success: 'bg-emerald-600',
  info: 'bg-indigo-600',
  error: 'bg-rose-600',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore(s => s.removeToast);

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold min-w-[220px] max-w-xs ${colors[toast.type]} animate-in slide-in-from-bottom-4 duration-200`}>
      <span className="text-base leading-none opacity-90">{icons[toast.type]}</span>
      <span className="flex-1 leading-snug">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => { toast.action!.onClick(); removeToast(toast.id); }}
          className="shrink-0 px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-base leading-none"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[600] flex flex-col items-center gap-2 pointer-events-none sm:left-auto sm:right-6 sm:translate-x-0 sm:items-end">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
