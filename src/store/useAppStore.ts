import { create } from 'zustand';
import { User } from 'firebase/auth';
import { Task } from './useTaskStore';

export type ActiveView = 'today' | 'calendar' | 'board' | 'tasks' | 'settings' | 'stats' | 'focus' | 'timeline';
export type Theme = 'light' | 'dark' | 'claude' | 'claude-dark';

const THEME_KEY = 'omniplan-theme';
const THEMES: readonly Theme[] = ['light', 'dark', 'claude', 'claude-dark'];
const THEME_COLOR: Record<Theme, string> = {
  light: '#6366f1', dark: '#0f172a', claude: '#faf9f5', 'claude-dark': '#262624',
};

export const isDarkTheme = (t: Theme) => t === 'dark' || t === 'claude-dark';

function loadTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY) as Theme | null;
    if (v && THEMES.includes(v)) return v;
  } catch { /* storage unavailable */ }
  return 'light';
}

/** Applies a theme to <html>. index.html runs the same logic before first paint. */
export function applyTheme(t: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', isDarkTheme(t));
  if (t === 'claude' || t === 'claude-dark') root.dataset.palette = 'claude';
  else delete root.dataset.palette;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[t]);
}

const initialTheme = loadTheme();

/** How task pills are coloured: by project tag, or by status (with a project tag chip). */
export type TaskColorMode = 'project' | 'status';
const COLOR_MODE_KEY = 'omniplan-task-color';
function loadColorMode(): TaskColorMode {
  try { return localStorage.getItem(COLOR_MODE_KEY) === 'status' ? 'status' : 'project'; }
  catch { return 'project'; }
}
applyTheme(initialTheme);

interface ConfirmDialog {
  message: string;
  onConfirm: () => void;
}

interface AppState {
  user: User | null;
  isAuthLoaded: boolean;
  isMobileMenuOpen: boolean;
  activeView: ActiveView;
  theme: Theme;
  taskColorMode: TaskColorMode;
  isTaskModalOpen: boolean;
  editingTask: Task | null;
  selectedDate?: Date;
  clipboardTaskId: string | null;
  selectedTaskId: string | null;
  clipboardMode: 'copy' | 'cut' | null;
  focusTaskId: string | null;
  confirmDialog: ConfirmDialog | null;
  searchOpen: boolean;

  setUser: (u: User | null) => void;
  setAuthLoaded: (v: boolean) => void;
  setMobileMenuOpen: (v: boolean) => void;
  setActiveView: (v: ActiveView) => void;
  setTheme: (v: Theme) => void;
  toggleTheme: () => void;
  setTaskColorMode: (m: TaskColorMode) => void;
  setTaskModalOpen: (v: boolean) => void;
  setEditingTask: (t: Task | null) => void;
  setSelectedDate: (d?: Date) => void;
  setClipboard: (id: string, mode: 'copy'|'cut') => void;
  clearClipboard: () => void;
  setSelectedTaskId: (id: string | null) => void;
  setFocusTaskId: (id: string | null) => void;
  setConfirmDialog: (dialog: ConfirmDialog | null) => void;
  setSearchOpen: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null, isAuthLoaded: false, isMobileMenuOpen: false,
  activeView: 'today', theme: initialTheme, taskColorMode: loadColorMode(),
  isTaskModalOpen: false, editingTask: null, selectedDate: undefined,
  clipboardTaskId: null, clipboardMode: null, focusTaskId: null, selectedTaskId: null,
  confirmDialog: null, searchOpen: false,

  setUser: u => set({ user: u }),
  setAuthLoaded: v => set({ isAuthLoaded: v }),
  setMobileMenuOpen: v => set({ isMobileMenuOpen: v }),
  setActiveView: v => set({ activeView: v }),
  setTheme: v => {
    set({ theme: v });
    applyTheme(v);
    try { localStorage.setItem(THEME_KEY, v); } catch { /* storage unavailable */ }
  },
  // Flips light ↔ dark within the current palette.
  toggleTheme: () => {
    const t = get().theme;
    get().setTheme(t === 'light' ? 'dark' : t === 'dark' ? 'light' : t === 'claude' ? 'claude-dark' : 'claude');
  },
  setTaskColorMode: m => {
    set({ taskColorMode: m });
    try { localStorage.setItem(COLOR_MODE_KEY, m); } catch { /* storage unavailable */ }
  },
  setTaskModalOpen: v => set({ isTaskModalOpen: v }),
  setEditingTask: t => set({ editingTask: t }),
  setSelectedDate: d => set({ selectedDate: d }),
  setClipboard: (id, mode) => set({ clipboardTaskId: id, clipboardMode: mode }),
  clearClipboard: () => set({ clipboardTaskId: null, clipboardMode: null }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setFocusTaskId: id => set({ focusTaskId: id }),
  setConfirmDialog: dialog => set({ confirmDialog: dialog }),
  setSearchOpen: v => set({ searchOpen: v }),
}));
