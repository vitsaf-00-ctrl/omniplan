import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';
import { isChunkLoadError, reloadOnceForNewVersion } from '../lib/chunkReload';

interface Props {
  children: ReactNode;
  /** Changing this value clears the error (e.g. switching to another screen). */
  resetKey?: string;
  /** Full-page variant for the app root; default is an in-panel card. */
  fullPage?: boolean;
}

interface State {
  error: Error | null;
  /** True while reloading to pick up a newly deployed version. */
  updating?: boolean;
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
    if (isChunkLoadError(error) && reloadOnceForNewVersion()) {
      this.setState({ updating: true });
      return;
    }
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  componentDidUpdate(prev: Props): void {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null, updating: false });
  }

  render() {
    const { error, updating } = this.state;
    if (!error) return this.props.children;

    if (updating) {
      return (
        <div className={`flex items-center justify-center gap-2 text-sm text-slate-500 ${this.props.fullPage ? 'min-h-screen' : 'h-full'}`}>
          <RefreshCw className="w-4 h-4 animate-spin" /> Оновлення до нової версії…
        </div>
      );
    }

    const isStale = isChunkLoadError(error);

    return (
      <div className={`flex items-center justify-center p-6 ${this.props.fullPage ? 'min-h-screen bg-slate-50 dark:bg-slate-900' : 'h-full'}`}>
        <div className="max-w-md w-full bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm p-6 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-black text-slate-800 dark:text-white">
              {isStale ? 'Доступна нова версія' : 'Щось пішло не так'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isStale
                ? 'Застосунок оновився, поки сторінка була відкрита. Перезавантажте сторінку — задачі збережені.'
                : 'Цей екран не вдалося показати. Ваші задачі збережені — спробуйте ще раз або перезавантажте сторінку.'}
            </p>
          </div>
          {!isStale && (
            <p className="text-[10px] font-mono text-slate-400 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-3 py-2 break-words">
              {error.message}
            </p>
          )}
          <div className="flex gap-2 justify-center">
            {!this.props.fullPage && !isStale && (
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
