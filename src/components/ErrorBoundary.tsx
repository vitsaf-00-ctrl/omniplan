import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Changing this value clears the error (e.g. switching to another screen). */
  resetKey?: string;
  /** Full-page variant for the app root; default is an in-panel card. */
  fullPage?: boolean;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so a bug in one screen shows a recovery card
 * instead of blanking the whole app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className={`flex items-center justify-center p-6 ${this.props.fullPage ? 'min-h-screen bg-slate-50 dark:bg-slate-900' : 'h-full'}`}>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-slate-800 dark:text-white">Щось пішло не так</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Цей екран не вдалося показати. Ваші задачі збережені — спробуйте ще раз або перезавантажте сторінку.
            </p>
          </div>
          <p className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-3 py-2 break-words">
            {error.message}
          </p>
          <div className="flex gap-2 justify-center">
            {!this.props.fullPage && (
              <button
                onClick={() => this.setState({ error: null })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Спробувати ще раз
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Перезавантажити
            </button>
          </div>
        </div>
      </div>
    );
  }
}
